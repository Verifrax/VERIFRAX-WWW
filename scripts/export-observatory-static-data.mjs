#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const source = "public/data";
const target = "data";

if (!existsSync(source) || !statSync(source).isDirectory()) {
  console.error("[OBSERVATORY_STATIC_DATA_EXPORT_FAIL] missing public/data");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const entry of readdirSync(source)) {
  const from = join(source, entry);
  const to = join(target, entry);
  if (statSync(from).isFile()) copyFileSync(from, to);
}

console.log("OBSERVATORY STATIC DATA EXPORT");
console.log(`source ${source}`);
console.log(`target ${target}`);
console.log(`files  ${readdirSync(target).length}`);
