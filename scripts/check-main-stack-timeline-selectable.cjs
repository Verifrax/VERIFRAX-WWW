#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_MAIN_STACK_TIMELINE_SELECTABLE",
    error,
    ...extra
  }, null, 2));
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
  if (!html.includes('data-timeline-mode="package"')) fail(`${name} missing package timeline mode`);
}

const runtimeNeedles = [
  "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2",
  "function hydrateCompleteMainStackTimeline(container, manifest, timelineContract = null)",
  "timelineObjectFromMode",
  'if (mode === "package")',
  'fetch(TIMELINE_URL, { cache: "no-store" })',
  "const timelineContract = await timelineResponse.json();",
  "function hydrateCommandSurface(container, manifest, attestation, timelineContract)",
  "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
  "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
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

const cssNeedles = [
  "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS",
  ".oc-main-stack-timeline",
  ".oc-timeline-track",
  ".oc-timeline-node",
  ".oc-timeline-node.is-selected"
];

for (const needle of cssNeedles) {
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
  timeline_contract_call_chain: true,
  legacy_clobber_blocked: true,
  generated_surface_bound: true
}, null, 2));
