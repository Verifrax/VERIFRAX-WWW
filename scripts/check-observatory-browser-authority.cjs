#!/usr/bin/env node
const { chromium } = require("playwright");

const target = process.argv[2] || "http://127.0.0.1:4173/";
const failures = [];

async function waitForRuntimeCanvas(page, timeout = 90000) {
  const started = Date.now();
  let last = null;

  while (Date.now() - started < timeout) {
    last = await page.evaluate(() => {
      const runtime = document.querySelector("#observatory-webgl-runtime");
      const canvas = runtime && runtime.querySelector("canvas");

      if (!runtime || !canvas) {
        return {
          ok: false,
          reason: "missing_runtime_or_canvas",
          hasRuntime: !!runtime,
          hasCanvas: !!canvas
        };
      }

      const r = runtime.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      const attrWidth = Number(canvas.getAttribute("width") || canvas.width || 0);
      const attrHeight = Number(canvas.getAttribute("height") || canvas.height || 0);

      const ok =
        canvas.isConnected &&
        (
          attrWidth > 0 ||
          attrHeight > 0 ||
          canvas.clientWidth > 0 ||
          canvas.clientHeight > 0 ||
          c.width > 0 ||
          c.height > 0
        );

      return {
        ok,
        reason: ok ? "ready" : "canvas_surface_not_ready",
        runtime: { width: r.width, height: r.height, clientWidth: runtime.clientWidth, clientHeight: runtime.clientHeight },
        canvas: { width: c.width, height: c.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight, attrWidth, attrHeight, connected: canvas.isConnected },
        text: document.body.innerText.slice(0, 600)
      };
    });

    if (last && last.ok) {
      await page.waitForTimeout(650);
      return last;
    }

    await page.waitForTimeout(250);
  }

  throw new Error("runtime canvas bootstrap timeout :: " + JSON.stringify(last));
}

function fail(name, detail = "") { failures.push(`${name}${detail ? ` :: ${detail}` : ""}`); }
function pass(name) { console.log(`${name} PASS`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => failedRequests.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ""}`));

  const response = await page.goto(`${target}${target.includes("?") ? "&" : "?"}v=${Date.now()}`, { waitUntil: "networkidle", timeout: 30000 });
  if (response && response.status() >= 200 && response.status() < 300) pass("http_200"); else fail("http_200", response && String(response.status()));

  await page.waitForFunction(() => {
    const runtime = document.querySelector("#observatory-webgl-runtime");
    const rect = runtime?.getBoundingClientRect?.();
    return !!runtime && !!rect && rect.width > 100 && rect.height > 100;
  }, null, { timeout: 90000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    const rect = canvas?.getBoundingClientRect?.();
    return !!canvas && !!rect && rect.width > 100 && rect.height > 100;
  }, null, { timeout: 90000 });
  await page.waitForTimeout(4500);

  const facts = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => [...document.querySelectorAll(s)];
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const intersect = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

    const runtime = $("#observatory-webgl-runtime");
    const canvas = $("#observatory-webgl-runtime canvas");
    const journeyItems = $$("[data-journey-list] li");
    const links = $$("a").map((a) => a.href);

    let pixel = { ok: false, nonDarkRatio: 0, variance: 0, avg: 0, reason: "no-canvas" };
    if (canvas) {
      const summarize = (data) => {
        let nonDark = 0, sum = 0, sum2 = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (v > 9) nonDark++;
          sum += v;
          sum2 += v * v;
          count++;
        }
        const avg = sum / count;
        const variance = (sum2 / count) - avg * avg;
        return { ok: true, nonDarkRatio: nonDark / count, variance, avg };
      };

      try {
        const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) || canvas.getContext("webgl", { preserveDrawingBuffer: true });
        if (gl) {
          const w = Math.min(192, gl.drawingBufferWidth);
          const h = Math.min(108, gl.drawingBufferHeight);
          const bytes = new Uint8Array(w * h * 4);
          gl.readPixels(
            Math.max(0, Math.floor((gl.drawingBufferWidth - w) / 2)),
            Math.max(0, Math.floor((gl.drawingBufferHeight - h) / 2)),
            w,
            h,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            bytes
          );
          pixel = { ...summarize(bytes), reason: "readPixels" };
        }
      } catch (err) {
        pixel = { ok: false, nonDarkRatio: 0, variance: 0, avg: 0, reason: err.message };
      }
    }

    const vw = innerWidth;
    const vh = innerHeight;
    const runtimeRect = runtime ? rect(runtime) : null;
    const canvasRect = canvas ? rect(canvas) : null;
    const centerMachineZone = { left: vw * 0.34, right: vw * 0.66, top: vh * 0.16, bottom: vh * 0.76 };

    const collisions = [];
    for (const [name, el] of [["left", $(".oc-left")], ["right", $(".oc-right")], ["bottom", $(".oc-bottom")], ["hero", $(".oc-hero")]]) {
      if (el) {
        const r = rect(el);
        if (intersect(r, centerMachineZone)) collisions.push(name);
      }
    }

    return {
      runtime: !!runtime,
      canvas: !!canvas,
      webgl: !!(canvas && (canvas.getContext("webgl2") || canvas.getContext("webgl"))),
      runtimeRect,
      canvasRect,
      pixel,
      viewport: { width: vw, height: vh },
      renderPermissionText: document.body.innerText.includes("FULL_OBSERVATORY"),
      staticFallbackText: document.body.innerText.includes("STATIC_FALLBACK"),
      doubleHttps: links.filter((x) => x.includes("https://https://")),
      commandApi: !!(window.VCO_BROWSER_TRUTH_AUTHORITY_API || window.VCO_REAL3D_ANTI_TOY_RUNTIME_API),
      real3dApi: !!(window.VCO_REAL3D_ANTI_TOY_RUNTIME_API || window.VCO_BROWSER_TRUTH_AUTHORITY_API),
      journeyCount: journeyItems.length,
      collisions
    };
  });

  if (facts.runtime) pass("runtime_mount"); else fail("runtime_mount");
  if (facts.canvas) pass("canvas_present"); else fail("canvas_present");
  if (facts.webgl) pass("webgl_context"); else fail("webgl_context");
  if (facts.runtimeRect && facts.runtimeRect.height >= facts.viewport.height * 0.82) pass("first_viewport_dominance"); else fail("first_viewport_dominance", JSON.stringify(facts.runtimeRect));
  if (facts.canvasRect && facts.canvasRect.width >= facts.viewport.width * 0.98 && facts.canvasRect.height >= facts.runtimeRect.height * 0.92) pass("canvas_fills_runtime"); else fail("canvas_fills_runtime", JSON.stringify(facts.canvasRect));
  if (facts.pixel.ok && facts.pixel.nonDarkRatio > 0.08 && facts.pixel.variance > 15 && facts.pixel.avg > 4) pass("non_blank_real_canvas"); else fail("non_blank_real_canvas", JSON.stringify(facts.pixel));
  if (facts.collisions.length === 0) pass("center_machine_not_panel_blocked"); else fail("center_machine_not_panel_blocked", facts.collisions.join(","));
  if (facts.renderPermissionText && !facts.staticFallbackText) pass("full_observatory_not_fallback"); else fail("full_observatory_not_fallback", `FULL=${facts.renderPermissionText} STATIC=${facts.staticFallbackText}`);
  if (facts.doubleHttps.length === 0) pass("no_double_https_links"); else fail("no_double_https_links", facts.doubleHttps.join(","));
  if (facts.commandApi) pass("command_api_present"); else fail("command_api_present");
  if (facts.real3dApi) pass("real3d_api_present"); else fail("real3d_api_present");
  if (facts.journeyCount === 9) pass("artifact_journey_9_stages"); else fail("artifact_journey_9_stages", String(facts.journeyCount));

  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await page.waitForTimeout(300);
  const paletteOpen = await page.evaluate(() => !!document.querySelector(".vco-command-palette.is-open,.vco-command.is-open"));
  if (paletteOpen) pass("ctrl_k_opens_command_surface"); else fail("ctrl_k_opens_command_surface");

  await page.keyboard.press("Escape");
  await page.evaluate(() => document.activeElement?.blur?.());

  const beforeArrow = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const afterArrow = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  if (afterArrow && afterArrow !== beforeArrow) pass("keyboard_dispatch_changes_inspector"); else fail("keyboard_dispatch_changes_inspector", afterArrow.slice(0, 180));

  await page.keyboard.press("1");
  await page.waitForTimeout(300);
  const afterOne = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  if (/SYNTAGMARIUM/i.test(afterOne)) pass("number_key_chamber_dispatch"); else fail("number_key_chamber_dispatch", afterOne.slice(0, 180));

  await page.keyboard.press("g");
  await page.keyboard.press("a");
  await page.waitForTimeout(350);
  const activeJourney = await page.evaluate(() => [...document.querySelectorAll("[data-journey-list] li")].some((x) => x.classList.contains("is-active")));
  if (activeJourney) pass("artifact_journey_live_state"); else fail("artifact_journey_live_state");

  const canvasClick = await page.evaluate(() => {
    const r = document.querySelector("#observatory-webgl-runtime canvas")?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  });

  if (canvasClick) {
    const before = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
    await page.mouse.click(canvasClick.x, canvasClick.y);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
    if (after && after !== before) pass("canvas_click_dispatches_object"); else fail("canvas_click_dispatches_object", after.slice(0, 180));
  } else {
    fail("canvas_click_dispatches_object", "no canvas rect");
  }

  if (consoleErrors.length === 0) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.join(" | ").slice(0, 500));
  if (pageErrors.length === 0) pass("page_error_zero"); else fail("page_error_zero", pageErrors.join(" | ").slice(0, 500));
  if (failedRequests.length === 0) pass("request_failure_zero"); else fail("request_failure_zero", failedRequests.join(" | ").slice(0, 500));

  try {
    await page.screenshot({ path: "/tmp/verifrax-observatory-browser-authority.png", fullPage: false });
  } catch (error) {
    console.log("[OBSERVATORY_BROWSER_AUTHORITY_SCREENSHOT_NON_FATAL]", String(error?.message || error));
  }
  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_BROWSER_AUTHORITY_FAIL]");
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log("\nobservatory_browser_authority PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_BROWSER_AUTHORITY_FATAL]", err);
  process.exit(1);
});
