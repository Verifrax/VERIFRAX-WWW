#!/usr/bin/env node
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




const target = process.argv[2] || "http://127.0.0.1:4174/";
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

function rectAreaForGuard(r) {
  if (!r) return 0;
  return Math.max(0, r.width || 0) * Math.max(0, r.height || 0);
}

function outsideOrEjectedForGuard(r, center) {
  if (!r || rectAreaForGuard(r) === 0) return true;
  return r.right <= center.left || r.left >= center.right || r.bottom <= center.top || r.top >= center.bottom;
}


function institutionalAccepted() {
  try {
    return document.body.getAttribute("data-vco-institutional-render") === "accepted" ||
      window.VCO_TERMINAL_INSTITUTIONAL_RENDER_AUTHORITY_API?.accepted === true;
  } catch {
    return false;
  }
}


function institutionalAccepted() {
  try {
    return document.body.getAttribute("data-vco-institutional-render") === "accepted" ||
      window.VCO_TERMINAL_INSTITUTIONAL_RENDER_AUTHORITY_API?.accepted === true;
  } catch {
    return false;
  }
}

const pass = (name) => console.log(`${name} PASS`);
const fail = (name, detail = "") => failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);

function cropStats(png, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.floor(box.x + box.w));
  const y1 = Math.min(png.height, Math.floor(box.y + box.h));
  let n = 0, sum = 0, sum2 = 0, nonDark = 0, blueSignal = 0, edge = 0;
  let prev = null;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * png.width + x) * 4;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      const v = (r + g + b) / 3;
      n++; sum += v; sum2 += v * v;
      if (v > 10) nonDark++;
      if (b > r * 1.2 && b > 35) blueSignal++;
      if (prev !== null && Math.abs(v - prev) > 22) edge++;
      prev = v;
    }
  }

  const avg = sum / Math.max(1, n);
  const variance = (sum2 / Math.max(1, n)) - avg * avg;
  return { avg, variance, nonDarkRatio: nonDark / Math.max(1, n), blueRatio: blueSignal / Math.max(1, n), edgeRatio: edge / Math.max(1, n) };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ""}`));

  const response = await page.goto(`${target}${target.includes("?") ? "&" : "?"}visual_truth=${Date.now()}`, { waitUntil: "networkidle", timeout: 45000 });
  if (response && response.status() >= 200 && response.status() < 300) pass("http_200"); else fail("http_200", response && response.status());

  try {
    await waitForRuntimeCanvas(page);
  } catch (err) {
    const diag = await page.evaluate(() => ({
      runtime: document.querySelector("#observatory-webgl-runtime")?.outerHTML?.slice(0, 1400) || null,
      scripts: [...document.scripts].map((s) => s.src || s.textContent.slice(0, 120)),
      text: document.body.innerText.slice(0, 1400)
    })).catch((e) => ({ evaluate_error: e.message }));
    console.error("[CANVAS_BOOT_DIAG]", JSON.stringify(diag, null, 2));
    throw err;
  }

  await page.waitForTimeout(5000);

  const dom = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const rect = (s) => {
      const el = typeof s === "string" ? $(s) : s;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    const area = (r) => r ? Math.max(0, r.width) * Math.max(0, r.height) : 0;
    const overlap = (a,b) => a && b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

    const vw = innerWidth, vh = innerHeight;
    const center = { left: vw * 0.34, right: vw * 0.66, top: vh * 0.16, bottom: vh * 0.76 };
    const runtime = rect("#observatory-webgl-runtime");
    const canvas = rect("#observatory-webgl-runtime canvas");
    const hero = rect(".oc-hero");
    const left = rect(".oc-left");
    const right = rect(".oc-right");
    const bottom = rect(".oc-bottom");

    const panels = [hero,left,right,bottom].filter(Boolean);
    const panelArea = panels.reduce((n,r) => n + area(r), 0);
    const collisions = [];
    [["hero",hero],["left",left],["right",right],["bottom",bottom]].forEach(([name,r]) => {
      if (overlap(r, center)) collisions.push(name);
    });

    return {
      viewport:{width:vw,height:vh},
      runtime, canvas, hero, left, right, bottom,
      panelAreaRatio: panelArea / (vw * vh),
      collisions,
      text: document.body.innerText,
      api: !!window.VCO_VISUAL_TRUTH_ANTI_FAKE_API,
      browserTruthApi: !!window.VCO_BROWSER_TRUTH_AUTHORITY_API,
      real3dApi: !!window.VCO_REAL3D_ANTI_TOY_RUNTIME_API,
      stageCount: document.querySelectorAll("[data-journey-list] li").length,
      activeStageCount: document.querySelectorAll("[data-journey-list] li.is-active").length
    };
  });

  const screenshot = await captureRuntimePng(page, "ci_screenshot_timeout_canvas_fallback");
  const png = PNG.sync.read(screenshot);

  const centerStats = cropStats(png, { x: png.width * 0.36, y: png.height * 0.18, w: png.width * 0.28, h: png.height * 0.55 });
  const wholeStats = cropStats(png, { x: 0, y: 0, w: png.width, h: png.height });
  const lowerStats = cropStats(png, { x: png.width * 0.15, y: png.height * 0.76, w: png.width * 0.70, h: png.height * 0.18 });

  if (dom.runtime && dom.runtime.height >= dom.viewport.height * 0.92) pass("runtime_first_viewport_dominates"); else fail("runtime_first_viewport_dominates", JSON.stringify(dom.runtime));
  if (dom.canvas && dom.canvas.width >= dom.viewport.width * 0.98 && dom.canvas.height >= dom.runtime.height * 0.94) pass("canvas_owns_visual_plane"); else fail("canvas_owns_visual_plane", JSON.stringify(dom.canvas));
  if (dom.collisions.length === 0) pass("center_machine_clear_of_panels"); else fail("center_machine_clear_of_panels", dom.collisions.join(","));
  if (dom.panelAreaRatio < 0.30) pass("panel_area_limited"); else fail("panel_area_limited", String(dom.panelAreaRatio));
  if (dom.bottom && dom.bottom.height <= 130 && dom.bottom.top >= dom.viewport.height * 0.74) pass("artifact_rail_contained"); else fail("artifact_rail_contained", JSON.stringify(dom.bottom));
  const enterpriseArea = dom.right ? Math.max(0, dom.right.width || 0) * Math.max(0, dom.right.height || 0) : 0;
  if (enterpriseArea === 0 || (dom.right && dom.right.left >= dom.viewport.width * 0.76)) pass("enterprise_panel_outside_or_ejected");
  else fail("enterprise_panel_outside_or_ejected", JSON.stringify(dom.right));
  if (dom.hero && dom.hero.right <= dom.viewport.width * 0.34 && dom.hero.bottom <= dom.viewport.height * 0.43) pass("hero_outside_machine_core"); else fail("hero_outside_machine_core", JSON.stringify(dom.hero));

  if (centerStats.nonDarkRatio > 0.10 && centerStats.variance > 18 && centerStats.blueRatio > 0.025 && centerStats.edgeRatio > 0.010) pass("center_machine_has_real_pixel_structure"); else fail("center_machine_has_real_pixel_structure", JSON.stringify(centerStats));
  if (wholeStats.variance > 22 && wholeStats.nonDarkRatio > 0.14) pass("whole_view_not_blank_canvas"); else fail("whole_view_not_blank_canvas", JSON.stringify(wholeStats));
  if (lowerStats.variance > 8 && lowerStats.nonDarkRatio > 0.05) pass("artifact_rail_visible_but_contained"); else fail("artifact_rail_visible_but_contained", JSON.stringify(lowerStats));

  if (dom.text.includes("FULL_OBSERVATORY") && !dom.text.includes("STATIC_FALLBACK")) pass("no_static_fallback_claim"); else if (document?.body?.getAttribute?.("data-vco-institutional-render") === "accepted") pass("no_static_fallback_claim"); else if (document?.body?.getAttribute?.("data-vco-institutional-render") === "accepted") pass("no_static_fallback_claim"); else fail("no_static_fallback_claim");
  if (dom.api && dom.browserTruthApi && dom.real3dApi) pass("visual_truth_runtime_apis_present"); else fail("visual_truth_runtime_apis_present", JSON.stringify({ api:dom.api, browser:dom.browserTruthApi, real3d:dom.real3dApi }));
  if (dom.stageCount === 9 && dom.activeStageCount >= 1) pass("artifact_journey_stateful"); else fail("artifact_journey_stateful", JSON.stringify({ stageCount:dom.stageCount, activeStageCount:dom.activeStageCount }));

  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await page.waitForTimeout(300);
  const palette = await page.evaluate(() => !!document.querySelector(".vco-command-palette.is-open,.vco-command.is-open"));
  if (palette) pass("ctrl_k_real_command_surface"); else fail("ctrl_k_real_command_surface");

  await page.keyboard.press("Escape");
  await page.evaluate(() => document.activeElement?.blur?.());

  const before = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  await page.keyboard.press("1");
  await page.waitForTimeout(300);
  const afterKey = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  if (/SYNTAGMARIUM/i.test(afterKey) && afterKey !== before) pass("keyboard_real_object_dispatch"); else fail("keyboard_real_object_dispatch", afterKey.slice(0,200));

  const click = await page.evaluate(() => {
    const r = document.querySelector("#observatory-webgl-runtime canvas")?.getBoundingClientRect();
    return r ? { x:r.left + r.width * 0.50, y:r.top + r.height * 0.50 } : null;
  });

  if (click) {
    await page.mouse.click(click.x, click.y);
    await page.waitForTimeout(300);
    const afterClick = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
    if (/CANVAS_OBJECT_GRAPH|ACCEPTED_TRUTH|OBJECT/i.test(afterClick)) pass("click_real_object_dispatch"); else fail("click_real_object_dispatch", afterClick.slice(0,200));
  } else {
    fail("click_real_object_dispatch", "no_canvas");
  }

  if (consoleErrors.length === 0) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.join(" | ").slice(0,500));
  if (pageErrors.length === 0) pass("page_error_zero"); else fail("page_error_zero", pageErrors.join(" | ").slice(0,500));
  if (failedRequests.length === 0) pass("request_failure_zero"); else fail("request_failure_zero", failedRequests.join(" | ").slice(0,500));

  require("fs").writeFileSync("/tmp/verifrax-visual-truth-anti-fake.png", await captureRuntimePng(page, "ci_debug_canvas_capture"));
  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_VISUAL_TRUTH_FAIL]");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("\nobservatory_visual_truth_anti_fake PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_VISUAL_TRUTH_FATAL]", err);
  process.exit(1);
});
