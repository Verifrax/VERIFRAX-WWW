#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILE = path.join(ROOT, "public/data/verifrax-org36-public-surface-authority-witness.json");

const EXPECTED = {
  repoCount: 36,
  pkg: "verifrax",
  version: "0.1.0",
  wheelSha: "5139065b0c4f3738bff6252f72bd2615b59efb9ad356d1e875311cb1d5ac5701",
  sdistSha: "9a7675917708bbadcc740c4a078ed41c3642593eb9993db2dc60243da66ff3bd",
};

function fail(error) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_ORG36_PUBLIC_SURFACE_AUTHORITY_WITNESS",
    error
  }, null, 2));
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

if (data.schema !== "verifrax.org36.public-surface-authority-witness.v1") fail("bad schema");
if (data.status !== "PASS") fail("witness not PASS");

const auth = data.authority_boundary || {};
if (auth.expected_repository_count !== EXPECTED.repoCount) fail("bad expected repository count");
if (auth.repository_count_live !== EXPECTED.repoCount) fail("bad live repository count");
if (!Array.isArray(auth.repositories) || auth.repositories.length !== EXPECTED.repoCount) fail("repository graph mismatch");
if (auth.stale_34_35_counts_forbidden !== true) fail("stale count guard missing");

const py = data.sealed_distribution?.python;
if (!py) fail("missing sealed python distribution");
if (py.package !== EXPECTED.pkg) fail("bad package");
if (py.version !== EXPECTED.version) fail("bad version");
if (py.files?.wheel?.sha256 !== EXPECTED.wheelSha) fail("wheel sha mismatch");
if (py.files?.sdist?.sha256 !== EXPECTED.sdistSha) fail("sdist sha mismatch");
if (py.release_tag !== "v0.1.0") fail("bad release tag");
if (py.release_tag_head === py.remote_main) fail("release tag moved to post-seal main");
if (py.tag_is_annotated !== true) fail("release tag is not annotated");
if (py.tag_not_moved_to_post_seal_witness !== true) fail("tag immutability invariant false");

const surface = data.public_surface || {};
if (surface.role !== "rendered projection surface") fail("bad surface role");
if (surface.authority !== "does_not_own_truth") fail("bad surface authority");
const hostNames = new Set((surface.host_roles || []).map(x => x.name));
for (const name of ["www","api_health","api_ready","api_version","api_openapi","status","docs","proof","verify","apply"]) {
  if (!hostNames.has(name)) fail(`missing public surface role: ${name}`);
}

for (const key of [
  "org36_is_current_public_repository_perimeter",
  "www_is_projection_not_origin",
  "proof_verify_apply_are_separate_public_surfaces",
  "pypi_v010_is_sealed",
  "same_version_publish_rerun_refused",
  "no_publish_executed"
]) {
  if (data.invariants?.[key] !== true) fail(`missing invariant: ${key}`);
}

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_ORG36_PUBLIC_SURFACE_AUTHORITY_WITNESS",
  repository_count: EXPECTED.repoCount,
  package: EXPECTED.pkg,
  version: EXPECTED.version,
  pypi_v010_sealed: true,
  release_tag_unmoved: true,
  www_authority: "projection_not_origin",
  no_publish_executed: true
}, null, 2));
