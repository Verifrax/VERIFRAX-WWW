import fs from "node:fs";

const file = "OBSERVATORY_CONSTITUTION.md";
const failures = [];
const required = [
"DERIVED_PROJECTION",
"NOT_TRUTH_SOURCE",
"FULL_OBSERVATORY",
"SAFE_PROJECTION",
"BLOCKED_PROJECTION",
"ADMISSORIUM",
"FRONT_GATE_ONLY",
"SOVEREIGN_CHAMBER",
"TRUTH_SOURCE",
"ACCEPTED_STATE",
"35 governed repositories",
"9 chambers",
"Beauty is subordinate to projection permission",
"The Observatory may render only what it can publicly justify",
"No-lie CI",
"QUARANTINED PROJECTION OBJECT"
];

if (!fs.existsSync(file)) {
failures.push(`${file} missing`);
} else {
const text = fs.readFileSync(file, "utf8");
for (const marker of required) {
if (!text.includes(marker)) failures.push(`missing marker: ${marker}`);
}
if (text.length < 12000) failures.push(`constitution too thin: ${text.length} bytes`);
}

for (const stale of ["assets/.observatory-webgl-runtime.js.swp"]) {
if (fs.existsSync(stale)) failures.push(`stale editor artifact present: ${stale}`);
}

if (failures.length) {
console.error(JSON.stringify({ ok: false, failures }, null, 2));
process.exit(1);
}

console.log(JSON.stringify({ ok: true, file, markers: required.length }, null, 2));
