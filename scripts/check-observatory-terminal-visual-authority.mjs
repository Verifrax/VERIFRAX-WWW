#!/usr/bin/env node
import fs from "node:fs";

const js = fs.readFileSync("assets/observatory-webgl-runtime.js", "utf8");

function fail(message) {
  console.error(`[OBSERVATORY_TERMINAL_VISUAL_FAIL] ${message}`);
  process.exit(1);
}

function must(name, ok) {
  if (!ok) fail(name);
  console.log(`${name} PASS`);
}

must("terminal_visual_authority_marker", js.includes("VCO_TERMINAL_VISUAL_AUTHORITY_REPAIR"));
must("terminal_ready_body_class", js.includes("vco-terminal-ready"));
must("runtime_css_injected", js.includes("vco-terminal-visual-authority-repair"));
must("runtime_promoted_first_viewport", js.includes("document.body.insertBefore(runtime, document.body.firstChild)"));
must("raw_button_reset_blocked", js.includes(":root.vco-terminal-ready button"));
must("fallback_surface_hidden", js.includes("main > :not(.observatory-webgl-runtime)"));
must("command_palette_styled", js.includes(".vco-command") && js.includes(".vco-palette"));
must("inspector_styled", js.includes(".vco-inspector"));
must("journey_styled", js.includes(".vco-journey"));
must("mobile_containment", js.includes("@media (max-width:760px)"));

console.log("observatory_terminal_visual_authority PASS");
