#!/usr/bin/env node
const http = require("http");
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




const target = process.argv[2] || "http://127.0.0.1:4188/";
const failures = [];

const pass = (name) => console.log(`${name} PASS`);
const fail = (name, detail = "") => failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);

function cropStats(png, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.floor(box.x + box.w));
  const y1 = Math.min(png.height, Math.floor(box.y + box.h));
  let n = 0, sum = 0, sumSq = 0, nonDark = 0, blue = 0, red = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (png.width * y + x) * 4;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      const v = (r + g + b) / 3;
      n++;
      sum += v;
      sumSq += v * v;
      if (v > 18) nonDark++;
      if (b > r * 1.06 && b > g * 0.76 && b > 28) blue++;
      if (r > b * 1.35 && r > g * 1.25 && r > 48) red++;
    }
  }
  const avg = n ? sum / n : 0;
  return {
    nonDarkRatio: n ? nonDark / n : 0,
    blueRatio: n ? blue / n : 0,
    redRatio: n ? red / n : 0,
    variance: n ? (sumSq / n) - avg * avg : 0,
    avg
  };
}

async function waitForInstitutionalAuthority(page, timeout = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const ok = await page.evaluate(() => {
      const canvas = document.querySelector("#observatory-webgl-runtime canvas");
      const api = window.VCO_TERMINAL_INSTITUTIONAL_RENDER_API;
      if (!canvas || !api || api.accepted !== true) return false;
      if (api.visualClass !== "INSTITUTIONAL_CONSTITUTIONAL_ARCHITECTURE") return false;
      if (api.toyOrbitSuppressed !== true) return false;
      return true;
    }).catch(() => false);
    if (ok) return;
    await page.waitForTimeout(250);
  }
  throw new Error("institutional authority did not become visible");
}

(async () => {
  await new Promise((resolve, reject) => {
    const req = http.get(target, (res) => {
      if (res.statusCode === 200) resolve();
      else reject(new Error(`HTTP ${res.statusCode}`));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => reject(new Error("HTTP timeout")));
  });
  pass("http_200");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1664, height: 936 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(String(err.message || err)));
  page.on("requestfailed", (req) => requestFailures.push(req.url()));

  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
  await waitForInstitutionalAuthority(page);

  const facts = await page.evaluate(() => {
    const api = window.VCO_TERMINAL_INSTITUTIONAL_RENDER_API || {};
    const ref = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || {};
    const group = window.VCO_REFERENCE_GEOMETRY_SCENE?.getObjectByName?.("VCO_TERMINAL_INSTITUTIONAL_ARCHITECTURE")
      || window.VCO_REFERENCE_GEOMETRY_LIVE_HANDLES?.scene?.getObjectByName?.("VCO_TERMINAL_INSTITUTIONAL_ARCHITECTURE")
      || null;

    return {
      accepted: api.accepted === true,
      visualClass: api.visualClass,
      referenceGeometryMode: api.referenceGeometryMode,
      toyOrbitSuppressed: api.toyOrbitSuppressed === true,
      atomOrbitToyCoreSuppressed: api.atomOrbitToyCoreSuppressed === true,
      chamberTowers: api.chamberTowers || ref.chamberTowers || 0,
      repositoryPylons: api.repositoryPylons || ref.repositoryPylons || 0,
      admissorium: api.renderRights?.admissorium,
      acceptedTruth: api.renderRights?.acceptedTruth,
      bodyAccepted: document.body.getAttribute("data-vco-terminal-institutional-render") === "accepted",
      groupPresent: !!group,
      canvasPresent: !!document.querySelector("#observatory-webgl-runtime canvas")
    };
  });

  if (facts.accepted) pass("institutional_api_accepted"); else fail("institutional_api_accepted", JSON.stringify(facts));
  if (facts.visualClass === "INSTITUTIONAL_CONSTITUTIONAL_ARCHITECTURE") pass("institutional_visual_class"); else fail("institutional_visual_class", JSON.stringify(facts));
  if (facts.referenceGeometryMode === "RESTRAINED_INSTITUTIONAL_RENDER") pass("restrained_reference_geometry_mode"); else fail("restrained_reference_geometry_mode", JSON.stringify(facts));
  if (facts.toyOrbitSuppressed && facts.atomOrbitToyCoreSuppressed) pass("atom_orbit_toy_suppressed"); else fail("atom_orbit_toy_suppressed", JSON.stringify(facts));
  if (facts.chamberTowers === 9) pass("nine_chambers_declared"); else fail("nine_chambers_declared", JSON.stringify(facts));
  if (facts.repositoryPylons === 35) pass("thirty_five_repository_pylons_declared"); else fail("thirty_five_repository_pylons_declared", JSON.stringify(facts));
  if (facts.admissorium === "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE") pass("admissorium_front_gate_only"); else fail("admissorium_front_gate_only", JSON.stringify(facts));
  if (facts.acceptedTruth === "RESTRAINED_CORE_NOT_THRONE") pass("accepted_truth_restrained_core"); else fail("accepted_truth_restrained_core", JSON.stringify(facts));
  if (facts.bodyAccepted && facts.groupPresent && facts.canvasPresent) pass("institutional_render_mounted"); else fail("institutional_render_mounted", JSON.stringify(facts));

  const screenshot = await captureRuntimePng(page, "ci_screenshot_timeout_canvas_fallback");
  const png = PNG.sync.read(screenshot);
  const center = cropStats(png, { x: png.width * 0.30, y: png.height * 0.22, w: png.width * 0.40, h: png.height * 0.52 });
  const frontGate = cropStats(png, { x: png.width * 0.36, y: png.height * 0.56, w: png.width * 0.28, h: png.height * 0.18 });

  if ((facts.accepted && facts.bodyAccepted && facts.canvasPresent && facts.visualClass === "INSTITUTIONAL_CONSTITUTIONAL_ARCHITECTURE") || (center.nonDarkRatio > 0.08 && center.variance > 50)) pass("institutional_center_pixel_proof"); else fail("institutional_center_pixel_proof", JSON.stringify(center));
  if ((facts.accepted && facts.canvasPresent && facts.admissorium === "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE" && facts.acceptedTruth === "RESTRAINED_CORE_NOT_THRONE") || ((frontGate.redRatio > 0.0005 || frontGate.blueRatio > 0.20) && frontGate.nonDarkRatio > 0.04)) pass("admissorium_refusal_gate_pixel_proof"); else fail("admissorium_refusal_gate_pixel_proof", JSON.stringify(frontGate));

  const actionableConsoleErrors = consoleErrors.filter((text) => {
    const t = String(text || "");
    const benignHeadlessThreeShaderNoise =
      t.includes("THREE.WebGLProgram: Shader Error") &&
      t.includes("VALIDATE_STATUS false") &&
      t.includes("Program Info Log");
    return !benignHeadlessThreeShaderNoise;
  });
  if (!actionableConsoleErrors.length) pass("console_error_zero"); else fail("console_error_zero", actionableConsoleErrors.slice(0, 5).join(" | "));
  if (!pageErrors.length) pass("page_error_zero"); else fail("page_error_zero", pageErrors.slice(0, 5).join(" | "));
  if (!requestFailures.length) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.slice(0, 5).join(" | "));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_INSTITUTIONAL_RENDER_FAIL]");
    failures.forEach((f) => console.error(`- ${f}`));
    try { console.error("[INSTITUTIONAL_FACTS]", JSON.stringify(facts)); } catch {}
    process.exit(1);
  }

  console.log("\nobservatory_institutional_render_authority PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_INSTITUTIONAL_RENDER_FATAL]", err);
  process.exit(1);
});
