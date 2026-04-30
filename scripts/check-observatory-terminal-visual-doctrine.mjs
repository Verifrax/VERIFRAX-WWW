import fs from "node:fs";

const file = "assets/observatory-webgl-runtime.js";
const src = fs.readFileSync(file, "utf8");

const required = [
  "VCO_TERMINAL_NO_ATOM_ORBIT_AUTHORITY",
  "VCO_TERMINAL_NO_ATOM_ORBIT_API",
  "VCO_TERMINAL_VISUAL_DOCTRINE_FINAL_API",
  "VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_AUTHORITY",
  "VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API",
  "VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_AUTHORITY",
  "VCO_TERMINAL_FOREGROUND_COMPOSITION_API",
  "VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_GOVERNOR_AUTHORITY",
  "VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API",
  'data-vco-no-atom-core", "accepted"',
  'data-vco-terminal-visual-doctrine-final", "accepted"',
  'data-vco-terminal-absolute-visual-lock", "accepted"',
  'data-vco-foreground-composition-governor", "accepted"',
  'data-vco-hard-foreground-occlusion-governor", "accepted"',
  "noAtomLoops: true",
  "noWireCube: true",
  "noWhiteSlabs: true",
  "noAtomLoopsPreserved",
  "noCentralCagePreserved",
  "residualObstructions",
];

const forbidden = [
  "data-vco-no-atom-core\", \"rejected\"",
  "data-vco-terminal-visual-doctrine-final\", \"rejected\"",
  "data-vco-terminal-absolute-visual-lock\", \"rejected\"",
  "data-vco-hard-foreground-occlusion-governor\", \"rejected\"",
];

const missing = required.filter((needle) => !src.includes(needle));
const presentForbidden = forbidden.filter((needle) => src.includes(needle));

if (missing.length || presentForbidden.length) {
  console.error(JSON.stringify({
    ok: false,
    file,
    missing,
    presentForbidden,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  file,
  doctrine: "terminal_visual_doctrine_invariant",
  requiredMarkers: required.length,
}, null, 2));
