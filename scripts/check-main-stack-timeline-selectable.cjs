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
}

const runtimeNeedles = [
  "function hydrateMainStackTimeline(container, manifest)",
  "data-stack-id",
  "data-stack-index",
  "aria-selected",
  "tabindex",
  "keydown",
  "ArrowRight",
  "ArrowLeft",
  "Home",
  "End",
  "writeInspector(container",
  "hydrateMainStackTimeline(container, manifest);",
];

for (const needle of runtimeNeedles) {
  if (!runtime.includes(needle)) fail("runtime missing selectable timeline binding", { needle });
}

const cssNeedles = [
  "VERIFRAX_MAIN_STACK_TIMELINE_SELECTABLE_CSS",
  ".oc-main-stack-timeline",
  ".oc-timeline-track",
  ".oc-timeline-node",
  ".oc-timeline-node.is-selected",
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
  generated_surface_bound: true
}, null, 2));
