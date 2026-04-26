#!/usr/bin/env node
import fs from "node:fs";

const runtime = fs.readFileSync("assets/observatory-webgl-runtime.js", "utf8");

function fail(message) {
  console.error(`[OBSERVATORY_RUNTIME_BOOT_FAIL] ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const isTerminalMachine = runtime.includes("VCO_TERMINAL_INTERACTION_COMMAND_MACHINE");

if (isTerminalMachine) {
  const repoBlock = runtime.match(/const GOVERNED_REPOS = Object\.freeze\(\[([\s\S]*?)\]\);/);
  const repos = repoBlock ? [...repoBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

  const chamberBlock = runtime.match(/const CHAMBERS = Object\.freeze\(\[([\s\S]*?)\]\);/);
  const chambers = chamberBlock ? [...chamberBlock[1].matchAll(/\["([^"]+)"/g)].map((m) => m[1]) : [];

  assert(repos.length === 35, "terminal runtime must expose exactly 35 governed repositories");
  assert(repos.includes("ADMISSORIUM"), "terminal runtime must include ADMISSORIUM as governed repo");
  assert(chambers.length === 9, "terminal runtime must expose exactly 9 sovereign chambers");

  assert(runtime.includes("ADMISSORIUM") && runtime.includes("front_gate"), "ADMISSORIUM must remain front_gate");
  assert(runtime.includes("truth_owner=false / sovereign_chamber=false"), "ADMISSORIUM non-truth-owner boundary missing");

  assert(runtime.includes("raycaster.intersectObjects"), "terminal runtime must retain WebGL raycast click authority");
  assert(runtime.includes("resolveScreenFallback"), "terminal runtime must retain screen fallback click authority");
  assert(runtime.includes("openPanel") && runtime.includes("focusObject"), "terminal runtime must retain inspector dispatcher");
  assert(runtime.includes("openCommandPalette"), "terminal runtime must retain command palette");
  assert(runtime.includes("ctrlKey") && runtime.includes("metaKey"), "terminal runtime must retain Ctrl/Cmd+K binding");
  assert(runtime.includes("ArrowDown") && runtime.includes("ArrowUp"), "terminal runtime must retain keyboard navigation");
  assert(runtime.includes("keyChord"), "terminal runtime must retain keyboard chord navigation");
  assert(runtime.includes("advanceJourney"), "terminal runtime must retain live Artifact Journey state machine");

  assert(runtime.includes("MeshPhysicalMaterial"), "terminal runtime must retain real material depth");
  assert(runtime.includes("shadowMap.enabled"), "terminal runtime must retain shadow discipline");
  assert(runtime.includes("FogExp2"), "terminal runtime must retain atmospheric depth");

  assert(runtime.includes("FULL_OBSERVATORY"), "terminal runtime render permission boundary missing");
  assert(runtime.includes("DERIVED_PROJECTION") || runtime.includes("derived projection") || runtime.includes("NOT_TRUTH_SOURCE"), "terminal runtime projection warning boundary missing");

  console.log("observatory_runtime_boot_authority PASS");
  process.exit(0);
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
