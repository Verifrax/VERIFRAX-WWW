import fs from "node:fs";

const file = "assets/observatory-webgl-runtime.js";
const text = fs.readFileSync(file, "utf8");

const required = [
  "VCO_TERMINAL_NO_ATOM_ORBIT_API",
  "VCO_TERMINAL_NO_ATOM_ORBIT_AUTHORITY",
  "data-vco-no-atom-core",
  "RESTRAINED_FACETED_TRUTH_CORE_NOT_ATOM_ORBIT_TOY",
  "STRAIGHT_DETERMINISTIC_LINES_NOT_ORBITAL_LOOPS",
  "NO_WHITE_PLACEHOLDER_PLATES",

  "VCO_TERMINAL_VISUAL_DOCTRINE_FINAL_API",
  "data-vco-terminal-visual-doctrine-final",

  "VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API",
  "VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_AUTHORITY",
  "data-vco-terminal-absolute-visual-lock",
  "noAtomLoops",
  "noWireCube",
  "noWhiteSlabs",

  "VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_AUTHORITY",
  "VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_API",
  "VCO_TERMINAL_FOREGROUND_COMPOSITION_API",
  "data-vco-foreground-composition-governor",
  "data-vco-foreground-composition-api-alias-lock",
  "VCO_TERMINAL_FOREGROUND_COMPOSITION_API_ALIAS_LOCK_AUTHORITY",

  "VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API",
  "VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_GOVERNOR_AUTHORITY",
  "data-vco-hard-foreground-occlusion-governor",
  "compositionGovernorPreserved",
  "residualObstructions"
];

const missing = required.filter((marker) => !text.includes(marker));

if (missing.length) {
  console.error(JSON.stringify({
    ok: false,
    file,
    doctrine: "terminal_visual_doctrine_invariant",
    missing
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  file,
  doctrine: "terminal_visual_doctrine_invariant",
  requiredMarkers: required.length,
  foregroundCompositionApiAlias: true
}, null, 2));
