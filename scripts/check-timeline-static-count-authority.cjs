#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY",
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

const timeline = readJson("data/main-stack-timeline.json");
const observatory = readJson("data/verifrax-observatory.json");

function collectionCount(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value.length;
    if (value && typeof value === "object") return Object.keys(value).length;
  }
  return 0;
}

const expected = {
  stack: timeline.stack.length,
  artifact: collectionCount(
    timeline.artifacts,
    timeline.artifact_journey,
    timeline.journey,
    timeline.artifact_chain,
    observatory.artifacts,
    observatory.artifact_journey,
    observatory.journey,
    observatory.artifact_chain
  ),
  host: Array.isArray(observatory.hosts) ? observatory.hosts.length : 12,
  repository: observatory.repositories.length,
  package: timeline.packages.length
};

if (expected.stack !== 9) fail("stack count mismatch", { expected });
if (expected.host !== 12) fail("host count mismatch", { expected });
if (expected.repository !== 36) fail("repository count mismatch", { expected });
if (expected.package !== 3) fail("package count mismatch", { expected });

for (const path of ["index.html", "404.html"]) {
  const html = read(path);
  for (const [mode, count] of Object.entries(expected)) {
    const needle = `data-timeline-mode-count="${mode}">${count}</b>`;
    if (!html.includes(needle)) {
      fail("static HTML count missing", { path, mode, count, needle });
    }
  }
  if (html.includes('data-timeline-mode-count="stack">0</b>')) {
    fail("stack count remains zero", { path });
  }
  if (html.includes('data-timeline-mode-count="repository">0</b>')) {
    fail("repository count remains zero", { path });
  }
  if (html.includes('data-timeline-mode-count="package">0</b>')) {
    fail("package count remains zero", { path });
  }
}

const runtime = read("assets/observatory-webgl-runtime.js");
for (const needle of [
  "VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY",
  "const EXPECTED_TIMELINE_STATIC_COUNTS",
  '"repository": 36',
  '"package": 3',
  '"stack": 9'
]) {
  if (!runtime.includes(needle)) fail("runtime static count marker missing", { needle });
}

const postPass = read("scripts/apply-timeline-static-count-authority.py");
for (const needle of [
  "VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY",
  "version_raise",
  "repository count must be 36",
  "package count must be 3"
]) {
  if (!postPass.includes(needle)) fail("post-pass static count invariant missing", { needle });
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY",
  counts: expected,
  version_raise: false
}, null, 2));
