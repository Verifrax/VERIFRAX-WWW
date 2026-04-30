const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), "verifrax-terminal-runtime-doctrine-"));
fs.mkdirSync(OUT, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function httpOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await httpOk(url)) return true;
    await sleep(500);
  }
  return false;
}

function fail(payload) {
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

function assertFacts(facts, consoleErrors, pageErrors, requestFailures) {
  const failures = [];
  const attrs = facts.bodyAttrs || {};

  for (const attr of [
    "data-vco-no-atom-core",
    "data-vco-terminal-visual-doctrine-final",
    "data-vco-terminal-absolute-visual-lock",
    "data-vco-foreground-composition-governor",
    "data-vco-foreground-composition-api-alias-lock",
    "data-vco-hard-foreground-occlusion-governor"
  ]) {
    if (attrs[attr] !== "accepted") failures.push(`${attr}_not_accepted`);
  }

  if (!facts.canvas || facts.canvas.width < 300 || facts.canvas.height < 300 || facts.canvas.boxWidth < 300 || facts.canvas.boxHeight < 300) {
    failures.push("canvas_not_visible_or_real_size");
  }

  for (const [label, api] of [
    ["compositionApi", facts.compositionApi],
    ["compositionAliasApi", facts.compositionAliasApi]
  ]) {
    if (!api || api.accepted !== true) failures.push(`${label}_not_accepted`);
    if (!api || api.stableAlias !== true) failures.push(`${label}_stableAlias_not_true`);
    if (!api || api.authority !== "VCO_TERMINAL_FOREGROUND_COMPOSITION_API_ALIAS_LOCK") failures.push(`${label}_authority_wrong`);
    if (!Array.isArray(api && api.residualObstructions) || api.residualObstructions.length !== 0) failures.push(`${label}_residualObstructions_not_empty`);
    if (!api || api.noAtomLoopsPreserved !== true) failures.push(`${label}_noAtomLoops_not_preserved`);
    if (!api || api.noCentralCagePreserved !== true) failures.push(`${label}_noCentralCage_not_preserved`);
    if (!api || api.hardOcclusionGovernorPreserved !== true) failures.push(`${label}_hardOcclusion_not_preserved`);
  }

  const hard = facts.hardOcclusionApi;
  if (!hard || hard.accepted !== true) failures.push("hardOcclusionApi_not_accepted");
  if (!Array.isArray(hard && hard.residualObstructions) || hard.residualObstructions.length !== 0) failures.push("hardOcclusion_residualObstructions_not_empty");
  if (!hard || hard.compositionGovernorPreserved !== true) failures.push("hardOcclusion_compositionGovernor_not_preserved");
  if (!hard || hard.noAtomLoopsPreserved !== true) failures.push("hardOcclusion_noAtomLoops_not_preserved");
  if (!hard || hard.noCentralCagePreserved !== true) failures.push("hardOcclusion_noCentralCage_not_preserved");

  const abs = facts.absoluteApi;
  if (!abs || abs.accepted !== true) failures.push("absoluteApi_not_accepted");
  if (!abs || abs.noAtomLoops !== true) failures.push("absoluteApi_noAtomLoops_not_true");
  if (!abs || abs.noWireCube !== true) failures.push("absoluteApi_noWireCube_not_true");
  if (!abs || abs.noWhiteSlabs !== true) failures.push("absoluteApi_noWhiteSlabs_not_true");

  const noAtom = facts.noAtomApi;
  if (!noAtom || noAtom.accepted !== true) failures.push("noAtomApi_not_accepted");
  if (!noAtom || noAtom.atomOrbitSuppressed !== true) failures.push("atomOrbit_not_suppressed");
  if (!noAtom || noAtom.coreDoctrine !== "RESTRAINED_FACETED_TRUTH_CORE_NOT_ATOM_ORBIT_TOY") failures.push("coreDoctrine_wrong");
  if (!noAtom || noAtom.evidenceDoctrine !== "STRAIGHT_DETERMINISTIC_LINES_NOT_ORBITAL_LOOPS") failures.push("evidenceDoctrine_wrong");
  if (!noAtom || noAtom.slabDoctrine !== "NO_WHITE_PLACEHOLDER_PLATES") failures.push("slabDoctrine_wrong");

  if (consoleErrors.length) failures.push("console_errors_present");
  if (pageErrors.length) failures.push("page_errors_present");
  if (requestFailures.length) failures.push("request_failures_present");

  return failures;
}

(async () => {
  const port = Number(process.env.PORT || await freePort());
  const url = process.env.URL || `http://127.0.0.1:${port}/?v=${Date.now()}`;

  const serverLog = path.join(OUT, "vite.log");
  const server = spawn(
    "npm",
    ["exec", "vite", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0", CI: "1" }
    }
  );

  const logStream = fs.createWriteStream(serverLog, { flags: "a" });
  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);

  const cleanup = () => {
    try { server.kill("SIGTERM"); } catch (_) {}
  };
  process.on("exit", cleanup);

  if (!await waitForHttp(`http://127.0.0.1:${port}/`, 120000)) {
    fail({
      ok: false,
      doctrine: "terminal_runtime_doctrine_browser_invariant",
      failure: "vite_server_not_ready",
      port,
      serverLog,
      serverLogText: fs.existsSync(serverLog) ? fs.readFileSync(serverLog, "utf8").slice(-6000) : ""
    });
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=swiftshader",
      "--ignore-gpu-blocklist",
      "--disable-features=VizDisplayCompositor"
    ]
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const consoleMessages = [];

  page.on("console", (msg) => {
    const line = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(line);
    if (msg.type() === "error") consoleErrors.push(line);
  });

  page.on("pageerror", (err) => pageErrors.push(String(err && err.stack || err)));
  page.on("requestfailed", (req) => {
    requestFailures.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure() && req.failure().errorText
    });
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  } catch (err) {
    await browser.close();
    fail({
      ok: false,
      doctrine: "terminal_runtime_doctrine_browser_invariant",
      failure: "page_goto_failed",
      url,
      error: String(err && err.stack || err),
      consoleErrors,
      pageErrors,
      requestFailures,
      serverLogText: fs.existsSync(serverLog) ? fs.readFileSync(serverLog, "utf8").slice(-6000) : ""
    });
  }

  let facts = null;
  let failures = ["not_collected"];

  for (let i = 0; i < 300; i++) {
    facts = await page.evaluate(() => {
      function callReapply(key) {
        try {
          const api = window[key];
          if (api && typeof api.reapply === "function") api.reapply();
        } catch (_) {}
      }

      for (const key of [
        "VCO_TERMINAL_NO_ATOM_ORBIT_API",
        "VCO_TERMINAL_VISUAL_DOCTRINE_FINAL_API",
        "VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API",
        "VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_API",
        "VCO_TERMINAL_FOREGROUND_COMPOSITION_API",
        "VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API"
      ]) callReapply(key);

      function attrs() {
        return Object.fromEntries(
          Array.from(document.body?.attributes || [])
            .filter((a) => a.name.startsWith("data-vco-"))
            .map((a) => [a.name, a.value])
        );
      }

      function selectedApi(key) {
        const api = window[key];
        if (!api) return null;
        return {
          accepted: api.accepted === true,
          governed: Number(api.governed || 0),
          strongGoverned: Number(api.strongGoverned || 0),
          hardDemoted: Number(api.hardDemoted || 0),
          hidden: Number(api.hidden || 0),
          maxResidualArea: Number(api.maxResidualArea || 0),
          residualObstructions: Array.isArray(api.residualObstructions) ? api.residualObstructions : [],
          noAtomLoopsPreserved: api.noAtomLoopsPreserved === true,
          noCentralCagePreserved: api.noCentralCagePreserved === true,
          compositionGovernorPreserved: api.compositionGovernorPreserved === true,
          hardOcclusionGovernorPreserved: api.hardOcclusionGovernorPreserved === true,
          authority: typeof api.authority === "string" ? api.authority : null,
          stableAlias: api.stableAlias === true,
          noAtomLoops: api.noAtomLoops === true,
          noWireCube: api.noWireCube === true,
          noWhiteSlabs: api.noWhiteSlabs === true,
          rematerializedSlabs: Number(api.rematerializedSlabs || 0),
          atomOrbitSuppressed: api.atomOrbitSuppressed === true,
          coreDoctrine: typeof api.coreDoctrine === "string" ? api.coreDoctrine : null,
          evidenceDoctrine: typeof api.evidenceDoctrine === "string" ? api.evidenceDoctrine : null,
          slabDoctrine: typeof api.slabDoctrine === "string" ? api.slabDoctrine : null,
          rematerialized: Number(api.rematerialized || 0)
        };
      }

      const canvas = document.querySelector("canvas");
      const box = canvas ? canvas.getBoundingClientRect() : null;

      return {
        href: location.href,
        title: document.title,
        bodyAttrs: attrs(),
        canvas: canvas ? {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
          boxWidth: box.width,
          boxHeight: box.height
        } : null,
        compositionApi: selectedApi("VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_API"),
        compositionAliasApi: selectedApi("VCO_TERMINAL_FOREGROUND_COMPOSITION_API"),
        hardOcclusionApi: selectedApi("VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API"),
        absoluteApi: selectedApi("VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API"),
        noAtomApi: selectedApi("VCO_TERMINAL_NO_ATOM_ORBIT_API"),
        vcoKeys: Object.keys(window).filter((k) => k.startsWith("VCO_")).sort()
      };
    });

    failures = assertFacts(facts, consoleErrors, pageErrors, requestFailures);
    if (failures.length === 0) break;

    await sleep(1000);
  }

  const screenshot = path.join(OUT, "terminal-runtime-doctrine-proof.png");
  let screenshotError = null;
  try {
    await page.screenshot({ path: screenshot, fullPage: true, timeout: 120000 });
  } catch (err) {
    screenshotError = String(err && err.stack || err);
  }

  await browser.close();

  const result = {
    ok: failures.length === 0,
    doctrine: "terminal_runtime_doctrine_browser_invariant",
    url,
    facts,
    failures,
    consoleErrors,
    pageErrors,
    requestFailures,
    screenshot,
    screenshotError,
    serverLog
  };

  fs.writeFileSync(path.join(OUT, "terminal-runtime-doctrine-proof.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
})().catch((err) => {
  fail({
    ok: false,
    doctrine: "terminal_runtime_doctrine_browser_invariant",
    failure: "uncaught",
    error: String(err && err.stack || err)
  });
});
