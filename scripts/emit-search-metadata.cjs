const fs = require("fs");
const path = require("path");

const roots = [
  ".",
  ".vercel/output/static",
  "_site",
  "build",
  "dist",
  "docs",
  "out",
  "public",
  "site",
  "surface-system",
  "surface-system/build",
  "surface-system/dist",
  "surface-system/public",
  "surface-system/templates",
];

const robots = `User-agent: *
Allow: /

Sitemap: https://www.verifrax.net/sitemap.xml
Sitemap: https://verifrax.net/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.verifrax.net/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

for (const root of roots) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "robots.txt"), robots);
  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
  console.log(`SEARCH_METADATA_EMITTED ${root}`);
}
