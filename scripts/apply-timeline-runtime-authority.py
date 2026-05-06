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
            <button type="button" data-timeline-mode="stack" aria-pressed="true">Stack <b data-timeline-mode-count="stack">0</b></button>
            <button type="button" data-timeline-mode="artifact" aria-pressed="false">Artifacts <b data-timeline-mode-count="artifact">0</b></button>
            <button type="button" data-timeline-mode="host" aria-pressed="false">Hosts <b data-timeline-mode-count="host">0</b></button>
            <button type="button" data-timeline-mode="repository" aria-pressed="false">Repos <b data-timeline-mode-count="repository">0</b></button>
            <button type="button" data-timeline-mode="package" aria-pressed="false">Packages <b data-timeline-mode-count="package">0</b></button>
          </div>
        </div>

        <div class="oc-timeline-instruction">
          Click any object to open its native static detail. Selection is resolved by URL fragment and CSS target state before JavaScript.
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
.oc-timeline-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px}
.oc-timeline-head span{display:block;color:#73d0ff;font:900 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em}
.oc-timeline-head strong{display:block;margin-top:4px;color:#eaf6ff;font:900 12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-actions{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.oc-timeline-actions button{appearance:none;cursor:pointer;color:#cfe6f8;border:1px solid rgba(115,208,255,.18);border-radius:999px;background:rgba(255,255,255,.04);padding:6px 9px;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase}
.oc-timeline-actions b{display:inline-grid;place-items:center;min-width:15px;height:15px;margin-left:4px;border-radius:999px;background:rgba(115,208,255,.12);color:#9ee6b8;font:900 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-actions button[aria-pressed="true"],.oc-timeline-actions button.is-selected{color:#9ee6b8;border-color:rgba(115,208,255,.72);background:rgba(115,208,255,.14)}
.oc-timeline-instruction{margin:0 0 10px;color:#8fa5b9;font:800 10px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-track{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px}
.oc-timeline-node{appearance:none;display:grid;gap:3px;min-width:0;min-height:62px;padding:8px 6px;text-align:left;cursor:pointer;color:#dcecff;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.035)}
.oc-timeline-node span{color:#73d0ff;font:900 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-node strong,.oc-timeline-node em{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.oc-timeline-node strong{font:900 10px/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-node em{color:#8fa5b9;font:800 9px/1.1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-style:normal}
.oc-timeline-node:hover,.oc-timeline-node:focus-visible,.oc-timeline-node.is-selected{outline:none;border-color:rgba(115,208,255,.72);background:linear-gradient(180deg,rgba(115,208,255,.18),rgba(115,208,255,.07));box-shadow:0 0 0 1px rgba(115,208,255,.32),0 12px 34px rgba(0,0,0,.28)}
.oc-timeline-node.is-selected em{color:#9ee6b8}
.oc-timeline-detail{margin-top:10px;padding:10px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.035)}
.oc-timeline-detail strong{display:block;color:#f2f8ff;font:900 12px/1.25 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-detail p{margin:5px 0 8px;color:#b8c7d6;font:600 12px/1.35 Inter,ui-sans-serif,system-ui,sans-serif}
.oc-timeline-detail dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0}
.oc-timeline-detail div{min-width:0;padding:6px;border-radius:10px;background:rgba(0,0,0,.18)}
.oc-timeline-detail dt,.oc-timeline-detail dd{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 9px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.oc-timeline-detail dt{color:#73d0ff}.oc-timeline-detail dd{color:#dcecff;margin-top:3px}
@media (max-width:1320px), (max-height:780px){.oc-main-stack-timeline{top:auto;left:300px;right:320px;bottom:132px;transform:none;width:auto;min-width:0}.oc-timeline-track{grid-template-columns:repeat(3,minmax(0,1fr))}.oc-timeline-detail{display:none}}
@media (max-width:900px), (max-height:640px){.oc-main-stack-timeline{display:none}}

/* VERIFRAX_EMERGENCY_MAIN_STACK_TIMELINE_POINTER_QUARANTINE
   Static timeline is a support control, not the center WebGL selection plane.
   It must remain selectable without consuming the machine pointer plane or panel-area budget.
*/
.oc-main-stack-timeline{
  top:112px !important;
  left:auto !important;
  right:14px !important;
  bottom:auto !important;
  transform:none !important;
  width:min(240px,calc(100vw - 44px)) !important;
  min-width:0 !important;
  max-height:min(280px,calc(100vh - 300px)) !important;
  overflow:auto !important;
  z-index:18 !important;
  pointer-events:none !important;
}
.oc-main-stack-timeline :is(button,a,input,select,textarea,[tabindex]){
  pointer-events:auto !important;
}
.oc-main-stack-timeline .oc-timeline-instruction,
.oc-main-stack-timeline .oc-timeline-detail{
  display:none !important;
}
.oc-main-stack-timeline .oc-timeline-track{
  grid-template-columns:1fr !important;
  gap:5px !important;
}
.oc-main-stack-timeline .oc-timeline-node{
  min-height:36px !important;
  padding:4px 5px !important;
}
.oc-main-stack-timeline .oc-timeline-node .oc-node-role,
.oc-main-stack-timeline .oc-timeline-node .oc-node-desc{
  display:none !important;
}
@media (max-width:1100px), (max-height:720px){
  .oc-main-stack-timeline{
    display:none !important;
  }
}

'''

PACKAGE_BLOCK = r'''
  if (mode === "package") {
    const packages = (timelineContract.packages && timelineContract.packages.length)
      ? timelineContract.packages
      : (manifest.packages || []);

    return packages.map((pkg, index) => ({
      id: pkg.id || pkg.name || `package-${index + 1}`,
      ordinal: pkg.ordinal || index + 1,
      label: pkg.label || pkg.name || pkg.id || `Package ${index + 1}`,
      role: [pkg.ecosystem, pkg.version || pkg.version_status].filter(Boolean).join(" / ") || pkg.role || "package boundary",
      question: pkg.question || pkg.description || pkg.source_repo || "Which package boundary is selected?",
      repo: pkg.repo || pkg.source_repo || "Verifrax/VERIFRAX",
      owns: pkg.owns || [
        pkg.ecosystem ? `${pkg.ecosystem} package surface` : "package surface",
        pkg.version || pkg.version_status || "versioned distribution",
        pkg.source_repo || pkg.repo || "source repository binding"
      ],
      must_not_own: pkg.must_not_own || [
        "constitutional law",
        "accepted state",
        "authority issuance",
        "governed execution",
        "package sovereignty"
      ]
    }));
  }

'''

EMPTY_DENIAL = r'''
function timelineEmptyModeDenial(mode) {
  return [{
    id: `${mode}-empty-denial`,
    ordinal: 0,
    label: `${mode.toUpperCase()} MODE EMPTY`,
    role: "denied empty projection mode",
    question: "This timeline mode has no selectable projection objects and is therefore denied.",
    repo: "DERIVED_PROJECTION",
    owns: ["empty-mode denial", "runtime safety surface"],
    must_not_own: ["silent empty UI", "false completeness", "truth source"]
  }];
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
    start = css.find("/* VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_CSS */")
    if start != -1:
        css = css[:start].rstrip()
    CSS.write_text(css.rstrip() + "\n\n" + CSS_BLOCK.lstrip())

def replace_package_mode(js: str) -> str:
    pattern = re.compile(r'\n  if \(mode === "package"\) \{.*?\n  \}\n\n  return timelineContract\.stack \|\| \[\];\n\}', re.S)
    if pattern.search(js):
        return pattern.sub("\n" + PACKAGE_BLOCK + "  return timelineContract.stack || [];\n}", js, count=1)
    needle = '\n  return timelineContract.stack || [];\n}'
    if needle not in js:
        raise SystemExit("runtime: timelineObjectFromMode return needle missing")
    return js.replace(needle, "\n" + PACKAGE_BLOCK + "  return timelineContract.stack || [];\n}", 1)

def patch_runtime() -> None:
    js = RUNTIME.read_text()

    if "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2" not in js:
        js = js.replace(
            "/* BEGIN VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_RUNTIME */",
            "/* BEGIN VERIFRAX_COMPLETE_MAIN_STACK_TIMELINE_RUNTIME */\n/* VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2 */",
            1,
        )

    if "VERIFRAX_TIMELINE_MODE_AUTHORITY_V3" not in js:
        js = js.replace(
            "/* VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2 */",
            "/* VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2 */\n/* VERIFRAX_TIMELINE_MODE_AUTHORITY_V3 */",
            1,
        )

    js = replace_package_mode(js)

    if "function timelineEmptyModeDenial(mode)" not in js:
        js = js.replace(
            "function hydrateCompleteMainStackTimeline(container, manifest, timelineContract = null) {",
            EMPTY_DENIAL + "function hydrateCompleteMainStackTimeline(container, manifest, timelineContract = null) {",
            1,
        )

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
            1,
        )

    if "const timelineContract = await timelineResponse.json();" not in js:
        js = js.replace(
            "    const attestation = await attestationResponse.json();",
            "    const attestation = await attestationResponse.json();\n    const timelineContract = await timelineResponse.json();",
            1,
        )

    js = js.replace(
        "function hydrateCommandSurface(container, manifest, attestation) {",
        "function hydrateCommandSurface(container, manifest, attestation, timelineContract) {",
    )
    js = js.replace(
        "hydrateCommandSurface(container, manifest, attestation);",
        "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
    )
    js = js.replace(
        "hydrateCompleteMainStackTimeline(container, manifest);",
        "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
    )

    if "hash.match(/^#timeline:([^:]+):(.+)$/)" not in js:
        js = js.replace(
            'let selectedId = shell.dataset.selectedTimelineId || new URL(location.href).hash.replace(/^#timeline:/, "") || objects[0]?.id;',
            '''let hashMatch = new URL(location.href).hash.match(/^#timeline:([^:]+):(.+)$/);
  if (hashMatch) {
    mode = hashMatch[1];
    objects = timelineObjectFromMode(mode, manifest, contract);
  }
  if (!objects.length) objects = timelineEmptyModeDenial(mode);
  let selectedId = shell.dataset.selectedTimelineId || (hashMatch ? hashMatch[2] : null) || objects[0]?.id;''',
            1,
        )

    js = js.replace(
        "objects = timelineObjectFromMode(mode, manifest, contract);",
        "objects = timelineObjectFromMode(mode, manifest, contract);\n    if (!objects.length) objects = timelineEmptyModeDenial(mode);",
        1,
    )

    js = js.replace("url.hash = `timeline:${item.id}`;", "url.hash = `timeline:${mode}:${item.id}`;")

    if "const modeCounts = {" not in js:
        needle = '      button.classList.toggle("is-selected", active);'
        if needle not in js:
            raise SystemExit("runtime: mode-count needle missing")
        js = js.replace(needle, needle + '''

    const modeCounts = {
      stack: timelineObjectFromMode("stack", manifest, contract).length,
      artifact: timelineObjectFromMode("artifact", manifest, contract).length,
      host: timelineObjectFromMode("host", manifest, contract).length,
      repository: timelineObjectFromMode("repository", manifest, contract).length,
      package: timelineObjectFromMode("package", manifest, contract).length
    };

    shell.querySelectorAll("[data-timeline-mode-count]").forEach((node) => {
      const key = node.getAttribute("data-timeline-mode-count");
      node.textContent = String(modeCounts[key] || 0);
    });''', 1)

    if "Must not own" not in js:
        js = js.replace(
            '''          <div><dt>Role</dt><dd>${escapeHtml(item.role || "")}</dd></div>
        </dl>''',
            '''          <div><dt>Role</dt><dd>${escapeHtml(item.role || "")}</dd></div>
          <div><dt>Owns</dt><dd>${escapeHtml((item.owns || []).join(" · ") || "bounded projection object")}</dd></div>
          <div><dt>Must not own</dt><dd>${escapeHtml((item.must_not_own || []).join(" · ") || "truth source")}</dd></div>
        </dl>''',
            1,
        )

    js = "\n".join(
        line for line in js.splitlines()
        if line.strip() != "if (!objects.length) objects = timelineEmptyModeDenial(mode);"
    ) + "\n"

    hash_block = """  if (hashMatch) {
    mode = hashMatch[1];
    objects = timelineObjectFromMode(mode, manifest, contract);
  }
"""
    if hash_block not in js:
        raise SystemExit("runtime: hash mode selection block missing")
    js = js.replace(
        hash_block,
        hash_block + "    if (!objects.length) objects = timelineEmptyModeDenial(mode);\n",
        1,
    )

    js = re.sub(r'\n\s*hydrateMainStackTimeline\(container,\s*manifest\);\n', "\n", js)

    required = [
        "VERIFRAX_TIMELINE_RUNTIME_AUTHORITY_V2",
        "VERIFRAX_TIMELINE_MODE_AUTHORITY_V3",
        'if (mode === "package")',
        "timelineContract.packages",
        "function timelineEmptyModeDenial(mode)",
        'fetch(TIMELINE_URL, { cache: "no-store" })',
        "const timelineContract = await timelineResponse.json();",
        "function hydrateCommandSurface(container, manifest, attestation, timelineContract)",
        "hydrateCommandSurface(container, manifest, attestation, timelineContract);",
        "hydrateCompleteMainStackTimeline(container, manifest, timelineContract);",
        "hash.match(/^#timeline:([^:]+):(.+)$/)",
        "url.hash = `timeline:${mode}:${item.id}`",
        "const modeCounts = {",
        "data-timeline-mode-count",
        "Must not own",
        "Owns",
    ]
    missing = [x for x in required if x not in js]
    if missing:
        raise SystemExit(f"runtime missing timeline authority pieces: {missing}")
    if "hydrateMainStackTimeline(container, manifest);" in js:
        raise SystemExit("legacy timeline hydrator still clobbers complete timeline")

    RUNTIME.write_text(js)

def mirror_contract() -> None:
    src = ROOT / "data/main-stack-timeline.json"
    dsts = [
        ROOT / "data/timeline/main-stack-timeline.json",
        ROOT / "public/data/timeline/main-stack-timeline.json",
    ]
    if src.exists():
        for dst in dsts:
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
