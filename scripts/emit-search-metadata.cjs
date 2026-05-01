const fs = require("fs");
const path = require("path");

const robots = `User-agent: *
Allow: /

Sitemap: https://www.verifrax.net/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.verifrax.net/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

const candidates = new Set([
  ".",
  "public",
  "docs",
  "dist",
  "build",
  "out",
  "_site",
  "site",
  ".vercel/output/static",
  "surface-system",
  "surface-system/public",
  "surface-system/dist",
  "surface-system/build",
  "surface-system/templates",
]);

for (const arg of process.argv.slice(2)) {
  if (arg) candidates.add(arg);
}

function walkForHtmlDirs(start, depth = 0) {
  if (depth > 5 || !fs.existsSync(start)) return;
  const base = path.basename(start);
  if ([".git", "node_modules", ".next", ".vercel", "coverage"].includes(base)) return;

  let entries;
  try {
    entries = fs.readdirSync(start, { withFileTypes: true });
  } catch {
    return;
  }

  if (entries.some((e) => e.isFile() && (e.name === "index.html" || e.name === "404.html"))) {
    candidates.add(start);
  }

  for (const entry of entries) {
    if (entry.isDirectory()) walkForHtmlDirs(path.join(start, entry.name), depth + 1);
  }
}

walkForHtmlDirs(".");

for (const dir of [...candidates].sort()) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.statSync(dir).isDirectory()) continue;

  fs.writeFileSync(path.join(dir, "robots.txt"), robots);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), sitemap);
  console.log(`SEARCH_METADATA_EMITTED ${dir}`);
}
