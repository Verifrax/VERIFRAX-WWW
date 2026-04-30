const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { chromium } = require("playwright");

const OUT = process.env.OUT || fs.mkdtempSync(path.join(os.tmpdir(), "verifrax-terminal-runtime-doctrine-"));
fs.mkdirSync(OUT, { recursive: true });

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = require("node:net").createServer();
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
      resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForHttp(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await httpOk(url)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function fail(payload) {
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

(async () => {
  const port = Number(process.env.PORT || await freePort());
  const url = process.env.URL || `http://127.0.0.1:${port}/?v=${Date.now()}`;

  const serverLog = path.join(OUT, "vite.log");
  const logStream = fs.createWriteStream(serverLog, { flags: "a" });

  const server = spawn(
    "npm",
    ["exec", "vite", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FORCE_COLOR: "0" }
    }
  );

  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);

  const cleanup = () => {
    try { server.kill("SIGTERM"); } catch (_) {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(130); });
  process.on("SIGTERM", () => { cleanup(); process.exit(143); });

  const serverReady = await waitForHttp(`http://127.0.0.1:${port}/`, 120000);
  if (!serverReady) {
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
    args: ["--disable-dev-shm-usage", "--no-sandbox"]
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
    const text = `${msg.type()}: ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === "error") consoleErrors.push(text);
  });

  page.on("pageerror", (err) => pageErrors.push(String(err && err.stack || err)));
  page.on("requestfailed", (req) => {
    requestFailures.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure() && req.failure().errorText
    });
  });

  let gotoOk = false;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
    gotoOk = true;
  } catch (err) {
    const html = await page.content().catch(() => "");
    await browser.close();
    fail({
      ok: false,
      doctrine: "terminal_runtime_doctrine_browser_invariant",
      failure: "page_goto_failed",
      url,
      error: String(err && err.stack || err),
      htmlExcerpt: html.slice(0, 2000),
      consoleErrors,
      pageErrors,
      requestFailures,
      serverLogText: fs.existsSync(serverLog) ? fs.readFileSync(serverLog, "utf8").slice(-6000) : ""
    });
  }

  try {
    await page.waitForFunction(() => {
      const runtime = document.querySelector("#observatory-webgl-runtime");
      const stage = document.querySelector("[data-runtime-stage]");
      return Boolean(runtime && stage);
    }, { timeout: 90000 });

    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll("canvas")).some((canvas) => {
        const box = canvas.getBoundingClientRect();
        return canvas.width >= 300 &&
          canvas.height >= 300 &&
          box.width >= 300 &&
          box.height >= 300 &&
          getComputedStyle(canvas).visibility !== "hidden" &&
          getComputedStyle(canvas).display !== "none";
      });
    }, { timeout: 180000 });

    await page.waitForFunction(() => {
      const body = document.body;
      return body &&
        body.getAttribute("data-vco-no-atom-core") === "accepted" &&
        body.getAttribute("data-vco-terminal-visual-doctrine-final") === "accepted" &&
        body.getAttribute("data-vco-terminal-absolute-visual-lock") === "accepted" &&
        body.getAttribute("data-vco-foreground-composition-governor") === "accepted" &&
        body.getAttribute("data-vco-hard-foreground-occlusion-governor") === "accepted" &&
        body.getAttribute("data-vco-foreground-composition-api-alias-lock") === "accepted" &&
        window.VCO_TERMINAL_NO_ATOM_ORBIT_API &&
        window.VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API &&
        window.VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_API &&
        window.VCO_TERMINAL_FOREGROUND_COMPOSITION_API &&
        window.VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API;
    }, { timeout: 180000 });
  } catch (err) {
    const diagnostics = await page.evaluate(() => ({
      href: location.href,
      title: document.title,
      text: document.body ? document.body.innerText.slice(0, 2000) : "",
      scripts: Array.from(document.scripts).map((s) => s.src || "[inline]"),
      canvases: Array.from(document.querySelectorAll("canvas")).map((canvas) => {
        const box = canvas.getBoundingClientRect();
        const css = getComputedStyle(canvas);
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight,
          boxWidth: box.width,
          boxHeight: box.height,
          display: css.display,
          visibility: css.visibility,
          opacity: css.opacity
        };
      }),
      bodyAttrs: Object.fromEntries(Array.from(document.body?.attributes || []).filter((a) => a.name.startsWith("data-vco-")).map((a) => [a.name, a.value])),
      vcoKeys: Object.keys(window).filter((k) => k.startsWith("VCO_")).sort()
    })).catch((e) => ({ diagnosticError: String(e) }));

    await page.screenshot({ path: path.join(OUT, "terminal-runtime-doctrine-timeout.png"), fullPage: true }).catch(() => {});
    await browser.close();

    fail({
      ok: false,
      doctrine: "terminal_runtime_doctrine_browser_invariant",
      failure: "runtime_doctrine_wait_timeout",
      url,
      gotoOk,
      error: String(err && err.stack || err),
      diagnostics,
      consoleMessages,
      consoleErrors,
      pageErrors,
      requestFailures,
      serverLog,
      serverLogText: fs.existsSync(serverLog) ? fs.readFileSync(serverLog, "utf8").slice(-6000) : ""
    });
  }

  const png = path.join(OUT, "terminal-runtime-doctrine-proof.png");

  const facts = await page.evaluate(() => {
    const attrs = Object.fromEntries(
      Array.from(document.body.attributes)
        .filter((a) => a.name.startsWith("data-vco-"))
        .map((a) => [a.name, a.value])
    );

    const canvas = document.querySelector("canvas");
    const box = canvas ? canvas.getBoundingClientRect() : null;

    return {
      bodyAttrs: attrs,
      canvas: canvas ? {
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        boxWidth: box.width,
        boxHeight: box.height
      } : null,
      compositionApi: window.VCO_TERMINAL_FOREGROUND_COMPOSITION_GOVERNOR_API || null,
      compositionAliasApi: window.VCO_TERMINAL_FOREGROUND_COMPOSITION_API || null,
      hardOcclusionApi: window.VCO_TERMINAL_HARD_FOREGROUND_OCCLUSION_API || null,
      absoluteApi: window.VCO_TERMINAL_ABSOLUTE_VISUAL_LOCK_API || null,
      noAtomApi: window.VCO_TERMINAL_NO_ATOM_ORBIT_API || null
    };
  });

  await page.screenshot({ path: png, fullPage: true });
  await browser.close();

  const failures = [];

  const requiredAttrs = [
    "data-vco-no-atom-core",
    "data-vco-terminal-visual-doctrine-final",
    "data-vco-terminal-absolute-visual-lock",
    "data-vco-foreground-composition-governor",
    "data-vco-hard-foreground-occlusion-governor",
    "data-vco-foreground-composition-api-alias-lock"
  ];

  for (const attr of requiredAttrs) {
    if (facts.bodyAttrs[attr] !== "accepted") failures.push(`${attr}_not_accepted`);
  }

  if (!facts.canvas || facts.canvas.width < 300 || facts.canvas.height < 300 || facts.canvas.boxWidth < 300 || facts.canvas.boxHeight < 300) {
    failures.push("canvas_not_visible_or_not_real_size");
  }

  if (!facts.compositionApi || facts.compositionApi.accepted !== true) failures.push("compositionApi_not_accepted");
  if (!facts.compositionApi || facts.compositionApi.stableAlias !== true) failures.push("compositionApi_stableAlias_not_true");
  if (!facts.compositionAliasApi || facts.compositionAliasApi.accepted !== true) failures.push("compositionAliasApi_not_accepted");
  if (!facts.compositionAliasApi || facts.compositionAliasApi.stableAlias !== true) failures.push("compositionAliasApi_stableAlias_not_true");

  if (!Array.isArray(facts.compositionApi?.residualObstructions) || facts.compositionApi.residualObstructions.length !== 0) {
    failures.push("compositionApi_residualObstructions_not_empty");
  }

  if (!facts.hardOcclusionApi || facts.hardOcclusionApi.accepted !== true) failures.push("hardOcclusionApi_not_accepted");
  if (!Array.isArray(facts.hardOcclusionApi?.residualObstructions) || facts.hardOcclusionApi.residualObstructions.length !== 0) {
    failures.push("hardOcclusion_residualObstructions_not_empty");
  }
  if (facts.hardOcclusionApi?.compositionGovernorPreserved !== true) failures.push("compositionGovernor_not_preserved");
  if (facts.hardOcclusionApi?.noAtomLoopsPreserved !== true) failures.push("hardOcclusion_noAtomLoops_not_preserved");
  if (facts.hardOcclusionApi?.noCentralCagePreserved !== true) failures.push("hardOcclusion_noCentralCage_not_preserved");

  if (!facts.absoluteApi || facts.absoluteApi.accepted !== true) failures.push("absoluteApi_not_accepted");
  if (facts.absoluteApi?.noAtomLoops !== true) failures.push("absoluteApi_noAtomLoops_not_true");
  if (facts.absoluteApi?.noWireCube !== true) failures.push("absoluteApi_noWireCube_not_true");
  if (facts.absoluteApi?.noWhiteSlabs !== true) failures.push("absoluteApi_noWhiteSlabs_not_true");

  if (!facts.noAtomApi || facts.noAtomApi.accepted !== true) failures.push("noAtomApi_not_accepted");
  if (facts.noAtomApi?.atomOrbitSuppressed !== true) failures.push("atomOrbit_not_suppressed");
  if (facts.noAtomApi?.coreDoctrine !== "RESTRAINED_FACETED_TRUTH_CORE_NOT_ATOM_ORBIT_TOY") failures.push("coreDoctrine_wrong");
  if (facts.noAtomApi?.evidenceDoctrine !== "STRAIGHT_DETERMINISTIC_LINES_NOT_ORBITAL_LOOPS") failures.push("evidenceDoctrine_wrong");
  if (facts.noAtomApi?.slabDoctrine !== "NO_WHITE_PLACEHOLDER_PLATES") failures.push("slabDoctrine_wrong");

  if (consoleErrors.length) failures.push("console_errors_present");
  if (pageErrors.length) failures.push("page_errors_present");
  if (requestFailures.length) failures.push("request_failures_present");

  const result = {
    ok: failures.length === 0,
    doctrine: "terminal_runtime_doctrine_browser_invariant",
    url,
    facts,
    failures,
    consoleErrors,
    pageErrors,
    requestFailures,
    screenshot: png
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
