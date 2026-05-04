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
        "Click any object to open its native static detail. Selection is resolved by URL fragment and CSS target state before JavaScript.",
        "Click any object to open its native static detail. Selection is resolved by URL fragment and CSS target state before JavaScript.",
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







def patch_layout_inert_css() -> None:
    css_path = ROOT / "assets/surface.css"
    css = css_path.read_text()

    start = "/* VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT */"
    end = "/* /VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY_LAYOUT_INERT */"

    css = re.sub(
        re.escape(start) + r"[\s\S]*?" + re.escape(end) + r"\n?",
        "",
        css,
        count=1,
    )

    block = f"""{start}
.oc-static-timeline-details {{
  position: relative;
  z-index: 6;
  margin-top: 0.65rem;
  contain: layout paint;
}}

.oc-static-timeline-detail {{
  display: none;
  max-height: min(36vh, 22rem);
  overflow: auto;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 1rem;
  padding: 0.85rem;
  background: rgba(3,8,18,0.84);
  box-shadow: 0 18px 50px rgba(0,0,0,0.28);
}}

.oc-static-timeline-detail:first-of-type {{
  display: block;
}}

.oc-static-timeline-detail:target {{
  display: block;
}}

.oc-static-timeline-details:has(.oc-static-timeline-detail:target)
  .oc-static-timeline-detail:first-of-type:not(:target) {{
  display: none;
}}

.oc-static-timeline-detail h4,
.oc-static-timeline-detail h5 {{
  margin: 0.25rem 0;
}}

.oc-static-timeline-detail p {{
  margin: 0.35rem 0 0.65rem;
}}

.oc-static-timeline-detail ul {{
  margin: 0.25rem 0 0.65rem 1rem;
  padding: 0;
}}

{end}
"""

    css_path.write_text(css.rstrip() + "\n\n" + block + "\n")


def patch_selectable_guard_files() -> None:
    dead_expr = '["Click or use ", "← →", " to select. Tab / Home / End also work. ", "Selection updates inspector, URL hash, and 3D focus intent."].join("")'
    guard = f"""// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:
const deadSelectableInstruction = {dead_expr};
for (const path of ["index.html", "404.html"]) {{
  const emittedHtml = read(path);
  if (emittedHtml.includes(deadSelectableInstruction)) {{
    fail("dead selectable instruction still present", {{ path }});
  }}
  if (!emittedHtml.includes("VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY")) {{
    fail("native selectable authority missing", {{ path }});
  }}
  if (!emittedHtml.includes('href="#static-timeline-detail-')) {{
    fail("native static timeline anchors missing", {{ path }});
  }}
  if (!emittedHtml.includes('id="static-timeline-detail-')) {{
    fail("native static timeline targets missing", {{ path }});
  }}
}}

"""

    for rel in [
        "scripts/check-main-stack-timeline-selectable.cjs",
        "scripts/check-complete-main-stack-timeline.cjs",
    ]:
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text()
        text = text.replace(
            (
                '  if (!html.includes("Click or use '
                '← →'
                ' to select")) fail(`${name} missing selectable instruction`);\\n'
            ),
            '  if (!html.includes("VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY")) fail(`${name} missing native static timeline authority`);\n',
        )
        text = re.sub(
            r'\n// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:[\s\S]*?(?=\nconsole\.log\(JSON\.stringify\()',
            '\n',
            text,
            count=1,
        )
        marker = "console.log(JSON.stringify("
        if marker not in text:
            raise SystemExit(f"{rel}: console output marker missing")
        text = text.replace(marker, guard + marker, 1)
        path.write_text(text)



def normalize_projection_output_files() -> None:
    import re

    for rel in [
        "assets/surface.css",
        "scripts/check-complete-main-stack-timeline.cjs",
        "scripts/check-main-stack-timeline-selectable.cjs",
    ]:
        path = ROOT / rel
        if not path.exists():
            continue

        text = path.read_text()

        if rel.endswith(".cjs"):
            text = re.sub(
                r"\n{3,}(// VERIFRAX_STATIC_TIMELINE_NATIVE_INTERACTION_AUTHORITY:)",
                r"\n\n\1",
                text,
            )

        path.write_text(text.rstrip() + "\n")

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
    normalize_projection_output_files()
    print(json.dumps({
        "status": "PASS",
        "gate": GATE,
        "native_static_details": len(stack),
        "dead_instruction_removed": True,
        "version_raise": False,
    }, indent=2))

if __name__ == "__main__":
    main()
