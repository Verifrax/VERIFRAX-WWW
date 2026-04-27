#!/usr/bin/env node
const { chromium } = require("playwright");

const target = process.argv[2] || "http://127.0.0.1:4175/";
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

function pass(name){ console.log(`${name} PASS`); }
function fail(name, detail=""){ failures.push(`${name}${detail ? ` :: ${detail}` : ""}`); }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport:{ width:1440, height:900 }, deviceScaleFactor:1 });

  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", err => pageErrors.push(err.message));
  page.on("requestfailed", req => requestFailures.push(`${req.url()} ${req.failure()?.errorText || ""}`));

  const res = await page.goto(`${target}${target.includes("?") ? "&" : "?"}v=${Date.now()}`, { waitUntil:"networkidle", timeout:30000 });
  if (res && res.status() >= 200 && res.status() < 300) pass("http_200"); else fail("http_200", res && String(res.status()));

  await waitForRuntimeCanvas(page);
  await page.waitForTimeout(4200);

  const facts = await page.evaluate(() => {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    const intersects = (a,b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const visible = el => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== "none" && cs.visibility !== "hidden" && Number(cs.opacity) > 0.01 && r.width > 1 && r.height > 1;
    };

    const vw = innerWidth, vh = innerHeight;
    const runtime = $("#observatory-webgl-runtime");
    const canvas = $("#observatory-webgl-runtime canvas");
    const center = { left: vw * .32, right: vw * .68, top: vh * .16, bottom: vh * .78 };

    const panels = [
      ".oc-hero",
      ".oc-left",
      ".oc-right",
      ".oc-bottom",
      ".oc-inspector",
      ".vco-deep-inspector"
    ].flatMap(sel => $$(sel).filter(visible).map(el => ({ sel, rect: rect(el) })));

    const collisions = panels.filter(p => intersects(p.rect, center)).map(p => p.sel);
    const panelArea = panels.reduce((sum,p) => sum + Math.max(0,p.rect.width) * Math.max(0,p.rect.height), 0) / (vw * vh);

    return {
      runtime: !!runtime,
      canvas: !!canvas,
      canvasRect: canvas ? rect(canvas) : null,
      runtimeRect: runtime ? rect(runtime) : null,
      scrollH: document.scrollingElement.scrollHeight,
      viewportH: vh,
      collisions,
      panelArea,
      api: !!window.VCO_PANEL_QUARANTINE_REAL_FIX_API,
      fallbackVisible: !!$("#static-root-contract") && getComputedStyle($("#static-root-contract")).display !== "none",
      deepOpen: $$(".vco-deep-inspector").some(el => visible(el) && intersects(rect(el), center)),
      bodyText: document.body.innerText
    };
  });

  if (facts.runtime) pass("runtime_mount"); else fail("runtime_mount");
  if (facts.canvas) pass("canvas_present"); else fail("canvas_present");
  if (facts.canvasRect && facts.canvasRect.width >= 1430 && facts.canvasRect.height >= 890) pass("canvas_full_viewport"); else fail("canvas_full_viewport", JSON.stringify(facts.canvasRect));
  if (facts.runtimeRect && facts.runtimeRect.height >= 890) pass("runtime_full_viewport"); else fail("runtime_full_viewport", JSON.stringify(facts.runtimeRect));
  if (facts.scrollH <= facts.viewportH + 4) pass("no_page_scroll"); else fail("no_page_scroll", `${facts.scrollH}/${facts.viewportH}`);
  if (facts.collisions.length === 0) pass("center_machine_panel_clearance"); else fail("center_machine_panel_clearance", facts.collisions.join(","));
  if (facts.panelArea < 0.23) pass("panel_area_quarantined"); else fail("panel_area_quarantined", String(facts.panelArea));
  if (facts.api) pass("panel_quarantine_api_present"); else fail("panel_quarantine_api_present");
  if (!facts.fallbackVisible) pass("static_fallback_not_in_viewport"); else fail("static_fallback_not_in_viewport");
  if (!facts.deepOpen) pass("central_modal_not_hijacking_scene"); else fail("central_modal_not_hijacking_scene");
  if (!facts.bodyText.includes("STATIC_FALLBACK")) pass("no_static_fallback_claim"); else fail("no_static_fallback_claim");

  await page.keyboard.press("1");
  await page.waitForTimeout(350);
  const one = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  if (/SYNTAGMARIUM/.test(one) && !/ADMISSIBILITY|AUTHORITYAUCTORISEAL|RECOGNITIONANAGNORIUM/.test(one)) pass("number_key_clean_object_dispatch"); else fail("number_key_clean_object_dispatch", one.slice(0,220));

  await page.keyboard.press("2");
  await page.waitForTimeout(350);
  const two = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
  if (/ORBISTIUM/.test(two) && !/ADMISSIBILITYADMISSORIUM/.test(two)) pass("second_key_clean_object_dispatch"); else fail("second_key_clean_object_dispatch", two.slice(0,220));

  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await page.waitForTimeout(350);
  const palette = await page.evaluate(() => !!document.querySelector(".vco-command-palette.is-open,.vco-command.is-open"));
  if (palette) pass("ctrl_k_command_palette"); else fail("ctrl_k_command_palette");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  const clickPoint = await page.evaluate(() => {
    const r = document.querySelector("#observatory-webgl-runtime canvas")?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  });
  if (clickPoint) {
    await page.mouse.click(clickPoint.x, clickPoint.y);
    await page.waitForTimeout(350);
    const clicked = await page.evaluate(() => document.querySelector("[data-runtime-inspector]")?.textContent || "");
    if (/CANVAS_OBJECT_GRAPH/.test(clicked)) pass("canvas_click_clean_dispatch"); else fail("canvas_click_clean_dispatch", clicked.slice(0,220));
  } else {
    fail("canvas_click_clean_dispatch", "no canvas");
  }

  const finalFacts = await page.evaluate(() => {
    const el = document.querySelector(".vco-deep-inspector");
    if (!el) return { deepCenter:false };
    const r = el.getBoundingClientRect();
    const center = { left: innerWidth*.32, right: innerWidth*.68, top: innerHeight*.16, bottom: innerHeight*.78 };
    const hit = !(r.right <= center.left || r.left >= center.right || r.bottom <= center.top || r.top >= center.bottom);
    const cs = getComputedStyle(el);
    return { deepCenter: hit && cs.display !== "none" && Number(cs.opacity) > .01 };
  });
  if (!finalFacts.deepCenter) pass("modal_remains_quarantined_after_input"); else fail("modal_remains_quarantined_after_input");

  if (consoleErrors.length === 0) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.join("\n").slice(0,500));
  if (pageErrors.length === 0) pass("page_error_zero"); else fail("page_error_zero", pageErrors.join("\n").slice(0,500));
  if (requestFailures.length === 0) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.join("\n").slice(0,500));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_PANEL_QUARANTINE_FAIL]");
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log("\nobservatory_panel_quarantine_real_fix PASS");
})().catch(async err => {
  console.error("[OBSERVATORY_PANEL_QUARANTINE_FATAL]", err);
  process.exit(1);
});
