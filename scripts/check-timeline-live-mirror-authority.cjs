#!/usr/bin/env node
const fs = require("fs");

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_TIMELINE_LIVE_MIRROR_AUTHORITY",
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

const rootPath = "data/main-stack-timeline.json";
const deployedPath = "data/timeline/main-stack-timeline.json";
const publicPath = "public/data/timeline/main-stack-timeline.json";
const runtimePath = "assets/observatory-webgl-runtime.js";
const postPassPath = "scripts/apply-timeline-runtime-authority.py";

const rootRaw = read(rootPath);
const deployedRaw = read(deployedPath);
const publicRaw = read(publicPath);

if (rootRaw !== deployedRaw) fail("deployed mirror differs from root contract");
if (rootRaw !== publicRaw) fail("public mirror differs from root contract");

const root = JSON.parse(rootRaw);
if (root.projection_type !== "DERIVED_PROJECTION") fail("bad projection type");
if (root.truth_warning !== "NOT_TRUTH_SOURCE") fail("truth warning missing");
if (!Array.isArray(root.stack) || root.stack.length !== 9) fail("stack count mismatch");
if (!Array.isArray(root.packages) || root.packages.length !== 3) fail("package count mismatch");
if (JSON.stringify(root.selection_modes) !== JSON.stringify(["stack", "artifact", "host", "repository", "package"])) {
  fail("selection modes mismatch", { selection_modes: root.selection_modes });
}

const runtime = read(runtimePath);
if (!runtime.includes('const TIMELINE_URL = "data/main-stack-timeline.json";')) {
  fail("runtime timeline URL changed");
}
if (!runtime.includes("VERIFRAX_TIMELINE_MODE_AUTHORITY_V3")) {
  fail("runtime V3 marker missing");
}
if (!runtime.includes("timelineContract.packages")) {
  fail("package contract binding missing");
}

const postPass = read(postPassPath);
for (const needle of [
  "data/main-stack-timeline.json",
  "data/timeline/main-stack-timeline.json",
  "public/data/timeline/main-stack-timeline.json",
]) {
  if (!postPass.includes(needle)) fail("post-pass mirror path missing", { needle });
}

const versionFiles = [
  "package.json",
  "package-lock.json",
  "pyproject.toml",
  "setup.py",
  "setup.cfg"
].filter((path) => fs.existsSync(path));

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_TIMELINE_LIVE_MIRROR_AUTHORITY",
  root_contract: rootPath,
  deployed_live_path: deployedPath,
  public_source_mirror: publicPath,
  stack_nodes: root.stack.length,
  package_objects: root.packages.length,
  version_files_present: versionFiles,
  version_raise: false
}, null, 2));
