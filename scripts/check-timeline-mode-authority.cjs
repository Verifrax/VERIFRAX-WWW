#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_TIMELINE_MODE_AUTHORITY",
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
const runtime = read("assets/observatory-webgl-runtime.js");
const contract = readJson("data/main-stack-timeline.json");
const publicContract = readJson("public/data/timeline/main-stack-timeline.json");

const modes = ["stack", "artifact", "host", "repository", "package"];

for (const mode of modes) {
  if (!index.includes(`data-timeline-mode="${mode}"`)) fail("mode button missing", { mode });
  if (!index.includes(`data-timeline-mode-count="${mode}"`)) fail("mode count missing", { mode });
}

if (!Array.isArray(contract.packages) || contract.packages.length < 1) {
  fail("contract package mode has no package objects");
}

if (JSON.stringify(contract.packages) !== JSON.stringify(publicContract.packages)) {
  fail("public package contract mirror mismatch");
}

const runtimeNeedles = [
  "VERIFRAX_TIMELINE_MODE_AUTHORITY_V3",
  "data-timeline-mode-count",
  "function timelineEmptyModeDenial(mode)",
  "timelineContract.packages",
  "modeCounts = {",
  "url.hash = `timeline:${mode}:${item.id}`",
  "hash.match(/^#timeline:([^:]+):(.+)$/)",
  "Must not own",
  "Owns"
];

for (const needle of runtimeNeedles) {
  if (!runtime.includes(needle)) fail("runtime missing mode-authority binding", { needle });
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_TIMELINE_MODE_AUTHORITY",
  modes,
  package_objects: contract.packages.length,
  mode_aware_deeplinks: true,
  mode_counts: true,
  empty_mode_denial: true,
  owns_detail: true,
  must_not_own_detail: true
}, null, 2));
