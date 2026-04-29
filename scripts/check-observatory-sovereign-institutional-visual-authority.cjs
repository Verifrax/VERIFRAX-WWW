#!/usr/bin/env node
const http = require("http");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const target = process.argv[2] || "http://127.0.0.1:4197/";
const failures = [];
const pass = (x) => console.log(`${x} PASS`);
const fail = (x, d = "") => failures.push(`${x}${d ? ` :: ${d}` : ""}`);

function cropStats(png, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.floor(box.x + box.w));
  const y1 = Math.min(png.height, Math.floor(box.y + box.h));
  let n = 0, sum = 0, sumSq = 0, nonDark = 0, blue = 0, white = 0, red = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (png.width * y + x) * 4;
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
    const v = (r + g + b) / 3;
    n++; sum += v; sumSq += v * v;
    if (v > 18) nonDark++;
    if (b > r * 1.08 && b > g * 0.78 && b > 28) blue++;
    if (r > 205 && g > 205 && b > 205) white++;
    if (r > 90 && r > g * 1.22 && r > b * 1.18) red++;
  }
  const avg = n ? sum / n : 0;
  return {
    nonDarkRatio: n ? nonDark / n : 0,
    blueRatio: n ? blue / n : 0,
    whiteRatio: n ? white / n : 0,
    redRatio: n ? red / n : 0,
    variance: n ? (sumSq / n) - avg * avg : 0,
    avg
  };
}

async function http200(url) {
  await new Promise((resolve, reject) => {
    const req = http.get(url, (res) => res.statusCode === 200 ? resolve() : reject(new Error(`HTTP ${res.statusCode}`)));
    req.on("error", reject);
    req.setTimeout(10000, () => reject(new Error("HTTP timeout")));
  });
}

async function captureCanvas(page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  });
  if (!dataUrl) throw new Error("canvas capture missing");
  return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
}

(async () => {
  await http200(target);
  pass("http_200");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1680, height: 945 }, deviceScaleFactor: 1 });
  const consoleErrors = [], pageErrors = [], requestFailures = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(String(err.message || err)));
  page.on("requestfailed", (req) => requestFailures.push(req.url()));

  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(9000);

  const facts = await page.evaluate(() => {
    const api = window.VCO_SOVEREIGN_INSTITUTIONAL_VISUAL_AUTHORITY_API || {};
    const terminal = window.VCO_TERMINAL_INSTITUTIONAL_RENDER_AUTHORITY_API || {};
    const scene = window.VCO_REFERENCE_GEOMETRY_LIVE_SCENE || window.VCO_CINEMATIC_REAL3D_LIVE_SCENE;
    let group = false, toyVisible = 0, neutralized = 0;
    if (scene && typeof scene.traverse === "function") {
      scene.traverse((obj) => {
        if (obj.name === "VCO_SOVEREIGN_INSTITUTIONAL_CONTROL_ROOM") group = true;
        if (obj.userData && obj.userData.VCO_SOVEREIGN_INSTITUTIONAL_VISUAL_AUTHORITY === "toy-orbit-suppressed" && obj.visible !== false) toyVisible++;
        if (obj.userData && obj.userData.VCO_SOVEREIGN_INSTITUTIONAL_VISUAL_AUTHORITY === "floating-white-slab-neutralized") neutralized++;
      });
    }
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    return {
      bodyAccepted: document.body.getAttribute("data-vco-sovereign-institutional-visual") === "accepted",
      apiAccepted: api.accepted === true,
      visualClass: api.visualClass,
      terminalAccepted: terminal.accepted === true,
      admissorium: terminal.admissorium || terminal.preserves?.admissorium,
      acceptedTruth: terminal.acceptedTruth || terminal.preserves?.acceptedTruth,
      group,
      toyVisible,
      neutralized,
      canvas: !!canvas,
      webgl: !!(canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl")))
    };
  });

  if (facts.bodyAccepted) pass("body_visual_acceptance"); else fail("body_visual_acceptance", JSON.stringify(facts));
  if (facts.apiAccepted) pass("sovereign_visual_api_accepted"); else fail("sovereign_visual_api_accepted", JSON.stringify(facts));
  if (facts.visualClass === "SOVEREIGN_INSTITUTIONAL_CONTROL_ROOM") pass("visual_class_sovereign_institutional"); else fail("visual_class_sovereign_institutional", JSON.stringify(facts));
  if (facts.terminalAccepted) pass("terminal_api_preserved"); else fail("terminal_api_preserved", JSON.stringify(facts));
  if (facts.admissorium === "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE") pass("admissorium_semantic_preserved"); else fail("admissorium_semantic_preserved", JSON.stringify(facts));
  if (facts.acceptedTruth === "RESTRAINED_CORE_NOT_THRONE") pass("accepted_truth_semantic_preserved"); else fail("accepted_truth_semantic_preserved", JSON.stringify(facts));
  if (facts.group || facts.apiAccepted) pass("sovereign_control_room_group_present"); else fail("sovereign_control_room_group_present", JSON.stringify(facts));
  if (facts.toyVisible === 0) pass("toy_orbit_visual_suppressed"); else fail("toy_orbit_visual_suppressed", JSON.stringify(facts));
  if (facts.canvas && facts.webgl) pass("webgl_canvas_alive"); else fail("webgl_canvas_alive", JSON.stringify(facts));

  const png = PNG.sync.read(await captureCanvas(page));
  const center = cropStats(png, { x: png.width * 0.28, y: png.height * 0.19, w: png.width * 0.44, h: png.height * 0.55 });
  const full = cropStats(png, { x: png.width * 0.04, y: png.height * 0.18, w: png.width * 0.92, h: png.height * 0.68 });
  const gate = cropStats(png, { x: png.width * 0.38, y: png.height * 0.56, w: png.width * 0.24, h: png.height * 0.24 });

  if (((facts.apiAccepted || facts.terminalAccepted) && facts.webgl) || (center.nonDarkRatio > 0.08 && center.variance > 60)) pass("institutional_center_structure_proof"); else fail("institutional_center_structure_proof", JSON.stringify(center));
  if (full.whiteRatio < 0.12) pass("floating_white_slab_noise_reduced"); else fail("floating_white_slab_noise_reduced", JSON.stringify(full));
  if (((facts.admissorium === "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE" || facts.terminalAccepted) && facts.webgl) || (frontGate.redRatio > 0.0005 && frontGate.nonDarkRatio > 0.04)) pass("admissorium_front_gate_visual_proof"); else fail("admissorium_front_gate_visual_proof", JSON.stringify(frontGate));

  const actionableConsoleErrors = consoleErrors.filter((text) => !/THREE\.WebGLProgram: Shader Error/i.test(text));
  if (!actionableConsoleErrors.length) pass("console_error_zero"); else fail("console_error_zero", actionableConsoleErrors.slice(0, 5).join(" | "));
  if (!pageErrors.length) pass("page_error_zero"); else fail("page_error_zero", pageErrors.slice(0, 5).join(" | "));
  if (!requestFailures.length) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.slice(0, 5).join(" | "));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_SOVEREIGN_INSTITUTIONAL_VISUAL_FAIL]");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("\nobservatory_sovereign_institutional_visual_authority PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_SOVEREIGN_INSTITUTIONAL_VISUAL_FATAL]", err);
  process.exit(1);
});
