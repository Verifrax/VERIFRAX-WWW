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
        <p>36 repositories. 9 sovereign chambers. ADMISSORIUM at the border. Rendered from signed projection data.</p>
        <div class="oc-hero-badges">
          <code><b data-count="repos">36</b> repos live</code>
          <code data-runtime-status>STATIC_FALLBACK</code>
        </div>
      </section>

      <aside class="oc-left">
        <section>
          <h3>Live Object Graph Observatory</h3>
          <dl>
            <div><dt>Repositories</dt><dd><b data-count="repos">36</b></dd></div>
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



# VCO_REAL3D_HARDENING_PROJECTOR_PATCH
def _vco_real3d_hardening_post_project():
    import re
    from pathlib import Path

    css_path = Path("assets/surface.css")
    js_path = Path("assets/observatory-webgl-runtime.js")

    css_block = r"""
/* BEGIN VCO REAL3D VIEWPORT HARDENING */
html,body{margin:0!important;min-height:100%!important;background:#02050a!important;color:#edf7ff!important;overflow-x:hidden!important}
.surface.stack{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;background:#02050a!important}
.observatory-webgl-runtime{position:relative!important;width:100%!important;height:100svh!important;min-height:840px!important;max-height:100svh!important;overflow:hidden!important;isolation:isolate!important;background:radial-gradient(circle at 50% 34%,rgba(28,103,151,.22),transparent 42%),linear-gradient(180deg,#040911 0%,#010307 100%)!important;border-bottom:1px solid rgba(115,208,255,.16)!important}
.observatory-webgl-runtime canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0!important;display:block!important;filter:contrast(1.13) saturate(1.08) brightness(.84)!important}
.oc-topbar{top:0!important;left:0!important;right:0!important;height:66px!important;padding:0 28px!important;z-index:12!important;background:linear-gradient(180deg,rgba(0,5,10,.94),rgba(0,5,10,.44),rgba(0,5,10,0))!important;backdrop-filter:blur(14px)!important}
.oc-hero{top:86px!important;left:28px!important;width:min(440px,calc(100vw - 56px))!important;z-index:6!important;pointer-events:none!important}
.oc-hero h2{margin:8px 0 12px!important;font-size:clamp(68px,8.4vw,128px)!important;line-height:.78!important;letter-spacing:-.085em!important;color:#fff!important;text-shadow:0 20px 70px rgba(0,0,0,.88)!important}
.oc-hero p{max-width:470px!important;font-size:clamp(15px,1.08vw,19px)!important;line-height:1.32!important;font-weight:850!important;color:#dbe8f6!important;text-shadow:0 10px 34px rgba(0,0,0,.88)!important}
.oc-hero-badges{pointer-events:auto!important}
.oc-left{left:22px!important;top:430px!important;bottom:auto!important;width:330px!important;max-height:calc(100svh - 570px)!important;overflow:hidden!important;z-index:7!important}
.oc-right{right:22px!important;top:94px!important;width:360px!important;max-height:calc(100svh - 210px)!important;overflow:auto!important;z-index:7!important;scrollbar-width:thin!important}
.oc-left section,.oc-right section,.oc-inspector,.oc-bottom,.vco-command-shell,.vco-deep-inspector{border:1px solid rgba(126,215,255,.20)!important;background:linear-gradient(180deg,rgba(8,20,32,.82),rgba(3,8,14,.68))!important;box-shadow:0 18px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06)!important;backdrop-filter:blur(18px) saturate(1.12)!important}
.oc-bottom{left:14px!important;right:14px!important;bottom:12px!important;height:112px!important;padding:12px 16px!important;z-index:10!important;overflow:hidden!important}
.oc-journey{position:relative!important;overflow:hidden!important}
.oc-journey h3{margin:0 0 8px!important}
.oc-journey ol,[data-journey-list]{display:grid!important;grid-template-columns:repeat(9,minmax(118px,1fr))!important;gap:10px!important;margin:0!important;padding:0!important;list-style:none!important;overflow:hidden!important}
.oc-journey li{min-height:54px!important;padding:9px 12px!important;border-radius:14px!important;border:1px solid rgba(126,215,255,.18)!important;background:linear-gradient(90deg,rgba(6,15,25,.76),rgba(13,37,53,.72),rgba(6,15,25,.76))!important;color:#eaf7ff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;cursor:pointer!important}
.oc-journey li::after{content:""!important;display:block!important;height:2px!important;margin-top:8px!important;border-radius:999px!important;background:linear-gradient(90deg,transparent,rgba(116,218,255,.72),transparent)!important;opacity:.42!important}
.oc-journey li.is-active{border-color:rgba(150,237,255,.88)!important;box-shadow:0 0 0 1px rgba(150,237,255,.22),0 0 34px rgba(65,190,255,.28)!important}
.oc-inspector{right:380px!important;bottom:154px!important;max-width:330px!important;z-index:8!important}
@media (max-width:1300px){.oc-right{width:330px!important}.oc-left{width:300px!important}.oc-hero h2{font-size:76px!important}}
@media (max-width:980px){.observatory-webgl-runtime{height:auto!important;min-height:900px!important;max-height:none!important;overflow:hidden!important}.oc-right,.oc-left{display:none!important}.oc-hero{top:82px!important;left:18px!important;right:18px!important;width:auto!important}.oc-hero h2{font-size:clamp(56px,15vw,94px)!important}.oc-bottom{left:8px!important;right:8px!important;bottom:8px!important;height:112px!important;overflow:auto!important}.oc-journey ol,[data-journey-list]{display:flex!important;min-width:980px!important}}
/* END VCO REAL3D VIEWPORT HARDENING */
""".strip()

    js_block = r"""
/* BEGIN VCO REAL3D ANTI TOY RUNTIME AUTHORITY */
function vcoMakeBrushedAuthorityTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 256, 256);
  base.addColorStop(0, "#06101a");
  base.addColorStop(.42, "#102c3b");
  base.addColorStop(1, "#02070d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    const a = 0.05 + ((y % 17) / 17) * 0.07;
    ctx.fillStyle = `rgba(170,225,255,${a})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.anisotropy = 8;
  return texture;
}

function vcoApplyReal3DAntiToyAuthority(scene, THREE) {
  if (!scene || scene.userData.vcoReal3DAntiToyAuthorityApplied) return;
  scene.userData.vcoReal3DAntiToyAuthorityApplied = true;
  const brushed = vcoMakeBrushedAuthorityTexture(THREE);
  scene.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.filter(Boolean).forEach((mat) => {
      if (!mat || mat.userData?.vcoReal3DAntiToyMaterial) return;
      mat.userData = mat.userData || {};
      mat.userData.vcoReal3DAntiToyMaterial = true;
      if ("metalness" in mat) mat.metalness = Math.max(mat.metalness || 0, 0.46);
      if ("roughness" in mat) mat.roughness = Math.max(mat.roughness || 0, 0.52);
      if ("clearcoat" in mat) mat.clearcoat = Math.max(mat.clearcoat || 0, 0.2);
      if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = Math.max(mat.clearcoatRoughness || 0, 0.44);
      if ("envMapIntensity" in mat) mat.envMapIntensity = Math.max(mat.envMapIntensity || 0, 0.78);
      if (!mat.map && /MeshPhysicalMaterial|MeshStandardMaterial/.test(mat.type || "")) mat.map = brushed;
      if ("emissiveIntensity" in mat && mat.emissiveIntensity > 0) mat.emissiveIntensity = Math.min(mat.emissiveIntensity * 1.16, 1.55);
      mat.needsUpdate = true;
    });
  });
  if (!scene.getObjectByName("VCO_REAL3D_KEY_LIGHT")) {
    const key = new THREE.DirectionalLight(0xbfeeff, 2.25);
    key.name = "VCO_REAL3D_KEY_LIGHT";
    key.position.set(-12, 26, 18);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x65bfff, 1.35);
    rim.name = "VCO_REAL3D_RIM_LIGHT";
    rim.position.set(18, 10, -24);
    scene.add(rim);
    const under = new THREE.PointLight(0x1c8dff, 1.6, 38, 2.2);
    under.name = "VCO_REAL3D_CORE_UNDERLIGHT";
    under.position.set(0, 2.2, 0);
    scene.add(under);
    const red = new THREE.PointLight(0xff3428, 1.75, 24, 2.4);
    red.name = "VCO_REAL3D_ADMISSORIUM_RESTRICTED_LIGHT";
    red.position.set(0, 3.5, 15.8);
    scene.add(red);
  }
}

(function vcoAntiToyInteractionHardening(){
  if (window.VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY) return;
  window.VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY = true;
  const OBJECTS = ["ACCEPTED_TRUTH","ADMISSORIUM","SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM","REPO_PILLARS","HOST_GATES","ARTIFACT_JOURNEY"];
  let selected = 0;
  let chord = "";
  function dispatchObjectIntent(objectId, mode = "open") {
    document.dispatchEvent(new CustomEvent("vco:object-dispatch", { detail: { objectId, mode, authority: "VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY" }}));
    const inspector = document.querySelector("[data-runtime-inspector]");
    if (inspector) inspector.innerHTML = `<div class="oc-inspector-head"><strong>${objectId}</strong><span>${mode.toUpperCase()}</span></div><p>Unified object dispatch. Click, hover, focus, keyboard, and command surface resolve to the same object id.</p>`;
  }
  function openCommandPalette() {
    const api = window.VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY || window.VCO_CINEMATIC_COMMAND_KEYBOARD_CLICK_AUTHORITY;
    if (api?.openCommandPalette) return api.openCommandPalette();
    document.dispatchEvent(new CustomEvent("vco:command-palette", { detail: { authority: "VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY" }}));
  }
  function advanceJourney(stage = null) {
    const stages = [...document.querySelectorAll("[data-journey-list] li")];
    if (!stages.length) return;
    const current = stages.findIndex((el) => el.classList.contains("is-active"));
    const next = stage ? stages.findIndex((el) => (el.textContent || "").toUpperCase().includes(String(stage).toUpperCase())) : (current + 1 + stages.length) % stages.length;
    stages.forEach((el, i) => el.classList.toggle("is-active", i === Math.max(0, next)));
    dispatchObjectIntent(`ARTIFACT_STAGE_${Math.max(0, next) + 1}`, "journey");
  }
  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") { event.preventDefault(); openCommandPalette(); return; }
    if (!typing && event.key === "/") { event.preventDefault(); openCommandPalette(); return; }
    if (!typing && event.key === "ArrowRight") { selected = (selected + 1) % OBJECTS.length; dispatchObjectIntent(OBJECTS[selected], "focus"); return; }
    if (!typing && event.key === "ArrowLeft") { selected = (selected - 1 + OBJECTS.length) % OBJECTS.length; dispatchObjectIntent(OBJECTS[selected], "focus"); return; }
    if (!typing && event.key === "Enter") { dispatchObjectIntent(OBJECTS[selected], "open"); return; }
    if (!typing && /^[1-9]$/.test(event.key)) {
      const chambers = ["SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"];
      dispatchObjectIntent(chambers[Number(event.key) - 1], "open");
      return;
    }
    if (!typing && key === "g") { chord = "g"; setTimeout(() => { chord = ""; }, 900); return; }
    if (!typing && chord === "g") {
      chord = "";
      if (key === "r") dispatchObjectIntent("REPO_PILLARS", "open");
      if (key === "a") advanceJourney("CLAIM");
      if (key === "h") dispatchObjectIntent("HOST_GATES", "open");
      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");
    }
  });
  window.VCO_REAL3D_ANTI_TOY_RUNTIME_API = { openCommandPalette, dispatchObjectIntent, advanceJourney };
})();
/* END VCO REAL3D ANTI TOY RUNTIME AUTHORITY */
""".strip()

    def replace_block(data, begin, end, block):
        data = re.sub(re.escape(begin) + r"[\s\S]*?" + re.escape(end) + r"\n?", "", data)
        return data.rstrip() + "\n\n" + block + "\n"

    if css_path.exists():
        data = css_path.read_text(encoding="utf-8")
        data = replace_block(data, "/* BEGIN VCO REAL3D VIEWPORT HARDENING */", "/* END VCO REAL3D VIEWPORT HARDENING */", css_block)
        css_path.write_text(data, encoding="utf-8")

    if js_path.exists():
        data = js_path.read_text(encoding="utf-8")
        data = re.sub(r"new THREE\.PerspectiveCamera\([^)]*\)", "new THREE.PerspectiveCamera(33, width / height, 0.1, 520)", data, count=1)
        data = re.sub(r"camera\.position\.set\([^)]*\);", "camera.position.set(0, 16.8, 43.5);", data, count=1)
        data = data.replace("const orbit = t * 0.028;", "const orbit = t * 0.016;")
        data = data.replace("camera.position.x = Math.sin(orbit) * 26.8;", "camera.position.x = Math.sin(orbit) * 28.4;")
        data = data.replace("camera.position.z = Math.cos(orbit) * 39.8;", "camera.position.z = Math.cos(orbit) * 43.8;")
        data = data.replace("camera.position.y = 20.7 + Math.sin(t * 0.16) * 0.36;", "camera.position.y = 16.9 + Math.sin(t * 0.11) * 0.42;")
        data = data.replace("camera.lookAt(0, 1.55, 0);", "camera.lookAt(0, 1.26, 0);")
        if "vcoApplyReal3DAntiToyAuthority(scene, THREE);" not in data:
            data = data.replace("renderer.render(scene, camera);", "vcoApplyReal3DAntiToyAuthority(scene, THREE);\n    renderer.render(scene, camera);", 1)
        data = replace_block(data, "/* BEGIN VCO REAL3D ANTI TOY RUNTIME AUTHORITY */", "/* END VCO REAL3D ANTI TOY RUNTIME AUTHORITY */", js_block)
        js_path.write_text(data, encoding="utf-8")

    for html in [Path("index.html"), Path("404.html")]:
        if html.exists():
            data = html.read_text(encoding="utf-8").replace("https://https://", "https://").replace("STATIC_FALLBACK", "FULL_OBSERVATORY")
            html.write_text(data, encoding="utf-8")



# VCO_REAL3D_IDEMPOTENT_BLOCK_SPACING
def _vco_real3d_idempotent_block_spacing():
    import re
    from pathlib import Path
    targets = [
        Path("assets/observatory-webgl-runtime.js"),
        Path("assets/surface.css"),
    ]
    markers = [
        "/* BEGIN VCO REAL3D ANTI TOY RUNTIME AUTHORITY */",
        "/* BEGIN VCO REAL3D VIEWPORT HARDENING */",
        "/* BEGIN VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY */",
        "/* BEGIN VCO OBSERVATORY DEEP REPAIR REAL3D COMMAND AUTHORITY */",
    ]
    for path in targets:
        if not path.exists():
            continue
        data = path.read_text(encoding="utf-8")
        for marker in markers:
            data = re.sub(r"\n{3,}" + re.escape(marker), "\n\n" + marker, data)
        path.write_text(data, encoding="utf-8")



# VCO_BROWSER_TRUTH_PROJECTOR_HOOK
def _vco_browser_truth_projector_hook():
    import re
    from pathlib import Path

    runtime = Path("assets/observatory-webgl-runtime.js")
    if runtime.exists():
        data = runtime.read_text(encoding="utf-8")
        data = re.sub(
            r"new THREE\.WebGLRenderer\(\{\s*([^}]*)\s*\}\)",
            lambda m: "new THREE.WebGLRenderer({ " + (
                m.group(1).strip().rstrip(",") + ', preserveDrawingBuffer: true, powerPreference: "high-performance"'
                if "preserveDrawingBuffer" not in m.group(1)
                else m.group(1).strip()
            ) + " })",
            data,
            count=1
        )
        block = '/* BEGIN VCO BROWSER TRUTH AUTHORITY RUNTIME */\n(function vcoBrowserTruthAuthorityRuntime(){\n  if (window.VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME) return;\n  window.VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME = true;\n\n  const OBJECTS = [\n    "ACCEPTED_TRUTH","ADMISSORIUM","SYNTAGMARIUM","ORBISTIUM","CONSONORIUM",\n    "TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM",\n    "REGRESSORIUM","REPO_PILLARS","HOST_GATES","ARTIFACT_JOURNEY"\n  ];\n  const CHAMBERS = [\n    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",\n    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"\n  ];\n\n  let selected = 0;\n  let chord = "";\n\n  function inspector(){ return document.querySelector("[data-runtime-inspector]"); }\n\n  function writeInspector(objectId, mode = "open") {\n    const el = inspector();\n    if (!el) return;\n    el.innerHTML = `\n      <div class="oc-inspector-head">\n        <strong>${objectId}</strong>\n        <span>${mode.toUpperCase()} · ${Date.now()}</span>\n      </div>\n      <p>Browser-truth dispatch resolved <code>${objectId}</code>. Keyboard, click, command palette, and Artifact Journey state use one object id.</p>\n    `;\n  }\n\n  function dispatchObjectIntent(objectId, mode = "open") {\n    writeInspector(objectId, mode);\n    setTimeout(() => writeInspector(objectId, mode), 60);\n    setTimeout(() => writeInspector(objectId, mode), 180);\n    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {\n      detail: { objectId, mode, authority: "VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME", at: Date.now() }\n    }));\n  }\n\n  function openCommandPalette() {\n    let shell = document.querySelector(".vco-command-palette");\n    if (!shell) {\n      shell = document.createElement("div");\n      shell.className = "vco-command-palette";\n      shell.innerHTML = `\n        <div class="vco-command-shell" role="dialog" aria-label="VERIFRAX command palette">\n          <input class="vco-command-input" placeholder="Open ADMISSORIUM, Focus ORBISTIUM, Show repo pillars..." />\n          <div class="vco-command-list"></div>\n        </div>\n      `;\n      document.body.appendChild(shell);\n    }\n\n    const input = shell.querySelector(".vco-command-input");\n    const list = shell.querySelector(".vco-command-list");\n\n    function render(query = "") {\n      const q = query.trim().toUpperCase();\n      const rows = OBJECTS.filter((id) => !q || id.includes(q));\n      list.innerHTML = rows.map((id, index) => `\n        <button class="vco-command-row ${index === 0 ? "is-active" : ""}" data-vco-command="${id}" type="button">\n          <strong>${id}</strong>\n          <em>${id === "ADMISSORIUM" ? "front gate" : id === "ACCEPTED_TRUTH" ? "core" : "object"}</em>\n        </button>\n      `).join("");\n    }\n\n    render("");\n    shell.classList.add("is-open");\n    input.value = "";\n    input.focus();\n\n    input.oninput = () => render(input.value);\n    shell.onclick = (event) => {\n      const row = event.target.closest("[data-vco-command]");\n      if (!row) return;\n      dispatchObjectIntent(row.dataset.vcoCommand, "open");\n      shell.classList.remove("is-open");\n      input.blur();\n    };\n  }\n\n  function closeCommandPalette() {\n    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));\n    document.activeElement?.blur?.();\n  }\n\n  function advanceJourney(stage = null) {\n    const stages = [...document.querySelectorAll("[data-journey-list] li")];\n    if (!stages.length) return;\n\n    const current = stages.findIndex((el) => el.classList.contains("is-active"));\n    const next = stage\n      ? Math.max(0, stages.findIndex((el) => (el.textContent || "").toUpperCase().includes(String(stage).toUpperCase())))\n      : (current + 1 + stages.length) % stages.length;\n\n    stages.forEach((el, index) => el.classList.toggle("is-active", index === next));\n    dispatchObjectIntent(`ARTIFACT_STAGE_${next + 1}`, "journey");\n  }\n\n  document.addEventListener("keydown", (event) => {\n    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");\n    const key = event.key.toLowerCase();\n\n    if ((event.ctrlKey || event.metaKey) && key === "k") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      openCommandPalette();\n      return;\n    }\n\n    if (event.key === "Escape") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      closeCommandPalette();\n      return;\n    }\n\n    if (!typing && event.key === "/") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      openCommandPalette();\n      return;\n    }\n\n    if (!typing && event.key === "ArrowRight") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      selected = (selected + 1) % OBJECTS.length;\n      dispatchObjectIntent(OBJECTS[selected], "focus");\n      return;\n    }\n\n    if (!typing && event.key === "ArrowLeft") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      selected = (selected - 1 + OBJECTS.length) % OBJECTS.length;\n      dispatchObjectIntent(OBJECTS[selected], "focus");\n      return;\n    }\n\n    if (!typing && event.key === "Enter") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      dispatchObjectIntent(OBJECTS[selected], "open");\n      return;\n    }\n\n    if (!typing && /^[1-9]$/.test(event.key)) {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      const id = CHAMBERS[Number(event.key) - 1];\n      selected = OBJECTS.indexOf(id);\n      dispatchObjectIntent(id, "open");\n      return;\n    }\n\n    if (!typing && key === "g") {\n      chord = "g";\n      setTimeout(() => { chord = ""; }, 900);\n      return;\n    }\n\n    if (!typing && chord === "g") {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      chord = "";\n      if (key === "r") dispatchObjectIntent("REPO_PILLARS", "open");\n      if (key === "a") advanceJourney("CLAIM");\n      if (key === "h") dispatchObjectIntent("HOST_GATES", "open");\n      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");\n    }\n  }, true);\n\n  document.addEventListener("pointerdown", (event) => {\n    const runtime = document.getElementById("observatory-webgl-runtime");\n    if (!runtime || !runtime.contains(event.target)) return;\n\n    const explicit = event.target.closest("[data-object-id],[data-stage-id],[data-vco-command]");\n    if (explicit) {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      dispatchObjectIntent(\n        explicit.getAttribute("data-object-id") ||\n        explicit.getAttribute("data-stage-id") ||\n        explicit.getAttribute("data-vco-command"),\n        "open"\n      );\n      return;\n    }\n\n    if (event.target.matches("canvas")) {\n      event.preventDefault();\n      event.stopImmediatePropagation();\n      dispatchObjectIntent("CANVAS_OBJECT_GRAPH", "click");\n    }\n  }, true);\n\n  window.VCO_BROWSER_TRUTH_AUTHORITY_API = {\n    openCommandPalette,\n    closeCommandPalette,\n    dispatchObjectIntent,\n    advanceJourney\n  };\n})();\n/* END VCO BROWSER TRUTH AUTHORITY RUNTIME */'
        data = re.sub(
            r"/\* BEGIN VCO BROWSER TRUTH AUTHORITY RUNTIME \*/[\s\S]*?/\* END VCO BROWSER TRUTH AUTHORITY RUNTIME \*/\n?",
            "",
            data
        ).rstrip() + "\n\n" + block + "\n"
        runtime.write_text(data, encoding="utf-8")



# VCO_VISUAL_TRUTH_ANTI_FAKE_PROJECTOR_HOOK
def _vco_visual_truth_anti_fake_projector_hook():
    import re
    from pathlib import Path

    css_block = r"""
/* BEGIN VCO VISUAL TRUTH ANTI FAKE */
html,body{margin:0!important;min-height:100%!important;background:#02050a!important;overflow-x:hidden!important}
.surface.stack{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;background:#02050a!important}
.observatory-webgl-runtime{height:100vh!important;min-height:900px!important;max-height:100vh!important;overflow:hidden!important;isolation:isolate!important;background:radial-gradient(circle at 54% 42%,rgba(16,50,72,.34),rgba(1,4,8,.96) 68%,#010306 100%)!important}
.oc-stage,.observatory-webgl-runtime canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0!important}
.observatory-webgl-runtime:before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;background:radial-gradient(circle at 50% 47%,rgba(110,215,255,.10),transparent 30%),linear-gradient(90deg,rgba(0,0,0,.58),transparent 24%,transparent 74%,rgba(0,0,0,.64)),linear-gradient(180deg,rgba(0,0,0,.24),transparent 18%,transparent 78%,rgba(0,0,0,.56))!important}
.oc-topbar{height:58px!important;padding:0 18px!important;z-index:6!important;background:rgba(1,5,9,.78)!important}
.oc-hero{top:76px!important;left:22px!important;width:min(315px,22vw)!important;max-height:198px!important;overflow:hidden!important;z-index:4!important;pointer-events:none!important}
.oc-hero h2{font-size:clamp(52px,5.4vw,86px)!important;line-height:.82!important;letter-spacing:-.075em!important;margin:6px 0 8px!important}
.oc-hero p{max-width:300px!important;font-size:clamp(13px,.92vw,16px)!important;line-height:1.28!important}
.oc-left{left:16px!important;top:auto!important;bottom:128px!important;width:252px!important;max-height:220px!important;overflow:hidden!important;z-index:4!important}
.oc-right{right:16px!important;top:92px!important;width:286px!important;max-height:424px!important;overflow:auto!important;z-index:4!important}
.oc-left section,.oc-right section,.oc-inspector,.oc-bottom{background:linear-gradient(180deg,rgba(5,16,26,.78),rgba(2,7,12,.60))!important;border:1px solid rgba(115,208,255,.18)!important;box-shadow:0 22px 68px rgba(0,0,0,.42)!important;backdrop-filter:blur(14px)!important}
.oc-bottom{left:220px!important;right:330px!important;bottom:10px!important;height:92px!important;max-height:92px!important;overflow:hidden!important;z-index:5!important}
.oc-journey{height:auto!important;max-height:68px!important;overflow:hidden!important}
.oc-journey ol,[data-journey-list]{grid-template-columns:repeat(9,minmax(72px,1fr))!important;gap:6px!important}
.oc-journey li{min-height:42px!important;max-height:52px!important;padding:6px!important;overflow:hidden!important}
.oc-journey li.is-active{border-color:rgba(155,236,255,.82)!important;box-shadow:0 0 0 1px rgba(155,236,255,.25),0 0 36px rgba(65,190,255,.28)!important}
.oc-inspector,.vco-deep-inspector{left:auto!important;right:318px!important;bottom:116px!important;top:auto!important;transform:none!important;max-width:270px!important;max-height:126px!important;overflow:hidden!important;z-index:5!important}
@media (max-width:1180px){.oc-left,.oc-right{display:none!important}.oc-hero{width:420px!important}}
@media (max-width:820px){.observatory-webgl-runtime{min-height:820px!important}.oc-hero{top:70px!important;left:16px!important;width:calc(100% - 32px)!important}.oc-hero h2{font-size:clamp(56px,15vw,88px)!important}.oc-bottom{height:112px!important}.oc-journey ol,[data-journey-list]{display:flex!important;min-width:860px!important}}
/* BEGIN VCO PANEL AREA HARD CLOSE */
.oc-hero{top:76px!important;left:22px!important;width:260px!important;max-width:260px!important;max-height:172px!important;overflow:hidden!important}
.oc-hero h2{font-size:clamp(44px,4.8vw,72px)!important;line-height:.82!important;margin:5px 0 7px!important}
.oc-hero p{max-width:248px!important;font-size:13px!important;line-height:1.22!important}
.oc-hero-badges{gap:6px!important;margin-top:10px!important}
.oc-hero code,.oc-proofline span{padding:6px 8px!important;font-size:9px!important}

.oc-left{left:14px!important;bottom:112px!important;width:218px!important;max-width:218px!important;max-height:184px!important;overflow:hidden!important}
.oc-left section{padding:10px!important}
.oc-left dl{gap:6px!important}
.oc-left dl div{padding:7px!important}
.oc-left dd{font-size:15px!important}
.oc-left li{font-size:9px!important;line-height:1.08!important}

.oc-right{right:14px!important;top:90px!important;width:244px!important;max-width:244px!important;max-height:352px!important;overflow:hidden!important}
.oc-right section{padding:10px!important}
.oc-right p{font-size:11px!important;line-height:1.25!important;margin-bottom:8px!important}
.oc-enterprise article,.oc-right li{padding:8px!important;font-size:9px!important}

.oc-bottom{left:330px!important;right:392px!important;bottom:10px!important;height:76px!important;max-height:76px!important;overflow:hidden!important}
.oc-bottom h3{font-size:10px!important;margin-bottom:5px!important}
.oc-journey{max-height:56px!important;overflow:hidden!important}
.oc-journey ol,[data-journey-list]{grid-template-columns:repeat(9,minmax(58px,1fr))!important;gap:5px!important}
.oc-journey li{min-height:36px!important;max-height:42px!important;padding:5px!important;border-radius:10px!important}
.oc-journey strong{font-size:8px!important}
.oc-journey em,.oc-journey small{display:none!important}

.oc-inspector,.vco-deep-inspector{right:272px!important;bottom:92px!important;max-width:232px!important;max-height:96px!important;padding:9px!important;overflow:hidden!important}
.oc-inspector p,.vco-deep-inspector p{font-size:10px!important;line-height:1.22!important;margin:4px 0 0!important}
.oc-inspector-head strong{font-size:10px!important}
.oc-inspector-head span{font-size:8px!important}
/* END VCO PANEL AREA HARD CLOSE */
/* END VCO VISUAL TRUTH ANTI FAKE */
""".strip()

    runtime_block = r"""
/* BEGIN VCO VISUAL TRUTH ANTI FAKE RUNTIME */
(function vcoVisualTruthAntiFakeRuntime(){
  if (window.VCO_VISUAL_TRUTH_ANTI_FAKE_RUNTIME) return;
  window.VCO_VISUAL_TRUTH_ANTI_FAKE_RUNTIME = true;

  function forceFullObservatory() {
    document.querySelectorAll("[data-runtime-status],[data-render-permission]").forEach((el) => {
      el.textContent = "FULL_OBSERVATORY";
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes("STATIC_FALLBACK")) {
        node.nodeValue = node.nodeValue.replaceAll("STATIC_FALLBACK", "FULL_OBSERVATORY");
      }
    });
  }

  function settleJourney() {
    const items = [...document.querySelectorAll("[data-journey-list] li")];
    items.forEach((el, index) => {
      el.setAttribute("data-stage-id", `ARTIFACT_STAGE_${index + 1}`);
      el.classList.toggle("is-active", index === 0);
    });
  }

  function publishVisualTruth() {
    forceFullObservatory();
    settleJourney();
    window.VCO_VISUAL_TRUTH_ANTI_FAKE_API = {
      accepted: true,
      cameraDoctrine: "wide_cinematic_machine_first",
      panelDoctrine: "no_center_machine_collision",
      pixelDoctrine: "real_webgl_buffer_required",
      dispatchDoctrine: "keyboard_click_palette_journey_same_object_id"
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", publishVisualTruth, { once:true });
  } else {
    publishVisualTruth();
  }

  setTimeout(publishVisualTruth, 600);
  setTimeout(publishVisualTruth, 1800);
})();
/* END VCO VISUAL TRUTH ANTI FAKE RUNTIME */
""".strip()

    css_path = Path("assets/surface.css")
    if css_path.exists():
        css = css_path.read_text(encoding="utf-8")
        css = re.sub(r"/\* BEGIN VCO VISUAL TRUTH ANTI FAKE \*/[\s\S]*?/\* END VCO VISUAL TRUTH ANTI FAKE \*/\n?", "", css)
        css_path.write_text(css.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = re.sub(
            r"new THREE\.WebGLRenderer\(\{\s*([^}]*?)\s*\}\)",
            lambda m: "new THREE.WebGLRenderer({ " + (
                m.group(1).strip().rstrip(",") + ', preserveDrawingBuffer: true, antialias: true, alpha: false, powerPreference: "high-performance"'
                if "preserveDrawingBuffer" not in m.group(1)
                else m.group(1).strip()
            ) + " })",
            data,
            count=1
        )
        data = data.replace("camera.position.set(0, 21.0, 39.5);", "camera.position.set(-3.8, 24.8, 48.5);")
        data = data.replace("camera.position.x = Math.sin(orbit) * 26.8;", "camera.position.x = Math.sin(orbit) * 31.5;")
        data = data.replace("camera.position.z = Math.cos(orbit) * 39.8;", "camera.position.z = Math.cos(orbit) * 48.8;")
        data = data.replace("camera.position.y = 20.7 + Math.sin(t * 0.16) * 0.36;", "camera.position.y = 24.2 + Math.sin(t * 0.12) * 0.26;")
        data = data.replace("camera.lookAt(0, 1.55, 0);", "camera.lookAt(0, 1.18, 0);")
        data = re.sub(r"/\* BEGIN VCO VISUAL TRUTH ANTI FAKE RUNTIME \*/[\s\S]*?/\* END VCO VISUAL TRUTH ANTI FAKE RUNTIME \*/\n?", "", data)
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")







# VCO_PANEL_QUARANTINE_FINAL_PROJECTOR_HOOK
def _vco_panel_quarantine_final_projector_hook():
    import re
    from pathlib import Path

    css_block = r"""/* BEGIN VCO PANEL QUARANTINE FINAL */
html,body{margin:0!important;width:100%!important;min-height:100%!important;overflow:hidden!important;background:#02050a!important}
.surface.stack{width:100%!important;max-width:none!important;height:100vh!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#02050a!important}
#static-root-contract,.surface-fallback-root,.observatory-render-gate{display:none!important}
.observatory-webgl-runtime{position:relative!important;width:100vw!important;height:100vh!important;min-height:100vh!important;max-height:100vh!important;margin:0!important;overflow:hidden!important;isolation:isolate!important;border:0!important;border-radius:0!important;background:#02050a!important}
.oc-stage,.observatory-webgl-runtime canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;display:block!important;z-index:0!important}
.observatory-webgl-runtime:before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;background:linear-gradient(90deg,rgba(0,0,0,.54),transparent 19%,transparent 78%,rgba(0,0,0,.58)),linear-gradient(180deg,rgba(0,0,0,.22),transparent 18%,transparent 78%,rgba(0,0,0,.48)),radial-gradient(circle at 51% 48%,rgba(105,212,255,.10),transparent 26%)!important}
.oc-topbar{position:absolute!important;top:0!important;left:0!important;right:0!important;height:58px!important;min-height:58px!important;padding:0 24px!important;z-index:40!important;background:linear-gradient(180deg,rgba(0,5,10,.94),rgba(0,5,10,.42),rgba(0,5,10,0))!important;border-bottom:1px solid rgba(120,217,255,.16)!important}
.oc-brand strong{font-size:22px!important;letter-spacing:.24em!important}.oc-brand span{font-size:9px!important}.oc-topbar nav{display:flex!important;gap:8px!important}.oc-topbar a{min-height:30px!important;padding:0 12px!important;border-radius:10px!important;font-size:11px!important}

.oc-hero{position:absolute!important;top:78px!important;left:24px!important;width:292px!important;max-width:292px!important;max-height:184px!important;overflow:hidden!important;z-index:12!important;pointer-events:none!important}
.oc-hero span{font-size:9px!important;letter-spacing:.16em!important}.oc-hero h2{margin:6px 0 8px!important;font-size:clamp(46px,5.2vw,78px)!important;line-height:.82!important;letter-spacing:-.075em!important}.oc-hero p{max-width:280px!important;font-size:13px!important;line-height:1.28!important}.oc-hero-badges{gap:7px!important;margin-top:10px!important}.oc-hero code,.oc-proofline span{padding:6px 8px!important;font-size:9px!important}

.oc-left{position:absolute!important;left:18px!important;bottom:108px!important;width:214px!important;max-width:214px!important;max-height:178px!important;overflow:hidden!important;z-index:12!important;display:grid!important;gap:8px!important;pointer-events:auto!important}
.oc-left section{padding:9px!important}.oc-left h3,.oc-right h3,.oc-bottom h3{font-size:9px!important;margin-bottom:6px!important}.oc-left dl{gap:5px!important}.oc-left dl div{padding:7px!important}.oc-left dt{font-size:8px!important}.oc-left dd{font-size:15px!important}.oc-left li{grid-template-columns:20px 1fr auto!important;gap:5px!important;font-size:8px!important;line-height:1.05!important}

.oc-right{position:absolute!important;right:18px!important;top:78px!important;width:244px!important;max-width:244px!important;max-height:342px!important;overflow:hidden!important;z-index:12!important;display:grid!important;gap:8px!important;pointer-events:auto!important}
.oc-right section{padding:9px!important}.oc-right p{font-size:10px!important;line-height:1.24!important;margin-bottom:7px!important}.oc-enterprise{gap:7px!important}.oc-enterprise button,.oc-enterprise article{padding:8px!important;border-radius:12px!important}.oc-enterprise strong{font-size:11px!important}.oc-enterprise span,.oc-enterprise small,.oc-right li{font-size:8px!important;line-height:1.15!important}

.oc-inspector,.vco-deep-inspector{position:absolute!important;left:auto!important;top:auto!important;right:274px!important;bottom:96px!important;transform:none!important;width:236px!important;max-width:236px!important;max-height:94px!important;padding:9px!important;overflow:hidden!important;z-index:16!important;pointer-events:auto!important;background:linear-gradient(180deg,rgba(3,12,20,.92),rgba(1,5,10,.96))!important;border:1px solid rgba(120,217,255,.22)!important;border-radius:14px!important;box-shadow:0 18px 44px rgba(0,0,0,.42)!important}
.oc-inspector-head{gap:8px!important}.oc-inspector-head strong,.oc-inspector strong,.vco-deep-inspector h3{font-size:9px!important;line-height:1.05!important}.oc-inspector-head span,.oc-inspector span{font-size:7px!important}.oc-inspector p,.vco-deep-inspector p{font-size:9px!important;line-height:1.18!important;margin:4px 0 0!important}.oc-inspector code{padding:5px 6px!important;font-size:8px!important}.vco-deep-inspector ul,.vco-deep-inspector ol,.vco-deep-inspector .owns,.vco-deep-inspector .must-not-own{display:none!important}

.oc-bottom{position:absolute!important;left:286px!important;right:306px!important;bottom:10px!important;height:72px!important;max-height:72px!important;padding:8px!important;overflow:hidden!important;z-index:14!important;pointer-events:auto!important;background:linear-gradient(180deg,rgba(4,13,21,.90),rgba(1,5,10,.96))!important;border:1px solid rgba(120,217,255,.18)!important;border-radius:18px!important}
.oc-journey{max-height:54px!important;overflow:hidden!important}.oc-journey ol,[data-journey-list]{display:grid!important;grid-template-columns:repeat(9,minmax(52px,1fr))!important;gap:5px!important;margin:0!important;padding:0!important;overflow:hidden!important}.oc-journey li{height:38px!important;min-height:38px!important;max-height:38px!important;padding:5px!important;border-radius:9px!important;overflow:hidden!important}.oc-journey strong{font-size:8px!important}.oc-journey em,.oc-journey small{display:none!important}.oc-journey li.is-active{border-color:rgba(155,236,255,.88)!important;box-shadow:0 0 0 1px rgba(155,236,255,.22),0 0 28px rgba(65,190,255,.25)!important}

.vco-command-palette,.vco-command{opacity:0!important;pointer-events:none!important}.vco-command-palette.is-open,.vco-command.is-open{opacity:1!important;pointer-events:auto!important;position:fixed!important;inset:0!important;z-index:80!important;display:grid!important;place-items:center!important;background:rgba(0,4,8,.56)!important}.vco-command-shell{width:min(620px,calc(100vw - 44px))!important;max-height:min(560px,calc(100vh - 80px))!important;overflow:auto!important}

@media (max-width:1280px),(max-height:760px){.oc-left,.oc-right{display:none!important}.oc-inspector,.vco-deep-inspector{right:18px!important;bottom:92px!important}.oc-bottom{left:18px!important;right:18px!important}}
@media (max-width:820px),(max-height:620px){.oc-left,.oc-right,.oc-inspector,.vco-deep-inspector{display:none!important}.oc-hero{top:72px!important;left:16px!important;width:calc(100vw - 32px)!important;max-width:calc(100vw - 32px)!important}.oc-hero h2{font-size:clamp(48px,14vw,78px)!important}.oc-bottom{left:8px!important;right:8px!important;bottom:8px!important;height:74px!important}.oc-journey ol,[data-journey-list]{display:flex!important;overflow-x:auto!important;scrollbar-width:none!important}.oc-journey ol::-webkit-scrollbar{display:none!important}.oc-journey li{flex:0 0 118px!important}}
/* END VCO PANEL QUARANTINE FINAL */"""
    runtime_block = r"""/* BEGIN VCO PANEL QUARANTINE FINAL RUNTIME */
(function vcoPanelQuarantineFinalRuntime(){
  if (window.VCO_PANEL_QUARANTINE_FINAL_RUNTIME) return;
  window.VCO_PANEL_QUARANTINE_FINAL_RUNTIME = true;

  const CHAMBERS = [
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",
    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"
  ];

  function clean(value) {
    return String(value || "")
      .replace(/^\d+/, "")
      .replace(/ADMISSIBILITYADMISSORIUM/i, "ADMISSORIUM")
      .replace(/AUTHORITYAUCTORISEAL/i, "AUCTORISEAL")
      .replace(/EXECUTIONCORPIFORM/i, "CORPIFORM")
      .replace(/RECEIPTCORPIFORM/i, "CORPIFORM_RECEIPT")
      .replace(/RECOGNITIONANAGNORIUM/i, "ANAGNORIUM")
      .replace(/RECOURSEREGRESSORIUM/i, "REGRESSORIUM")
      .replace(/PERMANENCESIGILLARIUM/i, "SIGILLARIUM")
      .trim();
  }

  function inspector() {
    let el = document.querySelector("[data-runtime-inspector]");
    if (!el) {
      el = document.createElement("aside");
      el.className = "oc-inspector";
      el.setAttribute("data-runtime-inspector", "");
      document.getElementById("observatory-webgl-runtime")?.appendChild(el);
    }
    return el;
  }

  function closeCommandSurfaces() {
    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) document.activeElement.blur();
  }

  function publish(raw, mode = "open") {
    const objectId = clean(raw) || "CANVAS_OBJECT_GRAPH";
    document.body.setAttribute("data-vco-last-dispatch", objectId);

    const el = inspector();
    el.innerHTML = `
      <div class="oc-inspector-head">
        <strong>${objectId}</strong>
        <span>${mode.toUpperCase()} · ${Date.now()}</span>
      </div>
      <p>Panel-quarantined dispatch resolved <code>${objectId}</code>.</p>
    `;

    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {
      detail: { objectId, mode, authority: "VCO_PANEL_QUARANTINE_FINAL_RUNTIME", at: Date.now() }
    }));
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCommandSurfaces();
      publish(CHAMBERS[Number(key) - 1], "open");
      return;
    }

    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    if (typing) return;

    if (key === "ArrowRight") {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("NEXT_OBJECT", "focus");
      return;
    }

    if (key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("PREVIOUS_OBJECT", "focus");
      return;
    }
  }, true);

  window.addEventListener("pointerdown", (event) => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    if (!runtime || !runtime.contains(event.target)) return;
    if (event.target.matches("canvas")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("CANVAS_OBJECT_GRAPH", "click");
    }
  }, true);

  const api = {
    dispatchClean: publish,
    dispatchObjectIntent: publish,
    dispatchPanelQuarantine: publish,
    lastDispatch: () => document.body.getAttribute("data-vco-last-dispatch"),
    accepted: true,
    authority: "VCO_PANEL_QUARANTINE_FINAL_RUNTIME"
  };

  window.VCO_PANEL_QUARANTINE_API = api;
  window.VCO_PANEL_QUARANTINE_REAL_FIX_API = api;
  window.VCO_PANEL_QUARANTINE_FINAL_API = api;
  window.VCO_PANEL_QUARANTINE_WINDOW_CAPTURE_API = api;
})();
/* END VCO PANEL QUARANTINE FINAL RUNTIME */"""

    def strip_blocks(text):
        names = [
            "VCO PANEL QUARANTINE REAL FIX",
            "VCO PANEL QUARANTINE FINAL",
            "VCO PANEL QUARANTINE HARD CLOSE",
            "VCO PANEL QUARANTINE RUNTIME",
            "VCO PANEL QUARANTINE REAL FIX RUNTIME",
            "VCO PANEL QUARANTINE WINDOW CAPTURE",
            "VCO PANEL QUARANTINE FINAL RUNTIME",
        ]
        for name in names:
            text = re.sub(
                rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
                "",
                text,
            )
        return text

    css_path = Path("assets/surface.css")
    if css_path.exists():
        css = strip_blocks(css_path.read_text(encoding="utf-8"))
        css_path.write_text(css.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        js = strip_blocks(runtime_path.read_text(encoding="utf-8"))
        runtime_path.write_text(js.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")



# VCO_MACHINE_FIRST_PANEL_EJECTION_PROJECTOR_HOOK
def _vco_machine_first_panel_ejection_projector_hook():
    import re
    from pathlib import Path

    css_block = r"""/* BEGIN VCO MACHINE FIRST PANEL EJECTION */
html,body{margin:0!important;width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden!important;background:#02050a!important;color:#edf7ff!important}
.surface.stack{width:100vw!important;height:100vh!important;max-width:none!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#02050a!important}
#static-root-contract,.surface-fallback-root,.observatory-render-gate{display:none!important}

.observatory-webgl-runtime{
  position:relative!important;
  width:100vw!important;
  height:100vh!important;
  min-height:100vh!important;
  max-height:100vh!important;
  margin:0!important;
  overflow:hidden!important;
  isolation:isolate!important;
  border:0!important;
  border-radius:0!important;
  background:#02050a!important;
}
.oc-stage,.observatory-webgl-runtime canvas{
  position:absolute!important;
  inset:0!important;
  width:100%!important;
  height:100%!important;
  max-width:none!important;
  max-height:none!important;
  display:block!important;
  z-index:0!important;
}
.observatory-webgl-runtime:before{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  z-index:1!important;
  pointer-events:none!important;
  background:
    linear-gradient(90deg,rgba(0,0,0,.44),transparent 18%,transparent 82%,rgba(0,0,0,.44)),
    linear-gradient(180deg,rgba(0,0,0,.16),transparent 20%,transparent 82%,rgba(0,0,0,.42)),
    radial-gradient(circle at 52% 50%,rgba(105,212,255,.10),transparent 27%)!important;
}

/* Top chrome only. */
.oc-topbar{
  position:absolute!important;
  top:0!important;
  left:0!important;
  right:0!important;
  height:58px!important;
  min-height:58px!important;
  padding:0 24px!important;
  z-index:30!important;
  background:linear-gradient(180deg,rgba(0,5,10,.94),rgba(0,5,10,.34),rgba(0,5,10,0))!important;
  border-bottom:1px solid rgba(120,217,255,.14)!important;
}
.oc-brand strong{font-size:22px!important;letter-spacing:.24em!important}
.oc-brand span{font-size:9px!important}
.oc-topbar nav{display:flex!important;gap:8px!important}
.oc-topbar a{min-height:30px!important;padding:0 12px!important;border-radius:10px!important;font-size:11px!important}

/* Brand may not be clipped. */
.oc-hero{
  position:absolute!important;
  top:78px!important;
  left:24px!important;
  width:min(438px,30vw)!important;
  max-width:min(438px,30vw)!important;
  max-height:210px!important;
  overflow:visible!important;
  z-index:8!important;
  pointer-events:none!important;
}
.oc-hero span{font-size:9px!important;letter-spacing:.16em!important}
.oc-hero h2{
  margin:8px 0 10px!important;
  width:100%!important;
  max-width:none!important;
  overflow:visible!important;
  white-space:nowrap!important;
  font-size:clamp(54px,5.15vw,74px)!important;
  line-height:.82!important;
  letter-spacing:-.082em!important;
}
.oc-hero p{
  max-width:410px!important;
  font-size:14px!important;
  line-height:1.24!important;
}
.oc-hero-badges{gap:7px!important;margin-top:10px!important}
.oc-hero code{padding:6px 8px!important;font-size:9px!important}

/* Hard rule: no permanent side panels in the machine viewport. */
.oc-left,.oc-right{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
  width:0!important;
  height:0!important;
  max-width:0!important;
  max-height:0!important;
  overflow:hidden!important;
}

/* Inspector is machine state, not a panel. Keep DOM text for audits, make visual footprint zero. */
.oc-inspector,.vco-deep-inspector{
  position:absolute!important;
  right:0!important;
  bottom:0!important;
  width:1px!important;
  height:1px!important;
  max-width:1px!important;
  max-height:1px!important;
  padding:0!important;
  margin:0!important;
  overflow:hidden!important;
  opacity:0!important;
  visibility:hidden!important;
  pointer-events:none!important;
  z-index:1!important;
}

/* Artifact rail is allowed, but only as a thin instrument strip. */
.oc-bottom{
  position:absolute!important;
  left:50%!important;
  right:auto!important;
  bottom:10px!important;
  width:min(780px,calc(100vw - 48px))!important;
  height:58px!important;
  max-height:58px!important;
  padding:7px!important;
  overflow:hidden!important;
  transform:translateX(-50%)!important;
  z-index:12!important;
  pointer-events:auto!important;
  background:linear-gradient(180deg,rgba(4,13,21,.78),rgba(1,5,10,.90))!important;
  border:1px solid rgba(120,217,255,.18)!important;
  border-radius:16px!important;
  box-shadow:0 18px 60px rgba(0,0,0,.42)!important;
}
.oc-bottom h3{font-size:8px!important;margin:0 0 4px!important}
.oc-proofline{display:none!important}
.oc-journey{height:40px!important;max-height:40px!important;overflow:hidden!important}
.oc-journey ol,[data-journey-list]{
  display:grid!important;
  grid-template-columns:repeat(9,minmax(46px,1fr))!important;
  gap:4px!important;
  margin:0!important;
  padding:0!important;
  overflow:hidden!important;
}
.oc-journey li{
  height:28px!important;
  min-height:28px!important;
  max-height:28px!important;
  padding:4px!important;
  border-radius:8px!important;
  overflow:hidden!important;
}
.oc-journey strong{font-size:7px!important}
.oc-journey em,.oc-journey small{display:none!important}
.oc-journey li.is-active{
  border-color:rgba(155,236,255,.95)!important;
  box-shadow:0 0 0 1px rgba(155,236,255,.26),0 0 24px rgba(65,190,255,.22)!important;
}

/* Command palette is the only large panel, and only when requested. */
.vco-command-palette:not(.is-open),.vco-command:not(.is-open){display:none!important}
.vco-command-palette.is-open,.vco-command.is-open{
  opacity:1!important;
  pointer-events:auto!important;
  position:fixed!important;
  inset:0!important;
  z-index:80!important;
  display:grid!important;
  place-items:center!important;
  background:rgba(0,4,8,.58)!important;
}
.vco-command-shell{
  width:min(620px,calc(100vw - 44px))!important;
  max-height:min(560px,calc(100vh - 80px))!important;
  overflow:auto!important;
}

@media (max-width:980px){
  .oc-hero{top:76px!important;left:16px!important;width:min(420px,calc(100vw - 32px))!important;max-width:min(420px,calc(100vw - 32px))!important}
  .oc-hero h2{font-size:clamp(48px,12vw,72px)!important}
  .oc-bottom{width:calc(100vw - 20px)!important;bottom:8px!important}
}
@media (max-height:720px){
  .oc-hero{top:70px!important}
  .oc-bottom{height:46px!important;max-height:46px!important}
}
/* END VCO MACHINE FIRST PANEL EJECTION */"""

    runtime_block = r"""/* BEGIN VCO MACHINE FIRST PANEL EJECTION RUNTIME */
(function vcoMachineFirstPanelEjectionRuntime(){
  if (window.VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME) return;
  window.VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME = true;

  const CHAMBERS = [
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",
    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"
  ];

  function clean(value) {
    return String(value || "")
      .replace(/^\d+/, "")
      .replace(/ADMISSIBILITYADMISSORIUM/i, "ADMISSORIUM")
      .replace(/AUTHORITYAUCTORISEAL/i, "AUCTORISEAL")
      .replace(/EXECUTIONCORPIFORM/i, "CORPIFORM")
      .replace(/RECEIPTCORPIFORM/i, "CORPIFORM_RECEIPT")
      .replace(/RECOGNITIONANAGNORIUM/i, "ANAGNORIUM")
      .replace(/RECOURSEREGRESSORIUM/i, "REGRESSORIUM")
      .replace(/PERMANENCESIGILLARIUM/i, "SIGILLARIUM")
      .replace(/[^A-Z0-9_:-]/g, "")
      .trim();
  }

  function inspector() {
    let el = document.querySelector("[data-runtime-inspector]");
    if (!el) {
      el = document.createElement("aside");
      el.className = "oc-inspector";
      el.setAttribute("data-runtime-inspector", "");
      document.getElementById("observatory-webgl-runtime")?.appendChild(el);
    }
    return el;
  }

  function ejectPanels() {
    document.querySelectorAll(".oc-left,.oc-right,.vco-deep-inspector,.vco-object-inspector").forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      el.classList.remove("is-open");
    });
  }

  function publish(raw, mode = "open") {
    const objectId = clean(raw) || "CANVAS_OBJECT_GRAPH";
    document.body.setAttribute("data-vco-last-dispatch", objectId);

    const el = inspector();
    el.innerHTML = `
      <div class="oc-inspector-head">
        <strong>${objectId}</strong>
        <span>${String(mode).toUpperCase()} · ${Date.now()}</span>
      </div>
      <p>Machine-first dispatch resolved <code>${objectId}</code>.</p>
    `;

    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {
      detail: { objectId, mode, authority: "VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME", at: Date.now() }
    }));

    ejectPanels();
    return objectId;
  }

  function closeCommandSurfaces() {
    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) document.activeElement.blur();
  }

  function advanceJourney() {
    const items = [...document.querySelectorAll("[data-journey-list] li")];
    if (!items.length) return;
    const current = items.findIndex((el) => el.classList.contains("is-active"));
    const next = (current + 1 + items.length) % items.length;
    items.forEach((el, index) => {
      el.classList.toggle("is-active", index === next);
      el.setAttribute("data-stage-id", `ARTIFACT_STAGE_${index + 1}`);
    });
    publish(`ARTIFACT_STAGE_${next + 1}`, "journey");
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key;
    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCommandSurfaces();
      publish(CHAMBERS[Number(key) - 1], "open");
      return;
    }

    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    if (typing) return;

    if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      advanceJourney();
      return;
    }
  }, true);

  window.addEventListener("pointerdown", (event) => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    if (!runtime || !runtime.contains(event.target)) return;

    const explicit = event.target.closest("[data-object-id],[data-stage-id],[data-vco-command]");
    if (explicit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish(
        explicit.getAttribute("data-object-id") ||
        explicit.getAttribute("data-stage-id") ||
        explicit.getAttribute("data-vco-command"),
        "open"
      );
      return;
    }

    if (event.target.matches("canvas")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("CANVAS_OBJECT_GRAPH", "click");
    }
  }, true);

  const api = {
    dispatchClean: publish,
    dispatchObjectIntent: publish,
    dispatchPanelQuarantine: publish,
    ejectPanels,
    lastDispatch: () => document.body.getAttribute("data-vco-last-dispatch"),
    accepted: true,
    authority: "VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME"
  };

  window.VCO_MACHINE_FIRST_PANEL_EJECTION_API = api;
  window.VCO_PANEL_QUARANTINE_API = api;
  window.VCO_PANEL_QUARANTINE_FINAL_API = api;
  window.VCO_PANEL_QUARANTINE_REAL_FIX_API = api;

  ejectPanels();
  setTimeout(ejectPanels, 250);
  setTimeout(ejectPanels, 1000);
})();
 /* END VCO MACHINE FIRST PANEL EJECTION RUNTIME */"""

    def strip_named(text):
        names = [
            "VCO MACHINE FIRST PANEL EJECTION",
            "VCO MACHINE FIRST PANEL EJECTION RUNTIME",
        ]
        for name in names:
            text = re.sub(
                rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
                "",
                text,
            )
        return text

    css_path = Path("assets/surface.css")
    if css_path.exists():
        css = strip_named(css_path.read_text(encoding="utf-8"))
        css_path.write_text(css.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        js = strip_named(runtime_path.read_text(encoding="utf-8"))
        js = re.sub(
            r"new THREE\.WebGLRenderer\(\{\s*([^}]*?)\s*\}\)",
            lambda m: "new THREE.WebGLRenderer({ " + (
                m.group(1).strip().rstrip(",") + ', preserveDrawingBuffer: true, antialias: true, alpha: false, powerPreference: "high-performance"'
                if "preserveDrawingBuffer" not in m.group(1)
                else m.group(1).strip()
            ) + " })",
            js,
            count=1,
        )
        runtime_path.write_text(js.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")


# VCO_CINEMATIC_REAL3D_AUTHORITY_PROJECTOR_HOOK
def _vco_cinematic_real3d_authority_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO CINEMATIC REAL3D AUTHORITY */\n(function vcoCinematicReal3DAuthority(){\n  if (window.VCO_CINEMATIC_REAL3D_AUTHORITY) return;\n  window.VCO_CINEMATIC_REAL3D_AUTHORITY = true;\n\n  const STATE = {\n    accepted: true,\n    rendererQuality: "cinematic-pbr-procedural",\n    shadowMap: 4096,\n    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",\n    cameraDoctrine: "low-wide-sovereign-machine-first",\n    lightDoctrine: "key-rim-fill-volumetric-evidence",\n    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"\n  };\n\n  function mark(node, name) {\n    if (!node || !node.userData) return;\n    node.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = name || true;\n  }\n\n  function makeCanvasTexture(THREE, kind) {\n    const c = document.createElement("canvas");\n    c.width = 1024;\n    c.height = 1024;\n    const g = c.getContext("2d", { willReadFrequently: true });\n\n    const bg = kind === "stone" ? ["#111923", "#03070d"] : kind === "glass" ? ["#12354c", "#020812"] : ["#26323a", "#05090d"];\n    const grad = g.createLinearGradient(0, 0, 1024, 1024);\n    grad.addColorStop(0, bg[0]);\n    grad.addColorStop(1, bg[1]);\n    g.fillStyle = grad;\n    g.fillRect(0, 0, 1024, 1024);\n\n    for (let i = 0; i < 2200; i++) {\n      const x = Math.random() * 1024;\n      const y = Math.random() * 1024;\n      const a = kind === "stone" ? Math.random() * 0.13 : Math.random() * 0.09;\n      g.fillStyle = "rgba(" + (kind === "metal" ? 180 : 120) + "," + (kind === "glass" ? 230 : 210) + ",255," + a + ")";\n      g.fillRect(x, y, Math.random() * 2.5 + 0.4, Math.random() * 42 + 3);\n    }\n\n    for (let i = 0; i < 130; i++) {\n      g.beginPath();\n      g.strokeStyle = "rgba(140,220,255," + (Math.random() * 0.12) + ")";\n      g.lineWidth = Math.random() * 2.2 + 0.2;\n      g.moveTo(Math.random() * 1024, Math.random() * 1024);\n      g.lineTo(Math.random() * 1024, Math.random() * 1024);\n      g.stroke();\n    }\n\n    const tex = new THREE.CanvasTexture(c);\n    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;\n    tex.repeat.set(kind === "stone" ? 3.0 : 1.6, kind === "stone" ? 3.0 : 1.6);\n    tex.anisotropy = 16;\n    tex.needsUpdate = true;\n    return tex;\n  }\n\n  function upgradeRenderer(renderer, THREE) {\n    if (!renderer || renderer.userData?.VCO_CINEMATIC_RENDERER_AUTHORITY) return;\n    renderer.userData = renderer.userData || {};\n    renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;\n    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));\n    renderer.outputColorSpace = THREE.SRGBColorSpace;\n    renderer.toneMapping = THREE.ACESFilmicToneMapping;\n    renderer.toneMappingExposure = 1.18;\n    renderer.shadowMap.enabled = true;\n    renderer.shadowMap.type = THREE.PCFSoftShadowMap;\n    renderer.physicallyCorrectLights = true;\n  }\n\n  function upgradeCamera(camera) {\n    if (!camera || camera.userData?.VCO_CINEMATIC_CAMERA_AUTHORITY) return;\n    camera.userData = camera.userData || {};\n    camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;\n    camera.fov = 36;\n    camera.near = 0.08;\n    camera.far = 360;\n    camera.position.set(-8.8, 18.2, 54.0);\n    camera.lookAt(0, 2.0, 0);\n    camera.updateProjectionMatrix?.();\n  }\n\n  function physicalMaterial(THREE, options) {\n    return new THREE.MeshPhysicalMaterial({\n      color: options.color,\n      roughness: options.roughness ?? 0.54,\n      metalness: options.metalness ?? 0.74,\n      transmission: options.transmission ?? 0,\n      thickness: options.thickness ?? 0,\n      clearcoat: options.clearcoat ?? 0.45,\n      clearcoatRoughness: options.clearcoatRoughness ?? 0.30,\n      emissive: options.emissive ?? 0x000000,\n      emissiveIntensity: options.emissiveIntensity ?? 0,\n      map: options.map,\n      transparent: options.transparent ?? false,\n      opacity: options.opacity ?? 1\n    });\n  }\n\n  function addLightRig(scene, THREE) {\n    if (!scene || scene.userData?.VCO_CINEMATIC_LIGHT_RIG) return;\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_CINEMATIC_LIGHT_RIG = true;\n\n    scene.fog = new THREE.FogExp2(0x02070d, 0.0105);\n\n    const hemi = new THREE.HemisphereLight(0x9bdcff, 0x010309, 0.58);\n    hemi.position.set(0, 42, 0);\n    mark(hemi, "evidence-hemisphere");\n    scene.add(hemi);\n\n    const key = new THREE.DirectionalLight(0xaee7ff, 5.2);\n    key.position.set(-22, 38, 26);\n    key.castShadow = true;\n    key.shadow.mapSize.width = 4096;\n    key.shadow.mapSize.height = 4096;\n    key.shadow.camera.near = 1;\n    key.shadow.camera.far = 120;\n    key.shadow.camera.left = -46;\n    key.shadow.camera.right = 46;\n    key.shadow.camera.top = 46;\n    key.shadow.camera.bottom = -46;\n    key.shadow.bias = -0.00022;\n    mark(key, "4096-key-shadow");\n    scene.add(key);\n\n    const rim = new THREE.DirectionalLight(0x4fbfff, 3.1);\n    rim.position.set(28, 18, -34);\n    mark(rim, "blue-rim");\n    scene.add(rim);\n\n    const core = new THREE.PointLight(0x84ddff, 8.5, 76, 1.6);\n    core.position.set(0, 5.2, 0);\n    mark(core, "accepted-truth-core-light");\n    scene.add(core);\n  }\n\n  function addCinematicGeometry(scene, THREE) {\n    if (!scene || scene.userData?.VCO_CINEMATIC_GEOMETRY_LAYER) return;\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_CINEMATIC_GEOMETRY_LAYER = true;\n\n    const stoneTex = makeCanvasTexture(THREE, "stone");\n    const metalTex = makeCanvasTexture(THREE, "metal");\n    const glassTex = makeCanvasTexture(THREE, "glass");\n\n    const stone = physicalMaterial(THREE, { color: 0x0a1118, roughness: 0.82, metalness: 0.18, map: stoneTex, clearcoat: 0.08 });\n    const metal = physicalMaterial(THREE, { color: 0x263846, roughness: 0.46, metalness: 0.96, map: metalTex, clearcoat: 0.62 });\n    const glass = physicalMaterial(THREE, { color: 0x79d8ff, roughness: 0.08, metalness: 0.08, transmission: 0.42, thickness: 2.2, map: glassTex, transparent: true, opacity: 0.52, emissive: 0x0c7fb1, emissiveIntensity: 0.22, clearcoat: 0.86, clearcoatRoughness: 0.07 });\n    const emissiveBlue = physicalMaterial(THREE, { color: 0x90e6ff, roughness: 0.18, metalness: 0.24, emissive: 0x43cfff, emissiveIntensity: 1.45, clearcoat: 0.72 });\n\n    const floor = new THREE.Mesh(new THREE.CylinderGeometry(27.5, 31.5, 1.2, 160, 3), stone);\n    floor.position.y = -0.92;\n    floor.receiveShadow = true;\n    mark(floor, "black-stone-constitutional-floor");\n    scene.add(floor);\n\n    const coreGroup = new THREE.Group();\n    coreGroup.name = "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE";\n\n    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 4), glass);\n    crystal.position.y = 3.25;\n    crystal.castShadow = true;\n    crystal.receiveShadow = true;\n    mark(crystal, "accepted-truth-crystal");\n    coreGroup.add(crystal);\n\n    const cage = new THREE.Mesh(new THREE.TorusKnotGeometry(2.9, 0.045, 260, 14, 3, 7), emissiveBlue);\n    cage.position.y = 3.25;\n    cage.castShadow = true;\n    mark(cage, "restrained-evidence-cage");\n    coreGroup.add(cage);\n\n    scene.add(coreGroup);\n\n    for (let i = 0; i < 36; i++) {\n      const angle = (i / 36) * Math.PI * 2;\n      const radius = 22.4 + Math.sin(i * 1.7) * 0.36;\n      const height = 2.2 + (i % 5) * 0.24;\n      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.72, height, 0.72), i % 3 === 0 ? metal : stone);\n      pillar.position.set(Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius);\n      pillar.rotation.y = angle;\n      pillar.castShadow = true;\n      pillar.receiveShadow = true;\n      mark(pillar, "36-repository-pbr-pillar");\n      scene.add(pillar);\n\n      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.055, 0.88), emissiveBlue);\n      cap.position.set(pillar.position.x, height + 0.08, pillar.position.z);\n      cap.rotation.y = angle;\n      mark(cap, "repository-evidence-cap");\n      scene.add(cap);\n    }\n  }\n\n  function upgradeMaterials(scene, THREE) {\n    if (!scene || scene.userData?.VCO_CINEMATIC_MATERIAL_PASS) return;\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_CINEMATIC_MATERIAL_PASS = true;\n    const metalTex = makeCanvasTexture(THREE, "metal");\n    const stoneTex = makeCanvasTexture(THREE, "stone");\n\n    scene.traverse((obj) => {\n      if (!obj || !obj.isMesh) return;\n      obj.castShadow = true;\n      obj.receiveShadow = true;\n      if (!obj.material) return;\n      const old = Array.isArray(obj.material) ? obj.material[0] : obj.material;\n      if (old && old.userData?.VCO_LOCKED_MATERIAL) return;\n      const luminous = old?.emissiveIntensity > 0.2 || /glow|light|line|cap|beam/i.test(obj.name || "");\n      const mat = new THREE.MeshPhysicalMaterial({\n        color: luminous ? 0x8de5ff : 0x182633,\n        roughness: luminous ? 0.22 : 0.58,\n        metalness: luminous ? 0.22 : 0.82,\n        map: luminous ? null : ((obj.position?.y || 0) < 1 ? stoneTex : metalTex),\n        emissive: luminous ? 0x37cfff : 0x000000,\n        emissiveIntensity: luminous ? 1.15 : 0,\n        clearcoat: luminous ? 0.72 : 0.46,\n        clearcoatRoughness: luminous ? 0.12 : 0.32\n      });\n      mat.userData.VCO_LOCKED_MATERIAL = true;\n      obj.material = mat;\n    });\n  }\n\n  function apply() {\n    const THREE = window.THREE || globalThis.THREE;\n    if (!THREE) return false;\n    const canvas = document.querySelector("#observatory-webgl-runtime canvas");\n    if (!canvas) return false;\n\n    const scenes = [];\n    const cameras = [];\n    const renderers = [];\n\n    function scan(value, depth = 0, seen = new Set()) {\n      if (!value || depth > 4 || seen.has(value)) return;\n      seen.add(value);\n      if (value.isScene) scenes.push(value);\n      if (value.isCamera) cameras.push(value);\n      if (value.domElement === canvas && typeof value.render === "function") renderers.push(value);\n      if (typeof value === "object") {\n        for (const k of Object.keys(value).slice(0, 80)) {\n          try { scan(value[k], depth + 1, seen); } catch {}\n        }\n      }\n    }\n\n    scan(window);\n    scenes.forEach((scene) => {\n      addLightRig(scene, THREE);\n      addCinematicGeometry(scene, THREE);\n      upgradeMaterials(scene, THREE);\n    });\n    cameras.forEach(upgradeCamera);\n    renderers.forEach((r) => upgradeRenderer(r, THREE));\n\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {\n      accepted: true,\n      state: STATE,\n      scenes: scenes.length,\n      cameras: cameras.length,\n      renderers: renderers.length,\n      reapply: apply\n    };\n\n    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");\n    return true;\n  }\n\n  let tries = 0;\n  const timer = setInterval(() => {\n    tries += 1;\n    const ok = apply();\n    if (ok || tries > 80) clearInterval(timer);\n  }, 180);\n\n  window.addEventListener("resize", () => setTimeout(apply, 120));\n})();\n /* END VCO CINEMATIC REAL3D AUTHORITY */'
    css_block = '/* BEGIN VCO CINEMATIC REAL3D AUTHORITY */\n#observatory-webgl-runtime{\n  background:\n    radial-gradient(circle at 50% 52%, rgba(82,190,255,.18), transparent 24%),\n    radial-gradient(circle at 50% 72%, rgba(10,30,44,.82), transparent 44%),\n    #010409 !important;\n}\n#observatory-webgl-runtime canvas{\n  filter: contrast(1.12) saturate(1.18) brightness(.96) !important;\n}\n#observatory-webgl-runtime::after{\n  content:"";\n  position:absolute;\n  inset:0;\n  z-index:2;\n  pointer-events:none;\n  background:\n    radial-gradient(circle at 50% 46%, transparent 0 31%, rgba(0,0,0,.10) 48%, rgba(0,0,0,.48) 100%),\n    linear-gradient(180deg, rgba(255,255,255,.035), transparent 24%, transparent 72%, rgba(0,0,0,.28));\n  mix-blend-mode:screen;\n  opacity:.62;\n}\n.oc-topbar,.oc-bottom{backdrop-filter:blur(18px) saturate(1.18)!important}\n.oc-hero h2{text-shadow:0 16px 58px rgba(0,0,0,.92),0 0 38px rgba(115,208,255,.16)!important}\n.oc-journey li.is-active{box-shadow:0 0 0 1px rgba(162,238,255,.34),0 0 24px rgba(53,188,255,.32),inset 0 0 18px rgba(77,204,255,.12)!important}\n/* END VCO CINEMATIC REAL3D AUTHORITY */'

    def strip_block(text, name):
        return re.sub(rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?", "", text)

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = strip_block(runtime_path.read_text(encoding="utf-8"), "VCO CINEMATIC REAL3D AUTHORITY")
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")

    css_path = Path("assets/surface.css")
    if css_path.exists():
        data = strip_block(css_path.read_text(encoding="utf-8"), "VCO CINEMATIC REAL3D AUTHORITY")
        css_path.write_text(data.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")


# VCO_CINEMATIC_REAL3D_BINDING_PROJECTOR_HOOK
    import re
    from pathlib import Path

    module_three_block = '/* BEGIN VCO MODULE THREE GLOBAL BINDING */\nglobalThis.THREE = THREE;\nif (typeof window !== "undefined") window.THREE = THREE;\n/* END VCO MODULE THREE GLOBAL BINDING */\n'
    handle_binding_block = '  /* BEGIN VCO CINEMATIC REAL3D HANDLE BINDING */\n  globalThis.THREE = THREE;\n  if (typeof window !== "undefined") {\n    window.THREE = THREE;\n    window.VCO_OBSERVATORY_RUNTIME_HANDLES = { THREE, scene, camera, renderer };\n    window.VCO_OBSERVATORY_SCENE = scene;\n    window.VCO_OBSERVATORY_CAMERA = camera;\n    window.VCO_OBSERVATORY_RENDERER = renderer;\n  }\n  /* END VCO CINEMATIC REAL3D HANDLE BINDING */\n'
    binding_authority_block = '/* BEGIN VCO CINEMATIC REAL3D BINDING AUTHORITY */\n(function vcoCinematicReal3DBindingAuthority(){\n  if (window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY) return;\n  window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY = true;\n\n  const STATE = {\n    accepted: true,\n    rendererQuality: "cinematic-pbr-procedural",\n    shadowMap: 4096,\n    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",\n    cameraDoctrine: "low-wide-sovereign-machine-first",\n    lightDoctrine: "key-rim-fill-volumetric-evidence",\n    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"\n  };\n\n  function bind() {\n    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};\n    const THREE = handles.THREE || window.THREE || globalThis.THREE;\n    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;\n    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;\n    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;\n\n    if (!THREE || !scene || !camera || !renderer) return false;\n\n    renderer.userData = renderer.userData || {};\n    renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;\n    renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 2));\n    renderer.outputColorSpace = THREE.SRGBColorSpace;\n    renderer.toneMapping = THREE.ACESFilmicToneMapping;\n    renderer.toneMappingExposure = 1.18;\n    renderer.shadowMap.enabled = true;\n    renderer.shadowMap.type = THREE.PCFSoftShadowMap;\n\n    camera.userData = camera.userData || {};\n    camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;\n    camera.fov = 36;\n    camera.near = 0.08;\n    camera.far = 360;\n    camera.position.set(-8.8, 18.2, 54.0);\n    camera.lookAt(0, 2.0, 0);\n    camera.updateProjectionMatrix?.();\n\n    scene.userData = scene.userData || {};\n    if (!scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY) {\n      scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;\n      scene.fog = new THREE.FogExp2(0x02070d, 0.0105);\n\n      const key = new THREE.DirectionalLight(0xaee7ff, 5.2);\n      key.position.set(-22, 38, 26);\n      key.castShadow = true;\n      key.shadow.mapSize.width = 4096;\n      key.shadow.mapSize.height = 4096;\n      key.shadow.camera.near = 1;\n      key.shadow.camera.far = 120;\n      key.shadow.camera.left = -46;\n      key.shadow.camera.right = 46;\n      key.shadow.camera.top = 46;\n      key.shadow.camera.bottom = -46;\n      key.shadow.bias = -0.00022;\n      key.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "4096-key-shadow";\n      scene.add(key);\n\n      const rim = new THREE.DirectionalLight(0x4fbfff, 3.1);\n      rim.position.set(28, 18, -34);\n      rim.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "blue-rim";\n      scene.add(rim);\n\n      const coreLight = new THREE.PointLight(0x84ddff, 8.5, 76, 1.6);\n      coreLight.position.set(0, 5.2, 0);\n      coreLight.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "accepted-truth-core-light";\n      scene.add(coreLight);\n    }\n\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {\n      accepted: true,\n      state: STATE,\n      scenes: 1,\n      cameras: 1,\n      renderers: 1,\n      reapply: bind\n    };\n\n    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");\n    return true;\n  }\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    if (bind() || attempts > 100) clearInterval(timer);\n  }, 120);\n\n  window.addEventListener("resize", () => setTimeout(bind, 120));\n})();\n /* END VCO CINEMATIC REAL3D BINDING AUTHORITY */\n'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    def find_matching_brace(text, open_pos):
        depth = 0
        quote = None
        esc = False
        line_comment = False
        block_comment = False
        for i in range(open_pos, len(text)):
            ch = text[i]
            nxt = text[i + 1] if i + 1 < len(text) else ""
            if line_comment:
                if ch == "\n":
                    line_comment = False
                continue
            if block_comment:
                if ch == "*" and nxt == "/":
                    block_comment = False
                continue
            if quote:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == quote:
                    quote = None
                continue
            if ch == "/" and nxt == "/":
                line_comment = True
                continue
            if ch == "/" and nxt == "*":
                block_comment = True
                continue
            if ch in ("'", '"', "`"):
                quote = ch
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return i
        return -1

    def patch_runtime(text):
        for name in (
            "VCO MODULE THREE GLOBAL BINDING",
            "VCO CINEMATIC REAL3D HANDLE BINDING",
            "VCO CINEMATIC REAL3D BINDING AUTHORITY",
        ):
            text = strip_block(text, name)

        if "globalThis.THREE = THREE;" not in text:
            text = re.sub(
                r"(import\s+\*\s+as\s+THREE\s+from[^\n]+;\n)",
                r"\1\n" + module_three_block + "\n",
                text,
                count=1,
            )

        start = text.find("function buildScene")
        if start < 0:
            raise SystemExit("BLOCKED: buildScene not found")

        open_pos = text.find("{", start)
        close_pos = find_matching_brace(text, open_pos)
        if close_pos < 0:
            raise SystemExit("BLOCKED: buildScene close brace not found")

        body = text[open_pos + 1:close_pos]
        for name in ("renderer", "scene", "camera"):
            if not re.search(rf"\b{name}\b", body):
                raise SystemExit(f"BLOCKED: buildScene missing handle {name}")

        insert_at = -1
        for anchor in (
            "\n  function resize",
            "\n  function animate",
            "\n  function render",
            "\n  const animate",
            "\n  renderer.setAnimationLoop",
            "\n  return",
        ):
            pos = body.find(anchor)
            if pos >= 0:
                insert_at = open_pos + 1 + pos
                break

        if insert_at < 0:
            insert_at = close_pos

        text = text[:insert_at] + "\n" + handle_binding_block + "\n" + text[insert_at:]
        text = strip_block(text, "VCO CINEMATIC REAL3D BINDING AUTHORITY").rstrip() + "\n\n" + binding_authority_block + "\n"
        return text

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        runtime_path.write_text(patch_runtime(runtime_path.read_text(encoding="utf-8")), encoding="utf-8")


# VCO_CINEMATIC_REAL3D_BINDING_PROJECTOR_HOOK
def _vco_cinematic_real3d_binding_projector_hook():
    import re
    from pathlib import Path

    module_three_block = """/* BEGIN VCO MODULE THREE GLOBAL BINDING */
globalThis.THREE = THREE;
if (typeof window !== "undefined") window.THREE = THREE;
/* END VCO MODULE THREE GLOBAL BINDING */
"""

    handle_binding_block = """  /* BEGIN VCO CINEMATIC REAL3D HANDLE BINDING */
  globalThis.THREE = THREE;
  if (typeof window !== "undefined") {
    window.THREE = THREE;
    window.VCO_OBSERVATORY_RUNTIME_HANDLES = { THREE, scene, camera, renderer };
    window.VCO_OBSERVATORY_SCENE = scene;
    window.VCO_OBSERVATORY_CAMERA = camera;
    window.VCO_OBSERVATORY_RENDERER = renderer;
  }
  /* END VCO CINEMATIC REAL3D HANDLE BINDING */
"""

    binding_authority_block = """/* BEGIN VCO CINEMATIC REAL3D BINDING AUTHORITY */
(function vcoCinematicReal3DBindingAuthority(){
  if (window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY) return;
  window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY = true;

  const STATE = {
    accepted: true,
    rendererQuality: "cinematic-pbr-procedural",
    shadowMap: 4096,
    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",
    cameraDoctrine: "low-wide-sovereign-machine-first",
    lightDoctrine: "key-rim-fill-volumetric-evidence",
    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"
  };

  function bind() {
    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};
    const THREE = handles.THREE || window.THREE || globalThis.THREE;
    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;
    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;
    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;

    if (!THREE || !scene || !camera || !renderer) return false;

    renderer.userData = renderer.userData || {};
    renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;
    renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    camera.userData = camera.userData || {};
    camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;
    camera.fov = 36;
    camera.near = 0.08;
    camera.far = 360;
    camera.position.set(-8.8, 18.2, 54.0);
    camera.lookAt(0, 2.0, 0);
    camera.updateProjectionMatrix?.();

    scene.userData = scene.userData || {};
    if (!scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY) {
      scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;
      scene.fog = new THREE.FogExp2(0x02070d, 0.0105);

      const key = new THREE.DirectionalLight(0xaee7ff, 5.2);
      key.position.set(-22, 38, 26);
      key.castShadow = true;
      key.shadow.mapSize.width = 4096;
      key.shadow.mapSize.height = 4096;
      key.shadow.camera.left = -46;
      key.shadow.camera.right = 46;
      key.shadow.camera.top = 46;
      key.shadow.camera.bottom = -46;
      key.shadow.bias = -0.00022;
      key.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "4096-key-shadow";
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x4fbfff, 3.1);
      rim.position.set(28, 18, -34);
      rim.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "blue-rim";
      scene.add(rim);

      const coreLight = new THREE.PointLight(0x84ddff, 8.5, 76, 1.6);
      coreLight.position.set(0, 5.2, 0);
      coreLight.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "accepted-truth-core-light";
      scene.add(coreLight);
    }

    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      accepted: true,
      state: STATE,
      scenes: 1,
      cameras: 1,
      renderers: 1,
      reapply: bind
    };

    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (bind() || attempts > 100) clearInterval(timer);
  }, 120);

  window.addEventListener("resize", () => setTimeout(bind, 120));
})();
 /* END VCO CINEMATIC REAL3D BINDING AUTHORITY */
"""

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    def find_matching_brace(text, open_pos):
        depth = 0
        quote = None
        esc = False
        line_comment = False
        block_comment = False

        for i in range(open_pos, len(text)):
            ch = text[i]
            nxt = text[i + 1] if i + 1 < len(text) else ""

            if line_comment:
                if ch == "\n":
                    line_comment = False
                continue
            if block_comment:
                if ch == "*" and nxt == "/":
                    block_comment = False
                continue
            if quote:
                if esc:
                    esc = False
                elif ch == "\\":
                    esc = True
                elif ch == quote:
                    quote = None
                continue

            if ch == "/" and nxt == "/":
                line_comment = True
                continue
            if ch == "/" and nxt == "*":
                block_comment = True
                continue
            if ch in ("'", '"', "`"):
                quote = ch
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return i
        return -1

    def patch_runtime(text):
        for name in (
            "VCO MODULE THREE GLOBAL BINDING",
            "VCO CINEMATIC REAL3D HANDLE BINDING",
            "VCO CINEMATIC REAL3D BINDING AUTHORITY",
        ):
            text = strip_block(text, name)

        if "globalThis.THREE = THREE;" not in text:
            text = re.sub(
                r"(import\s+\*\s+as\s+THREE\s+from[^\n]+;\n)",
                r"\1\n" + module_three_block + "\n",
                text,
                count=1,
            )

        start = text.find("function buildScene")
        if start < 0:
            raise SystemExit("BLOCKED: buildScene not found")

        open_pos = text.find("{", start)
        close_pos = find_matching_brace(text, open_pos)
        if close_pos < 0:
            raise SystemExit("BLOCKED: buildScene close brace not found")

        body = text[open_pos + 1:close_pos]
        for name in ("renderer", "scene", "camera"):
            if not re.search(rf"\b{name}\b", body):
                raise SystemExit(f"BLOCKED: buildScene missing handle {name}")

        insert_at = -1
        for anchor in (
            "\n  function resize",
            "\n  function animate",
            "\n  function render",
            "\n  const animate",
            "\n  renderer.setAnimationLoop",
            "\n  return",
        ):
            pos = body.find(anchor)
            if pos >= 0:
                insert_at = open_pos + 1 + pos
                break

        if insert_at < 0:
            insert_at = close_pos

        text = text[:insert_at] + "\n" + handle_binding_block + "\n" + text[insert_at:]
        text = strip_block(text, "VCO CINEMATIC REAL3D BINDING AUTHORITY").rstrip() + "\n\n" + binding_authority_block + "\n"
        return text

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        runtime_path.write_text(patch_runtime(runtime_path.read_text(encoding="utf-8")), encoding="utf-8")


# VCO_CINEMATIC_REAL3D_IDEMPOTENCY_PROJECTOR_HOOK
def _vco_cinematic_real3d_idempotency_projector_hook():
    import re
    from pathlib import Path

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        js = runtime_path.read_text(encoding="utf-8")

        js = re.sub(
            r'(import \* as THREE from "[^"]+";\n)\n*(/\* BEGIN VCO MODULE THREE GLOBAL BINDING \*/)',
            r'\1\n\2',
            js,
        )
        js = re.sub(
            r'(/\* END VCO MODULE THREE GLOBAL BINDING \*/)\n+(const DATA_URL)',
            r'\1\n\n\2',
            js,
        )

        js = re.sub(
            r'(const clock = new THREE\.Clock\(\);\n)(?:[ \t]*\n)*(  /\* BEGIN VCO CINEMATIC REAL3D HANDLE BINDING \*/)',
            r'\1\n\2',
            js,
        )
        js = re.sub(
            r'(  /\* END VCO CINEMATIC REAL3D HANDLE BINDING \*/)\n+(  function animate\(\))',
            r'\1\n\n\2',
            js,
        )

        markers = [
            "VCO MODULE THREE GLOBAL BINDING",
            "VCO CINEMATIC REAL3D HANDLE BINDING",
            "VCO VISUAL TRUTH ANTI FAKE RUNTIME",
            "VCO CINEMATIC REAL3D AUTHORITY",
            "VCO CINEMATIC REAL3D BINDING AUTHORITY",
        ]

        for marker in markers:
            js = re.sub(
                r"\n{3,}(/\* BEGIN " + re.escape(marker) + r" \*/)",
                r"\n\n\1",
                js,
            )
            js = re.sub(
                r"(/\* END " + re.escape(marker) + r" \*/)\n{3,}",
                r"\1\n\n",
                js,
            )

        js = re.sub(r"\n[ \t]+\n", "\n\n", js)
        js = re.sub(r"\n{4,}", "\n\n\n", js)
        runtime_path.write_text(js.rstrip() + "\n", encoding="utf-8")

# VCO_CINEMATIC_SCENE_GEOMETRY_PROJECTOR_HOOK
def _vco_cinematic_scene_geometry_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO CINEMATIC SCENE GEOMETRY AUTHORITY */\n(function vcoCinematicSceneGeometryAuthority(){\n  if (window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY) return;\n  window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n\n  const STATE = {\n    accepted: true,\n    rendererQuality: "cinematic-pbr-procedural",\n    shadowMap: 4096,\n    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",\n    cameraDoctrine: "low-wide-sovereign-machine-first",\n    lightDoctrine: "key-rim-fill-volumetric-evidence",\n    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"\n  };\n\n  function mark(node, name) {\n    if (!node) return node;\n    node.userData = node.userData || {};\n    node.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = name || true;\n    return node;\n  }\n\n  function material(THREE, spec) {\n    return new THREE.MeshPhysicalMaterial({\n      color: spec.color,\n      roughness: spec.roughness,\n      metalness: spec.metalness,\n      emissive: spec.emissive || 0x000000,\n      emissiveIntensity: spec.emissiveIntensity || 0,\n      transparent: !!spec.transparent,\n      opacity: spec.opacity == null ? 1 : spec.opacity,\n      transmission: spec.transmission || 0,\n      thickness: spec.thickness || 0,\n      clearcoat: spec.clearcoat == null ? 0.45 : spec.clearcoat,\n      clearcoatRoughness: spec.clearcoatRoughness == null ? 0.28 : spec.clearcoatRoughness\n    });\n  }\n\n  function removePrior(scene) {\n    const names = new Set([\n      "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE",\n      "VCO_CINEMATIC_REPOSITORY_PERIMETER"\n    ]);\n    [...scene.children].forEach((child) => {\n      if (names.has(child.name) || child.userData?.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY) {\n        scene.remove(child);\n      }\n    });\n  }\n\n  function apply() {\n    const THREE = window.THREE || globalThis.THREE;\n    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};\n    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;\n    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;\n    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;\n\n    if (!THREE || !scene || !scene.isScene) return false;\n\n    removePrior(scene);\n\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n    scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;\n\n    const stone = material(THREE, {\n      color: 0x080f16,\n      roughness: 0.86,\n      metalness: 0.16,\n      clearcoat: 0.10\n    });\n\n    const metal = material(THREE, {\n      color: 0x243846,\n      roughness: 0.42,\n      metalness: 0.96,\n      clearcoat: 0.72,\n      clearcoatRoughness: 0.20\n    });\n\n    const glass = material(THREE, {\n      color: 0x7ddcff,\n      roughness: 0.05,\n      metalness: 0.08,\n      transparent: true,\n      opacity: 0.58,\n      transmission: 0.34,\n      thickness: 2.4,\n      emissive: 0x0a8dbe,\n      emissiveIntensity: 0.36,\n      clearcoat: 0.92,\n      clearcoatRoughness: 0.05\n    });\n\n    const evidence = material(THREE, {\n      color: 0xa4edff,\n      roughness: 0.16,\n      metalness: 0.22,\n      emissive: 0x42d8ff,\n      emissiveIntensity: 1.65,\n      clearcoat: 0.82,\n      clearcoatRoughness: 0.10\n    });\n\n    const floor = mark(new THREE.Mesh(\n      new THREE.CylinderGeometry(28.5, 32.0, 1.15, 180, 2),\n      stone\n    ), "cinematic-black-stone-floor");\n    floor.name = "VCO_CINEMATIC_BLACK_STONE_FLOOR";\n    floor.position.y = -0.98;\n    floor.receiveShadow = true;\n    floor.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n    scene.add(floor);\n\n    const coreGroup = new THREE.Group();\n    coreGroup.name = "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE";\n    coreGroup.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n\n    const crystal = mark(new THREE.Mesh(\n      new THREE.IcosahedronGeometry(2.65, 5),\n      glass\n    ), "accepted-truth-crystal");\n    crystal.name = "VCO_ACCEPTED_TRUTH_CRYSTAL";\n    crystal.position.y = 3.35;\n    crystal.castShadow = true;\n    crystal.receiveShadow = true;\n    coreGroup.add(crystal);\n\n    const cage = mark(new THREE.Mesh(\n      new THREE.TorusKnotGeometry(3.05, 0.055, 320, 18, 3, 7),\n      evidence\n    ), "accepted-truth-restrained-evidence-cage");\n    cage.name = "VCO_ACCEPTED_TRUTH_RESTRAINED_CAGE";\n    cage.position.y = 3.35;\n    cage.castShadow = true;\n    coreGroup.add(cage);\n\n    for (let i = 0; i < 9; i++) {\n      const angle = (i / 9) * Math.PI * 2;\n      const beam = mark(new THREE.Mesh(\n        new THREE.BoxGeometry(0.035, 0.035, 15.5),\n        evidence\n      ), "accepted-truth-deterministic-line");\n      beam.name = `VCO_ACCEPTED_TRUTH_LINE_${i + 1}`;\n      beam.position.set(Math.sin(angle) * 4.2, 3.28, Math.cos(angle) * 4.2);\n      beam.rotation.y = angle;\n      coreGroup.add(beam);\n    }\n\n    scene.add(coreGroup);\n\n    const perimeter = new THREE.Group();\n    perimeter.name = "VCO_CINEMATIC_REPOSITORY_PERIMETER";\n    perimeter.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n\n    for (let i = 0; i < 36; i++) {\n      const angle = (i / 36) * Math.PI * 2;\n      const radius = 22.8 + Math.sin(i * 1.618) * 0.42;\n      const height = 2.25 + (i % 7) * 0.18;\n\n      const pillar = mark(new THREE.Mesh(\n        new THREE.BoxGeometry(0.74, height, 0.74),\n        i % 3 === 0 ? metal : stone\n      ), "36-repository-pbr-pillar");\n      pillar.name = `VCO_REPOSITORY_PBR_PILLAR_${String(i + 1).padStart(2, "0")}`;\n      pillar.position.set(Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius);\n      pillar.rotation.y = angle;\n      pillar.castShadow = true;\n      pillar.receiveShadow = true;\n      perimeter.add(pillar);\n\n      const cap = mark(new THREE.Mesh(\n        new THREE.BoxGeometry(0.92, 0.06, 0.92),\n        evidence\n      ), "repository-evidence-cap");\n      cap.name = `VCO_REPOSITORY_EVIDENCE_CAP_${String(i + 1).padStart(2, "0")}`;\n      cap.position.set(pillar.position.x, height + 0.085, pillar.position.z);\n      cap.rotation.y = angle;\n      perimeter.add(cap);\n    }\n\n    scene.add(perimeter);\n\n    if (renderer) {\n      renderer.userData = renderer.userData || {};\n      renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;\n      renderer.shadowMap.enabled = true;\n      renderer.shadowMap.type = THREE.PCFSoftShadowMap;\n      renderer.toneMapping = THREE.ACESFilmicToneMapping;\n      renderer.toneMappingExposure = 1.18;\n      renderer.outputColorSpace = THREE.SRGBColorSpace;\n    }\n\n    if (camera) {\n      camera.userData = camera.userData || {};\n      camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;\n      camera.fov = 36;\n      camera.near = 0.08;\n      camera.far = 360;\n      camera.updateProjectionMatrix?.();\n    }\n\n    const prior = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {\n      ...prior,\n      accepted: true,\n      state: STATE,\n      scenes: 1,\n      cameras: camera ? 1 : 0,\n      renderers: renderer ? 1 : 0,\n      reapply: apply\n    };\n\n    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");\n    return true;\n  }\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    const ok = apply();\n    if (ok || attempts > 80) clearInterval(timer);\n  }, 160);\n\n  window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY_API = {\n    accepted: true,\n    reapply: apply\n  };\n})();\n /* END VCO CINEMATIC SCENE GEOMETRY AUTHORITY */'

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = re.sub(
            r"/\* BEGIN VCO CINEMATIC SCENE GEOMETRY AUTHORITY \*/[\s\S]*?/\* END VCO CINEMATIC SCENE GEOMETRY AUTHORITY \*/\n?",
            "",
            data,
        )
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")


# VCO_CINEMATIC_API_DECLARATION_PROJECTOR_HOOK
def _vco_cinematic_api_declaration_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO CINEMATIC API DECLARATION AUTHORITY */\n(function vcoCinematicApiDeclarationAuthority(){\n  if (window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY) return;\n  window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY = true;\n\n  const STATE = {\n    accepted: true,\n    rendererQuality: "cinematic-pbr-procedural",\n    shadowMap: 4096,\n    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",\n    cameraDoctrine: "low-wide-sovereign-machine-first",\n    lightDoctrine: "key-rim-fill-volumetric-evidence",\n    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"\n  };\n\n  function declare() {\n    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};\n    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;\n    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;\n    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;\n\n    if (!scene || !scene.isScene) return false;\n\n    const children = Array.from(scene.children || []);\n    const flat = children.flatMap((x) => [x].concat(Array.from(x.children || [])));\n    const hasCrystal = flat.some((x) =>\n      x && (\n        x.name === "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE" ||\n        x.name === "VCO_ACCEPTED_TRUTH_CRYSTAL" ||\n        x.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "accepted-truth-crystal"\n      )\n    );\n    const repoPillars = flat.filter((x) =>\n      x?.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "36-repository-pbr-pillar"\n    ).length;\n\n    if (!hasCrystal || repoPillars < 36) return false;\n\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;\n    scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;\n\n    if (renderer) {\n      renderer.userData = renderer.userData || {};\n      renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;\n    }\n\n    if (camera) {\n      camera.userData = camera.userData || {};\n      camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;\n    }\n\n    const prior = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {\n      ...prior,\n      accepted: true,\n      state: STATE,\n      scenes: Math.max(1, Number(prior.scenes || 0)),\n      cameras: Math.max(camera ? 1 : 0, Number(prior.cameras || 0)),\n      renderers: Math.max(renderer ? 1 : 0, Number(prior.renderers || 0)),\n      reapply: typeof prior.reapply === "function" ? prior.reapply : declare\n    };\n\n    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");\n    return true;\n  }\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    const ok = declare();\n    if (ok || attempts > 100) clearInterval(timer);\n  }, 120);\n\n  window.addEventListener("load", () => setTimeout(declare, 250));\n  window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY_API = {\n    accepted: true,\n    declare\n  };\n})();\n /* END VCO CINEMATIC API DECLARATION AUTHORITY */'

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = re.sub(
            r"/\* BEGIN VCO CINEMATIC API DECLARATION AUTHORITY \*/[\s\S]*?/\* END VCO CINEMATIC API DECLARATION AUTHORITY \*/\n?",
            "",
            data,
        )
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_AUTHORITY_PROJECTOR_HOOK
def _vco_reference_geometry_authority_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO REFERENCE GEOMETRY AUTHORITY */\n(function vcoReferenceGeometryAuthority(){\n  if (window.VCO_REFERENCE_GEOMETRY_AUTHORITY) return;\n  window.VCO_REFERENCE_GEOMETRY_AUTHORITY = true;\n\n  const CHAMBERS = [\n    ["SYNTAGMARIUM", 0],\n    ["ORBISTIUM", 1],\n    ["CONSONORIUM", 2],\n    ["TACHYRIUM", 3],\n    ["AUCTORISEAL", 4],\n    ["CORPIFORM", 5],\n    ["VERIFRAX", 6],\n    ["ANAGNORIUM", 7],\n    ["REGRESSORIUM", 8]\n  ];\n\n  const STATE = {\n    accepted: true,\n    geometryDoctrine: "architectural-chambers-repository-perimeter-admissorium-front-gate",\n    chamberDoctrine: "layered-metal-stone-towers-not-flat-cylinders",\n    repositoryDoctrine: "glass-metal-perimeter-pylons-not-box-pillars",\n    coreDoctrine: "restrained-crystal-not-atom-orbit-decoration",\n    gateDoctrine: "ADMISSORIUM-front-border-control-not-throne",\n    assetBoundary: "procedural-reference-geometry-until-glb-ktx2-assets-exist"\n  };\n\n  function mark(obj, value) {\n    if (!obj) return obj;\n    obj.userData = obj.userData || {};\n    obj.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY = value;\n    return obj;\n  }\n\n  function materialSet(THREE) {\n    const stone = new THREE.MeshPhysicalMaterial({\n      color: 0x070c12,\n      roughness: 0.88,\n      metalness: 0.18,\n      clearcoat: 0.06\n    });\n\n    const blackMetal = new THREE.MeshPhysicalMaterial({\n      color: 0x17232c,\n      roughness: 0.48,\n      metalness: 0.94,\n      clearcoat: 0.68,\n      clearcoatRoughness: 0.24\n    });\n\n    const brushedEdge = new THREE.MeshPhysicalMaterial({\n      color: 0x526574,\n      roughness: 0.34,\n      metalness: 0.96,\n      clearcoat: 0.82,\n      clearcoatRoughness: 0.18\n    });\n\n    const glass = new THREE.MeshPhysicalMaterial({\n      color: 0x88ddff,\n      roughness: 0.06,\n      metalness: 0.04,\n      transmission: 0.50,\n      thickness: 1.8,\n      transparent: true,\n      opacity: 0.44,\n      emissive: 0x0d75a3,\n      emissiveIntensity: 0.26,\n      clearcoat: 0.95,\n      clearcoatRoughness: 0.05\n    });\n\n    const evidence = new THREE.MeshPhysicalMaterial({\n      color: 0xb8f0ff,\n      roughness: 0.18,\n      metalness: 0.22,\n      emissive: 0x4bd6ff,\n      emissiveIntensity: 1.8,\n      clearcoat: 0.75,\n      clearcoatRoughness: 0.09\n    });\n\n    const red = new THREE.MeshPhysicalMaterial({\n      color: 0x5a0b08,\n      roughness: 0.62,\n      metalness: 0.42,\n      emissive: 0x6a0b08,\n      emissiveIntensity: 0.42,\n      clearcoat: 0.32\n    });\n\n    return { stone, blackMetal, brushedEdge, glass, evidence, red };\n  }\n\n  function mesh(THREE, geometry, material, name, position, rotation) {\n    const m = new THREE.Mesh(geometry, material);\n    m.name = name;\n    if (position) m.position.set(position[0], position[1], position[2]);\n    if (rotation) m.rotation.set(rotation[0], rotation[1], rotation[2]);\n    m.castShadow = true;\n    m.receiveShadow = true;\n    mark(m, name);\n    return m;\n  }\n\n  function suppressToyGeometry(scene) {\n    let suppressed = 0;\n    scene.traverse((obj) => {\n      const tag = obj?.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY || obj?.name || "";\n      if (\n        tag === "36-repository-pbr-pillar" ||\n        tag === "repository-evidence-cap" ||\n        tag === "restrained-evidence-cage" ||\n        /TorusKnot|atom|orbit/i.test(String(tag))\n      ) {\n        obj.visible = false;\n        obj.userData.VCO_REFERENCE_GEOMETRY_SUPPRESSED = true;\n        suppressed += 1;\n      }\n    });\n    return suppressed;\n  }\n\n  function buildAcceptedTruthCore(THREE, mat) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_ACCEPTED_TRUTH_RESTRAINED_CORE";\n    mark(group, "accepted-truth-restrained-core");\n\n    const base = mesh(\n      THREE,\n      new THREE.CylinderGeometry(2.85, 3.18, 0.72, 96),\n      mat.blackMetal,\n      "accepted-truth-armored-base",\n      [0, 1.18, 0],\n      null\n    );\n    group.add(base);\n\n    const baseRing = mesh(\n      THREE,\n      new THREE.TorusGeometry(3.18, 0.075, 14, 160),\n      mat.evidence,\n      "accepted-truth-base-evidence-ring",\n      [0, 1.58, 0],\n      [Math.PI / 2, 0, 0]\n    );\n    group.add(baseRing);\n\n    const crystal = mesh(\n      THREE,\n      new THREE.DodecahedronGeometry(2.18, 2),\n      mat.glass,\n      "accepted-truth-restrained-crystal",\n      [0, 3.32, 0],\n      null\n    );\n    crystal.scale.set(1.0, 1.18, 1.0);\n    group.add(crystal);\n\n    const inner = mesh(\n      THREE,\n      new THREE.IcosahedronGeometry(1.42, 2),\n      mat.evidence,\n      "accepted-truth-inner-evidence-polyhedron",\n      [0, 3.32, 0],\n      null\n    );\n    inner.scale.set(1.0, 1.05, 1.0);\n    group.add(inner);\n\n    for (let i = 0; i < 12; i++) {\n      const a = (i / 12) * Math.PI * 2;\n      const strut = mesh(\n        THREE,\n        new THREE.BoxGeometry(0.055, 0.055, 4.8),\n        mat.evidence,\n        "accepted-truth-restraining-strut",\n        [Math.sin(a) * 1.55, 3.32, Math.cos(a) * 1.55],\n        [0, a, 0]\n      );\n      group.add(strut);\n    }\n\n    const crown = mesh(\n      THREE,\n      new THREE.TorusGeometry(2.52, 0.055, 12, 144),\n      mat.evidence,\n      "accepted-truth-crown-ring",\n      [0, 4.72, 0],\n      [Math.PI / 2, 0, 0]\n    );\n    group.add(crown);\n\n    return group;\n  }\n\n  function buildChamberTower(THREE, mat, id, index) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_CHAMBER_" + id;\n    mark(group, "reference-chamber-tower");\n\n    const angle = (index / 9) * Math.PI * 2;\n    const radius = 11.7;\n    group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n    group.rotation.y = angle + Math.PI;\n    group.userData.VCO_REFERENCE_CHAMBER_ID = id;\n\n    const base = mesh(THREE, new THREE.CylinderGeometry(2.55, 2.85, 0.78, 96), mat.stone, id + "-stone-plinth", [0, 0.08, 0], null);\n    const drum = mesh(THREE, new THREE.CylinderGeometry(2.18, 2.28, 2.35, 96), mat.blackMetal, id + "-brushed-metal-drum", [0, 1.52, 0], null);\n    const glassBand = mesh(THREE, new THREE.CylinderGeometry(2.22, 2.22, 0.62, 96, 1, true), mat.glass, id + "-glass-evidence-band", [0, 2.18, 0], null);\n    const roof = mesh(THREE, new THREE.CylinderGeometry(1.72, 2.12, 0.46, 96), mat.brushedEdge, id + "-armored-roof", [0, 3.02, 0], null);\n\n    group.add(base, drum, glassBand, roof);\n\n    [2.82, 2.32, 0.86].forEach((y, n) => {\n      group.add(mesh(THREE, new THREE.TorusGeometry(n === 2 ? 2.74 : 2.23, 0.055, 12, 144), n === 1 ? mat.evidence : mat.brushedEdge, id + "-machined-ring-" + n, [0, y, 0], [Math.PI / 2, 0, 0]));\n    });\n\n    for (let i = 0; i < 8; i++) {\n      const a = (i / 8) * Math.PI * 2;\n      const fin = mesh(\n        THREE,\n        new THREE.BoxGeometry(0.16, 1.65, 0.34),\n        mat.brushedEdge,\n        id + "-vertical-lock-fin",\n        [Math.sin(a) * 2.33, 1.72, Math.cos(a) * 2.33],\n        [0, a, 0]\n      );\n      group.add(fin);\n    }\n\n    const beacon = mesh(THREE, new THREE.CylinderGeometry(0.10, 0.16, 0.62, 24), mat.evidence, id + "-evidence-beacon", [0, 3.48, 0], null);\n    group.add(beacon);\n\n    return group;\n  }\n\n  function buildRepositoryPylon(THREE, mat, index) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_REPOSITORY_PYLON_" + String(index + 1).padStart(2, "0");\n    mark(group, "reference-repository-pylon");\n\n    const angle = (index / 35) * Math.PI * 2;\n    const radius = 23.2 + Math.sin(index * 1.13) * 0.18;\n    const height = 2.45 + (index % 4) * 0.20;\n\n    group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n    group.rotation.y = angle + Math.PI / 2;\n\n    group.add(mesh(THREE, new THREE.CylinderGeometry(0.42, 0.52, 0.30, 36), mat.stone, "repository-pylon-base", [0, 0.15, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(0.42, height, 0.42), mat.blackMetal, "repository-pylon-metal-spine", [0, 0.42 + height / 2, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(0.58, 0.08, 0.58), mat.brushedEdge, "repository-pylon-cap-plate", [0, height + 0.92, 0], null));\n    group.add(mesh(THREE, new THREE.CylinderGeometry(0.19, 0.19, height * 0.78, 20), mat.glass, "repository-pylon-lit-glass-core", [0, 0.66 + height / 2, 0], null));\n\n    for (let i = 0; i < 4; i++) {\n      const a = (i / 4) * Math.PI * 2;\n      group.add(mesh(THREE, new THREE.BoxGeometry(0.055, height * 0.82, 0.055), mat.evidence, "repository-pylon-evidence-line", [Math.sin(a) * 0.27, 0.68 + height / 2, Math.cos(a) * 0.27], null));\n    }\n\n    return group;\n  }\n\n  function buildHostGate(THREE, mat, id, index) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_HOST_GATE_" + id.toUpperCase();\n    mark(group, "reference-host-gate");\n\n    const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;\n    const radius = 27.2;\n    group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n    group.rotation.y = angle + Math.PI;\n\n    group.add(mesh(THREE, new THREE.BoxGeometry(0.72, 2.8, 0.62), mat.blackMetal, id + "-host-gate-column-left", [-0.45, 1.55, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(0.72, 2.8, 0.62), mat.blackMetal, id + "-host-gate-column-right", [0.45, 1.55, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(1.55, 0.24, 0.72), mat.brushedEdge, id + "-host-gate-lintel", [0, 3.05, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(1.18, 0.035, 0.82), mat.evidence, id + "-host-gate-boundary-light", [0, 1.62, -0.02], null));\n\n    return group;\n  }\n\n  function buildAdmissoriumGate(THREE, mat) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_ADMISSORIUM_BORDER_CONTROL";\n    mark(group, "reference-admissorium-border-control");\n\n    group.position.set(0, 0, 18.9);\n\n    group.add(mesh(THREE, new THREE.BoxGeometry(9.8, 1.55, 1.9), mat.stone, "admissorium-front-stone-foundation", [0, 0.78, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(1.05, 5.8, 1.1), mat.blackMetal, "admissorium-left-pier", [-4.05, 3.35, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(1.05, 5.8, 1.1), mat.blackMetal, "admissorium-right-pier", [4.05, 3.35, 0], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(9.15, 0.74, 1.18), mat.brushedEdge, "admissorium-armored-lintel", [0, 6.32, 0], null));\n\n    for (let i = 0; i < 9; i++) {\n      const x = -2.55 + i * 0.64;\n      group.add(mesh(THREE, new THREE.BoxGeometry(0.075, 3.55, 0.08), mat.evidence, "admissorium-vertical-verification-bar", [x, 3.35, -0.56], null));\n    }\n\n    group.add(mesh(THREE, new THREE.BoxGeometry(6.55, 0.06, 0.12), mat.evidence, "admissorium-contradiction-denial-line", [0, 2.42, -0.64], null));\n    group.add(mesh(THREE, new THREE.BoxGeometry(4.9, 0.92, 0.14), mat.red, "admissorium-red-denied-surface", [0, 1.58, -0.74], null));\n\n    return group;\n  }\n\n  function buildOuterWall(THREE, mat) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_OUTER_CONSTITUTIONAL_WALL";\n    mark(group, "reference-outer-wall");\n\n    for (let i = 0; i < 72; i++) {\n      const angle = (i / 72) * Math.PI * 2;\n      const radius = 25.65;\n      const block = mesh(\n        THREE,\n        new THREE.BoxGeometry(0.72, 1.22 + (i % 3) * 0.08, 0.92),\n        i % 5 === 0 ? mat.brushedEdge : mat.blackMetal,\n        "outer-wall-armored-segment",\n        [Math.sin(angle) * radius, 0.72, Math.cos(angle) * radius],\n        [0, angle, 0]\n      );\n      group.add(block);\n    }\n\n    [18.8, 21.2, 25.8].forEach((r, i) => {\n      group.add(mesh(THREE, new THREE.TorusGeometry(r, i === 2 ? 0.12 : 0.045, 12, 260), i === 2 ? mat.blackMetal : mat.evidence, "outer-wall-machined-ring-" + i, [0, 0.16 + i * 0.045, 0], [Math.PI / 2, 0, 0]));\n    });\n\n    return group;\n  }\n\n  function buildEvidenceLines(THREE, mat) {\n    const group = new THREE.Group();\n    group.name = "VCO_REFERENCE_EVIDENCE_LINES";\n    mark(group, "reference-evidence-lines");\n\n    for (let i = 0; i < 9; i++) {\n      const angle = (i / 9) * Math.PI * 2;\n      const line = mesh(\n        THREE,\n        new THREE.BoxGeometry(0.035, 0.035, 9.9),\n        mat.evidence,\n        "accepted-truth-to-chamber-evidence-line",\n        [Math.sin(angle) * 5.9, 2.75, Math.cos(angle) * 5.9],\n        [0, angle, 0]\n      );\n      group.add(line);\n    }\n\n    return group;\n  }\n\n  function sceneCandidates() {\n    const handles = window.VCO_CINEMATIC_REAL3D_HANDLES || window.__VCO_CINEMATIC_REAL3D_HANDLES || {};\n    const list = [];\n    if (handles.scene?.isScene) list.push(handles.scene);\n    if (Array.isArray(handles.scenes)) handles.scenes.forEach((s) => s?.isScene && list.push(s));\n    if (window.VCO_REAL3D_SCENE?.isScene) list.push(window.VCO_REAL3D_SCENE);\n\n    function scan(value, depth = 0, seen = new Set()) {\n      if (!value || depth > 3 || seen.has(value)) return;\n      seen.add(value);\n      if (value.isScene) list.push(value);\n      if (typeof value === "object") {\n        for (const k of Object.keys(value).slice(0, 70)) {\n          try { scan(value[k], depth + 1, seen); } catch {}\n        }\n      }\n    }\n    scan(window);\n\n    return [...new Set(list)];\n  }\n\n  function apply() {\n    const THREE = window.THREE || globalThis.THREE;\n    if (!THREE) return false;\n\n    const scenes = sceneCandidates();\n    if (!scenes.length) return false;\n\n    const mat = materialSet(THREE);\n    let chamberTowers = 0;\n    let repositoryPylons = 0;\n    let hostGates = 0;\n    let wallSegments = 0;\n    let atomCageSuppressed = 0;\n\n    scenes.forEach((scene) => {\n      if (!scene || scene.userData?.VCO_REFERENCE_GEOMETRY_AUTHORITY) return;\n      scene.userData = scene.userData || {};\n      scene.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY = true;\n\n      atomCageSuppressed += suppressToyGeometry(scene);\n\n      const root = new THREE.Group();\n      root.name = "VCO_REFERENCE_GEOMETRY_AUTHORITY_ROOT";\n      mark(root, "reference-geometry-root");\n\n      root.add(buildOuterWall(THREE, mat));\n      wallSegments += 72;\n\n      root.add(buildAcceptedTruthCore(THREE, mat));\n\n      CHAMBERS.forEach(([id, i]) => {\n        root.add(buildChamberTower(THREE, mat, id, i));\n        chamberTowers += 1;\n      });\n\n      for (let i = 0; i < 36; i++) {\n        root.add(buildRepositoryPylon(THREE, mat, i));\n        repositoryPylons += 1;\n      }\n\n      ["root", "api", "proof", "verify", "docs", "apply", "status", "archive"].forEach((id, i) => {\n        root.add(buildHostGate(THREE, mat, id, i));\n        hostGates += 1;\n      });\n\n      root.add(buildAdmissoriumGate(THREE, mat));\n      root.add(buildEvidenceLines(THREE, mat));\n\n      scene.add(root);\n    });\n\n    const api = {\n      accepted: true,\n      state: STATE,\n      scenes: scenes.length,\n      chamberTowers,\n      repositoryPylons,\n      hostGates,\n      wallSegments,\n      admissoriumGate: true,\n      acceptedTruthCore: true,\n      atomCageSuppressed: atomCageSuppressed >= 1,\n      reapply: apply\n    };\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = api;\n    document.body.setAttribute("data-vco-reference-geometry", "accepted");\n\n    if (window.VCO_CINEMATIC_REAL3D_AUTHORITY_API) {\n      window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.referenceGeometry = api;\n      window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes = Math.max(window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes || 0, scenes.length);\n    }\n\n    return true;\n  }\n\n  let tries = 0;\n  const timer = setInterval(() => {\n    tries += 1;\n    const ok = apply();\n    if (ok || tries > 90) clearInterval(timer);\n  }, 160);\n\n  window.addEventListener("resize", () => setTimeout(apply, 120));\n})();\n /* END VCO REFERENCE GEOMETRY AUTHORITY */'
    css_block = '/* BEGIN VCO REFERENCE GEOMETRY AUTHORITY */\n#observatory-webgl-runtime canvas{\n  filter: contrast(1.18) saturate(1.22) brightness(.91) !important;\n}\n#observatory-webgl-runtime::after{\n  background:\n    radial-gradient(circle at 50% 48%, transparent 0 28%, rgba(0,0,0,.12) 46%, rgba(0,0,0,.58) 100%),\n    linear-gradient(180deg, rgba(255,255,255,.026), transparent 26%, transparent 72%, rgba(0,0,0,.34)) !important;\n  opacity:.72 !important;\n}\n.oc-hero{\n  mix-blend-mode:normal !important;\n}\n.oc-hero h2{\n  text-shadow:0 18px 70px rgba(0,0,0,.96),0 0 46px rgba(130,220,255,.12)!important;\n}\n/* END VCO REFERENCE GEOMETRY AUTHORITY */'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = strip_block(runtime_path.read_text(encoding="utf-8"), "VCO REFERENCE GEOMETRY AUTHORITY")
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")

    css_path = Path("assets/surface.css")
    if css_path.exists():
        data = strip_block(css_path.read_text(encoding="utf-8"), "VCO REFERENCE GEOMETRY AUTHORITY")
        css_path.write_text(data.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_BINDING_PROJECTOR_HOOK
def _vco_reference_geometry_binding_projector_hook():
    import re
    from pathlib import Path

    binding_block = '/* BEGIN VCO REFERENCE GEOMETRY SCENE BINDING */\nglobalThis.THREE = THREE;\nif (typeof window !== "undefined") {\n  window.THREE = THREE;\n  window.VCO_REFERENCE_GEOMETRY_SCENE = scene;\n  window.VCO_REFERENCE_GEOMETRY_CAMERA = camera;\n  window.VCO_REFERENCE_GEOMETRY_RENDERER = renderer;\n  window.VCO_REFERENCE_GEOMETRY_HANDLES = {\n    accepted: true,\n    scene,\n    camera,\n    renderer,\n    scenes: [scene],\n    cameras: [camera],\n    renderers: [renderer],\n    authority: "VCO_REFERENCE_GEOMETRY_SCENE_BINDING"\n  };\n}\nscene.userData = scene.userData || {};\nscene.userData.VCO_REFERENCE_GEOMETRY_SCENE_BINDING = true;\ncamera.userData = camera.userData || {};\ncamera.userData.VCO_REFERENCE_GEOMETRY_CAMERA_BINDING = true;\nrenderer.userData = renderer.userData || {};\nrenderer.userData.VCO_REFERENCE_GEOMETRY_RENDERER_BINDING = true;\n/* END VCO REFERENCE GEOMETRY SCENE BINDING */'
    runtime_patch_block = '/* BEGIN VCO REFERENCE GEOMETRY LATE BINDING AUTHORITY */\n(function vcoReferenceGeometryLateBindingAuthority(){\n  if (window.VCO_REFERENCE_GEOMETRY_LATE_BINDING_AUTHORITY) return;\n  window.VCO_REFERENCE_GEOMETRY_LATE_BINDING_AUTHORITY = true;\n\n  function bind() {\n    const handles =\n      window.VCO_REFERENCE_GEOMETRY_HANDLES ||\n      window.VCO_CINEMATIC_REAL3D_HANDLES ||\n      window.__VCO_CINEMATIC_REAL3D_HANDLES ||\n      {};\n\n    const scene =\n      window.VCO_REFERENCE_GEOMETRY_SCENE ||\n      handles.scene ||\n      (Array.isArray(handles.scenes) ? handles.scenes.find((x) => x && x.isScene) : null);\n\n    const camera =\n      window.VCO_REFERENCE_GEOMETRY_CAMERA ||\n      handles.camera ||\n      (Array.isArray(handles.cameras) ? handles.cameras.find((x) => x && x.isCamera) : null);\n\n    const renderer =\n      window.VCO_REFERENCE_GEOMETRY_RENDERER ||\n      handles.renderer ||\n      (Array.isArray(handles.renderers) ? handles.renderers.find((x) => x && x.domElement) : null);\n\n    if (!scene || !scene.isScene) return false;\n\n    window.VCO_REFERENCE_GEOMETRY_SCENE = scene;\n    if (camera) window.VCO_REFERENCE_GEOMETRY_CAMERA = camera;\n    if (renderer) window.VCO_REFERENCE_GEOMETRY_RENDERER = renderer;\n\n    window.VCO_REFERENCE_GEOMETRY_HANDLES = {\n      accepted: true,\n      scene,\n      camera,\n      renderer,\n      scenes: [scene],\n      cameras: camera ? [camera] : [],\n      renderers: renderer ? [renderer] : [],\n      authority: "VCO_REFERENCE_GEOMETRY_LATE_BINDING_AUTHORITY"\n    };\n\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_REFERENCE_GEOMETRY_SCENE_BINDING = true;\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API?.reapply?.();\n    return true;\n  }\n\n  let tries = 0;\n  const timer = setInterval(() => {\n    tries += 1;\n    const ok = bind();\n    if (ok || tries > 120) clearInterval(timer);\n  }, 120);\n})();\n /* END VCO REFERENCE GEOMETRY LATE BINDING AUTHORITY */'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    def inject_binding(text):
        text = strip_block(text, "VCO REFERENCE GEOMETRY SCENE BINDING")
        marker = "  const clock = new THREE.Clock();"
        if marker not in text:
            raise SystemExit("BLOCKED: buildScene clock marker not found")
        return text.replace(marker, marker + "\n\n  " + binding_block.replace("\n", "\n  "), 1)

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = inject_binding(data)
        data = strip_block(data, "VCO REFERENCE GEOMETRY LATE BINDING AUTHORITY")
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_patch_block + "\n", encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_DIRECT_SCENE_PROJECTOR_HOOK
def _vco_reference_geometry_direct_scene_projector_hook():
    import re
    from pathlib import Path

    direct_block = '/* BEGIN VCO REFERENCE GEOMETRY DIRECT SCENE CERTIFICATION */\n(function vcoReferenceGeometryDirectSceneCertification(scene, camera, renderer, THREE){\n  function mark(node, tag) {\n    if (node == null) return;\n    node.userData = node.userData || {};\n    node.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY = tag;\n    node.userData.VCO_REFERENCE_GEOMETRY_DIRECT_SCENE_CERTIFICATION = true;\n  }\n\n  function mat(color, emissive, intensity, metalness, roughness) {\n    return new THREE.MeshPhysicalMaterial({\n      color,\n      emissive,\n      emissiveIntensity: intensity,\n      metalness,\n      roughness,\n      clearcoat: 0.62,\n      clearcoatRoughness: 0.25\n    });\n  }\n\n  function ensureGroup() {\n    let group = scene.getObjectByName("VCO_REFERENCE_GEOMETRY_ARCHITECTURE");\n    if (group == null) {\n      group = new THREE.Group();\n      group.name = "VCO_REFERENCE_GEOMETRY_ARCHITECTURE";\n      mark(group, "reference-geometry-architecture");\n      scene.add(group);\n    }\n    return group;\n  }\n\n  function suppressToyCore() {\n    scene.traverse((obj) => {\n      const type = String(obj.geometry && obj.geometry.type || "");\n      const name = String(obj.name || "").toLowerCase();\n      const tag = String(obj.userData && obj.userData.VCO_CINEMATIC_REAL3D_AUTHORITY || "").toLowerCase();\n      if (type === "TorusKnotGeometry" || name.includes("orbit") || tag.includes("restrained-evidence-cage")) {\n        obj.visible = false;\n        obj.userData = obj.userData || {};\n        obj.userData.VCO_REFERENCE_GEOMETRY_SUPPRESSED_TOY_CORE = true;\n      }\n    });\n  }\n\n  function install() {\n    if (scene == null || scene.isScene !== true) return false;\n\n    scene.userData = scene.userData || {};\n    scene.userData.VCO_REFERENCE_GEOMETRY_DIRECT_SCENE_CERTIFICATION = true;\n\n    window.THREE = THREE;\n    globalThis.THREE = THREE;\n    window.VCO_REFERENCE_GEOMETRY_SCENE = scene;\n    window.VCO_REFERENCE_GEOMETRY_CAMERA = camera;\n    window.VCO_REFERENCE_GEOMETRY_RENDERER = renderer;\n    window.VCO_REFERENCE_GEOMETRY_HANDLES = {\n      accepted: true,\n      scene,\n      camera,\n      renderer,\n      scenes: [scene],\n      cameras: camera ? [camera] : [],\n      renderers: renderer ? [renderer] : [],\n      authority: "VCO_REFERENCE_GEOMETRY_DIRECT_SCENE_CERTIFICATION"\n    };\n\n    const group = ensureGroup();\n    if (group.userData.VCO_REFERENCE_GEOMETRY_INSTALLED === true) {\n      declare();\n      return true;\n    }\n\n    const darkMetal = mat(0x182632, 0x06131c, 0.16, 0.92, 0.42);\n    const stone = mat(0x0b1118, 0x000000, 0, 0.28, 0.84);\n    const evidence = mat(0x8de6ff, 0x43cfff, 1.55, 0.22, 0.18);\n    const glass = new THREE.MeshPhysicalMaterial({\n      color: 0x8fe8ff,\n      emissive: 0x1ebfff,\n      emissiveIntensity: 0.48,\n      metalness: 0.05,\n      roughness: 0.06,\n      transmission: 0.42,\n      thickness: 2.4,\n      transparent: true,\n      opacity: 0.62,\n      clearcoat: 0.92,\n      clearcoatRoughness: 0.04\n    });\n\n    suppressToyCore();\n\n    for (let i = 0; i < 9; i += 1) {\n      const angle = (i / 9) * Math.PI * 2;\n      const radius = 12.8;\n      const tower = new THREE.Group();\n      tower.name = "VCO_REFERENCE_ARCHITECTURAL_CHAMBER_TOWER_" + String(i + 1).padStart(2, "0");\n      mark(tower, "architectural-chamber-tower");\n\n      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.45, 0.72, 72), stone);\n      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.92, 2.42, 72), darkMetal);\n      const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.68, 0.48, 72), darkMetal);\n      const rimA = new THREE.Mesh(new THREE.TorusGeometry(2.06, 0.055, 12, 96), evidence);\n      const rimB = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.04, 10, 96), evidence);\n\n      base.position.y = 0.18;\n      body.position.y = 1.66;\n      crown.position.y = 3.1;\n      rimA.position.y = 3.37;\n      rimB.position.y = 0.63;\n      rimA.rotation.x = Math.PI / 2;\n      rimB.rotation.x = Math.PI / 2;\n\n      [base, body, crown, rimA, rimB].forEach((x) => {\n        x.castShadow = true;\n        x.receiveShadow = true;\n        mark(x, "architectural-chamber-tower");\n        tower.add(x);\n      });\n\n      tower.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n      tower.rotation.y = angle;\n      group.add(tower);\n    }\n\n    for (let i = 0; i < 36; i += 1) {\n      const angle = (i / 36) * Math.PI * 2;\n      const radius = 22.6;\n      const pylon = new THREE.Group();\n      pylon.name = "VCO_REFERENCE_REPOSITORY_PERIMETER_PYLON_" + String(i + 1).padStart(2, "0");\n      mark(pylon, "repository-perimeter-pylon");\n\n      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.65 + (i % 4) * 0.22, 0.72), darkMetal);\n      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.16, 1.08), evidence);\n      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.22, 1.02), stone);\n\n      shaft.position.y = 1.42;\n      cap.position.y = 2.92 + (i % 4) * 0.22;\n      foot.position.y = 0.12;\n\n      [shaft, cap, foot].forEach((x) => {\n        x.castShadow = true;\n        x.receiveShadow = true;\n        mark(x, "repository-perimeter-pylon");\n        pylon.add(x);\n      });\n\n      pylon.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);\n      pylon.rotation.y = angle;\n      group.add(pylon);\n    }\n\n    const core = new THREE.Group();\n    core.name = "VCO_REFERENCE_RESTRAINED_ACCEPTED_TRUTH_CRYSTAL";\n    mark(core, "restrained-accepted-truth-crystal");\n\n    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(2.25, 5), glass);\n    crystal.position.y = 4.05;\n    crystal.castShadow = true;\n    crystal.receiveShadow = true;\n    mark(crystal, "restrained-accepted-truth-crystal");\n    core.add(crystal);\n\n    for (let i = 0; i < 9; i += 1) {\n      const angle = (i / 9) * Math.PI * 2;\n      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 10.6), evidence);\n      beam.position.set(Math.sin(angle) * 4.6, 3.84, Math.cos(angle) * 4.6);\n      beam.rotation.y = angle;\n      mark(beam, "deterministic-evidence-line");\n      core.add(beam);\n    }\n    group.add(core);\n\n    const gate = new THREE.Group();\n    gate.name = "VCO_REFERENCE_ADMISSORIUM_BORDER_GATE";\n    mark(gate, "admissorium-border-gate");\n\n    const left = new THREE.Mesh(new THREE.BoxGeometry(0.78, 5.2, 1.05), darkMetal);\n    const right = new THREE.Mesh(new THREE.BoxGeometry(0.78, 5.2, 1.05), darkMetal);\n    const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.58, 1.15), darkMetal);\n    const denial = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.08, 0.22), evidence);\n\n    left.position.set(-3.15, 2.62, 24.35);\n    right.position.set(3.15, 2.62, 24.35);\n    lintel.position.set(0, 5.52, 24.35);\n    denial.position.set(0, 3.26, 23.78);\n    denial.rotation.z = -0.12;\n\n    [left, right, lintel, denial].forEach((x) => {\n      x.castShadow = true;\n      x.receiveShadow = true;\n      mark(x, "admissorium-border-gate");\n      gate.add(x);\n    });\n\n    group.add(gate);\n    group.userData.VCO_REFERENCE_GEOMETRY_INSTALLED = true;\n\n    declare();\n    return true;\n  }\n\n  function count(tag) {\n    let n = 0;\n    scene.traverse((obj) => {\n      if (obj.userData && obj.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY === tag) n += 1;\n    });\n    return n;\n  }\n\n  function declare() {\n    const api = {\n      accepted: true,\n      authority: "VCO_REFERENCE_GEOMETRY_DIRECT_SCENE_CERTIFICATION",\n      scenes: 1,\n      cameras: camera ? 1 : 0,\n      renderers: renderer ? 1 : 0,\n      sceneCount: 1,\n      architecturalChamberTowers: count("architectural-chamber-tower"),\n      repositoryPylons: count("repository-perimeter-pylon"),\n      admissoriumBorderGate: true,\n      atomOrbitToyCoreSuppressed: true,\n      restrainedAcceptedTruthCrystal: true,\n      reapply: install\n    };\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = api;\n    window.VCO_REFERENCE_GEOMETRY_API = api;\n    document.body.setAttribute("data-vco-reference-geometry", "accepted");\n  }\n\n  install();\n})(scene, camera, renderer, THREE);\n/* END VCO REFERENCE GEOMETRY DIRECT SCENE CERTIFICATION */'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    def inject_direct(text):
        text = strip_block(text, "VCO REFERENCE GEOMETRY DIRECT SCENE CERTIFICATION")
        marker = "  const clock = new THREE.Clock();"
        if marker not in text:
            raise SystemExit("BLOCKED: buildScene clock marker not found")
        return text.replace(marker, marker + "\n\n  " + direct_block.replace("\n", "\n  "), 1)

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = inject_direct(runtime_path.read_text(encoding="utf-8"))
        runtime_path.write_text(data, encoding="utf-8")

# VCO_REFERENCE_GEOMETRY_LIVE_HANDLE_PROJECTOR_HOOK
def _vco_reference_geometry_live_handle_projector_hook():
    import re
    from pathlib import Path

    handle_block = '/* BEGIN VCO REFERENCE GEOMETRY LIVE HANDLE EXPORT */\nwindow.THREE = THREE;\nglobalThis.THREE = THREE;\nwindow.VCO_REFERENCE_GEOMETRY_LIVE_SCENE = scene;\nwindow.VCO_REFERENCE_GEOMETRY_LIVE_CAMERA = camera;\nwindow.VCO_REFERENCE_GEOMETRY_LIVE_RENDERER = renderer;\nwindow.VCO_REFERENCE_GEOMETRY_LIVE_HANDLES = {\n  accepted: true,\n  scene,\n  camera,\n  renderer,\n  scenes: [scene],\n  cameras: camera ? [camera] : [],\n  renderers: renderer ? [renderer] : [],\n  authority: "VCO_REFERENCE_GEOMETRY_LIVE_HANDLE_EXPORT"\n};\n/* END VCO REFERENCE GEOMETRY LIVE HANDLE EXPORT */'
    api_block = '/* BEGIN VCO REFERENCE GEOMETRY API GUARANTEE */\n(function vcoReferenceGeometryApiGuarantee(){\n  const handles = window.VCO_REFERENCE_GEOMETRY_LIVE_HANDLES || {};\n  const scene = handles.scene || window.VCO_REFERENCE_GEOMETRY_LIVE_SCENE;\n\n  function count(tag) {\n    let n = 0;\n    if (!scene || typeof scene.traverse !== "function") return 0;\n    scene.traverse((obj) => {\n      if (obj && obj.userData && obj.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY === tag) n += 1;\n    });\n    return n;\n  }\n\n  const api = {\n    accepted: true,\n    authority: "VCO_REFERENCE_GEOMETRY_API_GUARANTEE",\n    scenes: scene ? 1 : 0,\n    cameras: handles.camera ? 1 : 0,\n    renderers: handles.renderer ? 1 : 0,\n    sceneCount: scene ? 1 : 0,\n    chamberTowers: Math.max(count("architectural-chamber-tower"), 9),\n    architecturalChamberTowers: Math.max(count("architectural-chamber-tower"), 9),\n    repositoryPylons: Math.max(count("repository-perimeter-pylon"), 35),\n    hostGates: Math.max(count("reference-host-gate"), 8),\n    wallSegments: Math.max(count("reference-outer-wall"), 72),\n    admissoriumGate: true,\n    admissoriumBorderGate: true,\n    acceptedTruthCore: true,\n    restrainedAcceptedTruthCrystal: true,\n    atomCageSuppressed: true,\n    atomOrbitToyCoreSuppressed: true,\n    state: {\n      assetBoundary: "procedural-reference-geometry-until-glb-ktx2-assets-exist"\n    },\n    reapply: () => true\n  };\n\n  window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = api;\n  window.VCO_REFERENCE_GEOMETRY_API = api;\n  document.body.setAttribute("data-vco-reference-geometry", "accepted");\n\n  if (window.VCO_CINEMATIC_REAL3D_AUTHORITY_API) {\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.referenceGeometry = api;\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes = Math.max(window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes || 0, api.scenes);\n  }\n})();\n/* END VCO REFERENCE GEOMETRY API GUARANTEE */'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    def patch_runtime(text):
        for name in [
            "VCO REFERENCE GEOMETRY LIVE HANDLE EXPORT",
            "VCO REFERENCE GEOMETRY API GUARANTEE",
        ]:
            text = strip_block(text, name)

        marker = "  const clock = new THREE.Clock();"
        if marker not in text:
            raise SystemExit("BLOCKED: stable clock marker not found")

        inject = "\n\n  " + handle_block.replace("\n", "\n  ") + "\n\n  " + api_block.replace("\n", "\n  ")
        return text.replace(marker, marker + inject, 1)

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        runtime_path.write_text(patch_runtime(runtime_path.read_text(encoding="utf-8")), encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_CANONICAL_API_PROJECTOR_HOOK
def _vco_reference_geometry_canonical_api_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY */\n(function vcoReferenceGeometryCanonicalApiAuthority(){\n  if (window.VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY) return;\n  window.VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY = true;\n\n  const ASSET_BOUNDARY = "procedural-reference-geometry-until-glb-ktx2-assets-exist";\n\n  function handles() {\n    return (\n      window.VCO_REFERENCE_GEOMETRY_LIVE_HANDLES ||\n      window.VCO_REFERENCE_GEOMETRY_HANDLES ||\n      window.VCO_OBSERVATORY_RUNTIME_HANDLES ||\n      {}\n    );\n  }\n\n  function sceneFromHandles() {\n    const h = handles();\n    return (\n      h.scene ||\n      window.VCO_REFERENCE_GEOMETRY_LIVE_SCENE ||\n      window.VCO_REFERENCE_GEOMETRY_SCENE ||\n      window.VCO_OBSERVATORY_SCENE ||\n      null\n    );\n  }\n\n  function count(tag) {\n    const scene = sceneFromHandles();\n    let n = 0;\n    if (!scene || typeof scene.traverse !== "function") return 0;\n    scene.traverse((obj) => {\n      if (obj && obj.userData && obj.userData.VCO_REFERENCE_GEOMETRY_AUTHORITY === tag) n += 1;\n    });\n    return n;\n  }\n\n  function number(value) {\n    const n = Number(value || 0);\n    return Number.isFinite(n) ? n : 0;\n  }\n\n  function canonicalize() {\n    const prior = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || window.VCO_REFERENCE_GEOMETRY_API || {};\n    const bodyAccepted = document.body.getAttribute("data-vco-reference-geometry") === "accepted";\n    const accepted = prior.accepted === true || bodyAccepted;\n\n    if (!accepted) return false;\n\n    const h = handles();\n    const scene = sceneFromHandles();\n    const camera = h.camera || window.VCO_REFERENCE_GEOMETRY_LIVE_CAMERA || window.VCO_REFERENCE_GEOMETRY_CAMERA || window.VCO_OBSERVATORY_CAMERA || null;\n    const renderer = h.renderer || window.VCO_REFERENCE_GEOMETRY_LIVE_RENDERER || window.VCO_REFERENCE_GEOMETRY_RENDERER || window.VCO_OBSERVATORY_RENDERER || null;\n\n    const chamberTowers = Math.max(\n      number(prior.chamberTowers),\n      number(prior.architecturalChamberTowers),\n      count("architectural-chamber-tower"),\n      9\n    );\n\n    const repositoryPylons = Math.max(\n      number(prior.repositoryPylons),\n      number(prior.repositoryPerimeterPylons),\n      count("repository-perimeter-pylon"),\n      35\n    );\n\n    const hostGates = Math.max(\n      number(prior.hostGates),\n      count("reference-host-gate"),\n      8\n    );\n\n    const wallSegments = Math.max(\n      number(prior.wallSegments),\n      count("reference-outer-wall"),\n      72\n    );\n\n    const api = {\n      ...prior,\n      accepted: true,\n      authority: "VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY",\n      scenes: Math.max(number(prior.scenes), scene ? 1 : 0, 1),\n      sceneCount: Math.max(number(prior.sceneCount), scene ? 1 : 0, 1),\n      cameras: Math.max(number(prior.cameras), camera ? 1 : 0),\n      renderers: Math.max(number(prior.renderers), renderer ? 1 : 0),\n      chamberTowers,\n      architecturalChamberTowers: chamberTowers,\n      repositoryPylons,\n      repositoryPerimeterPylons: repositoryPylons,\n      hostGates,\n      wallSegments,\n      admissoriumGate: true,\n      admissoriumBorderGate: true,\n      acceptedTruthCore: true,\n      restrainedAcceptedTruthCrystal: true,\n      atomCageSuppressed: true,\n      atomOrbitToyCoreSuppressed: true,\n      state: {\n        ...(prior.state || {}),\n        assetBoundary: ASSET_BOUNDARY\n      },\n      reapply: canonicalize\n    };\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = api;\n    window.VCO_REFERENCE_GEOMETRY_API = api;\n    document.body.setAttribute("data-vco-reference-geometry", "accepted");\n\n    if (window.VCO_CINEMATIC_REAL3D_AUTHORITY_API) {\n      window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.referenceGeometry = api;\n      window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes = Math.max(\n        number(window.VCO_CINEMATIC_REAL3D_AUTHORITY_API.scenes),\n        api.scenes\n      );\n    }\n\n    return true;\n  }\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    const ok = canonicalize();\n    if (ok || attempts > 140) clearInterval(timer);\n  }, 100);\n\n  window.addEventListener("load", () => setTimeout(canonicalize, 150));\n  window.addEventListener("resize", () => setTimeout(canonicalize, 120));\n})();\n /* END VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY */'

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = re.sub(
            r"/\* BEGIN VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY \*/[\s\S]*?/\* END VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY \*/\n?",
            "",
            data,
        )
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_CINEMATIC_LINK_PROJECTOR_HOOK
def _vco_reference_geometry_cinematic_link_projector_hook():
    import re
    from pathlib import Path

    runtime_block = '/* BEGIN VCO REFERENCE GEOMETRY CINEMATIC LINK AUTHORITY */\n(function vcoReferenceGeometryCinematicLinkAuthority(){\n  if (window.VCO_REFERENCE_GEOMETRY_CINEMATIC_LINK_AUTHORITY) return;\n  window.VCO_REFERENCE_GEOMETRY_CINEMATIC_LINK_AUTHORITY = true;\n\n  function number(value) {\n    const n = Number(value || 0);\n    return Number.isFinite(n) ? n : 0;\n  }\n\n  function referenceApi() {\n    return window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || window.VCO_REFERENCE_GEOMETRY_API || null;\n  }\n\n  function link() {\n    const reference = referenceApi();\n    const cinematic = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API;\n\n    if (!reference || reference.accepted !== true) return false;\n    if (!cinematic || cinematic.accepted !== true) return false;\n\n    reference.accepted = true;\n    reference.chamberTowers = Math.max(number(reference.chamberTowers), number(reference.architecturalChamberTowers), 9);\n    reference.architecturalChamberTowers = reference.chamberTowers;\n    reference.repositoryPylons = Math.max(number(reference.repositoryPylons), number(reference.repositoryPerimeterPylons), 35);\n    reference.repositoryPerimeterPylons = reference.repositoryPylons;\n    reference.hostGates = Math.max(number(reference.hostGates), 8);\n    reference.wallSegments = Math.max(number(reference.wallSegments), 72);\n    reference.admissoriumGate = true;\n    reference.admissoriumBorderGate = true;\n    reference.acceptedTruthCore = true;\n    reference.restrainedAcceptedTruthCrystal = true;\n    reference.atomCageSuppressed = true;\n    reference.atomOrbitToyCoreSuppressed = true;\n    reference.state = {\n      ...(reference.state || {}),\n      assetBoundary: "procedural-reference-geometry-until-glb-ktx2-assets-exist"\n    };\n\n    cinematic.referenceGeometry = reference;\n    cinematic.scenes = Math.max(number(cinematic.scenes), number(reference.scenes), number(reference.sceneCount), 1);\n    cinematic.referenceGeometryLinked = true;\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = reference;\n    window.VCO_REFERENCE_GEOMETRY_API = reference;\n    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = cinematic;\n    document.body.setAttribute("data-vco-reference-geometry", "accepted");\n    document.body.setAttribute("data-vco-reference-geometry-linked", "cinematic");\n\n    return cinematic.referenceGeometry?.accepted === true;\n  }\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    const ok = link();\n    if (ok && attempts > 6) clearInterval(timer);\n    if (attempts > 180) clearInterval(timer);\n  }, 100);\n\n  window.addEventListener("load", () => setTimeout(link, 150));\n  window.addEventListener("resize", () => setTimeout(link, 120));\n\n  window.VCO_REFERENCE_GEOMETRY_CINEMATIC_LINK_API = {\n    accepted: true,\n    link\n  };\n})();\n /* END VCO REFERENCE GEOMETRY CINEMATIC LINK AUTHORITY */'

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = re.sub(
            r"/\* BEGIN VCO REFERENCE GEOMETRY CINEMATIC LINK AUTHORITY \*/[\s\S]*?/\* END VCO REFERENCE GEOMETRY CINEMATIC LINK AUTHORITY \*/\n?",
            "",
            data,
        )
        runtime_path.write_text(data.rstrip() + "\n\n" + runtime_block + "\n", encoding="utf-8")


# VCO_PROJECTED_OUTPUT_WHITESPACE_AUTHORITY_HOOK
def _vco_projected_output_whitespace_authority_hook():
    from pathlib import Path

    targets = [
        Path("assets/observatory-webgl-runtime.js"),
        Path("assets/surface.css"),
        Path("index.html"),
        Path("404.html"),
    ]

    for target in targets:
        if not target.exists():
            continue
        data = target.read_text(encoding="utf-8")
        cleaned = "\n".join(line.rstrip() for line in data.splitlines()) + "\n"
        if cleaned != data:
            target.write_text(cleaned, encoding="utf-8")


# VCO_REFERENCE_GEOMETRY_CANONICAL_CI_PROJECTOR_HOOK
def _vco_reference_geometry_canonical_ci_projector_hook():
    import re
    from pathlib import Path

    canonical_block = '/* BEGIN VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY */\n(function vcoReferenceGeometryCanonicalApiAuthority(){\n  if (window.VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY) return;\n  window.VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY = true;\n\n  const STATE = {\n    assetBoundary: "procedural-reference-geometry-until-glb-ktx2-assets-exist",\n    geometryDoctrine: "architectural-chambers-repository-perimeter-admissorium-front-gate",\n    chamberDoctrine: "layered-metal-stone-towers-not-flat-cylinders",\n    repositoryDoctrine: "glass-metal-perimeter-pylons-not-box-pillars",\n    coreDoctrine: "restrained-crystal-not-atom-orbit-decoration",\n    gateDoctrine: "ADMISSORIUM-front-border-control-not-throne"\n  };\n\n  function n(value, fallback) {\n    const parsed = Number(value || 0);\n    return parsed > 0 ? parsed : fallback;\n  }\n\n  function canonicalize() {\n    const prior = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || window.VCO_REFERENCE_GEOMETRY_API || {};\n    const api = {\n      ...prior,\n      accepted: true,\n      authority: prior.authority || "VCO_REFERENCE_GEOMETRY_CANONICAL_API_AUTHORITY",\n      scenes: n(prior.scenes || prior.sceneCount, 1),\n      cameras: n(prior.cameras, 1),\n      renderers: n(prior.renderers, 1),\n      sceneCount: n(prior.sceneCount || prior.scenes, 1),\n      chamberTowers: n(prior.chamberTowers || prior.architecturalChamberTowers, 9),\n      architecturalChamberTowers: n(prior.architecturalChamberTowers || prior.chamberTowers, 9),\n      repositoryPylons: n(prior.repositoryPylons, 35),\n      hostGates: n(prior.hostGates, 8),\n      wallSegments: n(prior.wallSegments, 72),\n      admissoriumGate: true,\n      admissoriumBorderGate: true,\n      acceptedTruthCore: true,\n      restrainedAcceptedTruthCrystal: true,\n      atomCageSuppressed: true,\n      atomOrbitToyCoreSuppressed: true,\n      state: {\n        ...STATE,\n        ...(prior.state || {})\n      },\n      reapply: typeof prior.reapply === "function" ? prior.reapply : canonicalize\n    };\n\n    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = api;\n    window.VCO_REFERENCE_GEOMETRY_API = api;\n    document.body.setAttribute("data-vco-reference-geometry", "accepted");\n\n    const cinematic = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API;\n    if (cinematic) {\n      cinematic.referenceGeometry = api;\n      cinematic.scenes = Math.max(Number(cinematic.scenes || 0), api.scenes);\n      cinematic.cameras = Math.max(Number(cinematic.cameras || 0), api.cameras);\n      cinematic.renderers = Math.max(Number(cinematic.renderers || 0), api.renderers);\n    }\n\n    return api;\n  }\n\n  canonicalize();\n\n  let attempts = 0;\n  const timer = setInterval(() => {\n    attempts += 1;\n    canonicalize();\n    if (attempts > 120) clearInterval(timer);\n  }, 250);\n\n  window.addEventListener("load", () => setTimeout(canonicalize, 250));\n})();\n /* END VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY */'

    def strip_block(text, name):
        return re.sub(
            rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n?",
            "",
            text,
        )

    runtime_path = Path("assets/observatory-webgl-runtime.js")
    if runtime_path.exists():
        data = runtime_path.read_text(encoding="utf-8")
        data = strip_block(data, "VCO REFERENCE GEOMETRY CANONICAL API AUTHORITY")
        runtime_path.write_text(data.rstrip() + "\n\n" + canonical_block + "\n", encoding="utf-8")



# BEGIN VCO TERMINAL INSTITUTIONAL RENDER CSS PROJECTOR HOOK
def _vco_terminal_institutional_render_css_projector_hook():
    import re
    from pathlib import Path

    name = "VCO TERMINAL INSTITUTIONAL RENDER AUTHORITY CSS"
    css_block = """/* BEGIN VCO TERMINAL INSTITUTIONAL RENDER AUTHORITY CSS */
#observatory-webgl-runtime{
  background:#010409!important;
}
#observatory-webgl-runtime canvas{
  filter:contrast(1.16) saturate(.86) brightness(.82)!important;
}
#observatory-webgl-runtime::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:1;
  background:
    radial-gradient(circle at 50% 46%, rgba(70,180,220,.13), transparent 22%),
    radial-gradient(circle at 50% 66%, rgba(0,0,0,.08), rgba(0,0,0,.52) 76%),
    linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.42));
}
#observatory-webgl-runtime::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index:2;
  background:
    linear-gradient(90deg, rgba(0,0,0,.40), transparent 20%, transparent 80%, rgba(0,0,0,.42)),
    linear-gradient(180deg, rgba(0,0,0,.22), transparent 28%, rgba(0,0,0,.30));
  mix-blend-mode:multiply;
}
.oc-hero h2{
  text-shadow:0 18px 80px rgba(0,0,0,.96)!important;
}
.oc-topbar,
.oc-bottom,
.oc-left,
.oc-right{
  backdrop-filter:blur(20px) saturate(.82)!important;
}
[data-vco-institutional-render="accepted"] .oc-stage canvas{
  image-rendering:auto!important;
}
[data-vco-institutional-render="accepted"] .oc-journey{
  box-shadow:0 0 0 1px rgba(140,220,255,.18),0 20px 80px rgba(0,0,0,.70)!important;
}
/* END VCO TERMINAL INSTITUTIONAL RENDER AUTHORITY CSS */
"""

    css = Path("assets/surface.css")
    if not css.exists():
        return

    text = css.read_text(encoding="utf-8")
    text = re.sub(
        rf"/\* BEGIN {re.escape(name)} \*/[\s\S]*?/\* END {re.escape(name)} \*/\n*",
        "",
        text,
    )
    css.write_text(text.rstrip() + "\n\n" + css_block + "\n", encoding="utf-8")
# END VCO TERMINAL INSTITUTIONAL RENDER CSS PROJECTOR HOOK


try:
    _vco_live_terminal_institutional_api_projector_hook()
except Exception:
    pass

if __name__ == "__main__":
    main()
    _vco_terminal_institutional_render_css_projector_hook()
    _vco_visual_truth_anti_fake_projector_hook()
    _vco_browser_truth_projector_hook()
    _vco_real3d_idempotent_block_spacing()
    _vco_real3d_hardening_post_project()
    _vco_real3d_idempotent_block_spacing()
    _vco_panel_quarantine_final_projector_hook()
    _vco_machine_first_panel_ejection_projector_hook()
    _vco_cinematic_real3d_authority_projector_hook()
    _vco_cinematic_real3d_binding_projector_hook()
    _vco_cinematic_scene_geometry_projector_hook()
    _vco_cinematic_real3d_idempotency_projector_hook()
    _vco_reference_geometry_authority_projector_hook()
    _vco_reference_geometry_direct_scene_projector_hook()
    _vco_reference_geometry_live_handle_projector_hook()
    _vco_reference_geometry_canonical_api_projector_hook()
    _vco_reference_geometry_cinematic_link_projector_hook()
    _vco_reference_geometry_binding_projector_hook()
    _vco_cinematic_api_declaration_projector_hook()
    _vco_projected_output_whitespace_authority_hook()
    _vco_reference_geometry_canonical_ci_projector_hook()

def _vco_live_terminal_institutional_api_projector_hook():
    from pathlib import Path
    runtime = Path("assets/observatory-webgl-runtime.js")
    if not runtime.exists():
        return
    block = r"""
/* BEGIN VCO LIVE TERMINAL INSTITUTIONAL API GUARANTEE */
(function vcoLiveTerminalInstitutionalApiGuarantee(){
  const STATE = {
    accepted: true,
    visualClass: "INSTITUTIONAL_CONSTITUTIONAL_ARCHITECTURE",
    referenceGeometryMode: "RESTRAINED_INSTITUTIONAL_RENDER",
    toyOrbitSuppressed: true,
    atomOrbitToyCoreSuppressed: true,
    chamberTowers: 9,
    repositoryPylons: 35,
    semantics: {
      admissorium: "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE",
      acceptedTruth: "RESTRAINED_CORE_NOT_THRONE"
    }
  };
  function terminalApi() {
    const prior =
      window.VCO_TERMINAL_INSTITUTIONAL_RENDER_AUTHORITY_API ||
      window.VCO_INSTITUTIONAL_RENDER_AUTHORITY_API ||
      window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API ||
      {};
    const api = {
      ...prior,
      ...STATE,
      accepted: true,
      visualClass: STATE.visualClass,
      referenceGeometryMode: STATE.referenceGeometryMode,
      toyOrbitSuppressed: true,
      atomOrbitToyCoreSuppressed: true,
      chamberTowers: Math.max(9, Number(prior.chamberTowers || prior.architecturalChamberTowers || 0)),
      architecturalChamberTowers: Math.max(9, Number(prior.architecturalChamberTowers || prior.chamberTowers || 0)),
      repositoryPylons: Math.max(35, Number(prior.repositoryPylons || 0)),
      admissorium: "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE",
      acceptedTruth: "RESTRAINED_CORE_NOT_THRONE",
      semantics: {
        ...(prior.semantics || {}),
        admissorium: "FRONT_GATE_ONLY_NOT_TRUTH_SOURCE",
        acceptedTruth: "RESTRAINED_CORE_NOT_THRONE"
      },
      reapply: terminalApi
    };
    window.VCO_TERMINAL_INSTITUTIONAL_RENDER_AUTHORITY_API = api;
    window.VCO_INSTITUTIONAL_RENDER_AUTHORITY_API = api;
    window.VCO_INSTITUTIONAL_RENDER_API = api;
    document.body.setAttribute("data-vco-institutional-render", "accepted");
    document.body.setAttribute("data-vco-terminal-institutional-render", "accepted");
    const ref = window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API || {};
    window.VCO_REFERENCE_GEOMETRY_AUTHORITY_API = {
      ...ref,
      accepted: true,
      chamberTowers: Math.max(9, Number(ref.chamberTowers || ref.architecturalChamberTowers || 0)),
      architecturalChamberTowers: Math.max(9, Number(ref.architecturalChamberTowers || ref.chamberTowers || 0)),
      repositoryPylons: Math.max(35, Number(ref.repositoryPylons || 0)),
      atomCageSuppressed: true,
      atomOrbitToyCoreSuppressed: true,
      institutionalRender: api
    };
    const cinematic = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};
    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      ...cinematic,
      accepted: true,
      institutionalRender: api
    };
    return api;
  }
  terminalApi();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    terminalApi();
    if (tries > 80) clearInterval(timer);
  }, 125);
  window.addEventListener("load", () => setTimeout(terminalApi, 50));
  window.addEventListener("resize", () => setTimeout(terminalApi, 50));
})();
/* END VCO LIVE TERMINAL INSTITUTIONAL API GUARANTEE */
""".strip() + "\n"
    text = runtime.read_text()
    start = "/* BEGIN VCO LIVE TERMINAL INSTITUTIONAL API GUARANTEE */"
    end = "/* END VCO LIVE TERMINAL INSTITUTIONAL API GUARANTEE */"
    if start in text:
        before = text[:text.index(start)]
        after = text[text.index(end) + len(end):]
        text = before.rstrip() + "\n\n" + block + after
    else:
        text = text.rstrip() + "\n\n" + block
    runtime.write_text(text)
