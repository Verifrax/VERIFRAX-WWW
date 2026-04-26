#!/usr/bin/env python3
import json
import html
import sys
from pathlib import Path

ROOT_COPY = {
    "root": "Canonical public entry for the VERIFRAX system.",
    "tool": "Bounded public tool surface inside the VERIFRAX perimeter.",
    "reference": "Canonical bounded reference surface inside the VERIFRAX perimeter."
}

CLASS_RULES = {
    "root": [
        "Navigation belongs here; execution does not.",
        "Commercial or root framing may exist; authority, verification, proof publication, runtime and intake semantics may not collapse into this host.",
        "One public root. Many isolated surfaces."
    ],
    "tool": [
        "One host. One active function.",
        "Tool surfaces may expose operator or machine-adjacent affordances without claiming adjacent-host authority.",
        "Execution, verification, intake, and status are not interchangeable."
    ],
    "reference": [
        "Reference surfaces explain, publish, or preserve bounded material.",
        "Reference is not execution. Reference is not authority issuance.",
        "Archive, proof, docs, runtime reference, and enforcement reference stay distinct."
    ]
}

READING_ORDER = [
    ("Docs", "https://docs.verifrax.net"),
    ("Proof", "https://proof.verifrax.net"),
    ("Verify", "https://verify.verifrax.net"),
    ("Authority", "https://auctoriseal.verifrax.net"),
    ("Runtime", "https://corpiform.verifrax.net"),
    ("Enforcement", "https://cicullis.verifrax.net"),
    ("Archive", "https://sigillarium.verifrax.net"),
    ("Apply", "https://apply.verifrax.net"),
    ("Status", "https://status.verifrax.net"),
]

def escape(s):
    return html.escape(str(s), quote=True)

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
.observatory-gate-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
}
.observatory-gate-kicker{
  display:block;
  margin-bottom:6px;
  color:var(--vf-accent,#73d0ff);
  font:700 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  letter-spacing:.12em;
}
.observatory-gate-head strong{
  font:700 18px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.observatory-gate-toggle{
  appearance:none;
  border:1px solid rgba(115,208,255,.32);
  border-radius:999px;
  padding:9px 13px;
  background:rgba(115,208,255,.08);
  color:var(--vf-text,#edf2f7);
  font:700 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  cursor:pointer;
}
.observatory-gate-strip{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:12px;
  color:var(--vf-text-soft,#b6c2cf);
  font:600 11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.observatory-gate-strip span{
  padding:7px 9px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:999px;
  background:rgba(255,255,255,.035);
}
.observatory-gate-detail{
  margin-top:16px;
  padding-top:14px;
  border-top:1px solid rgba(255,255,255,.09);
  color:var(--vf-text-soft,#b6c2cf);
}
.observatory-gate-detail p{
  margin:0 0 12px;
}
.observatory-gate-detail dl{
  display:grid;
  gap:6px;
  margin:0;
}
.observatory-gate-check{
  display:grid;
  grid-template-columns:minmax(180px,260px) 1fr;
  gap:10px;
  padding:8px 10px;
  border-radius:12px;
  background:rgba(255,255,255,.035);
}
.observatory-gate-check dt,
.observatory-gate-check dd{
  margin:0;
  font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.observatory-gate-check.is-pass dd{
  color:#9ee6b8;
}
.observatory-gate-check.is-fail dd{
  color:#ff9b9b;
}
body.vf-observatory-full .observatory-render-gate{
  border-color:rgba(115,208,255,.42);
}
body.vf-observatory-safe .observatory-render-gate,
body.vf-observatory-blocked .observatory-render-gate{
  border-color:rgba(255,139,139,.46);
}
@media (max-width:720px){
  .observatory-gate-head{
    align-items:flex-start;
    flex-direction:column;
  }
  .observatory-gate-check{
    grid-template-columns:1fr;
  }
}
"""


def render(cfg, surface_sha):
    host = cfg["host"]
    host_class = cfg["hostClass"]
    title = cfg["title"]
    repo = cfg["repo"]
    repo_url = f"https://github.com/Verifrax/{repo}"
    description = cfg["description"]
    role = cfg["role"]
    deploy_mode = cfg["deployMode"]
    adjacent = cfg.get("adjacentHosts", {})
    adjacent_rows = "\n".join(
        f'<li class="row"><span class="label">{escape(label)}</span><span class="value"><a href="{escape(url)}">{escape(url.replace("https://", ""))}</a></span></li>'
        for label, url in adjacent.items()
    )
    rules = "\n".join(f"<li>{escape(item)}</li>" for item in CLASS_RULES[host_class])
    reading = "\n".join(f'<a class="pill" href="{escape(url)}">{escape(label)}</a>' for label, url in READING_ORDER)
    deploy_note = "Static public host." if deploy_mode == "static-root" else "Preview-only surface projection. Live host stays outside GitHub Pages."
    observatory_gate = render_observatory_gate(cfg)
    observatory_script = render_observatory_script(cfg)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(description)}">
  <link rel="canonical" href="{escape(host if host.endswith("/") else host + "/")}">
  <link rel="stylesheet" href="assets/surface.css">
</head>
<body>
  <main class="wrap">
    <div class="kicker">VERIFRAX / {escape(role)}</div>
    <h1>{escape(title)}</h1>
    <p class="lead">{escape(description)}</p>
    <p class="copy">{escape(ROOT_COPY[host_class])}</p>
    <div class="rule"></div>

    <section class="grid two">
      <article class="card">
        <h2>System map</h2>
        <ul class="list">
          {adjacent_rows}
        </ul>
      </article>

      <article class="card">
        <h2>Host contract</h2>
        <p>{escape(deploy_note)}</p>
        <ul>
          {rules}
        </ul>
      </article>
    </section>

    <section class="card" style="margin-top:28px">
      <h2>Surface authority</h2>
      <ul class="list">
        <li class="row"><span class="label">Host</span><span class="value"><code>{escape(host)}</code></span></li>
        <li class="row"><span class="label">Repository</span><span class="value"><a href="{escape(repo_url)}">{escape(repo)}</a></span></li>
        <li class="row"><span class="label">Host class</span><span class="value"><code>{escape(host_class)}</code></span></li>
        <li class="row"><span class="label">Surface role</span><span class="value"><code>{escape(role)}</code></span></li>
        <li class="row"><span class="label">Projection source</span><span class="value"><code>VERIFRAX-SURFACE@{escape(surface_sha[:12])}</code></span></li>
      </ul>
      <p class="note">Form comes from the surface authority. Host purpose and content stay owned by the host repository.</p>
    </section>

    <section class="card" style="margin-top:28px">
      <h2>Reading order</h2>
      <div class="pills">{reading}</div>
    </section>

    <div class="footer">
      Generated from <code>surface.host.json</code> by the vendored VERIFRAX-SURFACE projector.
    </div>
{observatory_gate}
  </main>
{observatory_script}</body>
</html>
"""

def main():
    repo_root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    cfg_path = repo_root / "surface.host.json"
    if not cfg_path.exists():
        raise SystemExit(f"missing config: {cfg_path}")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    surface_sha = (repo_root / ".surface" / "SURFACE_SHA").read_text(encoding="utf-8").strip() if (repo_root / ".surface" / "SURFACE_SHA").exists() else "unknown"

    shell_css = (repo_root / ".surface" / "vendor" / "shell" / "base.css").read_text(encoding="utf-8")
    tokens_css = (repo_root / ".surface" / "vendor" / "tokens" / "surface.css").read_text(encoding="utf-8")
    css = tokens_css + "\n\n" + shell_css + "\n\n" + observatory_css(cfg)

    if cfg["deployMode"] == "static-root":
        out_dir = repo_root
    else:
        out_dir = repo_root / "surface-preview"

    out_dir.mkdir(parents=True, exist_ok=True)
    ensure_asset(out_dir, css)
    html_doc = render(cfg, surface_sha)
    (out_dir / "index.html").write_text(html_doc, encoding="utf-8")
    (out_dir / "404.html").write_text(html_doc.replace("<h1>", "<h1>404 — ", 1), encoding="utf-8")

if __name__ == "__main__":
    main()
