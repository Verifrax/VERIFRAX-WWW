#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_LIVE_RUNTIME_LIVENESS_AUTHORITY",
    error: "playwright dependency missing",
    remedy: "install Playwright outside the repo and run with NODE_PATH=/tmp/verifrax-playwright/node_modules",
    detail: String(error?.message || error)
  }, null, 2));
  process.exit(1);
}
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PORT = 41739;

function fail(error, extra = {}) {
  console.error(JSON.stringify({
    status: "FAIL",
    gate: "VERIFRAX_LIVE_RUNTIME_LIVENESS_AUTHORITY",
    error,
    ...extra
  }, null, 2));
  process.exit(1);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  res.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
});

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

page.on("console", (msg) => {
  if (["error", "warning"].includes(msg.type())) consoleErrors.push(`${msg.type()}: ${msg.text()}`);
});
page.on("pageerror", (err) => pageErrors.push(String(err?.stack || err)));
page.on("requestfailed", (req) => failedRequests.push(`${req.url()} :: ${req.failure()?.errorText || "request failed"}`));

await page.goto(`http://127.0.0.1:${PORT}/?liveness=${Date.now()}`, {
  waitUntil: "networkidle",
  timeout: 30000
});

await page.waitForTimeout(2500);

const state = await page.evaluate(() => {
  const text = (sel) => document.querySelector(sel)?.textContent?.trim() || "";
  const count = (sel) => document.querySelectorAll(sel).length;
  const visible = (sel) => {
    const node = document.querySelector(sel);
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };

  return {
    runtimeSection: visible("#observatory-webgl-runtime"),
    stageVisible: visible("[data-runtime-stage]"),
    canvasCount: count("canvas"),
    stackItems: count("[data-stack-list] li"),
    hostItems: count("[data-host-list] li"),
    journeyItems: count("[data-journey-list] li"),
    enterpriseItems: count("[data-enterprise-list] > *"),
    timelineNodes: count("[data-main-stack-timeline] [data-stack-id], [data-main-stack-timeline] [data-object-id]"),
    timelineModeButtons: count("[data-timeline-mode]"),
    timelineModes: [...document.querySelectorAll("[data-timeline-mode]")].map((node) => node.getAttribute("data-timeline-mode")).filter(Boolean),
    selectedTimelineNodes: count(".oc-timeline-node.is-selected"),
    inspectorText: text("[data-runtime-inspector]"),
    projectionId: text("[data-projection-id]"),
    renderPermission: text("[data-render-permission]"),
    repoCountText: text('[data-count="repos"]'),
    chamberCountText: text('[data-count="chambers"]'),
    hostCountText: text('[data-count="hosts"]'),
    packageCountText: text('[data-count="packages"]'),
    runtimeStatus: text("[data-runtime-status]"),
  };
});

await browser.close();
server.close();

const expected = {
  runtimeSection: true,
  stageVisible: true,
};

for (const [key, value] of Object.entries(expected)) {
  if (state[key] !== value) fail("runtime shell invariant failed", { key, expected: value, actual: state[key], state, consoleErrors, pageErrors, failedRequests });
}

const canonicalTimelineModes = ["stack", "artifact", "host", "repository", "package"];
for (const mode of canonicalTimelineModes) {
  if (!state.timelineModes.includes(mode)) {
    fail("canonical timeline mode missing", { mode, state, consoleErrors, pageErrors, failedRequests });
  }
}

if (state.timelineModeButtons < canonicalTimelineModes.length) {
  fail("not enough timeline mode controls", { expected_at_least: canonicalTimelineModes.length, actual: state.timelineModeButtons, state, consoleErrors, pageErrors, failedRequests });
}

if (state.canvasCount < 1) fail("WebGL canvas missing", { state, consoleErrors, pageErrors, failedRequests });
if (state.stackItems < 9) fail("stack list not hydrated", { state, consoleErrors, pageErrors, failedRequests });
if (state.hostItems < 12) fail("host list not hydrated", { state, consoleErrors, pageErrors, failedRequests });
if (state.journeyItems < 1) fail("artifact journey not hydrated", { state, consoleErrors, pageErrors, failedRequests });
if (state.enterpriseItems < 1) fail("enterprise list not hydrated", { state, consoleErrors, pageErrors, failedRequests });
if (state.timelineNodes < 9) fail("timeline nodes not hydrated", { state, consoleErrors, pageErrors, failedRequests });
if (state.selectedTimelineNodes < 1) fail("timeline selection missing", { state, consoleErrors, pageErrors, failedRequests });

if (!state.inspectorText.includes("DERIVED_PROJECTION") && !state.inspectorText.includes("Projection inspector")) {
  fail("inspector not alive", { state, consoleErrors, pageErrors, failedRequests });
}

if (state.renderPermission !== "FULL_OBSERVATORY") {
  fail("render permission not hydrated", { state, consoleErrors, pageErrors, failedRequests });
}

if (state.repoCountText !== "36") fail("repo count not live", { state, consoleErrors, pageErrors, failedRequests });
if (state.chamberCountText !== "9") fail("chamber count not live", { state, consoleErrors, pageErrors, failedRequests });
if (state.hostCountText !== "12") fail("host count not live", { state, consoleErrors, pageErrors, failedRequests });

if (pageErrors.length) fail("page runtime error", { state, pageErrors, consoleErrors, failedRequests });
if (failedRequests.length) fail("request failure", { state, failedRequests, consoleErrors, pageErrors });

console.log(JSON.stringify({
  status: "PASS",
  gate: "VERIFRAX_LIVE_RUNTIME_LIVENESS_AUTHORITY",
  state,
  console_errors: consoleErrors.length,
  page_errors: pageErrors.length,
  failed_requests: failedRequests.length,
  version_raise: false
}, null, 2));
