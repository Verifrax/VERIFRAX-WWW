#!/usr/bin/env node
import fs from "node:fs";

const runtime = fs.readFileSync("assets/observatory-webgl-runtime.js", "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`[OBSERVATORY_RUNTIME_BOOT_FAIL] ${message}`);
    process.exit(1);
  }
}

assert(runtime.includes("function createAdmissoriumRepoGate(scene, repo, labels, selectable)"), "ADMISSORIUM gate helper must receive scene explicitly");
assert(runtime.includes("createAdmissoriumRepoGate(scene, admissoriumRepo, labels, selectable);"), "ADMISSORIUM gate call must pass scene explicitly");
assert(!runtime.includes("function createAdmissoriumRepoGate(repo, labels, selectable)"), "stale ADMISSORIUM helper signature remains");

assert(runtime.includes("scene.add(group);"), "ADMISSORIUM gate must still be added to real scene");
assert(runtime.includes("createGovernedRepoPillar"), "35 repo pillar constructor missing");
assert(runtime.includes("governedRepoPillarAuthority"), "35 repo pillar authority marker missing");

assert(runtime.includes("function observatoryRuntimeBootError(event)"), "runtime boot error handler missing");
assert(runtime.includes('window.addEventListener("error", observatoryRuntimeBootError);'), "runtime boot error listener missing");
assert(runtime.includes('window.addEventListener("unhandledrejection"'), "runtime rejection listener missing");
assert(runtime.includes("window.observatoryRuntimeBootFailure"), "runtime boot failure marker missing");
assert(runtime.includes("window.observatorySceneBoot"), "successful scene boot marker missing");
assert(runtime.includes("observatoryRuntimeBootAuthority"), "runtime boot authority marker missing");

assert(runtime.includes("DERIVED_PROJECTION"), "projection warning missing from runtime");
assert(runtime.includes("NOT_TRUTH_SOURCE"), "truth warning missing from runtime");
assert(runtime.includes("FULL_OBSERVATORY"), "render permission boundary missing from runtime");

console.log("observatory_runtime_boot_authority PASS");
