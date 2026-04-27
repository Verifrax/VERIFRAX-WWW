#!/usr/bin/env node
const http = require("http");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const target = process.argv[2] || "http://127.0.0.1:4179/";
const failures = [];

async function waitForRuntimeCanvas(page, timeout = 90000) {
  await page.waitForFunction(() => {
    const runtime = document.querySelector("#observatory-webgl-runtime");
    const canvas = runtime && runtime.querySelector("canvas");
    if (!runtime || !canvas) return false;
    const r = runtime.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    return r.width > 800 && r.height > 500 && c.width > 800 && c.height > 500;
  }, { timeout });
}

const pass = (name) => console.log(`${name} PASS`);
const fail = (name, detail = "") => failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);

function cropStats(png, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.floor(box.x + box.w));
  const y1 = Math.min(png.height, Math.floor(box.y + box.h));
  let n = 0, sum = 0, sumSq = 0, nonDark = 0, blue = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (png.width * y + x) * 4;
      const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2];
      const v = (r + g + b) / 3;
      n++;
      sum += v;
      sumSq += v * v;
      if (v > 20) nonDark++;
      if (b > r * 1.08 && b > g * 0.82 && b > 34) blue++;
    }
  }
  const avg = n ? sum / n : 0;
  return {
    nonDarkRatio: n ? nonDark / n : 0,
    blueRatio: n ? blue / n : 0,
    variance: n ? (sumSq / n) - avg * avg : 0,
    avg
  };
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

  await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForFunction(() => {
    const r = document.querySelector("#observatory-webgl-runtime")?.getBoundingClientRect();
    const c = document.querySelector("#observatory-webgl-runtime canvas")?.getBoundingClientRect();
    return r && c && r.width > 800 && r.height > 500 && c.width > 800 && c.height > 500;
  }, { timeout: 90000 });

  await page.waitForFunction(() => {
    const api = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API;
    return api && api.accepted && api.chamberTowers >= 9 && api.repositoryPylons >= 35 && api.acceptedTruthCore;
  }, { timeout: 90000 });

  await page.waitForTimeout(900);

  const facts = await page.evaluate(() => {
    const api = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || {};
    const cinematic = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};
    return {
      bodyAccepted: document.body.getAttribute("data-vco-reference-geometry") === "accepted",
      apiAccepted: api.accepted === true,
      chamberTowers: api.chamberTowers || 0,
      repositoryPylons: api.repositoryPylons || 0,
      hostGates: api.hostGates || 0,
      wallSegments: api.wallSegments || 0,
      admissoriumGate: api.admissoriumGate === true,
      acceptedTruthCore: api.acceptedTruthCore === true,
      atomCageSuppressed: api.atomCageSuppressed === true,
      assetBoundary: api.state?.assetBoundary,
      cinematicAccepted: cinematic.accepted === true,
      referenceGeometryLinked: !!cinematic.referenceGeometry?.accepted,
      webgl: !!document.querySelector("#observatory-webgl-runtime canvas")?.getContext("webgl2")
        || !!document.querySelector("#observatory-webgl-runtime canvas")?.getContext("webgl")
    };
  });

  if (facts.bodyAccepted) pass("reference_geometry_body_acceptance"); else fail("reference_geometry_body_acceptance", JSON.stringify(facts));
  if (facts.apiAccepted) pass("reference_geometry_api_acceptance"); else fail("reference_geometry_api_acceptance", JSON.stringify(facts));
  if (facts.chamberTowers >= 9) pass("architectural_chamber_towers_reachable"); else fail("architectural_chamber_towers_reachable", JSON.stringify(facts));
  if (facts.repositoryPylons >= 35) pass("repository_perimeter_pylons_reachable"); else fail("repository_perimeter_pylons_reachable", JSON.stringify(facts));
  if (facts.hostGates >= 8) pass("host_boundary_gates_reachable"); else fail("host_boundary_gates_reachable", JSON.stringify(facts));
  if (facts.wallSegments >= 72) pass("outer_constitutional_wall_reachable"); else fail("outer_constitutional_wall_reachable", JSON.stringify(facts));
  if (facts.admissoriumGate) pass("admissorium_border_gate_reachable"); else fail("admissorium_border_gate_reachable", JSON.stringify(facts));
  if (facts.acceptedTruthCore) pass("restrained_accepted_truth_core_reachable"); else fail("restrained_accepted_truth_core_reachable", JSON.stringify(facts));
  if (facts.atomCageSuppressed) pass("atom_orbit_toy_core_suppressed"); else fail("atom_orbit_toy_core_suppressed", JSON.stringify(facts));
  if (facts.assetBoundary === "procedural-reference-geometry-until-glb-ktx2-assets-exist") pass("asset_boundary_declared"); else fail("asset_boundary_declared", JSON.stringify(facts));
  if (facts.cinematicAccepted && facts.referenceGeometryLinked) pass("cinematic_authority_linked"); else fail("cinematic_authority_linked", JSON.stringify(facts));
  if (facts.webgl) pass("webgl_context"); else fail("webgl_context");

  const screenshot = await page.screenshot({ fullPage: false });
  const png = PNG.sync.read(screenshot);
  const center = cropStats(png, { x: png.width * 0.28, y: png.height * 0.20, w: png.width * 0.44, h: png.height * 0.54 });
  const perimeter = cropStats(png, { x: png.width * 0.08, y: png.height * 0.18, w: png.width * 0.84, h: png.height * 0.62 });

  if (center.nonDarkRatio > 0.18 && center.variance > 180 && center.blueRatio > 0.035) pass("center_reference_geometry_pixel_proof"); else fail("center_reference_geometry_pixel_proof", JSON.stringify(center));
  if (perimeter.nonDarkRatio > 0.20 && perimeter.variance > 160 && perimeter.blueRatio > 0.028) pass("perimeter_reference_geometry_pixel_proof"); else fail("perimeter_reference_geometry_pixel_proof", JSON.stringify(perimeter));

  if (!consoleErrors.length) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.slice(0, 5).join(" | "));
  if (!pageErrors.length) pass("page_error_zero"); else fail("page_error_zero", pageErrors.slice(0, 5).join(" | "));
  if (!requestFailures.length) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.slice(0, 5).join(" | "));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_REFERENCE_GEOMETRY_FAIL]");
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  }

  console.log("\nobservatory_reference_geometry_authority PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_REFERENCE_GEOMETRY_FATAL]", err);
  process.exit(1);
});
