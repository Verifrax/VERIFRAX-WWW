#!/usr/bin/env node
const fs = require("fs");

const GATE = "VERIFRAX_STATIC_OBSERVATORY_DOM_AUTHORITY";

function fail(error, extra = {}) {
  console.error(JSON.stringify({ status: "FAIL", gate: GATE, error, ...extra }, null, 2));
  process.exit(1);
}

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function count(html, needle) {
  return (html.match(new RegExp(needle, "g")) || []).length;
}

for (const path of ["index.html", "404.html"]) {
  const html = read(path);

  if (!html.includes(GATE)) fail("static DOM authority marker missing", { path });

  const invariants = [
    ["static timeline nodes", "data-static-timeline-node", 9],
    ["static stack nodes", "data-static-stack-node", 9],
    ["static host nodes", "data-static-host-node", 12],
    ["static journey nodes", "data-static-journey-node", 9],
    ["static enterprise nodes", "data-static-enterprise-node", 5],
  ];

  for (const [label, needle, expected] of invariants) {
    const actual = count(html, needle);
    if (actual < expected) fail(`${label} missing`, { path, needle, expected_at_least: expected, actual });
  }

  const deadRegions = [
    /<div class="oc-timeline-track"[^>]*data-main-stack-timeline[^>]*>\s*<\/div>/,
    /<ol data-stack-list>\s*<\/ol>/,
    /<ul data-host-list>\s*<\/ul>/,
    /<ol data-journey-list>\s*<\/ol>/,
    /<div class="oc-enterprise" data-enterprise-list>\s*<\/div>/,
    /<strong>Selection loading<\/strong>/,
  ];

  for (const pattern of deadRegions) {
    if (pattern.test(html)) fail("dead static observatory region remains", { path, pattern: String(pattern) });
  }

  for (const id of ["syntagmarium", "admissorium", "regressorium"]) {
    if (!html.includes(`timeline:stack:${id}`)) fail("canonical stack deeplink missing", { path, id });
  }

  for (const mode of ["stack", "artifact", "host", "repository", "package"]) {
    if (!html.includes(`data-timeline-mode="${mode}"`)) fail("timeline mode button missing", { path, mode });
  }
}

console.log(JSON.stringify({
  status: "PASS",
  gate: GATE,
  static_timeline_nodes: 9,
  static_stack_nodes: 9,
  static_host_nodes: 12,
  static_journey_nodes: 9,
  static_enterprise_nodes: 5,
  dead_static_regions: false,
  version_raise: false
}, null, 2));
