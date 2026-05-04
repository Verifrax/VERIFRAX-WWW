#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE",
    error,
    ...extra
  }, null, 2));
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
  if (!html.includes("data-timeline-mode=\"stack\"")) fail(`${name} missing stack mode`);
  if (!html.includes("data-timeline-mode=\"artifact\"")) fail(`${name} missing artifact mode`);
  if (!html.includes("data-timeline-mode=\"host\"")) fail(`${name} missing host mode`);
  if (!html.includes("data-timeline-mode=\"repository\"")) fail(`${name} missing repository mode`);
}

if (contract.schema_version !== "1.0.0") fail("bad contract schema");
if (contract.projection_type !== "DERIVED_PROJECTION") fail("timeline is not derived projection");
if (contract.truth_warning !== "NOT_TRUTH_SOURCE") fail("timeline truth warning missing");
if (!Array.isArray(contract.stack) || contract.stack.length !== 9) fail("stack length mismatch");
if (JSON.stringify(contract) !== JSON.stringify(publicContract)) fail("public contract mirror mismatch");

const expected = [
  "syntagmarium",
  "orbistium",
  "consonorium",
  "tachyrium",
  "auctoriseal",
  "corpiform",
  "verifrax",
  "anagnorium",
  "regressorium"
];

const actual = contract.stack.map((item) => item.id);
if (JSON.stringify(actual) !== JSON.stringify(expected)) fail("stack order mismatch", { actual });

const runtimeNeedles = [
  "const TIMELINE_URL = \"data/main-stack-timeline.json\"",
  "hydrateCompleteMainStackTimeline",
  "timelineObjectFromMode",
  "data-timeline-mode",
  "data-stack-id",
  "aria-selected",
  "tabindex",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
  "verifrax:timeline-select",
  "history.replaceState",
  "writeInspector(container",
  "timelineContract"
];

for (const needle of runtimeNeedles) {
  if (!runtime.includes(needle)) fail("runtime missing complete binding", { needle });
}

const cssNeedles = [
  "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS",
  ".oc-main-stack-timeline",
  ".oc-timeline-actions",
  ".oc-timeline-detail",
  ".oc-timeline-node.is-selected"
];

for (const needle of cssNeedles) {
  if (!css.includes(needle)) fail("css missing complete selector", { needle });
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE",
  stack_nodes: 9,
  modes: contract.selection_modes,
  clickable: true,
  keyboard_selectable: true,
  deep_linkable: true,
  inspector_bound: true,
  generated_surface_bound: true
}, null, 2));
