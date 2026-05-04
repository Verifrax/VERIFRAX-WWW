#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({ status: "FAIL", gate: "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE", error, ...extra }, null, 2));
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail("missing file", { path });
  return fs.readFileSync(path, "utf8");
}

function readJson(path) {
  return JSON.parse(read(path));
}

const index = read("index.html");
const notFound = read("404.html");
const runtime = read("assets/observatory-webgl-runtime.js");
const css = read("assets/surface.css");
const contract = readJson("data/main-stack-timeline.json");
const publicContract = readJson("public/data/timeline/main-stack-timeline.json");

for (const [name, html] of [["index", index], ["404", notFound]]) {
  if (!html.includes("data-main-stack-shell")) fail(`${name} missing complete shell`);
  if (!html.includes("data-main-stack-timeline")) fail(`${name} missing timeline mount`);
  if (!html.includes("MAIN STACK TIMELINE")) fail(`${name} missing label`);
  if (!html.includes('role="listbox"')) fail(`${name} missing listbox`);
  for (const mode of ["stack", "artifact", "host", "repository", "package"]) {
    if (!html.includes(`data-timeline-mode="${mode}"`)) fail(`${name} missing mode`, { mode });
    if (!html.includes(`data-timeline-mode-count="${mode}"`)) fail(`${name} missing mode count`, { mode });
  }
}

if (contract.schema_version !== "1.0.0") fail("bad contract schema");
if (contract.projection_type !== "DERIVED_PROJECTION") fail("timeline is not derived projection");
if (contract.truth_warning !== "NOT_TRUTH_SOURCE") fail("timeline truth warning missing");
if (!Array.isArray(contract.stack) || contract.stack.length !== 9) fail("stack length mismatch");
if (!Array.isArray(contract.packages) || contract.packages.length < 1) fail("package objects missing");
if (JSON.stringify(contract) !== JSON.stringify(publicContract)) fail("public contract mirror mismatch");

const expected = ["syntagmarium", "orbistium", "consonorium", "tachyrium", "auctoriseal", "corpiform", "verifrax", "anagnorium", "regressorium"];
const actual = contract.stack.map((item) => item.id);
if (JSON.stringify(actual) !== JSON.stringify(expected)) fail("stack order mismatch", { actual });

const runtimeNeedles = [
  'const TIMELINE_URL = "data/main-stack-timeline.json"',
  "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2",
  "VERIFRAX_TIMELINE_MODE_AUTHORITY_V3",
  "hydrateCompleteMainStackTimeline",
  "timelineObjectFromMode",
  'if (mode === "package")',
  "timelineContract.packages",
  "function timelineEmptyModeDenial(mode)",
  "data-timeline-mode-count",
  "const modeCounts = {",
  'fetch(TIMELINE_URL, { cache: "no-store" })',
  "const timelineContract = await timelineResponse.json();",
  "function hydrateCommandSurface(container, manifest, attestation, timelineContract)",
  "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
  "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
  "url.hash = `timeline:${mode}:${item.id}`",
  "hash.match(/^#timeline:([^:]+):(.+)$/)",
  "Must not own",
  "Owns",
  "data-stack-id",
  "aria-selected",
  "tabindex",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
  "verifrax:timeline-select",
  "history.replaceState",
  "writeInspector(container"
];

for (const needle of runtimeNeedles) {
  if (!runtime.includes(needle)) fail("runtime missing complete binding", { needle });
}

if (runtime.includes("function hydrateCommandSurface(container, manifest, attestation) {")) {
  fail("old hydrateCommandSurface signature still present");
}
if (runtime.includes("hydrateMainStackTimeline(container, manifest);")) {
  fail("legacy timeline hydrator still clobbers complete timeline");
}

for (const needle of ["VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS", ".oc-main-stack-timeline", ".oc-timeline-actions", ".oc-timeline-detail", ".oc-timeline-node.is-selected"]) {
  if (!css.includes(needle)) fail("css missing complete selector", { needle });
}







// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:
const deadSelectableInstruction = ["Click or use ", "← →", " to select. Tab / Home / End also work. ", "Selection updates inspector, URL hash, and 3D focus intent."].join("");
for (const path of ["index.html", "404.html"]) {
  const emittedHtml = read(path);
  if (emittedHtml.includes(deadSelectableInstruction)) {
    fail("dead selectable instruction still present", { path });
  }
  if (!emittedHtml.includes("VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY")) {
    fail("native selectable authority missing", { path });
  }
  if (!emittedHtml.includes('href="#static-timeline-detail-')) {
    fail("native static timeline anchors missing", { path });
  }
  if (!emittedHtml.includes('id="static-timeline-detail-')) {
    fail("native static timeline targets missing", { path });
  }
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE",
  stack_nodes: 9,
  modes: contract.selection_modes,
  package_objects: contract.packages.length,
  clickable: true,
  keyboard_selectable: true,
  deep_linkable: true,
  inspector_bound: true,
  package_mode: true,
  timeline_contract_fetch: "no-store",
  timeline_contract_call_chain: true,
  mode_authority_v3: true,
  legacy_clobber_blocked: true,
  generated_surface_bound: true
}, null, 2));
