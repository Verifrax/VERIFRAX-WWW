#!/usr/bin/env node
"use strict";

const fs = require("fs");
const GATE = "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY";
const NATIVE = "Click any object to open its native static detail. Selection is resolved by URL fragment and CSS target state before JavaScript.";

const DEAD = ["Click or use ", "← →", " to select. Tab / Home / End also work. ", "Selection updates inspector, URL hash, and 3D focus intent."].join("");
const STALE = [
  DEAD,
  ["Click any object to open its native static detail. ", "JavaScript enhances", " keyboard selection, inspector updates, URL hash, and ", "3D focus intent", " when available."].join(""),
  ["JavaScript enhances", " keyboard selection"].join(""),
  ["3D focus intent", " when available"].join("")
];

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function fail(error, detail = {}) {
  console.error(JSON.stringify({ status: "FAIL", gate: GATE, error, ...detail }, null, 2));
  process.exit(1);
}

for (const path of ["index.html", "404.html"]) {
  const html = read(path);

  for (const staleInstruction of STALE) {
    if (html.includes(staleInstruction)) {
      fail("stale JS enhancement promise present", { path, staleInstruction });
    }
  }

  if (!html.includes(NATIVE)) fail("native static instruction missing", { path });
  if (!html.includes(GATE)) fail("native static authority marker missing", { path });
  if (!html.includes("data-static-timeline-details")) fail("static timeline detail container missing", { path });
  if (!html.includes('href="#static-timeline-detail-')) fail("native static timeline anchors missing", { path });
  if (!html.includes('id="static-timeline-detail-')) fail("native static timeline targets missing", { path });

  const detailCount = (html.match(/<section\b[^>]*\bdata-static-timeline-detail\b/g) || []).length;
  if (detailCount !== 9) fail("wrong native static detail count", { path, expected: 9, actual: detailCount });
}

const css = read("assets/surface.css");
for (const needle of [
  GATE,
  ".oc-static-timeline-detail:target",
  "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT"
]) {
  if (!css.includes(needle)) fail("native CSS authority missing", { needle });
}

console.log(JSON.stringify({
  status: "PASS",
  gate: GATE,
  native_static_details: 9,
  dead_instruction_removed: true,
  version_raise: false
}, null, 2));
