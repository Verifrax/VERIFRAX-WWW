#!/usr/bin/env python3
import hashlib
import json
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
.oc-hero{top:104px;left:34px;width:min(430px,calc(100% - 68px))}
.oc-hero span{color:#73d0ff;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em}
.oc-hero h2{margin:12px 0 8px;color:#f3f8ff;font:900 clamp(46px,6.2vw,104px)/.84 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:-.07em}
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

if __name__ == "__main__":
    main()
