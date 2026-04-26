import { readFileSync } from "node:fs";

const js = readFileSync("assets/observatory-webgl-runtime.js", "utf8");
const css = readFileSync("assets/surface.css", "utf8");
const index = readFileSync("index.html", "utf8");
const not = [];

function must(name, ok) {
  if (!ok) not.push(name);
  else console.log(`${name} PASS`);
}

const repoBlock = js.match(/const GOVERNED_REPOS = Object\.freeze\(\[([\s\S]*?)\]\);/);
const repos = repoBlock ? [...repoBlock[1].matchAll(/"([^"]+)"/g)].map(m => m[1]) : [];
const chamberBlock = js.match(/const CHAMBERS = Object\.freeze\(\[([\s\S]*?)\]\);/);
const chambers = chamberBlock ? [...chamberBlock[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]) : [];
const hostBlock = js.match(/const HOSTS = Object\.freeze\(\[([\s\S]*?)\]\);/);
const hosts = hostBlock ? [...hostBlock[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]) : [];
const journeyBlock = js.match(/const JOURNEY = Object\.freeze\(\[([\s\S]*?)\]\);/);
const journey = journeyBlock ? [...journeyBlock[1].matchAll(/\["([^"]+)"/g)].map(m => m[1]) : [];

must("terminal_runtime_marker", js.includes("VCO_TERMINAL_INTERACTION_COMMAND_MACHINE"));
must("all_35_governed_repos", repos.length === 35);
must("admissorium_repo_35_present", repos.includes("ADMISSORIUM"));
must("all_9_chambers_present", chambers.length === 9);
must("all_host_gates_present", hosts.length >= 12);
must("artifact_journey_live_machine", journey.length === 9 && js.includes("advanceJourney"));
must("raycast_click_authority", js.includes("raycaster.intersectObjects") && js.includes("interactive"));
must("screen_fallback_click_authority", js.includes("resolveScreenFallback"));
must("command_palette_ctrl_k", js.includes("metaKey") && js.includes("ctrlKey") && js.includes("openCommandPalette"));
must("keyboard_navigation", js.includes("ArrowDown") && js.includes("ArrowUp") && js.includes("keyChord"));
must("inspector_dispatcher", js.includes("openPanel") && js.includes("focusObject"));
must("render_permission_full", js.includes("FULL_OBSERVATORY"));
must("admissorium_front_gate_boundary", js.includes("truth_owner=false / sovereign_chamber=false"));
must("real_webgl_material_depth", js.includes("MeshPhysicalMaterial") && js.includes("shadowMap.enabled") && js.includes("FogExp2"));
must("panel_containment_css", css.includes("VCO TERMINAL INTERACTION COMMAND MACHINE") && css.includes(".vco-command") && css.includes(".vco-inspector"));
must("runtime_script_mounted", index.includes("assets/observatory-webgl-runtime.js"));

if (not.length) {
  console.error(`[OBSERVATORY_TERMINAL_MACHINE_FAIL] ${not.join(", ")}`);
  process.exit(1);
}
console.log("observatory_terminal_interaction_command_machine PASS");
