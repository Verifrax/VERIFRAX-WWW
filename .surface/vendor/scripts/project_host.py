#!/usr/bin/env python3
import hashlib
import json
import re
import sys
from html import escape
from pathlib import Path

CLASS_RULES = {
    "root": [
        "One root. Many isolated surfaces.",
        "Every host owns one function.",
        "No host may absorb another host’s consequences.",
        "Navigation belongs here; execution does not.",
    ],
    "boundary": [
        "This host is a bounded surface.",
        "It may expose its assigned role only.",
        "It may not claim adjacent authority.",
    ],
}

READING_ORDER = [
    ("Docs", "https://docs.verifrax.net/"),
    ("Proof", "https://proof.verifrax.net/"),
    ("Verify", "https://verify.verifrax.net/"),
    ("Authority", "https://auctoriseal.verifrax.net/"),
    ("Runtime", "https://corpiform.verifrax.net/"),
    ("Enforcement", "https://cicullis.verifrax.net/"),
    ("Archive", "https://sigillarium.verifrax.net/"),
    ("Apply", "https://apply.verifrax.net/"),
    ("Status", "https://status.verifrax.net/"),
]

def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]

def ensure_asset(dest_dir: Path, css: str):
    asset_dir = dest_dir / "assets"
    asset_dir.mkdir(parents=True, exist_ok=True)
    css = _vco_deep_repair_css(css)
    (asset_dir / "surface.css").write_text(css, encoding="utf-8")

def render_observatory_gate(cfg):
    if not cfg.get("observatoryRenderGate"):
        return ""
    return """
    <section id="observatory-render-gate" class="observatory-render-gate" aria-label="VERIFRAX Observatory render permission">
      <div class="observatory-gate-head">
        <div>
          <span class="observatory-gate-kicker">VERIFRAX CONSTITUTIONAL OBSERVATORY</span>
          <strong>Render permission: STATIC_FALLBACK</strong>
        </div>
      </div>
      <div class="observatory-gate-strip">
        <span>PROJECTION: unloaded</span>
        <span>WARNING: DERIVED_PROJECTION / NOT_TRUTH_SOURCE</span>
      </div>
    </section>
"""

def render_observatory_script(cfg):
    if not cfg.get("observatoryRenderGate"):
        return ""
    return '  <script src="assets/observatory-render-gate.js" defer></script>\n'

def render_observatory_webgl(cfg):
    if not cfg.get("observatoryWebglRuntime"):
        return ""
    return """
    <section id="observatory-webgl-runtime" class="observatory-webgl-runtime" aria-label="VERIFRAX Constitutional Observatory real WebGL runtime">
      <div class="oc-stage" data-runtime-stage></div>

      <header class="oc-topbar">
        <div class="oc-brand">
          <strong>VERIFRAX</strong>
          <span>Constitutional Observatory</span>
        </div>
        <nav>
          <a href="https://github.com/Verifrax">Repositories</a>
          <a href="https://docs.verifrax.net">Documentation</a>
          <a href="https://api.verifrax.net">API</a>
          <a href="https://apply.verifrax.net">Apply</a>
        </nav>
      </header>

      <section class="oc-hero">
        <span>REAL WEBGL PROJECTION RUNTIME</span>
        <h2>VERIFRAX</h2>
        <p>35 repositories. 9 sovereign chambers. ADMISSORIUM at the border. Rendered from signed projection data.</p>
        <div class="oc-hero-badges">
          <code><b data-count="repos">35</b> repos live</code>
          <code data-runtime-status>STATIC_FALLBACK</code>
        </div>
      </section>

      <aside class="oc-left">
        <section>
          <h3>Live Object Graph Observatory</h3>
          <dl>
            <div><dt>Repositories</dt><dd><b data-count="repos">35</b></dd></div>
            <div><dt>Chambers</dt><dd><b data-count="chambers">9</b></dd></div>
            <div><dt>Hosts</dt><dd><b data-count="hosts">12</b></dd></div>
            <div><dt>Packages</dt><dd><b data-count="packages">—</b></dd></div>
          </dl>
        </section>
        <section>
          <h3>Sovereign Stack Tower</h3>
          <ol data-stack-list></ol>
        </section>
      </aside>

      <aside class="oc-right">
        <section>
          <h3>Enterprise Control</h3>
          <p>Control above the perimeter. Open truth below.</p>
          <div class="oc-enterprise" data-enterprise-list></div>
        </section>
        <section>
          <h3>Host Boundary Gates</h3>
          <ul data-host-list></ul>
        </section>
      </aside>

      <aside class="oc-inspector" data-runtime-inspector>
        <div class="oc-inspector-head">
          <strong>Projection inspector</strong>
          <span>Click any object</span>
        </div>
        <p>Every visible object is subordinate to DERIVED_PROJECTION / NOT_TRUTH_SOURCE.</p>
      </aside>

      <footer class="oc-bottom">
        <div class="oc-journey">
          <h3>Artifact Journey</h3>
          <ol data-journey-list></ol>
        </div>
        <div class="oc-proofline">
          <span>Projection <b data-projection-id>loading</b></span>
          <span>Render <b data-render-permission>STATIC_FALLBACK</b></span>
          <span>DERIVED_PROJECTION / NOT_TRUTH_SOURCE</span>
        </div>
      </footer>
    </section>
"""

def render_observatory_webgl_script(cfg):
    if not cfg.get("observatoryWebglRuntime"):
        return ""
    return '  <script type="module" src="assets/observatory-webgl-runtime.js"></script>\n'

def observatory_css(cfg):
    if not cfg.get("observatoryRenderGate"):
        return ""
    return r"""
.observatory-render-gate{
  margin:28px 0 0;
  padding:16px;
  border:1px solid rgba(115,208,255,.22);
  border-radius:18px;
  background:linear-gradient(180deg,rgba(8,14,24,.88),rgba(5,9,15,.96));
  box-shadow:0 18px 60px rgba(0,0,0,.32);
  color:var(--vf-text,#edf2f7);
}
.observatory-gate-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
.observatory-gate-kicker{display:block;margin-bottom:6px;color:var(--vf-accent,#73d0ff);font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em}
.observatory-gate-head strong{font:700 18px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.observatory-gate-toggle{appearance:none;border:1px solid rgba(115,208,255,.32);border-radius:999px;padding:9px 13px;background:rgba(115,208,255,.08);color:var(--vf-text,#edf2f7);font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;cursor:pointer}
.observatory-gate-strip{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;color:var(--vf-text-soft,#b6c2cf);font:600 11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.observatory-gate-strip span{padding:7px 9px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.035)}
.observatory-gate-detail{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.09);color:var(--vf-text-soft,#b6c2cf)}
.observatory-gate-detail p{margin:0 0 12px}
.observatory-gate-detail dl{display:grid;gap:6px;margin:0}
.observatory-gate-check{display:grid;grid-template-columns:minmax(180px,260px) 1fr;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.035)}
.observatory-gate-check dt,.observatory-gate-check dd{margin:0;font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.observatory-gate-check.is-pass dd{color:#9ee6b8}
.observatory-gate-check.is-fail dd{color:#ff9b9b}
body.vf-observatory-full .observatory-render-gate{border-color:rgba(115,208,255,.42)}
body.vf-observatory-safe .observatory-render-gate,body.vf-observatory-blocked .observatory-render-gate{border-color:rgba(255,139,139,.46)}
@media (max-width:720px){.observatory-gate-head{align-items:flex-start;flex-direction:column}.observatory-gate-check{grid-template-columns:1fr}}
"""

def observatory_webgl_css(cfg):
    if not cfg.get("observatoryWebglRuntime"):
        return ""
    return r"""
.observatory-webgl-runtime{
  position:relative;width:min(100vw,calc(100vw - 12px));min-height:calc(100vh - 6px);
  margin:0 0 44px calc(50% - 50vw + 6px);
  border:1px solid rgba(115,208,255,.20);border-radius:0 0 30px 30px;overflow:hidden;
  background:#02060b;box-shadow:0 44px 120px rgba(0,0,0,.62);
  isolation:isolate;
}
.observatory-webgl-runtime:before{
  content:"";
  position:absolute;
  inset:0;
  z-index:1;
  pointer-events:none;
  background:
    linear-gradient(90deg,rgba(0,0,0,.70),transparent 18%,transparent 77%,rgba(0,0,0,.78)),
    radial-gradient(circle at 50% 46%,transparent 0,transparent 36%,rgba(0,0,0,.52) 75%);
}
.oc-stage{position:absolute;inset:0;z-index:0}
.oc-stage canvas{display:block;width:100%;height:100%}
.oc-stage:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 48%,rgba(115,208,255,.10),transparent 30%),linear-gradient(180deg,rgba(0,0,0,.54),transparent 18%,transparent 70%,rgba(0,0,0,.78))}
.oc-topbar,.oc-hero,.oc-left,.oc-right,.oc-inspector,.oc-bottom{position:absolute;z-index:2}
.oc-topbar{top:0;left:0;right:0;height:72px;display:flex;align-items:center;justify-content:space-between;padding:0 26px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(1,5,9,.82),rgba(1,5,9,.20));backdrop-filter:blur(12px)}
.oc-brand{display:flex;gap:14px;align-items:baseline}
.oc-brand strong{color:#f4f9ff;font:900 28px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.20em}
.oc-brand span{color:#9fb4c7;font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-topbar nav{display:flex;gap:22px}
.oc-topbar a{color:#d5e4f4;text-decoration:none;font:700 13px/1 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-hero{top:88px;left:34px;width:min(430px,calc(100% - 68px))}
.oc-hero span{color:#73d0ff;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em}
.oc-hero h2{margin:10px 0 8px;color:#f3f8ff;font:900 clamp(42px,5.7vw,94px)/.86 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.07em}
.oc-hero p{max-width:390px;color:#c4d1df;font:600 16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-hero-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.oc-hero code,.oc-proofline span{display:inline-flex;gap:8px;align-items:center;padding:9px 11px;border:1px solid rgba(115,208,255,.20);border-radius:999px;background:rgba(2,8,14,.68);color:#9ee6b8;font:800 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-left{left:18px;bottom:150px;width:338px;display:grid;gap:10px}
.oc-right{right:18px;top:88px;width:374px;display:grid;gap:10px}
.oc-left section,.oc-right section,.oc-inspector,.oc-bottom{border:1px solid rgba(115,208,255,.15);border-radius:18px;background:linear-gradient(180deg,rgba(4,13,22,.82),rgba(3,8,14,.64));backdrop-filter:blur(12px);box-shadow:0 18px 56px rgba(0,0,0,.34)}
.oc-left section,.oc-right section{padding:14px}
.oc-left h3,.oc-right h3,.oc-bottom h3{margin:0 0 10px;color:#e8f5ff;font:900 12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em}
.oc-left dl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0}
.oc-left dl div{padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035)}
.oc-left dt{color:#8fa5b9;font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-left dd{margin:5px 0 0;color:#eaf6ff;font:900 18px/1 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-left ol,.oc-right ul,.oc-journey ol{display:grid;gap:5px;margin:0;padding:0;list-style:none}
.oc-left li{display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;color:#dcecff;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-left li span,.oc-journey li span{color:#73d0ff}
.oc-left li em{color:#8fa5b9;font-style:normal}
.oc-right p{margin:0 0 12px;color:#aebed0;font:600 13px/1.45 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-enterprise{display:grid;gap:9px}
.oc-enterprise button{appearance:none;text-align:left;padding:12px;border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.04);color:#edf8ff}
.oc-enterprise strong{display:block;margin-bottom:4px;font:900 14px/1.2 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-enterprise span{display:block;color:#73d0ff;font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-enterprise small{display:block;margin-top:5px;color:#9fafbf;font:600 12px/1.35 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-right li{display:flex;justify-content:space-between;gap:12px;color:#dcecff;font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-right li span{color:#73d0ff}
.oc-inspector{right:408px;bottom:138px;width:380px;padding:14px;color:#dcecff}
.oc-inspector-head{display:flex;justify-content:space-between;gap:12px}
.oc-inspector strong{color:#f2f8ff;font:900 13px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-inspector span{color:#73d0ff;font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-inspector p{margin:10px 0;color:#b8c7d6;font:600 12px/1.45 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-inspector code{display:block;padding:8px;border-radius:10px;color:#9ee6b8;background:rgba(115,208,255,.08);font:800 10px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-inspector h4{margin:10px 0 6px;color:#eaf6ff;font:900 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-inspector ul{margin:0;padding-left:16px;color:#9fafbf;font:600 11px/1.35 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-bottom{left:14px;right:14px;bottom:12px;padding:10px}
.oc-journey ol{grid-template-columns:repeat(9,minmax(0,1fr));gap:8px}
.oc-journey li{min-height:48px;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.035);color:#dcecff}
.oc-journey strong{display:block;font:900 10px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-journey em{display:block;margin-top:4px;color:#8fa5b9;font:700 9px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-style:normal}
.oc-proofline{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
@media (max-width:1200px){.oc-left,.oc-right,.oc-inspector{position:relative;inset:auto;width:auto;margin:12px 14px}.oc-left,.oc-right{display:grid;grid-template-columns:1fr}.observatory-webgl-runtime{min-height:1160px}.oc-bottom{position:relative;left:auto;right:auto;bottom:auto;margin:12px 14px 14px}}
/* VERIFRAX_OBSERVATORY_COLLISION_REPAIR_CSS */

/* Observatory collision repair: first viewport remains dominant without covering inspector content. */
html,body{overflow-x:hidden}
.observatory-webgl-runtime{
  contain:layout paint;
}
.oc-stage{
  min-height:calc(100vh - 8px);
}
.oc-left{
  max-height:calc(100vh - 270px);
  overflow:hidden;
}
.oc-left .oc-panel{
  backdrop-filter:blur(18px);
}
.oc-left .oc-stack-list{
  max-height:188px;
  overflow:hidden;
}
.oc-right{
  max-height:calc(100vh - 170px);
  overflow:auto;
  scrollbar-width:thin;
}
.oc-inspector{
  right:320px;
  bottom:150px;
  width:min(420px,28vw);
  max-height:32vh;
  overflow:auto;
  z-index:8;
}
.oc-bottom{
  z-index:12;
  max-height:142px;
  overflow:hidden;
}
.oc-journey ol{
  grid-template-columns:repeat(9,minmax(120px,1fr));
}
.oc-journey li{
  min-height:44px;
  padding:10px 12px;
}
.oc-journey small{
  display:block;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.oc-topbar{
  z-index:16;
}
.oc-hero{
  z-index:7;
}
@media (max-width:1180px){
  .oc-inspector{right:18px;bottom:154px;width:380px}
  .oc-right{display:none}
}

/* VERIFRAX_OBSERVATORY_PANEL_CONTAINMENT_BOUNDARY
   The 3D scene owns the first viewport. Panels may inform it; panels may not invade it. */
html,
body{
  margin:0;
  min-width:0;
  overflow-x:hidden !important;
  background:#00050a;
}

.observatory-webgl-runtime{
  position:relative !important;
  width:100% !important;
  min-height:100svh !important;
  height:100svh !important;
  max-height:100svh !important;
  overflow:hidden !important;
  isolation:isolate !important;
  background:#00050a !important;
}

.oc-stage,
.observatory-webgl-runtime canvas{
  position:absolute !important;
  inset:0 !important;
  width:100% !important;
  height:100% !important;
  max-width:none !important;
  max-height:none !important;
  display:block !important;
}

.oc-topbar{
  position:absolute !important;
  top:0 !important;
  left:0 !important;
  right:0 !important;
  height:70px !important;
  z-index:30 !important;
  display:flex !important;
  align-items:center !important;
  padding:0 28px !important;
  pointer-events:auto !important;
  background:linear-gradient(180deg,rgba(0,5,10,.92),rgba(0,5,10,.36),rgba(0,5,10,0)) !important;
}

.oc-hero{
  position:absolute !important;
  top:92px !important;
  left:28px !important;
  width:360px !important;
  max-width:calc(100vw - 56px) !important;
  z-index:18 !important;
  pointer-events:none !important;
}

.oc-hero h2{
  margin:8px 0 10px !important;
  max-width:360px !important;
  font-size:clamp(54px,6.2vw,96px) !important;
  line-height:.84 !important;
  letter-spacing:-.055em !important;
}

.oc-hero p{
  max-width:330px !important;
  font-size:14px !important;
  line-height:1.42 !important;
}

.oc-left{
  position:absolute !important;
  left:18px !important;
  bottom:140px !important;
  width:330px !important;
  max-height:calc(100svh - 430px) !important;
  z-index:18 !important;
  display:grid !important;
  gap:10px !important;
  overflow:hidden !important;
  pointer-events:auto !important;
}

.oc-right{
  position:absolute !important;
  right:18px !important;
  top:86px !important;
  width:365px !important;
  max-height:calc(100svh - 238px) !important;
  z-index:18 !important;
  display:grid !important;
  gap:10px !important;
  overflow:hidden !important;
  pointer-events:auto !important;
}

.oc-panel{
  min-width:0 !important;
  overflow:hidden !important;
  background:linear-gradient(180deg,rgba(4,12,20,.88),rgba(2,7,12,.94)) !important;
  border:1px solid rgba(132,216,255,.17) !important;
  box-shadow:0 18px 42px rgba(0,0,0,.38) !important;
}

.oc-panel *{
  min-width:0 !important;
}

.oc-inspector{
  position:absolute !important;
  right:390px !important;
  bottom:150px !important;
  width:390px !important;
  max-width:calc(100vw - 780px) !important;
  max-height:300px !important;
  z-index:22 !important;
  overflow:auto !important;
  pointer-events:auto !important;
  background:linear-gradient(180deg,rgba(2,8,14,.96),rgba(1,5,10,.98)) !important;
}

.oc-inspector ul,
.oc-inspector ol{
  margin-bottom:0 !important;
}

.oc-bottom{
  position:absolute !important;
  left:14px !important;
  right:14px !important;
  bottom:14px !important;
  height:106px !important;
  max-height:106px !important;
  z-index:24 !important;
  overflow:hidden !important;
  pointer-events:auto !important;
  background:linear-gradient(180deg,rgba(3,10,17,.94),rgba(1,5,10,.98)) !important;
}

.oc-journey,
.oc-journey ol{
  height:100% !important;
  max-height:100% !important;
  overflow:hidden !important;
}

.oc-journey ol{
  display:grid !important;
  grid-template-columns:repeat(9,minmax(112px,1fr)) !important;
  gap:8px !important;
  margin:0 !important;
  padding:0 !important;
}

.oc-journey li{
  min-height:0 !important;
  height:64px !important;
  padding:8px 10px !important;
  overflow:hidden !important;
}

.oc-journey strong,
.oc-journey span,
.oc-journey small{
  display:block !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}

.oc-journey strong{
  font-size:13px !important;
}

.oc-journey small{
  font-size:9px !important;
}

/* Static fallback belongs below the Observatory, never inside the command viewport. */
.observatory-webgl-runtime + .surface,
.observatory-webgl-runtime ~ .surface,
main.surface{
  clear:both !important;
}

/* Medium screens: keep first viewport clean; remove secondary panels before overlap begins. */
@media (max-width:1320px), (max-height:780px){
  .oc-left{
    width:270px !important;
    bottom:132px !important;
    max-height:220px !important;
  }

  .oc-right{
    width:300px !important;
    max-height:calc(100svh - 218px) !important;
  }

  .oc-inspector{
    display:none !important;
  }

  .oc-bottom{
    height:96px !important;
    max-height:96px !important;
  }

  .oc-journey ol{
    grid-template-columns:repeat(9,minmax(96px,1fr)) !important;
  }

  .oc-journey li{
    height:56px !important;
  }
}

/* Small screens: no dashboard panels over the 3D scene. The Observatory becomes scene + top identity + verification strip only. */
@media (max-width:900px), (max-height:640px){
  .observatory-webgl-runtime{
    height:100svh !important;
    min-height:100svh !important;
  }

  .oc-topbar{
    height:58px !important;
    padding:0 16px !important;
  }

  .oc-hero{
    top:82px !important;
    left:16px !important;
    width:calc(100vw - 32px) !important;
  }

  .oc-hero h2{
    font-size:clamp(44px,13vw,72px) !important;
    max-width:calc(100vw - 32px) !important;
  }

  .oc-hero p{
    max-width:320px !important;
    font-size:13px !important;
  }

  .oc-left,
  .oc-right,
  .oc-inspector{
    display:none !important;
  }

  .oc-bottom{
    left:8px !important;
    right:8px !important;
    bottom:8px !important;
    height:86px !important;
    max-height:86px !important;
    overflow:hidden !important;
  }

  .oc-journey ol{
    display:flex !important;
    gap:8px !important;
    overflow-x:auto !important;
    overflow-y:hidden !important;
    scrollbar-width:none !important;
  }

  .oc-journey ol::-webkit-scrollbar{
    display:none !important;
  }

  .oc-journey li{
    flex:0 0 156px !important;
    height:54px !important;
  }
}

/* Ultra-short windows: preserve scene, show only proof strip. */
@media (max-height:540px){
  .oc-left,
  .oc-right,
  .oc-inspector,
  .oc-bottom{
    display:none !important;
  }
}

@media (max-width:780px){
  .oc-inspector{display:none}
  .oc-left{display:none}
  .oc-bottom{max-height:154px;overflow:auto}
  .oc-journey ol{grid-template-columns:1fr 1fr}
}

@media (max-width:780px){.oc-topbar nav,.oc-left,.oc-right{display:none}.oc-hero{top:90px;left:16px;right:16px}.oc-hero h2{font-size:54px}.oc-inspector{margin-top:720px}.oc-journey ol{grid-template-columns:1fr 1fr}}

.surface-fallback-root{
  max-width:1180px;
  margin:28px auto 44px;
  padding:18px;
  border:1px solid rgba(115,208,255,.14);
  border-radius:22px;
  background:linear-gradient(180deg,rgba(5,12,20,.72),rgba(3,8,14,.92));
  box-shadow:0 24px 80px rgba(0,0,0,.38);
}
.surface-fallback-root .surface-id,
.surface-fallback-root .surface-title,
.surface-fallback-root .surface-role,
.surface-fallback-root .surface-boundary,
.surface-fallback-root .divider,
.surface-fallback-root .panel{
  max-width:none;
}
.surface-fallback-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-bottom:18px;
  padding:12px 14px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  background:rgba(255,255,255,.035);
}
.surface-fallback-head span{
  color:#73d0ff;
  font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  letter-spacing:.14em;
}
.surface-fallback-head strong{
  color:#dcecff;
  font:800 13px/1.3 Inter,ui-sans-serif,system-ui,sans-serif;
}
body.vf-observatory-full .surface-fallback-root,
body[data-observatory-render-permission="FULL_OBSERVATORY"] .surface-fallback-root,
body.vf-observatory-command-dominant .surface-fallback-root{
  display:none;
}
body.vf-observatory-blocked .surface-fallback-root,
body.vf-observatory-safe .surface-fallback-root{
  display:block;
}

"""

def render(cfg, surface_sha):
    host = cfg["host"]
    host_class = cfg["hostClass"]
    role = cfg["role"]
    deploy_mode = cfg.get("deployMode", "static-root")

    adjacent = cfg.get("adjacentHosts", {})
    adjacent_rows = "\n".join(
        f"<dt>{escape(str(k))}</dt><dd><a href=\"https://{escape(str(v))}/\">{escape(str(v))}</a></dd>"
        for k, v in adjacent.items()
    )

    rules = "\n".join(f"<li>{escape(item)}</li>" for item in CLASS_RULES.get(host_class, CLASS_RULES["boundary"]))
    reading = "\n".join(f'<a class="pill" href="{escape(url)}">{escape(label)}</a>' for label, url in READING_ORDER)
    deploy_note = "Static public host." if deploy_mode == "static-root" else "Preview-only surface projection. Live host stays outside GitHub Pages."

    observatory_gate = render_observatory_gate(cfg)
    observatory_script = render_observatory_script(cfg)
    observatory_webgl_all = render_observatory_webgl(cfg)
    observatory_webgl = "" if cfg.get("observatoryFirstViewport") else observatory_webgl_all
    observatory_webgl_lead = observatory_webgl_all if cfg.get("observatoryFirstViewport") else ""
    observatory_webgl_script = render_observatory_webgl_script(cfg)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>VERIFRAX</title>
  <meta name="description" content="Canonical public entry for the VERIFRAX system. Root surface only.">
  <link rel="canonical" href="{escape(host)}/">
  <link rel="stylesheet" href="assets/surface.css">
</head>
<body>
  <main class="surface stack">
{observatory_webgl_lead}
    <section id="static-root-contract" class="surface-fallback-root" aria-label="Static VERIFRAX root contract fallback">
      <div class="surface-fallback-head">
        <span>STATIC ROOT CONTRACT</span>
        <strong>Fallback doctrine remains available below the Observatory.</strong>
      </div>
    <div class="surface-id">VERIFRAX / {escape(role)}</div>
    <h1 class="surface-title">VERIFRAX</h1>
    <p class="surface-role">Canonical public entry for the VERIFRAX system.</p>
    <p class="surface-boundary">This surface is the public root only. It presents entry and routing only. It does not issue authority, execute governed actions, verify published material, publish proof, serve archive/reference, or accept intake.</p>

    <div class="divider"></div>

    <section class="panel">
      <h2>System map</h2>
      <dl class="kv">
        {adjacent_rows}
      </dl>
    </section>

    <section class="panel">
      <h2>Root contract</h2>
      <ul class="list-tight">
        {rules}
      </ul>
    </section>

    <section class="panel">
      <h2>Host authority</h2>
      <p>Host <code>{escape(host)}</code></p>
      <p>Repository <a href="https://github.com/Verifrax/VERIFRAX-WWW">VERIFRAX-WWW</a></p>
      <p>Host class <code>{escape(host_class)}</code></p>
      <p>Projection source <code>VERIFRAX-SURFACE@{surface_sha}</code></p>
      <p>{deploy_note}</p>
    </section>

    <section class="panel">
      <h2>Reading order</h2>
      <div class="links">
        {reading}
      </div>
    </section>

    </section>

{observatory_webgl}
{observatory_gate}
  </main>
{observatory_script}{observatory_webgl_script}</body>
</html>
"""

def main():
    repo_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    cfg = read_json(repo_root / "surface.host.json")
    surface_sha = sha(repo_root / ".surface" / "vendor" / "scripts" / "project_host.py")

    shell_css = (repo_root / ".surface" / "vendor" / "shell" / "base.css").read_text(encoding="utf-8")
    tokens_css = (repo_root / ".surface" / "vendor" / "tokens" / "surface.css").read_text(encoding="utf-8")
    css = tokens_css + "\n\n" + shell_css + "\n\n" + observatory_css(cfg) + "\n\n" + observatory_webgl_css(cfg)

    out_dir = repo_root if cfg.get("deployMode") == "static-root" else repo_root / "public"
    out_dir.mkdir(parents=True, exist_ok=True)

    html = render(cfg, surface_sha)
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    (out_dir / "404.html").write_text(html, encoding="utf-8")
    ensure_asset(out_dir, css)
    print(f"ok: {cfg['role']}")


import re
# BEGIN VCO_PROJECTOR_CINEMATIC_LEVELUP
_VCO_LEVELUP_JS = '\n/* BEGIN VCO_CINEMATIC_INTERACTION_AUTHORITY */\n;(() => {\n  "use strict";\n\n  const VCO_CINEMATIC_INTERACTION_AUTHORITY = "VCO_CINEMATIC_INTERACTION_AUTHORITY";\n  const VCO_REAL3D_MATERIAL_DEPTH_PASS = "VCO_REAL3D_MATERIAL_DEPTH_PASS";\n  const VCO_CAMERA_CINEMATIC_AUTHORITY_PASS = "VCO_CAMERA_CINEMATIC_AUTHORITY_PASS";\n\n  const OBJECTS = [\n    "ACCEPTED_TRUTH",\n    "ADMISSORIUM",\n    "SYNTAGMARIUM",\n    "ORBISTIUM",\n    "CONSONORIUM",\n    "TACHYRIUM",\n    "AUCTORISEAL",\n    "CORPIFORM",\n    "VERIFRAX",\n    "ANAGNORIUM",\n    "REGRESSORIUM",\n    "WWW",\n    "API",\n    "PROOF",\n    "VERIFY",\n    "DOCS",\n    "APPLY",\n    "STATUS",\n    "ARCHIVE"\n  ];\n\n  let selectedIndex = 0;\n  let chord = "";\n\n  function normalizeObjectId(value) {\n    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");\n  }\n\n  function dispatchObjectIntent(objectId, intent = "open") {\n    const id = normalizeObjectId(objectId || OBJECTS[selectedIndex] || "ACCEPTED_TRUTH");\n    document.dispatchEvent(new CustomEvent("vco:object-intent", {\n      detail: {\n        id,\n        objectId: id,\n        intent,\n        surface: "cinematic_observatory",\n        authority: VCO_CINEMATIC_INTERACTION_AUTHORITY,\n        render_permission: "FULL_OBSERVATORY"\n      }\n    }));\n    document.dispatchEvent(new CustomEvent("vco:focus-object", {\n      detail: { id, objectId: id, intent, render_permission: "FULL_OBSERVATORY" }\n    }));\n    return id;\n  }\n\n  function closeCommandPalette() {\n    document.querySelector("[data-vco-command-palette]")?.remove();\n  }\n\n  function openCommandPalette() {\n    closeCommandPalette();\n\n    const palette = document.createElement("section");\n    palette.className = "vco-command";\n    palette.dataset.vcoCommandPalette = "true";\n    palette.setAttribute("role", "dialog");\n    palette.setAttribute("aria-label", "VERIFRAX Observatory command palette");\n\n    palette.innerHTML = `\n      <div class="vco-command-shell">\n        <div class="vco-command-head">\n          <strong>Command surface</strong>\n          <span>Ctrl/Cmd+K · / · arrows · enter · 1-9 · g r/a/h/c</span>\n          <button type="button" data-vco-close>×</button>\n        </div>\n        <input data-vco-command-input autocomplete="off" spellcheck="false" placeholder="Open ADMISSORIUM, Focus ORBISTIUM, Jump to verification…" />\n        <div class="vco-command-grid" data-vco-command-list></div>\n      </div>\n    `;\n\n    const list = palette.querySelector("[data-vco-command-list]");\n    const input = palette.querySelector("[data-vco-command-input]");\n\n    const commands = [\n      ...OBJECTS.map((id) => ({ label: `Open ${id.replaceAll("_", " ")}`, id, type: "Object" })),\n      ...["CLAIM","ADMISSIBILITY","AUTHORITY","EXECUTION","RECEIPT","VERIFICATION","RECOGNITION","RECOURSE","PERMANENCE"].map((id, index) => ({\n        label: `Open Artifact Journey stage ${index + 1}: ${id}`,\n        id: `JOURNEY_${index + 1}_${id}`,\n        type: "Artifact Journey"\n      })),\n      { label: "Show repo pillars", id: "REPOSITORIES", type: "Surface" },\n      { label: "Search repositories", id: "SEARCH_REPOSITORIES", type: "Surface" },\n      { label: "Open Accepted Truth core", id: "ACCEPTED_TRUTH", type: "Core" }\n    ];\n\n    function render() {\n      const q = input.value.trim().toLowerCase();\n      const rows = commands\n        .filter((cmd) => !q || cmd.label.toLowerCase().includes(q) || cmd.id.toLowerCase().includes(q))\n        .slice(0, 24);\n\n      list.innerHTML = rows.map((cmd, index) => `\n        <button type="button" data-vco-command-row data-object-id="${cmd.id}" class="${index === 0 ? "is-selected" : ""}">\n          <span>${cmd.label}</span>\n          <em>${cmd.type}</em>\n        </button>\n      `).join("");\n    }\n\n    palette.addEventListener("click", (event) => {\n      const close = event.target.closest("[data-vco-close]");\n      if (close) {\n        closeCommandPalette();\n        return;\n      }\n\n      const row = event.target.closest("[data-vco-command-row]");\n      if (!row) return;\n      dispatchObjectIntent(row.dataset.objectId, "open");\n      closeCommandPalette();\n    });\n\n    input.addEventListener("keydown", (event) => {\n      const rows = [...palette.querySelectorAll("[data-vco-command-row]")];\n      let current = rows.findIndex((row) => row.classList.contains("is-selected"));\n      if (current < 0) current = 0;\n\n      if (event.key === "ArrowDown" || event.key === "ArrowUp") {\n        event.preventDefault();\n        rows[current]?.classList.remove("is-selected");\n        current = event.key === "ArrowDown"\n          ? Math.min(rows.length - 1, current + 1)\n          : Math.max(0, current - 1);\n        rows[current]?.classList.add("is-selected");\n        rows[current]?.scrollIntoView({ block: "nearest" });\n      }\n\n      if (event.key === "Enter") {\n        event.preventDefault();\n        const row = rows[current];\n        if (row) dispatchObjectIntent(row.dataset.objectId, "open");\n        closeCommandPalette();\n      }\n\n      if (event.key === "Escape") {\n        event.preventDefault();\n        closeCommandPalette();\n      }\n    });\n\n    input.addEventListener("input", render);\n\n    document.body.appendChild(palette);\n    render();\n    input.focus();\n\n    document.dispatchEvent(new CustomEvent("vco:command-palette", {\n      detail: { surface: "cinematic_observatory", render_permission: "FULL_OBSERVATORY" }\n    }));\n  }\n\n  function advanceJourney(stage = null) {\n    const selected = stage || document.querySelector(".oc-journey li.is-active")?.dataset.stage || "verification";\n    document.dispatchEvent(new CustomEvent("vco:artifact-journey-advance", {\n      detail: {\n        stage: selected,\n        surface: "cinematic_observatory",\n        state: "alive",\n        render_permission: "FULL_OBSERVATORY"\n      }\n    }));\n  }\n\n  document.addEventListener("keydown", (event) => {\n    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") || event.target?.isContentEditable;\n\n    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {\n      event.preventDefault();\n      openCommandPalette();\n      return;\n    }\n\n    if (!typing && event.key === "/") {\n      event.preventDefault();\n      openCommandPalette();\n      return;\n    }\n\n    if (event.key === "Escape") {\n      closeCommandPalette();\n      document.dispatchEvent(new CustomEvent("vco:panel-close", { detail: { reason: "escape" } }));\n      return;\n    }\n\n    if (!typing && (event.key === "ArrowRight" || event.key === "ArrowDown")) {\n      event.preventDefault();\n      selectedIndex = (selectedIndex + 1) % OBJECTS.length;\n      dispatchObjectIntent(OBJECTS[selectedIndex], "focus");\n      return;\n    }\n\n    if (!typing && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {\n      event.preventDefault();\n      selectedIndex = (selectedIndex - 1 + OBJECTS.length) % OBJECTS.length;\n      dispatchObjectIntent(OBJECTS[selectedIndex], "focus");\n      return;\n    }\n\n    if (!typing && event.key === "Enter") {\n      event.preventDefault();\n      dispatchObjectIntent(OBJECTS[selectedIndex], "open");\n      return;\n    }\n\n    if (!typing && /^[1-9]$/.test(event.key)) {\n      event.preventDefault();\n      const chambers = OBJECTS.slice(2, 11);\n      dispatchObjectIntent(chambers[Number(event.key) - 1], "open");\n      return;\n    }\n\n    if (!typing && event.key.toLowerCase() === "g") {\n      chord = "g";\n      window.setTimeout(() => { chord = ""; }, 900);\n      return;\n    }\n\n    if (!typing && chord === "g") {\n      const key = event.key.toLowerCase();\n      chord = "";\n      if (key === "r") dispatchObjectIntent("REPOSITORIES", "open");\n      if (key === "a") advanceJourney("claim");\n      if (key === "h") dispatchObjectIntent("HOST_BOUNDARY_GATES", "open");\n      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");\n    }\n  }, true);\n\n  document.addEventListener("pointerdown", (event) => {\n    const target = event.target.closest?.("[data-object-id],[data-repo-id],[data-chamber-id],[data-journey-stage]");\n    if (!target) return;\n    const id = target.dataset.objectId || target.dataset.repoId || target.dataset.chamberId || target.dataset.journeyStage;\n    if (!id) return;\n    dispatchObjectIntent(id, "open");\n  }, true);\n\n  window.VCO_OBSERVATORY_INTERACTION_AUTHORITY = Object.freeze({\n    marker: VCO_CINEMATIC_INTERACTION_AUTHORITY,\n    material: VCO_REAL3D_MATERIAL_DEPTH_PASS,\n    camera: VCO_CAMERA_CINEMATIC_AUTHORITY_PASS,\n    openCommandPalette,\n    dispatchObjectIntent,\n    advanceJourney\n  });\n})();\n/* END VCO_CINEMATIC_INTERACTION_AUTHORITY */\n'
_VCO_LEVELUP_CSS = '\n/* BEGIN VCO CINEMATIC COMMAND KEYBOARD CLICK AUTHORITY */\n.vco-command{\n  position:fixed;\n  inset:0;\n  z-index:9999;\n  display:grid;\n  place-items:start center;\n  padding-top:8vh;\n  background:rgba(1,5,10,.58);\n  backdrop-filter:blur(18px) saturate(1.2);\n}\n.vco-command-shell{\n  width:min(760px,calc(100vw - 32px));\n  border:1px solid rgba(126,207,255,.34);\n  border-radius:22px;\n  background:linear-gradient(180deg,rgba(8,16,28,.96),rgba(3,8,14,.94));\n  box-shadow:0 28px 90px rgba(0,0,0,.58),0 0 80px rgba(70,170,255,.12);\n  overflow:hidden;\n}\n.vco-command-head{\n  display:flex;\n  align-items:center;\n  gap:14px;\n  padding:14px 16px;\n  border-bottom:1px solid rgba(126,207,255,.18);\n  color:#eaf6ff;\n}\n.vco-command-head strong{\n  font:900 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;\n  text-transform:uppercase;\n  letter-spacing:.12em;\n}\n.vco-command-head span{\n  flex:1;\n  color:#8ea9bd;\n  font:800 11px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;\n}\n.vco-command-head button{\n  border:1px solid rgba(126,207,255,.24);\n  border-radius:10px;\n  color:#dff5ff;\n  background:rgba(255,255,255,.05);\n}\n.vco-command input{\n  width:100%;\n  box-sizing:border-box;\n  padding:18px 20px;\n  border:0;\n  border-bottom:1px solid rgba(126,207,255,.16);\n  outline:0;\n  background:rgba(4,12,20,.86);\n  color:#f4fbff;\n  font:900 18px/1.2 ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;\n}\n.vco-command-grid{\n  display:grid;\n  gap:8px;\n  max-height:min(58vh,560px);\n  overflow:auto;\n  padding:12px;\n}\n.vco-command-grid button{\n  display:grid;\n  grid-template-columns:1fr auto;\n  gap:16px;\n  align-items:center;\n  min-height:46px;\n  padding:12px 14px;\n  border:1px solid rgba(126,207,255,.14);\n  border-radius:14px;\n  background:rgba(255,255,255,.035);\n  color:#eaf6ff;\n  text-align:left;\n}\n.vco-command-grid button.is-selected,\n.vco-command-grid button:hover{\n  border-color:rgba(126,207,255,.62);\n  background:linear-gradient(90deg,rgba(38,132,210,.22),rgba(255,255,255,.045));\n  box-shadow:inset 0 0 22px rgba(93,190,255,.08);\n}\n.vco-command-grid span{\n  font:900 13px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;\n}\n.vco-command-grid em{\n  color:#72d3ff;\n  font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;\n  font-style:normal;\n  text-transform:uppercase;\n  letter-spacing:.08em;\n}\n.oc-journey li{\n  cursor:pointer;\n  transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease;\n}\n.oc-journey li:hover,\n.oc-journey li:focus-within,\n.oc-journey li.is-active{\n  transform:translateY(-2px);\n  border-color:rgba(120,212,255,.5);\n  background:linear-gradient(180deg,rgba(38,132,210,.15),rgba(255,255,255,.04));\n  box-shadow:0 0 28px rgba(82,180,255,.13);\n}\n.observatory-webgl-runtime canvas{\n  cursor:crosshair;\n}\n/* END VCO CINEMATIC COMMAND KEYBOARD CLICK AUTHORITY */\n'

from pathlib import Path as _VCOPath
_VCO_ORIGINAL_WRITE_TEXT = _VCOPath.write_text

def _vco_levelup_write_text(self, data, *args, **kwargs):
    path = self.as_posix()
    if path.endswith("assets/observatory-webgl-runtime.js"):
        data = data.replace("VCO_TERMINAL_VISUAL_AUTHORITY_REPAIR", "")
        data = re.sub(r"/\* BEGIN VCO_CINEMATIC_INTERACTION_AUTHORITY \*/[\s\S]*?/\* END VCO_CINEMATIC_INTERACTION_AUTHORITY \*/", "", data)
        data = data.rstrip() + "\n\n" + _VCO_LEVELUP_JS.strip() + "\n"
    if path.endswith("assets/surface.css"):
        data = data.replace("VCO_TERMINAL_VISUAL_AUTHORITY_REPAIR", "")
        data = re.sub(r"/\* BEGIN VCO CINEMATIC COMMAND KEYBOARD CLICK AUTHORITY \*/[\s\S]*?/\* END VCO CINEMATIC COMMAND KEYBOARD CLICK AUTHORITY \*/", "", data)
        data = data.rstrip() + "\n\n" + _VCO_LEVELUP_CSS.strip() + "\n"
    return _VCO_ORIGINAL_WRITE_TEXT(self, data, *args, **kwargs)

_VCOPath.write_text = _vco_levelup_write_text
# END VCO_PROJECTOR_CINEMATIC_LEVELUP


def _vco_deep_repair_css_block():
    return r"""
/* BEGIN VCO OBSERVATORY DEEP REPAIR REAL3D COMMAND AUTHORITY */
:root{
  --vco-topbar-h:76px;
  --vco-bottom-rail-h:128px;
  --vco-blue:#78d9ff;
  --vco-green:#a9ffd2;
  --vco-line:rgba(127,210,255,.28);
  --vco-line-strong:rgba(162,229,255,.54);
}
html,body{margin:0;min-height:100%;overflow-x:hidden;background:#02060a;color:#edf7ff}
.oc-topbar{
  position:sticky!important;top:0!important;z-index:80!important;min-height:var(--vco-topbar-h)!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 26px!important;
  background:linear-gradient(180deg,rgba(1,5,10,.98),rgba(1,5,10,.82))!important;
  border-bottom:1px solid rgba(127,210,255,.18)!important;backdrop-filter:blur(16px) saturate(1.2)!important
}
.oc-topbar nav{display:flex!important;gap:10px!important;flex-wrap:wrap!important;justify-content:flex-end!important}
.oc-topbar a{
  display:inline-flex!important;align-items:center!important;min-height:34px!important;padding:0 15px!important;border-radius:12px!important;
  border:1px solid rgba(127,210,255,.34)!important;background:rgba(12,27,43,.76)!important;color:#eef7ff!important;text-decoration:none!important;font-weight:850!important
}
.observatory-webgl-runtime{
  position:relative!important;width:100vw!important;height:calc(100vh - var(--vco-topbar-h))!important;min-height:780px!important;
  overflow:hidden!important;isolation:isolate!important;background:#02060a!important
}
.observatory-webgl-runtime canvas{
  position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;z-index:1!important;
  filter:contrast(1.1) saturate(1.08) brightness(.98)!important
}
.oc-hero{
  position:absolute!important;z-index:14!important;top:clamp(30px,5vh,72px)!important;left:28px!important;width:min(520px,38vw)!important;
  pointer-events:none!important;text-shadow:0 10px 34px rgba(0,0,0,.78)!important
}
.oc-hero h2{margin:10px 0 12px!important;font-size:clamp(72px,7.6vw,142px)!important;line-height:.82!important;letter-spacing:-.08em!important;color:#fff!important}
.oc-hero p{max-width:460px!important;font-size:clamp(15px,1.12vw,20px)!important;line-height:1.35!important;font-weight:850!important}
.oc-left{
  position:absolute!important;z-index:16!important;left:28px!important;bottom:calc(var(--vco-bottom-rail-h) + 28px)!important;
  width:min(360px,22vw)!important;display:grid!important;gap:12px!important;max-height:42vh!important;overflow:hidden!important
}
.oc-right{
  position:absolute!important;z-index:17!important;right:28px!important;top:calc(var(--vco-topbar-h) + 30px)!important;
  width:min(370px,23vw)!important;max-height:calc(100vh - var(--vco-topbar-h) - var(--vco-bottom-rail-h) - 70px)!important;
  overflow:auto!important;display:grid!important;gap:12px!important;scrollbar-width:thin!important
}
.oc-panel,.oc-left>*,.oc-right>*,.oc-inspector,.vco-deep-inspector,.vco-command-shell{
  border:1px solid var(--vco-line)!important;border-radius:18px!important;
  background:linear-gradient(180deg,rgba(10,20,32,.88),rgba(4,9,16,.84))!important;
  box-shadow:0 24px 70px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.05)!important;
  backdrop-filter:blur(14px) saturate(1.16)!important
}
.oc-journey{
  position:absolute!important;z-index:24!important;left:18px!important;right:18px!important;bottom:18px!important;
  min-height:96px!important;max-height:128px!important;padding:14px 16px!important;border:1px solid var(--vco-line-strong)!important;
  border-radius:20px!important;background:linear-gradient(180deg,rgba(5,12,20,.94),rgba(3,8,14,.90))!important;
  box-shadow:0 -18px 70px rgba(0,0,0,.56),inset 0 1px 0 rgba(255,255,255,.05)!important;overflow:hidden!important
}
.oc-journey ol,[data-journey-list]{display:grid!important;grid-template-columns:repeat(9,minmax(96px,1fr))!important;gap:10px!important;margin:0!important;padding:0!important;list-style:none!important}
.oc-journey li{
  position:relative!important;min-height:58px!important;padding:11px 12px!important;border:1px solid rgba(127,210,255,.18)!important;
  border-radius:14px!important;background:linear-gradient(180deg,rgba(12,22,34,.86),rgba(5,10,17,.80))!important;color:#e9f6ff!important;
  cursor:pointer!important;overflow:hidden!important
}
.oc-journey li::after{
  content:""!important;position:absolute!important;left:-50%!important;top:0!important;width:42%!important;height:100%!important;
  background:linear-gradient(90deg,transparent,rgba(119,218,255,.22),transparent)!important;animation:vcoJourneySweep 5.2s linear infinite!important
}
.oc-journey li.is-active{border-color:rgba(153,236,255,.76)!important;box-shadow:0 0 0 1px rgba(153,236,255,.22),0 0 32px rgba(62,183,255,.25)!important}
@keyframes vcoJourneySweep{0%{transform:translateX(0)}100%{transform:translateX(360%)}}
.vco-deep-inspector{
  position:fixed!important;z-index:120!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%) scale(.98)!important;
  width:min(620px,calc(100vw - 42px))!important;max-height:min(620px,calc(100vh - 110px))!important;padding:22px!important;
  opacity:0!important;pointer-events:none!important;overflow:auto!important;transition:opacity .16s ease,transform .16s ease!important
}
.vco-deep-inspector.is-open{opacity:1!important;pointer-events:auto!important;transform:translate(-50%,-50%) scale(1)!important}
.vco-deep-close{
  position:absolute!important;right:14px!important;top:12px!important;width:34px!important;height:34px!important;border-radius:999px!important;
  border:1px solid rgba(127,210,255,.28)!important;background:rgba(8,17,28,.88)!important;color:#fff!important;cursor:pointer!important
}
.vco-deep-kicker{color:var(--vco-blue)!important;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;letter-spacing:.12em!important}
.vco-deep-inspector h3{margin:8px 44px 6px 0!important;font-size:30px!important;line-height:1!important}
.vco-deep-badge{
  padding:10px 12px!important;border:1px solid rgba(169,255,210,.22)!important;border-radius:12px!important;
  background:rgba(13,40,32,.42)!important;color:var(--vco-green)!important;font:900 12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important
}
.vco-deep-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:18px!important;margin-top:18px!important}
.vco-command-palette{
  position:fixed!important;inset:0!important;z-index:140!important;display:grid!important;place-items:start center!important;padding-top:12vh!important;
  background:rgba(0,4,8,.48)!important;opacity:0!important;pointer-events:none!important;backdrop-filter:blur(5px)!important;transition:opacity .14s ease!important
}
.vco-command-palette.is-open{opacity:1!important;pointer-events:auto!important}
.vco-command-shell{width:min(760px,calc(100vw - 40px))!important;padding:14px!important}
.vco-command-input{
  width:100%!important;box-sizing:border-box!important;padding:16px 18px!important;border:1px solid rgba(127,210,255,.34)!important;
  border-radius:14px!important;outline:none!important;background:rgba(1,7,13,.96)!important;color:#fff!important;
  font:900 18px/1.2 ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif!important
}
.vco-command-list{display:grid!important;gap:8px!important;margin-top:12px!important;max-height:52vh!important;overflow:auto!important}
.vco-command-row{
  display:flex!important;justify-content:space-between!important;align-items:center!important;gap:18px!important;padding:13px 14px!important;
  border:1px solid rgba(127,210,255,.16)!important;border-radius:12px!important;background:rgba(8,16,26,.78)!important;color:#eaf7ff!important;
  cursor:pointer!important;text-align:left!important
}
.vco-command-row.is-active,.vco-command-row:hover{border-color:rgba(133,219,255,.68)!important;background:rgba(15,39,58,.88)!important}
.vco-command-row em{color:var(--vco-blue)!important;font-style:normal!important;font:900 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;text-transform:uppercase!important}
@media (max-width:1280px){.oc-right{width:330px!important}.oc-left{width:300px!important}.oc-hero{width:420px!important}.oc-hero h2{font-size:72px!important}}
@media (max-width:980px){
  .observatory-webgl-runtime{min-height:820px!important}
  .oc-right,.oc-left{display:none!important}
  .oc-hero{top:28px!important;left:18px!important;right:18px!important;width:auto!important}
  .oc-hero h2{font-size:clamp(56px,15vw,88px)!important}
  .oc-journey{left:8px!important;right:8px!important;bottom:8px!important;overflow:auto!important}
  .oc-journey ol,[data-journey-list]{display:flex!important;min-width:900px!important}
  .vco-deep-grid{grid-template-columns:1fr!important}
}
/* END VCO OBSERVATORY DEEP REPAIR REAL3D COMMAND AUTHORITY */
"""

def _vco_deep_repair_css(css):
    import re
    css = re.sub(r"/\* BEGIN VCO OBSERVATORY DEEP REPAIR REAL3D COMMAND AUTHORITY \*/[\s\S]*?/\* END VCO OBSERVATORY DEEP REPAIR REAL3D COMMAND AUTHORITY \*/", "", css)
    return css.rstrip() + "\n\n" + _vco_deep_repair_css_block() + "\n"


if __name__ == "__main__":
    main()
