#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GATE = "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY"

def esc(x):
    return html.escape(str(x or ""), quote=True)

def load_stack():
    return json.loads((ROOT / "data/main-stack-timeline.json").read_text())["stack"]

def render_static_details(stack):
    cards = []
    for item in stack:
        owns = "".join(f"<li>{esc(x)}</li>" for x in item.get("owns", [])[:5])
        must_not = "".join(f"<li>{esc(x)}</li>" for x in item.get("must_not_own", [])[:5])
        repo = item.get("repository") or item.get("repo") or f"Verifrax/{item['label']}"
        cards.append(f'''          <section id="static-timeline-detail-{esc(item["id"])}" class="oc-static-timeline-detail" data-static-timeline-detail data-stack-id="{esc(item["id"])}">
            <h4>{esc(item["label"])} / {esc(item["role"])}</h4>
            <p>{esc(item.get("question", ""))}</p>
            <dl class="oc-timeline-detail-kv">
              <dt>Repository</dt><dd>{esc(repo)}</dd>
              <dt>Static authority</dt><dd>{GATE}</dd>
            </dl>
            <h5>Owns</h5>
            <ul>{owns}</ul>
            <h5>Must not own</h5>
            <ul>{must_not}</ul>
          </section>''')
    return "\n".join(cards)

def patch_html(path: Path, stack):
    s = path.read_text()

    s = s.replace(
        "Click or use ← → to select. Tab / Home / End also work. Selection updates inspector, URL hash, and 3D focus intent.",
        "Click any object to open its native static detail. JavaScript enhances keyboard selection, inspector updates, URL hash, and 3D focus intent when available.",
    )

    for item in stack:
        old = f'href="#timeline:stack:{item["id"]}"'
        new = f'href="#static-timeline-detail-{item["id"]}"'
        s = s.replace(old, new)

    # Keep canonical hidden alias for legacy deep-link discovery, but do not advertise it as the native click target.
    marker = "<!-- VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY -->"
    s = re.sub(r"\n\s*<!-- VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY -->.*?(?=\n\s*</section>\n\n<aside class=\"oc-left\">)", "", s, flags=re.S)

    insert = "\n        " + marker + "\n        <div class=\"oc-static-timeline-details\" data-static-timeline-details>\n" + render_static_details(stack) + "\n        </div>"
    s = s.replace("\n      </section>\n\n<aside class=\"oc-left\">", insert + "\n      </section>\n\n<aside class=\"oc-left\">", 1)

    path.write_text(s)

def patch_css():
    p = ROOT / "assets/surface.css"
    s = p.read_text()
    block = f'''
/* {GATE} */
.oc-static-timeline-details {{
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}}
.oc-static-timeline-detail {{
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 1rem;
  padding: 0.9rem;
  background: rgba(0,0,0,0.24);
}}
.oc-static-timeline-detail:target {{
  outline: 2px solid rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.08);
}}
.oc-static-timeline-detail h4,
.oc-static-timeline-detail h5 {{
  margin: 0 0 0.45rem;
}}
'''
    if GATE not in s:
        s = s.rstrip() + "\n\n" + block.strip() + "\n"
    p.write_text(s)

def patch_runtime_marker():
    p = ROOT / "assets/observatory-webgl-runtime.js"
    s = p.read_text()
    if GATE not in s:
        s = s.replace(
            "/* VERIFRAX_STATIC_COUNT_AUTHORITY */" if "/* VERIFRAX_STATIC_COUNT_AUTHORITY */" in s else "/* VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY */",
            "/* VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY */\n/* VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY */",
            1,
        )
    p.write_text(s)


def ensure_canonical_stack_deeplink_aliases(path, stack):
    import re

    s = path.read_text()
    marker = "VERIFRAX_STATIC_TIMELINE_CANONICAL_DEEPLINK_ALIASES"

    s = re.sub(
        rf'\n\s*<!-- {marker} -->.*?<!-- /{marker} -->\n?',
        "\n",
        s,
        flags=re.S,
    )

    aliases = "\n".join(
        f'          <a class="oc-static-canonical-alias" hidden aria-hidden="true" tabindex="-1" href="#timeline:stack:{esc(item["id"])}">{esc(item["id"])}</a>'
        for item in stack
    )

    block = (
        "\n          <!-- " + marker + " -->\n"
        + aliases
        + "\n          <!-- /" + marker + " -->"
    )

    pattern = r'(<div class="oc-timeline-track"[^>]*data-main-stack-timeline[^>]*>.*?)(\n\s*</div>\s*\n\s*<div class="oc-timeline-detail")'
    next_s, n = re.subn(
        pattern,
        lambda m: m.group(1) + block + m.group(2),
        s,
        count=1,
        flags=re.S,
    )

    if n != 1:
        raise SystemExit(f"{path}: timeline track insertion point missing")

    path.write_text(next_s)





def patch_selectable_guard_files() -> None:
    import re

    guard_lines = [
        "// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:",
        "// Static selection is native anchor/:target authority. The old JS-only instruction is forbidden.",
        'if (index.includes("Click or use ← → to select. Tab / Home / End also work. Selection updates inspector, URL hash, and 3D focus intent.")) {',
        '  fail("dead selectable instruction still present");',
        "}",
        "",
        "for (const needle of [",
        '  "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY",',
        '  "data-static-timeline-details",',
        "  'href=\"#static-timeline-detail-',",
        "  'id=\"static-timeline-detail-'",
        "]) {",
        "  if (!index.includes(needle) && !runtime.includes(needle) && !css.includes(needle)) {",
        '    fail("native selectable authority missing", { needle });',
        "  }",
        "}",
        "",
    ]
    guard = "\n".join(guard_lines)

    positive_old = '  if (!html.includes("Click or use ← → to select")) fail(`${name} missing selectable instruction`);\n'
    positive_new = (
        '  if (!html.includes("VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY")) fail(`${name} missing native static timeline authority`);\n'
        "  if (!html.includes('href=\"#static-timeline-detail-')) fail(`${name} missing native static timeline anchors`);\n"
    )

    guard_re = r'\n{0,8}// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:[\s\S]*?(?=\nconsole\.log\(JSON\.stringify\()'

    for rel in [
        "scripts/check-main-stack-timeline-selectable.cjs",
        "scripts/check-complete-main-stack-timeline.cjs",
    ]:
        path = ROOT / rel
        if not path.exists():
            continue

        text = path.read_text()
        text = text.replace(positive_old, positive_new)
        text = re.sub(guard_re, "\n", text, count=0)

        marker = "console.log(JSON.stringify("
        if marker not in text:
            raise SystemExit(f"{rel}: console output marker missing")

        text = re.sub(r"\n{3,}(?=console\.log\(JSON\.stringify\()", "\n\n", text)
        text = text.replace(marker, guard + marker, 1)

        if "index missing selectable instruction" in text:
            raise SystemExit(f"{rel}: stale selectable-instruction failure remains")

        path.write_text(text)



def patch_layout_inert_css() -> None:
    css_path = ROOT / "assets/surface.css"
    css = css_path.read_text() if css_path.exists() else ""

    marker = "VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT"
    block = """
/* VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT */
.oc-static-timeline-details {
  display: block;
  position: static;
  width: 100%;
  max-width: 100%;
  pointer-events: none;
}

.oc-static-timeline-detail {
  display: none;
  margin-top: 0.75rem;
  pointer-events: none;
}

.oc-static-timeline-detail:target {
  display: block;
  pointer-events: auto;
}
""".strip()

    if marker not in css:
        css = css.rstrip() + "\n\n" + block + "\n"
    else:
        css = re.sub(
            r'/\* VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT \*/[\s\S]*?(?=\n/\*|\Z)',
            block,
            css,
            count=1,
        )

    css_path.write_text(css)


def main():
    stack = load_stack()
    for rel in ["index.html", "404.html"]:
        path = ROOT / rel
        patch_html(path, stack)
        ensure_canonical_stack_deeplink_aliases(path, stack)
    patch_css()
    patch_layout_inert_css()
    patch_runtime_marker()
    patch_selectable_guard_files()
    print(json.dumps({
        "status": "PASS",
        "gate": GATE,
        "native_static_details": len(stack),
        "dead_instruction_removed": True,
        "version_raise": False,
    }, indent=2))

if __name__ == "__main__":
    main()
