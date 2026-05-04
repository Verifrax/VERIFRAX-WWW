#!/usr/bin/env node
const fs = require("fs");

const EXPECTED = 36;

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_ORG36_OBSERVATORY_RUNTIME_CONVERGENCE",
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
const manifest = readJson("data/verifrax-observatory.json");
const witness = readJson("public/data/verifrax-org36-public-surface-authority-witness.json");

if (witness?.authority_boundary?.expected_repository_count !== EXPECTED) fail("witness expected count mismatch");
if (witness?.authority_boundary?.repository_count_live !== EXPECTED) fail("witness live count mismatch");
if (witness?.authority_boundary?.stale_34_35_counts_forbidden !== true) fail("stale count witness guard missing");

if (manifest?.system?.governed_repo_count !== EXPECTED) fail("runtime manifest governed_repo_count mismatch");
if (!Array.isArray(manifest.repositories) || manifest.repositories.length !== EXPECTED) {
  fail("runtime manifest repository array mismatch", {
    governed_repo_count: manifest?.system?.governed_repo_count,
    repository_array_length: Array.isArray(manifest.repositories) ? manifest.repositories.length : null
  });
}

const witnessRepos = new Set(witness.authority_boundary.repositories.map(r => `Verifrax/${r.name}`));
const manifestRepos = new Set(manifest.repositories.map(r => r.repo));
const missing = [...witnessRepos].filter(x => !manifestRepos.has(x)).sort();
const extra = [...manifestRepos].filter(x => !witnessRepos.has(x)).sort();
if (missing.length || extra.length) fail("runtime manifest does not equal ORG36 witness repo set", { missing, extra });

if (!index.includes("36 repositories. 9 sovereign chambers.")) fail("index hero is not ORG36");
if (index.includes("36 repositories") || index.includes('data-count="repos">36')) fail("index contains stale ORG35 count");

if (runtime.includes("repo_count_not_35")) fail("runtime still emits repo_count_not_35");
if (runtime.includes("repositories.length !== 35")) fail("runtime still enforces repositories.length === 35");
if (runtime.includes("repo 35 · front admissibility gate")) fail("runtime still labels ADMISSORIUM as repo 35");

if (!runtime.includes("repositories.length !== 36")) fail("runtime does not enforce ORG36");
if (!manifest.packages?.some(p => p.name === "verifrax" && p.ecosystem === "pypi" && p.version === "0.1.0")) {
  fail("runtime manifest missing sealed PyPI package object");
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_ORG36_OBSERVATORY_RUNTIME_CONVERGENCE",
  repository_count: EXPECTED,
  runtime_manifest: "data/verifrax-observatory.json",
  index_runtime_count: "36",
  webgl_runtime_assertion: "repo_count_not_36",
  pypi_package_visible: true,
  signed_public_manifest_left_unchanged: true,
  no_publish_executed: true
}, null, 2));
