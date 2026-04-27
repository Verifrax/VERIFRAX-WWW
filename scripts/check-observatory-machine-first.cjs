#!/usr/bin/env node
const { chromium } = require("playwright");

const target = process.argv[2] || "http://127.0.0.1:4176/";
const failures = [];

async function waitForRuntimeCanvas(page, timeout = 90000) {
  await page.waitForFunction(() => {
    const runtime = document.querySelector("#observatory-webgl-runtime");
    const canvas = runtime && runtime.querySelector("canvas");
    if (!runtime || !canvas) return false;
    const r = runtime.getBoundingClientRect();
    const c = canvas.getBoundingClientRect();
    return r.width > 800 && r.height > 500 && c.width > 800 && c.height > 500;
  }, { timeout });
}

const pass = (name) => console.log(`${name} PASS`);
const fail = (name, detail = "") => failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1468, height: 1032 }, deviceScaleFactor: 1 });

  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];

  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("requestfailed", (req) => requestFailures.push(`${req.method()} ${req.url()} ${req.failure()?.errorText || ""}`));

  const response = await page.goto(`${target}${target.includes("?") ? "&" : "?"}v=${Date.now()}`, { waitUntil: "networkidle", timeout: 30000 });
  if (response && response.status() >= 200 && response.status() < 300) pass("http_200"); else fail("http_200", response && response.status());

  await waitForRuntimeCanvas(page);
  await page.waitForTimeout(4200);

  const facts = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => [...document.querySelectorAll(s)];
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
    };
    const area = (r) => Math.max(0, r.width) * Math.max(0, r.height);
    const intersects = (a,b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

    const viewport = { width: innerWidth, height: innerHeight };
    const runtime = $("#observatory-webgl-runtime");
    const canvas = $("#observatory-webgl-runtime canvas");
    const hero = $(".oc-hero");
    const heroTitle = $(".oc-hero h2");
    const bottom = $(".oc-bottom");
    const panels = [".oc-left",".oc-right",".oc-inspector",".vco-deep-inspector"]
      .map((sel) => ({ sel, el: $(sel) }))
      .filter((x) => x.el)
      .map((x) => ({ sel:x.sel, rect:rect(x.el), display:getComputedStyle(x.el).display, visibility:getComputedStyle(x.el).visibility, opacity:getComputedStyle(x.el).opacity }));

    const visiblePanels = panels.filter((x) =>
      x.display !== "none" &&
      x.visibility !== "hidden" &&
      Number(x.opacity) !== 0 &&
      x.rect.width > 2 &&
      x.rect.height > 2
    );

    const center = { left: viewport.width * 0.25, right: viewport.width * 0.75, top: viewport.height * 0.18, bottom: viewport.height * 0.78 };
    const centerHits = visiblePanels.filter((x) => intersects(x.rect, center)).map((x) => x.sel);

    const panelArea = visiblePanels.reduce((sum, x) => sum + area(x.rect), 0);
    const bottomRect = bottom ? rect(bottom) : null;
    const bottomArea = bottomRect ? area(bottomRect) : 0;
    const allowedAreaRatio = (panelArea + bottomArea) / (viewport.width * viewport.height);

    return {
      runtime: !!runtime,
      canvas: !!canvas,
      runtimeRect: runtime ? rect(runtime) : null,
      canvasRect: canvas ? rect(canvas) : null,
      scroll: {
        x: document.documentElement.scrollWidth,
        y: document.documentElement.scrollHeight,
        vw: viewport.width,
        vh: viewport.height
      },
      heroRect: hero ? rect(hero) : null,
      heroTitle: heroTitle ? {
        text: heroTitle.textContent.trim(),
        clientWidth: heroTitle.clientWidth,
        scrollWidth: heroTitle.scrollWidth,
        rect: rect(heroTitle)
      } : null,
      visiblePanels,
      centerHits,
      allowedAreaRatio,
      bottomRect,
      machineApi: !!window.VCO_MACHINE_FIRST_PANEL_EJECTION_API,
      panelApi: !!window.VCO_PANEL_QUARANTINE_API,
      lastDispatch: document.body.getAttribute("data-vco-last-dispatch") || "",
      staticFallbackInViewport: document.body.innerText.includes("STATIC_FALLBACK"),
      fullObservatory: document.body.innerText.includes("FULL_OBSERVATORY")
    };
  });

  if (facts.runtime) pass("runtime_mount"); else fail("runtime_mount");
  if (facts.canvas) pass("canvas_present"); else fail("canvas_present");
  if (facts.runtimeRect && facts.runtimeRect.width >= facts.scroll.vw - 2 && facts.runtimeRect.height >= facts.scroll.vh - 2) pass("runtime_full_viewport"); else fail("runtime_full_viewport", JSON.stringify(facts.runtimeRect));
  if (facts.canvasRect && facts.canvasRect.width >= facts.scroll.vw - 2 && facts.canvasRect.height >= facts.scroll.vh - 2) pass("canvas_full_viewport"); else fail("canvas_full_viewport", JSON.stringify(facts.canvasRect));
  if (facts.scroll.x <= facts.scroll.vw + 2 && facts.scroll.y <= facts.scroll.vh + 2) pass("first_viewport_no_page_scroll"); else fail("first_viewport_no_page_scroll", JSON.stringify(facts.scroll));
  if (facts.centerHits.length === 0) pass("machine_core_clear_of_panels"); else fail("machine_core_clear_of_panels", facts.centerHits.join(","));
  if (facts.allowedAreaRatio < 0.12) pass("panel_area_ejected"); else fail("panel_area_ejected", String(facts.allowedAreaRatio));
  if (facts.heroTitle && facts.heroTitle.text === "VERIFRAX" && facts.heroTitle.scrollWidth <= facts.heroTitle.clientWidth + 8) pass("hero_not_clipped"); else fail("hero_not_clipped", JSON.stringify(facts.heroTitle));
  if (facts.bottomRect && facts.bottomRect.height <= 70 && facts.bottomRect.bottom <= facts.scroll.vh + 2) pass("artifact_rail_thin_contained"); else fail("artifact_rail_thin_contained", JSON.stringify(facts.bottomRect));
  if (facts.machineApi && facts.panelApi) pass("machine_first_api_present"); else fail("machine_first_api_present");
  if (!facts.staticFallbackInViewport && facts.fullObservatory) pass("no_static_fallback_claim"); else fail("no_static_fallback_claim");

  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await page.waitForTimeout(300);
  const paletteOpen = await page.evaluate(() => !!document.querySelector(".vco-command-palette.is-open,.vco-command.is-open"));
  if (paletteOpen) pass("ctrl_k_preserved"); else fail("ctrl_k_preserved");

  await page.keyboard.press("2");
  await page.waitForTimeout(300);
  const afterTwo = await page.evaluate(() => document.body.getAttribute("data-vco-last-dispatch") || "");
  if (afterTwo === "ORBISTIUM") pass("number_key_clean_dispatch"); else fail("number_key_clean_dispatch", afterTwo);

  await page.keyboard.press("6");
  await page.waitForTimeout(300);
  const afterSix = await page.evaluate(() => document.body.getAttribute("data-vco-last-dispatch") || "");
  const secondDispatchClean = String(afterSix || "").trim();
  if (/^(SYNTAGMARIUM|ORBISTIUM|CONSONORIUM|TACHYRIUM|AUCTORISEAL|CORPIFORM|VERIFRAX|ANAGNORIUM|REGRESSORIUM)$/.test(secondDispatchClean)) pass("second_number_key_clean_dispatch");
  else fail("second_number_key_clean_dispatch", secondDispatchClean);

  const click = await page.evaluate(() => {
    const r = document.querySelector("#observatory-webgl-runtime canvas")?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  });
  if (click) {
    await page.mouse.click(click.x, click.y);
    await page.waitForTimeout(300);
    const afterClick = await page.evaluate(() => document.body.getAttribute("data-vco-last-dispatch") || "");
    if (afterClick === "CANVAS_OBJECT_GRAPH") pass("canvas_click_dispatch_preserved"); else fail("canvas_click_dispatch_preserved", afterClick);
  } else {
    fail("canvas_click_dispatch_preserved", "no canvas");
  }

  const afterInputFacts = await page.evaluate(() => {
    const visible = [...document.querySelectorAll(".oc-left,.oc-right,.oc-inspector,.vco-deep-inspector")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) !== 0 && r.width > 2 && r.height > 2;
      });
    return { visible: visible.map((el) => "." + [...el.classList].join(".")) };
  });
  if (afterInputFacts.visible.length === 0) pass("panels_remain_ejected_after_input"); else fail("panels_remain_ejected_after_input", afterInputFacts.visible.join(","));

  if (consoleErrors.length === 0) pass("console_error_zero"); else fail("console_error_zero", consoleErrors.slice(0,5).join(" | "));
  if (pageErrors.length === 0) pass("page_error_zero"); else fail("page_error_zero", pageErrors.slice(0,5).join(" | "));
  if (requestFailures.length === 0) pass("request_failure_zero"); else fail("request_failure_zero", requestFailures.slice(0,5).join(" | "));

  await browser.close();

  if (failures.length) {
    console.error("\n[OBSERVATORY_MACHINE_FIRST_FAIL]");
    for (const f of failures) console.error("- " + f);
    process.exit(1);
  }

  console.log("\nobservatory_machine_first_panel_ejection PASS");
})().catch((err) => {
  console.error("[OBSERVATORY_MACHINE_FIRST_FATAL]", err);
  process.exit(1);
});
