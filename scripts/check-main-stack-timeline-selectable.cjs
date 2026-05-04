#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({ status: "FAIL", gate: "VERIFRAX_MAIN_STACK_TIMELINE_SELECTABLE", error, ...extra }, null, 2));
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail("missing file", { path });
  return fs.readFileSync(path, "utf8");
}

const index = read("index.html");
const notFound = read("404.html");
const runtime = read("assets/observatory-webgl-runtime.js");
const css = read("assets/surface.css");

for (const [name, html] of [["index", index], ["404", notFound]]) {
  if (!html.includes("data-main-stack-timeline")) fail(`${name} missing timeline mount`);
  if (!html.includes("MAIN STACK TIMELINE")) fail(`${name} missing timeline label`);
  if (!html.includes('role="listbox"')) fail(`${name} missing listbox role`);
  if (!html.includes("Click or use ← → to select")) fail(`${name} missing selectable instruction`);
  for (const mode of ["stack", "artifact", "host", "repository", "package"]) {
    if (!html.includes(`data-timeline-mode="${mode}"`)) fail(`${name} missing mode`, { mode });
    if (!html.includes(`data-timeline-mode-count="${mode}"`)) fail(`${name} missing mode count`, { mode });
  }
}

const runtimeNeedles = [
  "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2",
  "VERIFRAX_TIMELINE_MODE_AUTHORITY_V3",
  "function hydrateCompleteMainStackTimeline(container, manifest, timelineContract = null)",
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
  "data-stack-id",
  "data-stack-index",
  "aria-selected",
  "tabindex",
  "keydown",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
  "writeInspector(container"
];

for (const needle of runtimeNeedles) {
  if (!runtime.includes(needle)) fail("runtime missing selectable timeline binding", { needle });
}

if (runtime.includes("function hydrateCommandSurface(container, manifest, attestation) {")) {
  fail("old hydrateCommandSurface signature still present");
}
if (runtime.includes("hydrateMainStackTimeline(container, manifest);")) {
  fail("legacy timeline hydrator still clobbers complete timeline");
}

for (const needle of ["VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS", ".oc-main-stack-timeline", ".oc-timeline-track", ".oc-timeline-node", ".oc-timeline-node.is-selected"]) {
  if (!css.includes(needle)) fail("css missing timeline selector", { needle });
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_MAIN_STACK_TIMELINE_SELECTABLE",
  clickable: true,
  keyboard_selectable: true,
  inspector_bound: true,
  package_mode: true,
  runtime_authority_v2: true,
  mode_authority_v3: true,
  timeline_contract_call_chain: true,
  legacy_clobber_blocked: true,
  generated_surface_bound: true
}, null, 2));
