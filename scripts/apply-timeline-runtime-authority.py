#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / "assets/observatory-webgl-runtime.js"
CSS = ROOT / "assets/surface.css"

TIMELINE_HTML = '''      <section class="oc-main-stack-timeline" aria-label="VERIFRAX complete selectable main stack timeline" data-main-stack-shell>
        <div class="oc-timeline-head">
          <div>
            <span>MAIN STACK TIMELINE</span>
            <strong data-timeline-active-label>SYNTAGMARIUM / law</strong>
          </div>
          <div class="oc-timeline-actions" role="group" aria-label="Timeline modes">
            <button type="button" data-timeline-mode="stack" aria-pressed="true">Stack</button>
            <button type="button" data-timeline-mode="artifact" aria-pressed="false">Artifacts</button>
            <button type="button" data-timeline-mode="host" aria-pressed="false">Hosts</button>
            <button type="button" data-timeline-mode="repository" aria-pressed="false">Repos</button>
            <button type="button" data-timeline-mode="package" aria-pressed="false">Packages</button>
          </div>
        </div>

        <div class="oc-timeline-instruction">
          Click or use ← → to select. Tab / Home / End also work. Selection updates inspector, URL hash, and 3D focus intent.
        </div>

        <div class="oc-timeline-track" role="listbox" aria-label="Selectable VERIFRAX main stack timeline" data-main-stack-timeline></div>

        <div class="oc-timeline-detail" data-main-stack-detail>
          <strong>Selection loading</strong>
          <p>Timeline data is loaded from signed derived projection data. It is not truth source.</p>
        </div>
      </section>

'''

CSS_BLOCK = r'''
/* VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS */
.oc-main-stack-timeline{
  position:absolute;
  z-index:26;
  top:86px;
  left:50%;
  transform:translateX(-50%);
  width:min(760px,calc(100vw - 820px));
  min-width:460px;
  pointer-events:auto;
  border:1px solid rgba(115,208,255,.22);
  border-radius:20px;
  background:linear-gradient(180deg,rgba(2,8,14,.92),rgba(1,5,10,.78));
  box-shadow:0 18px 56px rgba(0,0,0,.36);
  backdrop-filter:blur(14px);
  padding:12px;
}
.oc-timeline-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom:8px;
}
.oc-timeline-head span{
  display:block;
  color:#73d0ff;
  font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  letter-spacing:.14em;
}
.oc-timeline-head strong{
  display:block;
  margin-top:4px;
  color:#eaf6ff;
  font:900 12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-actions{
  display:flex;
  flex-wrap:wrap;
  gap:6px;
  justify-content:flex-end;
}
.oc-timeline-actions button{
  appearance:none;
  cursor:pointer;
  color:#cfe6f8;
  border:1px solid rgba(115,208,255,.18);
  border-radius:999px;
  background:rgba(255,255,255,.04);
  padding:6px 9px;
  font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  text-transform:uppercase;
}
.oc-timeline-actions button[aria-pressed="true"],
.oc-timeline-actions button.is-selected{
  color:#9ee6b8;
  border-color:rgba(115,208,255,.72);
  background:rgba(115,208,255,.14);
}
.oc-timeline-instruction{
  margin:0 0 10px;
  color:#8fa5b9;
  font:800 10px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-track{
  display:grid;
  grid-template-columns:repeat(9,minmax(0,1fr));
  gap:6px;
}
.oc-timeline-node{
  appearance:none;
  display:grid;
  gap:3px;
  min-width:0;
  min-height:62px;
  padding:8px 6px;
  text-align:left;
  cursor:pointer;
  color:#dcecff;
  border:1px solid rgba(255,255,255,.09);
  border-radius:12px;
  background:rgba(255,255,255,.035);
}
.oc-timeline-node span{
  color:#73d0ff;
  font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-node strong,
.oc-timeline-node em{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.oc-timeline-node strong{
  font:900 10px/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-node em{
  color:#8fa5b9;
  font:800 9px/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-style:normal;
}
.oc-timeline-node:hover,
.oc-timeline-node:focus-visible,
.oc-timeline-node.is-selected{
  outline:none;
  border-color:rgba(115,208,255,.72);
  background:linear-gradient(180deg,rgba(115,208,255,.18),rgba(115,208,255,.07));
  box-shadow:0 0 0 1px rgba(115,208,255,.32),0 12px 34px rgba(0,0,0,.28);
}
.oc-timeline-node.is-selected em{color:#9ee6b8}
.oc-timeline-detail{
  margin-top:10px;
  padding:10px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:14px;
  background:rgba(255,255,255,.035);
}
.oc-timeline-detail strong{
  display:block;
  color:#f2f8ff;
  font:900 12px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-detail p{
  margin:5px 0 8px;
  color:#b8c7d6;
  font:600 12px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;
}
.oc-timeline-detail dl{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:6px;
  margin:0;
}
.oc-timeline-detail div{
  min-width:0;
  padding:6px;
  border-radius:10px;
  background:rgba(0,0,0,.18);
}
.oc-timeline-detail dt,
.oc-timeline-detail dd{
  margin:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font:800 9px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.oc-timeline-detail dt{color:#73d0ff}
.oc-timeline-detail dd{color:#dcecff;margin-top:3px}
@media (max-width:1320px), (max-height:780px){
  .oc-main-stack-timeline{
    top:auto;
    left:300px;
    right:320px;
    bottom:132px;
    transform:none;
    width:auto;
    min-width:0;
  }
  .oc-timeline-track{grid-template-columns:repeat(3,minmax(0,1fr))}
  .oc-timeline-detail{display:none}
}
@media (max-width:900px), (max-height:640px){
  .oc-main-stack-timeline{display:none}
}
'''

PACKAGE_BLOCK = r'''
  if (mode === "package") {
    return (manifest.packages || []).map((pkg, index) => ({
      id: pkg.id || pkg.name || `package-${index + 1}`,
      ordinal: index + 1,
      label: pkg.name || pkg.id || `Package ${index + 1}`,
      role: [pkg.ecosystem, pkg.version].filter(Boolean).join(" ") || pkg.role || "package boundary",
      question: pkg.description || pkg.source_repo || "Which package boundary is selected?",
      repo: pkg.source_repo || pkg.repo || "Verifrax/VERIFRAX",
      owns: [
        pkg.ecosystem ? `${pkg.ecosystem} package surface` : "package surface",
        pkg.version ? `version ${pkg.version}` : "versioned distribution",
        pkg.source_repo || "source repository binding"
      ],
      must_not_own: [
        "constitutional law",
        "accepted state",
        "authority issuance",
        "governed execution",
        "package sovereignty"
      ]
    }));
  }

'''

def patch_html(path: Path) -> None:
    html = path.read_text()
    if "data-main-stack-timeline" in html:
        start = html.index('      <section class="oc-main-stack-timeline"')
        end = html.index('      <aside class="oc-left">', start)
        html = html[:start] + TIMELINE_HTML + html[end:]
    else:
        needle = '      </section>\n\n      <aside class="oc-left">'
        if needle not in html:
            raise SystemExit(f"{path.name}: timeline insertion needle missing")
        html = html.replace(needle, "      </section>\n\n" + TIMELINE_HTML + '      <aside class="oc-left">')
    path.write_text(html)

def patch_css() -> None:
    css = CSS.read_text()
    if "VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS" not in css:
        css = css.rstrip() + "\n\n" + CSS_BLOCK.lstrip()
    CSS.write_text(css)

def patch_runtime() -> None:
    js = RUNTIME.read_text()

    if "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2" not in js:
        js = js.replace(
            "/* BEGIN VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_RUNTIME */",
            "/* BEGIN VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_RUNTIME */\n/* VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2 */",
            1,
        )

    if 'if (mode === "package")' not in js:
        needle = '\n  return timelineContract.stack || [];\n}'
        if needle not in js:
            raise SystemExit("runtime: timelineObjectFromMode return needle missing")
        js = js.replace(needle, "\n" + PACKAGE_BLOCK + "  return timelineContract.stack || [];\n}", 1)

    js = js.replace(
        "const [manifestResponse, attestationResponse] = await Promise.all([",
        "const [manifestResponse, attestationResponse, timelineResponse] = await Promise.all([",
    )

    js = js.replace(
        '      fetch(DATA_URL, { cache: "no-store" }),\n      fetch(ATTESTATION_URL, { cache: "no-store" })\n    ]);',
        '      fetch(DATA_URL, { cache: "no-store" }),\n      fetch(ATTESTATION_URL, { cache: "no-store" }),\n      fetch(TIMELINE_URL, { cache: "no-store" })\n    ]);',
    )

    if 'if (!timelineResponse.ok) throw new Error(`timeline fetch failed: ${timelineResponse.status}`);' not in js:
        js = js.replace(
            '    if (!attestationResponse.ok) throw new Error(`attestation fetch failed: ${attestationResponse.status}`);',
            '    if (!attestationResponse.ok) throw new Error(`attestation fetch failed: ${attestationResponse.status}`);\n    if (!timelineResponse.ok) throw new Error(`timeline fetch failed: ${timelineResponse.status}`);',
        )

    if "const timelineContract = await timelineResponse.json();" not in js:
        js = js.replace(
            "    const attestation = await attestationResponse.json();",
            "    const attestation = await attestationResponse.json();\n    const timelineContract = await timelineResponse.json();",
        )

    js = js.replace(
        "hydrateCompleteMainStackTimeline(container, manifest);",
        "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
    )

    js = js.replace(
        "function hydrateCommandSurface(container, manifest, attestation) {",
        "function hydrateCommandSurface(container, manifest, attestation, timelineContract) {",
    )

    js = js.replace(
        "hydrateCommandSurface(container, manifest, attestation);",
        "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
    )

    js = re.sub(r'\n\s*hydrateMainStackTimeline\(container,\s*manifest\);\n', "\n", js)

    required = [
        "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2",
        'if (mode === "package")',
        'fetch(TIMELINE_URL, { cache: "no-store" })',
        "const timelineContract = await timelineResponse.json();",
        "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
        "function hydrateCommandSurface(container, manifest, attestation, timelineContract)",
        "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
    ]
    missing = [x for x in required if x not in js]
    if missing:
        raise SystemExit(f"runtime missing timeline authority pieces: {missing}")
    if re.search(r'\n\s*hydrateMainStackTimeline\(container,\s*manifest\);', js):
        raise SystemExit("legacy timeline hydrator still clobbers complete timeline")

    RUNTIME.write_text(js)

def mirror_contract() -> None:
    src = ROOT / "data/main-stack-timeline.json"
    dst = ROOT / "public/data/timeline/main-stack-timeline.json"
    if src.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)

def main() -> None:
    mirror_contract()
    for rel in ["index.html", "404.html"]:
        patch_html(ROOT / rel)
    patch_css()
    patch_runtime()
    print("timeline runtime authority post-pass PASS")

if __name__ == "__main__":
    main()
