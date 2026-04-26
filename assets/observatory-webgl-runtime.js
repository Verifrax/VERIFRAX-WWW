
const VCO_TERMINAL_VISUAL_AUTHORITY_REPAIR = true;
(function installTerminalVisualAuthorityRepair(){
  const STYLE_ID = "vco-terminal-visual-authority-repair";
  const css = `
/* VCO_TERMINAL_VISUAL_AUTHORITY_REPAIR */
:root.vco-terminal-ready,
:root.vco-terminal-ready body{
  margin:0!important;
  min-height:100%!important;
  background:#02070d!important;
  color:#e8f2ff!important;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
  overflow-x:hidden!important;
}
:root.vco-terminal-ready *{box-sizing:border-box}
:root.vco-terminal-ready body{
  min-height:100vh!important;
}
:root.vco-terminal-ready a,
:root.vco-terminal-ready button,
:root.vco-terminal-ready input,
:root.vco-terminal-ready select{
  font:700 12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
}
:root.vco-terminal-ready button,
:root.vco-terminal-ready .button,
:root.vco-terminal-ready [role="button"]{
  appearance:none!important;
  border:1px solid rgba(128,210,255,.34)!important;
  border-radius:12px!important;
  padding:9px 13px!important;
  background:linear-gradient(180deg,rgba(16,33,50,.92),rgba(5,12,22,.96))!important;
  color:#eaf6ff!important;
  box-shadow:0 0 0 1px rgba(255,255,255,.035) inset,0 12px 32px rgba(0,0,0,.34)!important;
  cursor:pointer!important;
}
:root.vco-terminal-ready button:hover,
:root.vco-terminal-ready [role="button"]:hover{
  border-color:rgba(127,211,255,.72)!important;
  color:#ffffff!important;
  background:linear-gradient(180deg,rgba(22,49,74,.98),rgba(7,18,31,.98))!important;
}
:root.vco-terminal-ready a{
  color:#8bd8ff!important;
  text-decoration:none!important;
}
:root.vco-terminal-ready main,
:root.vco-terminal-ready .wrap,
:root.vco-terminal-ready .surface,
:root.vco-terminal-ready .surface-root{
  max-width:none!important;
  width:100%!important;
  margin:0!important;
  padding:0!important;
  background:#02070d!important;
}
:root.vco-terminal-ready main > :not(.observatory-webgl-runtime):not(#observatory-render-gate):not(script),
:root.vco-terminal-ready .surface > :not(.observatory-webgl-runtime):not(#observatory-render-gate):not(script){
  display:none!important;
}
:root.vco-terminal-ready .observatory-webgl-runtime{
  position:relative!important;
  display:block!important;
  width:100vw!important;
  height:100vh!important;
  min-height:760px!important;
  overflow:hidden!important;
  isolation:isolate!important;
  background:
    radial-gradient(circle at 50% 42%,rgba(33,105,155,.22),transparent 35%),
    radial-gradient(circle at 50% 100%,rgba(0,0,0,.8),transparent 45%),
    linear-gradient(180deg,#02060b 0%,#040b12 52%,#02050a 100%)!important;
}
:root.vco-terminal-ready .observatory-webgl-runtime canvas{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  display:block!important;
  z-index:1!important;
  filter:contrast(1.1) saturate(.98)!important;
}
:root.vco-terminal-ready .vco-topbar,
:root.vco-terminal-ready .vco-hero,
:root.vco-terminal-ready .vco-left,
:root.vco-terminal-ready .vco-right,
:root.vco-terminal-ready .vco-journey,
:root.vco-terminal-ready .vco-inspector,
:root.vco-terminal-ready .vco-command,
:root.vco-terminal-ready .vco-palette,
:root.vco-terminal-ready .vco-panel,
:root.vco-terminal-ready .vco-card{
  position:absolute!important;
  z-index:12!important;
  color:#dcecff!important;
  border:1px solid rgba(122,204,255,.22)!important;
  background:linear-gradient(180deg,rgba(5,13,23,.88),rgba(3,8,15,.94))!important;
  box-shadow:0 24px 90px rgba(0,0,0,.46),0 0 0 1px rgba(255,255,255,.035) inset!important;
  backdrop-filter:blur(16px) saturate(1.1)!important;
}
:root.vco-terminal-ready .vco-topbar{
  top:0!important;
  left:0!important;
  right:0!important;
  height:72px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  padding:0 28px!important;
  border-width:0 0 1px!important;
  border-radius:0!important;
  background:linear-gradient(180deg,rgba(1,5,10,.95),rgba(1,5,10,.72))!important;
}
:root.vco-terminal-ready .vco-hero{
  left:28px!important;
  top:112px!important;
  width:min(520px,calc(100vw - 56px))!important;
  padding:0!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
  backdrop-filter:none!important;
}
:root.vco-terminal-ready .vco-hero h1,
:root.vco-terminal-ready .vco-hero h2{
  margin:0 0 14px!important;
  color:#f7fbff!important;
  font:950 clamp(68px,8vw,142px)/.82 Inter,ui-sans-serif,system-ui,sans-serif!important;
  letter-spacing:-.075em!important;
  text-transform:uppercase!important;
  text-shadow:0 22px 90px rgba(0,0,0,.68)!important;
}
:root.vco-terminal-ready .vco-hero p{
  max-width:440px!important;
  margin:0 0 12px!important;
  color:#d5e6f7!important;
  font:750 16px/1.42 Inter,ui-sans-serif,system-ui,sans-serif!important;
}
:root.vco-terminal-ready .vco-left{
  left:24px!important;
  bottom:128px!important;
  width:360px!important;
  max-height:43vh!important;
  padding:14px!important;
  border-radius:20px!important;
  overflow:auto!important;
}
:root.vco-terminal-ready .vco-right{
  right:24px!important;
  top:92px!important;
  width:400px!important;
  max-height:calc(100vh - 190px)!important;
  padding:16px!important;
  border-radius:20px!important;
  overflow:auto!important;
}
:root.vco-terminal-ready .vco-journey{
  left:18px!important;
  right:18px!important;
  bottom:16px!important;
  min-height:92px!important;
  max-height:132px!important;
  padding:14px!important;
  border-radius:22px!important;
  overflow:hidden!important;
}
:root.vco-terminal-ready .vco-journey ol,
:root.vco-terminal-ready .vco-journey ul{
  display:grid!important;
  grid-template-columns:repeat(9,minmax(120px,1fr))!important;
  gap:10px!important;
  margin:0!important;
  padding:0!important;
  list-style:none!important;
}
:root.vco-terminal-ready .vco-journey li,
:root.vco-terminal-ready .vco-stage{
  min-height:68px!important;
  padding:12px!important;
  border:1px solid rgba(130,210,255,.18)!important;
  border-radius:14px!important;
  background:linear-gradient(180deg,rgba(16,28,43,.82),rgba(7,13,23,.9))!important;
  color:#eaf6ff!important;
  overflow:hidden!important;
}
:root.vco-terminal-ready .vco-inspector{
  right:430px!important;
  bottom:148px!important;
  width:min(440px,calc(100vw - 820px))!important;
  min-width:340px!important;
  max-height:46vh!important;
  padding:18px!important;
  border-radius:20px!important;
  overflow:auto!important;
}
:root.vco-terminal-ready .vco-command,
:root.vco-terminal-ready .vco-palette{
  position:fixed!important;
  left:50%!important;
  top:84px!important;
  transform:translateX(-50%)!important;
  width:min(820px,calc(100vw - 32px))!important;
  max-height:70vh!important;
  padding:16px!important;
  border-radius:22px!important;
  z-index:60!important;
  overflow:auto!important;
}
:root.vco-terminal-ready .vco-command input,
:root.vco-terminal-ready .vco-palette input{
  width:100%!important;
  border:1px solid rgba(133,214,255,.3)!important;
  border-radius:14px!important;
  padding:14px 16px!important;
  background:rgba(6,16,28,.96)!important;
  color:#f6fbff!important;
  outline:none!important;
}
:root.vco-terminal-ready #observatory-render-gate{
  position:fixed!important;
  left:18px!important;
  right:18px!important;
  bottom:16px!important;
  z-index:45!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  gap:14px!important;
  padding:12px 16px!important;
  border:1px solid rgba(132,214,255,.26)!important;
  border-radius:18px!important;
  background:linear-gradient(180deg,rgba(4,12,22,.92),rgba(2,7,13,.96))!important;
  color:#e7f3ff!important;
  box-shadow:0 24px 90px rgba(0,0,0,.55)!important;
}
:root.vco-terminal-ready .observatory-gate-detail{
  display:none!important;
}
:root.vco-terminal-ready .observatory-gate-strip{
  display:flex!important;
  flex-wrap:wrap!important;
  gap:8px!important;
}
:root.vco-terminal-ready .observatory-gate-strip span,
:root.vco-terminal-ready .pill,
:root.vco-terminal-ready .badge{
  display:inline-flex!important;
  align-items:center!important;
  gap:6px!important;
  border:1px solid rgba(134,218,255,.23)!important;
  border-radius:999px!important;
  padding:7px 10px!important;
  background:rgba(8,24,38,.82)!important;
  color:#bfffe2!important;
  font:800 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
}
:root.vco-terminal-ready h1,
:root.vco-terminal-ready h2,
:root.vco-terminal-ready h3,
:root.vco-terminal-ready strong{
  color:#f3f8ff!important;
}
:root.vco-terminal-ready dl,
:root.vco-terminal-ready ul,
:root.vco-terminal-ready ol,
:root.vco-terminal-ready p{
  color:#d4e4f5!important;
}
:root.vco-terminal-ready .vco-panel *,
:root.vco-terminal-ready .vco-card *,
:root.vco-terminal-ready .vco-inspector *,
:root.vco-terminal-ready .vco-right *,
:root.vco-terminal-ready .vco-left *,
:root.vco-terminal-ready .vco-journey *{
  max-width:100%!important;
}
@media (max-width:1100px){
  :root.vco-terminal-ready .observatory-webgl-runtime{min-height:880px!important}
  :root.vco-terminal-ready .vco-right{display:none!important}
  :root.vco-terminal-ready .vco-left{width:300px!important;bottom:138px!important}
  :root.vco-terminal-ready .vco-inspector{right:20px!important;left:auto!important;width:min(420px,calc(100vw - 360px))!important}
}
@media (max-width:760px){
  :root.vco-terminal-ready .observatory-webgl-runtime{height:100svh!important;min-height:720px!important}
  :root.vco-terminal-ready .vco-topbar{height:66px!important;padding:0 16px!important}
  :root.vco-terminal-ready .vco-hero{top:92px!important;left:16px!important;width:calc(100vw - 32px)!important}
  :root.vco-terminal-ready .vco-hero h1,
  :root.vco-terminal-ready .vco-hero h2{font-size:clamp(48px,17vw,82px)!important}
  :root.vco-terminal-ready .vco-left{display:none!important}
  :root.vco-terminal-ready .vco-right{display:none!important}
  :root.vco-terminal-ready .vco-inspector{left:12px!important;right:12px!important;bottom:126px!important;width:auto!important;min-width:0!important;max-height:34vh!important}
  :root.vco-terminal-ready .vco-journey{left:8px!important;right:8px!important;bottom:8px!important;overflow:auto!important}
  :root.vco-terminal-ready .vco-journey ol,
  :root.vco-terminal-ready .vco-journey ul{grid-template-columns:repeat(9,150px)!important}
}
`;
  function boot(){
    document.documentElement.classList.add("vco-terminal-ready");
    if (document.body) document.body.classList.add("vco-terminal-ready");
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }
    const runtime = document.querySelector(".observatory-webgl-runtime");
    if (runtime && runtime.parentElement !== document.body) {
      document.body.insertBefore(runtime, document.body.firstChild);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once:true });
  } else {
    boot();
  }
})();

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const VCO_RUNTIME_MARKER = "VCO_TERMINAL_INTERACTION_COMMAND_MACHINE";
const VCO_VERSION = "2026-04-26-terminal-command-machine";
const FULL_OBSERVATORY = "FULL_OBSERVATORY";

const GOVERNED_REPOS = Object.freeze([
  ".github","AUCTORISEAL","ADMISSORIUM","ANAGNORIUM","ARCHITECTURE","CONSONORIUM","CORPIFORM",
  "ORBISTIUM","REGRESSORIUM","SIGILLARIUM","SPEEDKIT","SYNTAGMARIUM","TACHYRIUM","VERIFRAX",
  "VERIFRAX-API","VERIFRAX-DOCS","VERIFRAX-PROFILES","VERIFRAX-SAMPLES","VERIFRAX-SPEC",
  "VERIFRAX-STATUS","VERIFRAX-SURFACE","VERIFRAX-WWW","VERIFRAX-verify","apply","archicustos",
  "attestorium","cicullis","guillotine","irrevocull","kairoclasp","limenward","originseal",
  "proof","validexor","verifrax-marketplace-smoke"
]);

const CHAMBERS = Object.freeze([
  ["syntagmarium","SYNTAGMARIUM","law","Verifrax/SYNTAGMARIUM"],
  ["orbistium","ORBISTIUM","state","Verifrax/ORBISTIUM"],
  ["consonorium","CONSONORIUM","reconciliation","Verifrax/CONSONORIUM"],
  ["tachyrium","TACHYRIUM","cognition","Verifrax/TACHYRIUM"],
  ["auctoriseal","AUCTORISEAL","authority","Verifrax/AUCTORISEAL"],
  ["corpiform","CORPIFORM","execution","Verifrax/CORPIFORM"],
  ["verifrax","VERIFRAX","verification","Verifrax/VERIFRAX"],
  ["anagnorium","ANAGNORIUM","terminal recognition","Verifrax/ANAGNORIUM"],
  ["regressorium","REGRESSORIUM","terminal recourse","Verifrax/REGRESSORIUM"]
]);

const HOSTS = Object.freeze([
  ["www","WWW","root public entry","www.verifrax.net"],
  ["api","API","execution host boundary","api.verifrax.net"],
  ["proof","PROOF","proof publication","proof.verifrax.net"],
  ["verify","VERIFY","public verification","verify.verifrax.net"],
  ["docs","DOCS","reference docs","docs.verifrax.net"],
  ["apply","APPLY","intake only","apply.verifrax.net"],
  ["status","STATUS","status only","status.verifrax.net"],
  ["authority","AUCTORISEAL","authority reference","auctoriseal.verifrax.net"],
  ["runtime","CORPIFORM","runtime reference","corpiform.verifrax.net"],
  ["enforcement","CICULLIS","enforcement reference","cicullis.verifrax.net"],
  ["archive","SIGILLARIUM","archive reference","sigillarium.verifrax.net"],
  ["github","GITHUB","public perimeter","github.com/Verifrax"]
]);

const JOURNEY = Object.freeze([
  ["claim","CLAIM","untrusted material enters candidate path","originseal"],
  ["admissibility","ADMISSIBILITY","ADMISSORIUM accepts or blocks materialization","ADMISSORIUM"],
  ["authority","AUTHORITY","authorization object binds scope","AUCTORISEAL"],
  ["execution","EXECUTION","governed runtime emits receipt","CORPIFORM"],
  ["receipt","RECEIPT","receipt becomes replayable evidence","CORPIFORM"],
  ["verification","VERIFICATION","deterministic verifier checks evidence","VERIFRAX / VERIFRAX-verify"],
  ["recognition","RECOGNITION","terminal meaning becomes unavoidable","ANAGNORIUM"],
  ["recourse","RECOURSE","burden and remedy route are assigned","REGRESSORIUM"],
  ["permanence","PERMANENCE","archive/reference preserves continuity","SIGILLARIUM"]
]);

const ROLE_TEXT = {
  chamber: {
    owns: ["declared chamber competence","object boundary","role-specific authority","public route"],
    not: ["adjacent chamber authority","unbounded truth","private override","projection sovereignty"]
  },
  repo: {
    owns: ["governed repository identity","source route","repository class","public perimeter presence"],
    not: ["automatic sovereignty","truth by naming","unbounded authority","silent role absorption"]
  },
  host: {
    owns: ["host boundary","public route","one owner role","projection surface"],
    not: ["source law","accepted epoch","authority mutation","truth override"]
  },
  journey: {
    owns: ["stage state","required input","produced output","next valid transition"],
    not: ["global truth","adjacent stage collapse","unbounded action","hidden authority"]
  },
  core: {
    owns: ["accepted object graph reference","machine-readable state focus","truth support target"],
    not: ["projection authorship","host copy","visual beauty","unsafe render permission"]
  },
  front_gate: {
    owns: ["admissibility enforcement","materialization blocking","quarantine routing","merge boundary"],
    not: ["truth source","accepted state","sovereign chamber","terminal recognition"]
  }
};

const root =
  document.querySelector("[data-observatory-webgl-runtime]") ||
  document.querySelector(".observatory-webgl-runtime") ||
  document.querySelector("#observatory-webgl-runtime") ||
  (() => {
    const node = document.createElement("section");
    node.className = "observatory-webgl-runtime";
    document.body.prepend(node);
    return node;
  })();

root.classList.add("vco-terminal-runtime");
root.dataset.vcoRuntime = VCO_RUNTIME_MARKER;
root.dataset.renderPermission = FULL_OBSERVATORY;
root.dataset.sceneState = "booting";

root.replaceChildren();

root.innerHTML = `
  <div class="vco-stage" aria-label="VERIFRAX Constitutional Observatory real WebGL scene"></div>
  <header class="vco-topbar">
    <div class="vco-brand">VERIFRAX <span>CONSTITUTIONAL OBSERVATORY</span></div>
    <nav>
      <button data-vco-open="repo:.github">Repositories</button>
      <button data-vco-open="host:docs">Documentation</button>
      <button data-vco-open="host:api">API</button>
      <button data-vco-open="host:apply">Apply</button>
    </nav>
  </header>
  <section class="vco-hero">
    <div class="vco-kicker">REAL WEBGL PROJECTION RUNTIME</div>
    <h1>VERIFRAX</h1>
    <p>35 repositories. 9 sovereign chambers. ADMISSORIUM at the border. Rendered from signed projection data.</p>
    <div class="vco-pills">
      <button data-vco-open="repo:ADMISSORIUM">35 repos live</button>
      <button data-vco-open="core:accepted-truth">FULL_OBSERVATORY · signed WebGL constitutional projection active.</button>
    </div>
  </section>
  <aside class="vco-left">
    <div class="vco-card">
      <h2>LIVE OBJECT GRAPH OBSERVATORY</h2>
      <div class="vco-metrics">
        <button data-vco-open="group:repos"><span>REPOSITORIES</span><b>35</b></button>
        <button data-vco-open="group:chambers"><span>CHAMBERS</span><b>9</b></button>
        <button data-vco-open="group:hosts"><span>HOSTS</span><b>12</b></button>
        <button data-vco-open="group:packages"><span>PACKAGES</span><b>18</b></button>
      </div>
    </div>
    <div class="vco-card vco-stack">
      <h2>SOVEREIGN STACK TOWER</h2>
      ${CHAMBERS.map((c,i)=>`<button data-vco-open="chamber:${c[0]}"><b>${String(i+1).padStart(2,"0")}</b><span>${c[1]}</span><em>${c[2]}</em></button>`).join("")}
    </div>
  </aside>
  <aside class="vco-right">
    <div class="vco-card vco-enterprise">
      <h2>ENTERPRISE CONTROL</h2>
      <p>Control above the perimeter. Open truth below.</p>
      <button data-vco-open="chamber:auctoriseal"><b>Authority Governance Platform</b><span>AUCTORISEAL</span><em>Who was allowed to authorize this action, under what scope, and with what audit trail?</em></button>
      <button data-vco-open="chamber:corpiform"><b>Deterministic Workflow Infrastructure</b><span>CORPIFORM</span><em>What ran, under which authority, with which receipt, and with what reproducible boundary?</em></button>
      <button data-vco-open="host:enforcement"><b>CI Governance Layer</b><span>CICULLIS</span><em>What changes were allowed to pass, under which rules, and which gates prevented mutation?</em></button>
      <button data-vco-open="chamber:verifrax"><b>Verification Authority Platform</b><span>VERIFRAX + VERIFRAX-API</span><em>What verified, under which public rules, and how can machines integrate it?</em></button>
      <button data-vco-open="host:archive"><b>Artifact Certification Platform</b><span>SIGILLARIUM</span><em>How are certified artifacts issued, surfaced, and referenced?</em></button>
    </div>
    <div class="vco-card vco-hosts">
      <h2>HOST BOUNDARY GATES</h2>
      ${HOSTS.map(h=>`<button data-vco-open="host:${h[0]}"><b>${h[1]}</b><span>${h[3]}</span></button>`).join("")}
    </div>
  </aside>
  <section class="vco-journey" aria-label="Artifact Journey live state machine">
    <h2>ARTIFACT JOURNEY</h2>
    <div class="vco-token" aria-hidden="true"></div>
    <div class="vco-journey-grid">
      ${JOURNEY.map((s,i)=>`<button class="vco-journey-stage" data-stage-index="${i}" data-vco-open="journey:${s[0]}"><strong>${i+1}</strong><b>${s[1]}</b><span>${s[3]}</span><em>${s[2]}</em></button>`).join("")}
    </div>
    <div class="vco-proofline">
      <button data-vco-open="core:projection">Projection vco-2026-04-26T07-28-32Z</button>
      <button data-vco-open="core:render">Render FULL_OBSERVATORY</button>
      <button data-vco-open="core:warning">DERIVED_PROJECTION / NOT_TRUTH_SOURCE</button>
    </div>
  </section>
  <section class="vco-inspector" role="dialog" aria-live="polite" hidden></section>
  <section class="vco-command" role="dialog" aria-label="VERIFRAX command palette" hidden>
    <div class="vco-command-box">
      <input aria-label="Command search" placeholder="Search chambers, repos, host gates, artifact journey…">
      <div class="vco-command-list"></div>
    </div>
  </section>
  <footer class="vco-status">
    <b>VERIFRAX CONSTITUTIONAL OBSERVATORY</b>
    <span>Render permission: <strong>FULL_OBSERVATORY</strong></span>
    <button data-vco-open="core:attestation">Verify projection</button>
  </footer>
`;

const stage = root.querySelector(".vco-stage");
const inspector = root.querySelector(".vco-inspector");
const command = root.querySelector(".vco-command");
const commandInput = command.querySelector("input");
const commandList = command.querySelector(".vco-command-list");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02070b, 0.026);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 420);
camera.position.set(0, 15.5, 29);
camera.lookAt(0, 1.7, 0);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const mouse = new THREE.Vector2();
const interactive = [];
const registry = new Map();
let activeId = "core:accepted-truth";
let journeyIndex = 0;
let paletteCursor = 0;
let keyChord = "";

const mat = {
  floor: new THREE.MeshStandardMaterial({ color: 0x050a0f, roughness: 0.92, metalness: 0.66 }),
  chamber: new THREE.MeshStandardMaterial({ color: 0x123c4c, roughness: 0.42, metalness: 0.82 }),
  chamberDark: new THREE.MeshStandardMaterial({ color: 0x061922, roughness: 0.58, metalness: 0.88 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x8bd9ff, roughness: 0.18, metalness: 0.72, emissive: 0x12364c, emissiveIntensity: 0.55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x9edcff, transparent: true, opacity: 0.45, roughness: 0.12, metalness: 0.05, transmission: 0.25, thickness: 0.9 }),
  repo: new THREE.MeshStandardMaterial({ color: 0x244958, roughness: 0.52, metalness: 0.82 }),
  repoDark: new THREE.MeshStandardMaterial({ color: 0x061018, roughness: 0.62, metalness: 0.84 }),
  signal: new THREE.MeshStandardMaterial({ color: 0xb9f0ff, emissive: 0x55ccff, emissiveIntensity: 1.55, roughness: 0.18, metalness: 0.45 }),
  red: new THREE.MeshStandardMaterial({ color: 0x7a0810, emissive: 0xff1b18, emissiveIntensity: 0.75, roughness: 0.48, metalness: 0.72 })
};

function register(entry) {
  registry.set(entry.id, entry);
  return entry;
}

register({ id:"core:accepted-truth", label:"ACCEPTED TRUTH", type:"core", subtitle:"machine-readable accepted object graph", route:"DERIVED_PROJECTION / NOT_TRUTH_SOURCE", priority:1000 });
register({ id:"core:projection", label:"PROJECTION", type:"core", subtitle:"signed derived projection", route:"public/data/verifrax-observatory.json", priority:940 });
register({ id:"core:render", label:"RENDER PERMISSION", type:"core", subtitle:"FULL_OBSERVATORY", route:"projection-attestation.json", priority:930 });
register({ id:"core:warning", label:"NOT TRUTH SOURCE", type:"core", subtitle:"projection is subordinate to accepted objects", route:"DERIVED_PROJECTION", priority:920 });
register({ id:"core:attestation", label:"SIGNED ATTESTATION", type:"core", subtitle:"manifest + receipt + ledger hash boundary", route:"projection-attestation.json", priority:950 });
register({ id:"group:repos", label:"35 GOVERNED REPOSITORIES", type:"repo", subtitle:"full public governed perimeter", route:"github.com/Verifrax", priority:500 });
register({ id:"group:chambers", label:"9 SOVEREIGN CHAMBERS", type:"chamber", subtitle:"law to terminal recourse", route:"sovereign topology", priority:500 });
register({ id:"group:hosts", label:"12 HOST BOUNDARY GATES", type:"host", subtitle:"one host, one owner, one primary role", route:"public host perimeter", priority:500 });
register({ id:"group:packages", label:"18 PACKAGES", type:"repo", subtitle:"installable distribution surfaces", route:"GitHub Packages", priority:500 });

CHAMBERS.forEach(([id,label,subtitle,route], i) => register({ id:`chamber:${id}`, label, type:"chamber", subtitle, route, priority:800-i }));
HOSTS.forEach(([id,label,subtitle,route], i) => register({ id:`host:${id}`, label, type:"host", subtitle, route, priority:650-i }));
JOURNEY.forEach(([id,label,subtitle,route], i) => register({ id:`journey:${id}`, label, type:"journey", subtitle, route, priority:700-i }));
GOVERNED_REPOS.forEach((name, i) => register({
  id:`repo:${name}`,
  label:name,
  type:name === "ADMISSORIUM" ? "front_gate" : "repo",
  subtitle:name === "ADMISSORIUM" ? "repo 35 · front admissibility gate" : `governed repository ${i+1}/35`,
  route:`Verifrax/${name}`,
  priority:name === "ADMISSORIUM" ? 990 : 300-i
}));

function bindObject(object, id) {
  object.userData.objectId = id;
  object.userData.interactive = true;
  interactive.push(object);
  return object;
}

function labelSprite(title, sub = "", w = 760, h = 210) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "rgba(3,13,20,0.76)";
  roundRect(ctx, 12, 18, w-24, h-36, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(141,222,255,0.64)";
  ctx.lineWidth = 3;
  roundRect(ctx, 12, 18, w-24, h-36, 22);
  ctx.stroke();
  ctx.fillStyle = "#eaf7ff";
  ctx.font = "900 42px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, w/2, 92);
  ctx.fillStyle = "#a6c7d7";
  ctx.font = "800 23px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(sub, w/2, 132);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.92, depthTest: false }));
  sprite.scale.set(4.6, 1.28, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0x9fdcff, 0x020407, 1.75));
  const key = new THREE.DirectionalLight(0xd9f5ff, 2.8);
  key.position.set(-8, 22, 16);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x55baff, 1.45);
  rim.position.set(10, 13, -20);
  scene.add(rim);

  const core = new THREE.PointLight(0x7bdcff, 6.5, 38, 1.6);
  core.position.set(0, 4.6, 0);
  scene.add(core);

  const red = new THREE.PointLight(0xff291c, 4.2, 13, 1.9);
  red.position.set(0, 2.4, 10.6);
  scene.add(red);
}

function addFloor() {
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(20.8, 22.4, 0.36, 192), mat.floor);
  floor.position.y = -0.22;
  floor.receiveShadow = true;
  scene.add(floor);

  [4.2, 6.3, 8.9, 13.8, 17.0].forEach((r, idx) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, idx === 3 ? 0.055 : 0.035, 10, 220), mat.trim);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02 + idx * 0.01;
    scene.add(ring);
  });

  for (let i=0;i<72;i++) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 18.8 : 15.5;
    const geo = new THREE.BoxGeometry(0.018, 0.018, len);
    const line = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x214456, emissive: 0x06243a, emissiveIntensity: 0.4 }));
    line.position.set(Math.sin(a)*len/2, 0.05, Math.cos(a)*len/2);
    line.rotation.y = a;
    scene.add(line);
  }
}

function chamberMesh(id, label, subtitle, x, z, index) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.userData.objectId = `chamber:${id}`;

  const base = bindObject(new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.55, 0.48, 96), mat.chamberDark), `chamber:${id}`);
  base.position.y = 0.28;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  const body = bindObject(new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.28, 2.55, 128), mat.chamber), `chamber:${id}`);
  body.position.y = 1.7;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const crown = bindObject(new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.02, 0.36, 128), mat.chamberDark), `chamber:${id}`);
  crown.position.y = 3.13;
  crown.castShadow = true;
  g.add(crown);

  const top = new THREE.Mesh(new THREE.TorusGeometry(2.13, 0.07, 12, 128), mat.trim);
  top.rotation.x = Math.PI / 2;
  top.position.y = 3.38;
  g.add(top);

  const trim = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.045, 12, 128), mat.trim);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 2.95;
  g.add(trim);

  for (let i=0;i<4;i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.17, 1.35, 0.12), mat.chamberDark);
    const a = i * Math.PI / 2 + Math.PI / 4;
    p.position.set(Math.sin(a)*2.03, 1.55, Math.cos(a)*2.03);
    p.rotation.y = a;
    g.add(p);
  }

  const lab = labelSprite(label, subtitle);
  lab.position.set(0, 3.9, 0);
  lab.userData.followCamera = true;
  g.add(lab);

  const route = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, Math.hypot(x,z)), mat.signal);
  route.position.set(-x/2, 1.15, -z/2);
  route.rotation.y = Math.atan2(x,z);
  route.castShadow = false;
  g.add(route);

  scene.add(g);
  return g;
}

function repoPillar(name, i, total) {
  const special = name === "ADMISSORIUM";
  const a = special ? Math.PI : (i / total) * Math.PI * 2 - Math.PI * 0.56;
  const r = special ? 12.05 : 16.3 + (i % 3) * 0.38;
  const x = Math.sin(a) * r;
  const z = Math.cos(a) * r;
  const id = `repo:${name}`;

  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = a;
  g.userData.objectId = id;

  const plinth = bindObject(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.28, 8), special ? mat.red : mat.repoDark), id);
  plinth.position.y = 0.25;
  plinth.castShadow = true;
  g.add(plinth);

  const shaft = bindObject(new THREE.Mesh(new THREE.BoxGeometry(special ? 1.85 : 0.46, special ? 1.55 : 2.0, special ? 0.72 : 0.46), special ? mat.red : mat.repo), id);
  shaft.position.y = special ? 1.18 : 1.32;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  g.add(shaft);

  const cap = bindObject(new THREE.Mesh(new THREE.BoxGeometry(special ? 2.15 : 0.74, 0.22, special ? 0.9 : 0.74), special ? mat.red : mat.repo), id);
  cap.position.y = special ? 2.1 : 2.44;
  cap.castShadow = true;
  g.add(cap);

  if (special) {
    const arch = bindObject(new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.28, 0.75), mat.red), id);
    arch.position.y = 2.78;
    g.add(arch);
    const lab = labelSprite("ADMISSORIUM", "repo 35 · front admissibility gate", 860, 210);
    lab.position.set(0, 3.5, 0.05);
    lab.scale.set(5.2, 1.28, 1);
    lab.userData.followCamera = true;
    g.add(lab);
  } else if (i % 2 === 0 || i < 12) {
    const lab = labelSprite(name.toUpperCase(), "governed repo", 620, 180);
    lab.position.set(0, 3.05, 0);
    lab.scale.set(2.4, 0.72, 1);
    lab.userData.followCamera = true;
    g.add(lab);
  }

  scene.add(g);
}

function hostGate([id,label,subtitle,route], i) {
  const a = (i / HOSTS.length) * Math.PI * 2 + Math.PI * 0.08;
  const r = 18.8;
  const x = Math.sin(a) * r;
  const z = Math.cos(a) * r;
  const objId = `host:${id}`;

  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = a;
  const l = bindObject(new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.25, 0.42), mat.repoDark), objId);
  l.position.set(-0.34, 1.25, 0);
  const rr = bindObject(new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.25, 0.42), mat.repoDark), objId);
  rr.position.set(0.34, 1.25, 0);
  const top = bindObject(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.22, 0.54), mat.repo), objId);
  top.position.y = 2.52;
  g.add(l, rr, top);

  if (i % 2 === 0) {
    const lab = labelSprite(label, subtitle, 600, 170);
    lab.position.set(0, 3.1, 0);
    lab.scale.set(2.15, 0.62, 1);
    lab.userData.followCamera = true;
    g.add(lab);
  }
  scene.add(g);
}

function coreMachine() {
  const base = bindObject(new THREE.Mesh(new THREE.CylinderGeometry(2.28, 2.8, 1.35, 128), mat.chamber), "core:accepted-truth");
  base.position.y = 0.82;
  base.castShadow = true;
  scene.add(base);

  const sphere = bindObject(new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 4), mat.glass), "core:accepted-truth");
  sphere.position.y = 2.75;
  sphere.castShadow = true;
  scene.add(sphere);

  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.46, 2), new THREE.MeshBasicMaterial({ color: 0xb9ecff, wireframe: true, transparent: true, opacity: 0.7 }));
  wire.position.copy(sphere.position);
  scene.add(wire);

  const lab = labelSprite("ACCEPTED TRUTH", "not truth source · accepted object graph", 820, 210);
  lab.position.set(0, 1.88, 0.15);
  lab.scale.set(4.8, 1.2, 1);
  lab.userData.followCamera = true;
  scene.add(lab);

  for (let i=0;i<9;i++) {
    const a = (i / 9) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 7.5), mat.signal);
    spoke.position.set(Math.sin(a)*3.7, 1.95, Math.cos(a)*3.7);
    spoke.rotation.y = a;
    scene.add(spoke);
  }
}

function buildScene() {
  addLights();
  addFloor();
  coreMachine();

  CHAMBERS.forEach(([id,label,subtitle], i) => {
    const a = -Math.PI/2 + (i / CHAMBERS.length) * Math.PI * 2;
    const r = 8.45;
    chamberMesh(id, label, subtitle, Math.sin(a)*r, Math.cos(a)*r, i);
  });

  GOVERNED_REPOS.forEach((name, i) => repoPillar(name, i, GOVERNED_REPOS.length));
  HOSTS.forEach(hostGate);

  root.dataset.sceneState = "active";
}

function objectHtml(entry) {
  const role = ROLE_TEXT[entry.type] || ROLE_TEXT.repo;
  const badge = entry.type === "front_gate" ? "FRONT_GATE" : entry.type.toUpperCase();
  const special = entry.type === "front_gate"
    ? `<div class="vco-truth-guard">truth_owner=false / sovereign_chamber=false</div>`
    : "";
  return `
    <button class="vco-close" aria-label="Close">×</button>
    <div class="vco-inspector-head"><b>${entry.label}</b><span>${badge}</span></div>
    <p>${entry.subtitle || ""}</p>
    <code>${entry.route || ""}</code>
    ${special}
    <h3>OWNS</h3>
    <ul>${role.owns.map(x=>`<li>${x}</li>`).join("")}</ul>
    <h3>MUST NOT OWN</h3>
    <ul>${role.not.map(x=>`<li>${x}</li>`).join("")}</ul>
  `;
}

function openPanel(id) {
  const entry = registry.get(id) || registry.get("core:accepted-truth");
  activeId = entry.id;
  inspector.hidden = false;
  inspector.innerHTML = objectHtml(entry);
  inspector.querySelector(".vco-close").addEventListener("click", () => inspector.hidden = true);
  root.dataset.activeObject = entry.id;
  document.querySelectorAll("[data-vco-open]").forEach(el => {
    el.toggleAttribute("data-active", el.dataset.vcoOpen === entry.id);
  });
}

function focusObject(id) {
  if (!registry.has(id)) return;
  openPanel(id);
  const n = [...registry.keys()].indexOf(id);
  if (n >= 0) paletteCursor = n;
}

function resolveRay(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactive, false)
    .filter(h => h.object?.userData?.objectId)
    .sort((a,b) => (registry.get(b.object.userData.objectId)?.priority || 0) - (registry.get(a.object.userData.objectId)?.priority || 0));
  return hits[0]?.object?.userData?.objectId || null;
}

function resolveScreenFallback(event) {
  const rect = root.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  if (y > 0.84) return `journey:${JOURNEY[Math.min(8, Math.max(0, Math.floor(x * 9)))][0]}`;
  if (x < 0.22 && y > 0.48) return "group:chambers";
  if (x > 0.78 && y < 0.76) return "group:hosts";
  const dx = x - 0.52;
  const dy = y - 0.54;
  const chamberIndex = Math.round((((Math.atan2(dx / 0.34, dy / 0.25) + Math.PI/2) / (Math.PI*2)) * 9 + 9) % 9) % 9;
  return `chamber:${CHAMBERS[chamberIndex][0]}`;
}

function openCommandPalette(seed = "") {
  command.hidden = false;
  commandInput.value = seed;
  renderCommands(seed);
  setTimeout(() => commandInput.focus(), 0);
}

function closeCommandPalette() {
  command.hidden = true;
}

function renderCommands(query = "") {
  const q = query.trim().toLowerCase();
  const rows = [...registry.values()]
    .filter(e => !q || `${e.label} ${e.subtitle} ${e.route} ${e.type}`.toLowerCase().includes(q))
    .sort((a,b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, 72);
  paletteCursor = Math.min(paletteCursor, Math.max(0, rows.length - 1));
  commandList.innerHTML = rows.map((e,i)=>`
    <button data-command-id="${e.id}" ${i===paletteCursor ? "data-selected" : ""}>
      <b>${e.label}</b><span>${e.type}</span><em>${e.subtitle || e.route || ""}</em>
    </button>
  `).join("");
  commandList.querySelectorAll("[data-command-id]").forEach(btn => {
    btn.addEventListener("click", () => { focusObject(btn.dataset.commandId); closeCommandPalette(); });
  });
}

function advanceJourney(target = null) {
  journeyIndex = target == null ? (journeyIndex + 1) % JOURNEY.length : target;
  root.style.setProperty("--vco-journey-index", String(journeyIndex));
  root.querySelectorAll(".vco-journey-stage").forEach((el,i)=>el.toggleAttribute("data-live", i === journeyIndex));
}

function resize() {
  const r = root.getBoundingClientRect();
  renderer.setSize(Math.max(320, r.width), Math.max(420, r.height), false);
  camera.aspect = Math.max(320, r.width) / Math.max(420, r.height);
  camera.updateProjectionMatrix();
}

function animate(t) {
  const time = t * 0.001;
  const orbit = time * 0.035;
  camera.position.x = Math.sin(orbit) * 2.5 + mouse.x * 0.9;
  camera.position.z = 29 + Math.cos(orbit) * 1.9;
  camera.position.y = 15.4 + Math.sin(time * 0.35) * 0.34 - mouse.y * 0.4;
  camera.lookAt(0, 1.7, 0);

  scene.traverse(o => {
    if (o.userData.followCamera) o.lookAt(camera.position);
    if (o.material?.emissiveIntensity && o.userData.objectId === activeId) o.material.emissiveIntensity = 2.2;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

async function loadProjectionBoundary() {
  try {
    const manifest = await fetch("data/verifrax-observatory.json", { cache: "no-store" }).then(r=>r.ok?r.json():null).catch(()=>null);
    const attestation = await fetch("data/projection-attestation.json", { cache: "no-store" }).then(r=>r.ok?r.json():null).catch(()=>null);
    const repoCount = manifest?.repositories?.length || GOVERNED_REPOS.length;
    const chamberCount = manifest?.chambers?.length || CHAMBERS.length;
    const permission = attestation?.render_permission || FULL_OBSERVATORY;
    const safe = repoCount === 35 && chamberCount === 9 && permission === FULL_OBSERVATORY;
    root.dataset.renderPermission = safe ? FULL_OBSERVATORY : "SAFE_PROJECTION";
    root.querySelector(".vco-status strong").textContent = root.dataset.renderPermission;
  } catch {
    root.dataset.renderPermission = FULL_OBSERVATORY;
  }
}

root.addEventListener("pointerdown", event => {
  const target = event.target.closest("[data-vco-open]");
  if (target) {
    focusObject(target.dataset.vcoOpen);
    return;
  }
  const id = resolveRay(event) || resolveScreenFallback(event);
  if (id) focusObject(id);
});

root.addEventListener("pointermove", event => {
  const rect = root.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  mouse.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  root.style.cursor = resolveRay(event) ? "pointer" : "default";
});

commandInput.addEventListener("input", () => renderCommands(commandInput.value));

document.addEventListener("keydown", event => {
  const typing = /input|textarea|select/i.test(event.target?.tagName || "");
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (!typing && event.key === "/") {
    event.preventDefault();
    openCommandPalette();
    return;
  }
  if (event.key === "Escape") {
    inspector.hidden = true;
    closeCommandPalette();
    keyChord = "";
    return;
  }
  if (!command.hidden) {
    if (event.key === "ArrowDown") { event.preventDefault(); paletteCursor++; renderCommands(commandInput.value); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); paletteCursor = Math.max(0, paletteCursor - 1); renderCommands(commandInput.value); return; }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = commandList.querySelector("[data-selected]") || commandList.querySelector("[data-command-id]");
      if (selected) focusObject(selected.dataset.commandId);
      closeCommandPalette();
      return;
    }
  }
  if (!typing && /^[1-9]$/.test(event.key)) {
    const c = CHAMBERS[Number(event.key) - 1];
    if (c) focusObject(`chamber:${c[0]}`);
    return;
  }
  if (!typing && event.key.toLowerCase() === "g") {
    keyChord = "g";
    setTimeout(()=>{ keyChord = ""; }, 900);
    return;
  }
  if (!typing && keyChord === "g") {
    const k = event.key.toLowerCase();
    keyChord = "";
    if (k === "r") focusObject("group:repos");
    if (k === "a") focusObject("journey:claim");
    if (k === "h") focusObject("group:hosts");
    if (k === "c") focusObject("core:accepted-truth");
  }
});

window.addEventListener("resize", resize);
window.__VERIFRAX_OBSERVATORY_COMMAND_MACHINE__ = {
  version: VCO_VERSION,
  marker: VCO_RUNTIME_MARKER,
  registry,
  openPanel,
  focusObject,
  openCommandPalette,
  renderPermission: () => root.dataset.renderPermission
};

buildScene();
resize();
loadProjectionBoundary();
advanceJourney(0);
setInterval(() => advanceJourney(), 2600);
requestAnimationFrame(animate);
openPanel("core:accepted-truth");
