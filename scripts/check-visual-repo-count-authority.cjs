#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_VISUAL_REPO_COUNT_AUTHORITY",
    error,
    ...extra
  }, null, 2));
  process.exit(1);
}

function read(path) {
  if (!fs.existsSync(path)) fail("missing file", { path });
  return fs.readFileSync(path, "utf8");
}

function json(path) {
  return JSON.parse(read(path));
}

const runtimeManifest = json("data/verifrax-observatory.json");
const publicManifest = json("public/data/verifrax-observatory.json");

const runtimeCount = runtimeManifest.repositories.length;
const publicCount = publicManifest.repositories.length;

if (runtimeCount !== 36) fail("runtime repository count not 36", { runtimeCount });
if (publicCount !== 36) fail("public repository count not 36", { publicCount });

const files = [
  "index.html",
  "404.html",
  "assets/observatory-webgl-runtime.js",
  "assets/observatory-render-gate.js",
  "assets/surface.css",
  "data/status.json",
  "public/data/status.json",
  "data/verifrax-observatory.json",
  "public/data/verifrax-observatory.json",
  "scripts/bootstrap-observatory-projection.mjs"
];

for (const path of files) {
  const text = read(path);

  if (/35\s+(governed\s+)?repositories/i.test(text)) {
    fail("stale visual 35 repositories claim", { path });
  }

  if (/35\s+GOVERNED\s+REPOSITORIES/i.test(text)) {
    fail("stale uppercase 35 governed repositories claim", { path });
  }

  if (text.includes("35 REPOSITORIES. ONE CONSTITUTIONAL MACHINE.")) {
    fail("stale status label 35 repositories claim", { path });
  }

  if (text.includes("VERIFRAX_OBSERVATORY_35_GOVERNED_REPO_PILLAR_AUTHORITY")) {
    fail("stale 35 repo pillar authority marker", { path });
  }

  if (text.includes("manifest.repositories?.length === 35") ||
      text.includes("receipt.object_counts?.governed_repositories === 35") ||
      text.includes("repos.length === 35")) {
    fail("stale machine check against 35 repositories", { path });
  }
}

const runtime = read("assets/observatory-webgl-runtime.js");

for (const needle of [
  "VERIFRAX_VISUAL_REPO_COUNT_AUTHORITY",
  "36 GOVERNED REPOSITORIES",
  "data-count=\"repos\""
]) {
  if (!runtime.includes(needle) && !read("index.html").includes(needle)) {
    fail("visual repo-count authority marker missing", { needle });
  }
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_VISUAL_REPO_COUNT_AUTHORITY",
  runtime_repositories: runtimeCount,
  public_repositories: publicCount,
  stale_35_visual_claim: false,
  version_raise: false
}, null, 2));
