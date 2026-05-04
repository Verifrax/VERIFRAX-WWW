#!/usr/bin/env node
const fs = require("node:fs");

const GATE = "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY";
function fail(error, detail = {}) {
  console.error(JSON.stringify({ status: "FAIL", gate: GATE, error, ...detail }, null, 2));
  process.exit(1);
}
function read(path) {
  return fs.readFileSync(path, "utf8");
}

const stack = JSON.parse(read("data/main-stack-timeline.json")).stack;
const css = read("assets/surface.css");
const runtime = read("assets/observatory-webgl-runtime.js");

for (const path of ["index.html", "404.html"]) {
  const html = read(path);

  if (!html.includes(GATE)) fail("native interaction authority marker missing", { path });
  if (html.includes("Click or use ← → to select. Tab / Home / End also work. Selection updates inspector, URL hash, and 3D focus intent.")) {
    fail("dead runtime instruction still present", { path });
  }

  for (const item of stack) {
    if (!html.includes(`href="#static-timeline-detail-${item.id}"`)) fail("native static click target missing", { path, id: item.id });
    if (!html.includes(`id="static-timeline-detail-${item.id}"`)) fail("native static detail target missing", { path, id: item.id });
  }

  const details = (html.match(/\bdata-static-timeline-detail(?=[\s=>])/g) || []).length;
  if (details !== stack.length) fail("wrong static detail count", { path, expected: stack.length, actual: details });
}

for (const needle of [
  GATE,
  ".oc-static-timeline-detail:target",
  "data-static-timeline-details"
]) {
  if (!css.includes(needle) && !read("index.html").includes(needle) && !runtime.includes(needle)) {
    fail("native interaction needle missing", { needle });
  }
}

console.log(JSON.stringify({
  status: "PASS",
  gate: GATE,
  native_static_details: stack.length,
  dead_instruction_removed: true,
  version_raise: false
}, null, 2));
