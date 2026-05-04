#!/usr/bin/env node
"use strict";

const { chromium } = require("playwright");
const { PNG } = require("pngjs");

async function captureRuntimePng(page, reason = "runtime_canvas_capture") {
  const base64 = await page.evaluate(async (captureReason) => {
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    if (!canvas) return null;

    try {
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (gl && typeof gl.finish === "function") gl.finish();
    } catch {}

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      return canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
    } catch {
      return null;
    }
  }, reason);

  if (!base64) throw new Error(`[CANVAS_CAPTURE_FAILED] ${reason}`);
  return Buffer.from(base64, "base64");
}




const target = process.argv[2] || "http://127.0.0.1:4181/";
const failures = [];

async function waitForRuntimeCanvas(page, timeout = 90000) {
  const started = Date.now();
  let last = null;

  while (Date.now() - started < timeout) {
    last = await page.evaluate(() => {
      const runtime = document.querySelector("#observatory-webgl-runtime");
      const canvas = runtime && runtime.querySelector("canvas");

      if (!runtime || !canvas) {
        return {
          ok: false,
          reason: "missing_runtime_or_canvas",
          hasRuntime: !!runtime,
          hasCanvas: !!canvas
        };
      }

      const r = runtime.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const attrWidth = Number(canvas.getAttribute("width") || canvas.width || 0);
      const attrHeight = Number(canvas.getAttribute("height") || canvas.height || 0);

      const ok =
        canvas.isConnected &&
        (
          attrWidth > 0 ||
          attrHeight > 0 ||
          canvas.clientWidth > 0 ||
          canvas.clientHeight > 0 ||
          c.width > 0 ||
          c.height > 0
        );

      return {
        ok,
        reason: ok ? "ready" : "canvas_surface_not_ready",
        runtime: { width: r.width, height: r.height, clientWidth: runtime.clientWidth, clientHeight: runtime.clientHeight },
        canvas: { width: c.width, height: c.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight, attrWidth, attrHeight, connected: canvas.isConnected },
        text: document.body.innerText.slice(0, 600)
      };
    });

    if (last && last.ok) {
      await page.waitForTimeout(650);
      return last;
    }

    await page.waitForTimeout(250);
  }

  throw new Error("runtime canvas bootstrap timeout :: " + JSON.stringify(last));
}

function pass(name) {
  console.log(`${name} PASS`);
}

function fail(name, detail = "") {
  failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);
}

function cropStats(png, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.floor(box.x + box.w));
  const y1 = Math.min(png.height, Math.floor(box.y + box.h));

  let count = 0;
  let sum = 0;
  let sumSq = 0;
  let nonDark = 0;
  let blueEvidence = 0;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (png.width * y + x) << 2;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const avg = (r + g + b) / 3;

      count += 1;
      sum += avg;
      sumSq += avg * avg;

      if (avg > 18) nonDark += 1;
      if (b > 42 && b > r * 1.08 && b > g * 0.78) blueEvidence += 1;
    }
  }

  const mean = count ? sum / count : 0;
  const variance = count ? sumSq / count - mean * mean : 0;

  return {
    count,
    avg: mean,
    variance,
    nonDarkRatio: count ? nonDark / count : 0,
    blueEvidenceRatio: count ? blueEvidence / count : 0
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1
  });

  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => {
    requestFailures.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ""}`);
  });

  const response = await page.goto(`${target}${target.includes("?") ? "&" : "?"}cinematic=${Date.now()}`, {
    waitUntil: "networkidle",
    timeout: 30000
  });

  if (response && response.status() >= 200 && response.status() < 300) pass("http_200");
  else fail("http_200", response && String(response.status()));

  await page.waitForFunction(() => {
    const runtime = document.querySelector("#observatory-webgl-runtime");
    const rect = runtime?.getBoundingClientRect?.();
    return !!runtime && !!rect && rect.width > 100 && rect.height > 100;
  }, null, { timeout: 90000 });

  await page.waitForFunction(() => {
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    const rect = canvas?.getBoundingClientRect?.();
    return !!canvas && !!rect && rect.width > 100 && rect.height > 100;
  }, null, { timeout: 25000 });

  await page.waitForFunction(() => {
    const api = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API;
    return !!api && api.accepted === true && Number(api.scenes || 0) >= 1;
  }, null, { timeout: 25000 });

  await page.waitForTimeout(2500);

  const facts = await page.evaluate(() => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    const canvas = runtime?.querySelector("canvas");
    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};
    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;
    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;
    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;
    const api = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};
    const apiState = api.state || {};
    const children = [...(scene?.children || [])];
    const flat = children.flatMap((x) => [x, ...(x?.children || [])]);

    const rect = (el) => {
      const r = el?.getBoundingClientRect?.();
      return r ? {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height
      } : null;
    };

    return {
      bodyAccepted: document.body.getAttribute("data-vco-cinematic-real3d") === "accepted",
      apiAccepted: !!api.accepted,
      apiState,
      scenes: api.scenes ?? -1,
      cameras: api.cameras ?? -1,
      renderers: api.renderers ?? -1,
      hasReapply: typeof api.reapply === "function",
      moduleThree: !!window.THREE,
      handlesExposed: !!handles.scene && !!handles.camera && !!handles.renderer,
      runtime: rect(runtime),
      canvas: rect(canvas),
      webgl: !!(canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"))),
      sceneGeometryAuthority: !!scene?.userData?.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY,
      sceneLightAuthority: !!scene?.userData?.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY || !!scene?.userData?.VCO_CINEMATIC_LIGHT_RIG,
      rendererAuthority: !!renderer?.userData?.VCO_CINEMATIC_RENDERER_AUTHORITY,
      cameraAuthority: !!camera?.userData?.VCO_CINEMATIC_CAMERA_AUTHORITY,
      shadow4096: children.some((x) =>
        x?.isLight &&
        x?.shadow?.mapSize?.width === 4096 &&
        x?.shadow?.mapSize?.height === 4096
      ),
      acceptedTruthCrystal: flat.some((x) =>
        x?.name === "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE" ||
        x?.name === "VCO_ACCEPTED_TRUTH_CRYSTAL" ||
        x?.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "accepted-truth-crystal"
      ),
      repoPillars: flat.filter((x) =>
        x?.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "36-repository-pbr-pillar"
      ).length,
      fullText: document.body.innerText.includes("FULL_OBSERVATORY"),
      staticFallbackText: document.body.innerText.includes("STATIC_FALLBACK")
    };
  });

  const screenshot = await captureRuntimePng(page, "ci_screenshot_timeout_canvas_fallback");
  const png = PNG.sync.read(screenshot);
  const center = cropStats(png, {
    x: png.width * 0.34,
    y: png.height * 0.16,
    w: png.width * 0.32,
    h: png.height * 0.58
  });
  const whole = cropStats(png, {
    x: 0,
    y: 0,
    w: png.width,
    h: png.height
  });

  if (facts.bodyAccepted) pass("cinematic_body_acceptance"); else fail("cinematic_body_acceptance", JSON.stringify(facts));
  if (facts.apiAccepted && facts.hasReapply) pass("cinematic_api_acceptance"); else fail("cinematic_api_acceptance", JSON.stringify(facts));
  if (facts.moduleThree) pass("module_three_exposed"); else fail("module_three_exposed", JSON.stringify(facts));
  if (facts.handlesExposed) pass("runtime_handles_exposed"); else fail("runtime_handles_exposed", JSON.stringify(facts));
  if (facts.scenes >= 1) pass("cinematic_scene_count_declared"); else fail("cinematic_scene_count_declared", JSON.stringify(facts));
  if (facts.cameras >= 1) pass("cinematic_camera_count_declared"); else fail("cinematic_camera_count_declared", JSON.stringify(facts));
  if (facts.renderers >= 1) pass("cinematic_renderer_count_declared"); else fail("cinematic_renderer_count_declared", JSON.stringify(facts));
  if (facts.sceneGeometryAuthority) pass("cinematic_scene_geometry_authority"); else fail("cinematic_scene_geometry_authority", JSON.stringify(facts));
  if (facts.sceneLightAuthority) pass("cinematic_light_authority_reachable"); else fail("cinematic_light_authority_reachable", JSON.stringify(facts));
  if (facts.rendererAuthority) pass("renderer_authority_reachable"); else fail("renderer_authority_reachable", JSON.stringify(facts));
  if (facts.cameraAuthority) pass("camera_authority_reachable"); else fail("camera_authority_reachable", JSON.stringify(facts));
  if (facts.shadow4096) pass("shadow_4096_authority_reachable"); else fail("shadow_4096_authority_reachable", JSON.stringify(facts));
  if (facts.acceptedTruthCrystal) pass("accepted_truth_crystal_reachable"); else fail("accepted_truth_crystal_reachable", JSON.stringify(facts));
  if (facts.repoPillars >= 35) pass("repository_pillar_detail_reachable"); else fail("repository_pillar_detail_reachable", JSON.stringify(facts));
  if (facts.apiState.rendererQuality === "cinematic-pbr-procedural") pass("renderer_quality_declared"); else fail("renderer_quality_declared", JSON.stringify(facts.apiState));
  if (facts.apiState.shadowMap === 4096) pass("shadow_map_4096_declared"); else fail("shadow_map_4096_declared", JSON.stringify(facts.apiState));
  if (facts.apiState.materialDoctrine === "brushed-metal-stone-glass-emissive-evidence") pass("pbr_material_doctrine_declared"); else fail("pbr_material_doctrine_declared", JSON.stringify(facts.apiState));
  if (facts.apiState.cameraDoctrine === "low-wide-sovereign-machine-first") pass("cinematic_camera_doctrine_declared"); else fail("cinematic_camera_doctrine_declared", JSON.stringify(facts.apiState));
  if (facts.apiState.lightDoctrine === "key-rim-fill-volumetric-evidence") pass("cinematic_light_doctrine_declared"); else fail("cinematic_light_doctrine_declared", JSON.stringify(facts.apiState));
  if (facts.apiState.textureDoctrine === "procedural-until-glb-ktx2-assets-exist") pass("procedural_texture_boundary_declared"); else fail("procedural_texture_boundary_declared", JSON.stringify(facts.apiState));
  if (facts.webgl) pass("webgl_context"); else fail("webgl_context", JSON.stringify(facts));
  if (facts.fullText && !facts.staticFallbackText) pass("full_observatory_not_fallback"); else fail("full_observatory_not_fallback");
  if (center.nonDarkRatio > 0.12 && center.variance > 20 && center.blueEvidenceRatio > 0.02) pass("cinematic_center_pixel_structure"); else fail("cinematic_center_pixel_structure", JSON.stringify(center));
  if (whole.nonDarkRatio > 0.14 && whole.variance > 24) pass("real_canvas_pixel_proof"); else fail("real_canvas_pixel_proof", JSON.stringify(whole));

  if (consoleErrors.length === 0) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.join("\n").slice(0, 900));
  if (pageErrors.length === 0) pass("page_error_zero"); else fail("page_error_zero", pageErrors.join("\n").slice(0, 900));
  if (requestFailures.length === 0) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.join("\n").slice(0, 900));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_CINEMATIC_RENDER_AUTHORITY_FAIL]");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("\nobservatory_cinematic_render_authority PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_CINEMATIC_RENDER_AUTHORITY_FATAL]", err);
  process.exit(1);
});
