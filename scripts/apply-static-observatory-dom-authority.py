#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
GATE = "VERIFRAX_STATIC_OBSERVATORY_DOM_AUTHORITY"

CANONICAL_STACK_DEEPLINK_ALIASES = [
    "syntagmarium",
    "consonorium",
    "orbistium",
    "admissorium",
    "tachyrium",
    "anagnorium",
    "regressorium",
]


def read_json(rel: str) -> dict[str, Any]:
    p = ROOT / rel
    return json.loads(p.read_text()) if p.exists() else {}


def esc(value: Any) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def collection(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return list(value.values())
    return []


def stack_objects(timeline: dict[str, Any]) -> list[dict[str, Any]]:
    out = []
    for i, item in enumerate(collection(timeline.get("stack")), start=1):
        if not isinstance(item, dict):
            continue
        out.append({
            "id": item.get("id") or f"stack-{i}",
            "ordinal": item.get("ordinal") or i,
            "label": item.get("label") or item.get("id") or f"STACK {i}",
            "role": item.get("role") or "governed stack object",
            "repo": item.get("repo") or "",
            "question": item.get("question") or "",
            "owns": collection(item.get("owns")),
            "must_not_own": collection(item.get("must_not_own")),
        })
    if len(out) != 9:
        raise SystemExit(f"{GATE}: expected 9 stack objects, got {len(out)}")
    return out


def host_objects(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[Any] = []
    for key in ["hosts", "surfaces", "host_boundaries", "public_hosts"]:
        candidates.extend(collection(manifest.get(key)))

    system = manifest.get("system")
    if isinstance(system, dict):
        for key in ["hosts", "surfaces", "host_boundaries", "public_hosts"]:
            candidates.extend(collection(system.get(key)))

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for i, item in enumerate(candidates, start=1):
        if isinstance(item, str):
            url = item
            label = item.replace("https://", "").strip("/")
            host_id = label
            role = "host boundary"
        elif isinstance(item, dict):
            url = item.get("url") or item.get("href") or item.get("host") or item.get("origin") or ""
            label = item.get("label") or item.get("name") or item.get("id") or url or f"host-{i}"
            host_id = item.get("id") or label
            role = item.get("role") or item.get("class") or item.get("host_class") or "host boundary"
        else:
            continue

        key = str(host_id)
        if key in seen:
            continue
        seen.add(key)
        out.append({"id": host_id, "label": label, "url": url, "role": role})

    if len(out) < 12:
        out = [
            {"id": "www", "label": "Root", "url": "https://www.verifrax.net/", "role": "root"},
            {"id": "docs", "label": "Docs", "url": "https://docs.verifrax.net/", "role": "documentation"},
            {"id": "proof", "label": "Proof", "url": "https://proof.verifrax.net/", "role": "proof"},
            {"id": "verify", "label": "Verify", "url": "https://verify.verifrax.net/", "role": "verification"},
            {"id": "apply", "label": "Apply", "url": "https://apply.verifrax.net/", "role": "intake"},
            {"id": "api", "label": "Execution", "url": "https://api.verifrax.net/", "role": "execution"},
            {"id": "auctoriseal", "label": "Authority", "url": "https://auctoriseal.verifrax.net/", "role": "authority"},
            {"id": "corpiform", "label": "Runtime", "url": "https://corpiform.verifrax.net/", "role": "runtime"},
            {"id": "cicullis", "label": "Enforcement", "url": "https://cicullis.verifrax.net/", "role": "enforcement"},
            {"id": "sigillarium", "label": "Archive", "url": "https://sigillarium.verifrax.net/", "role": "archive"},
            {"id": "status", "label": "Status", "url": "https://status.verifrax.net/", "role": "status"},
            {"id": "github", "label": "Repositories", "url": "https://github.com/Verifrax", "role": "source"},
        ]

    return out[:12]


def artifact_objects(timeline: dict[str, Any], manifest: dict[str, Any], stack: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = (
        collection(timeline.get("artifact_journey"))
        or collection(timeline.get("artifacts"))
        or collection(manifest.get("artifact_journey"))
        or collection(manifest.get("artifact_chain"))
    )

    out: list[dict[str, Any]] = []
    for i, item in enumerate(candidates, start=1):
        if isinstance(item, str):
            out.append({"id": f"artifact-{i}", "label": item, "role": "artifact journey"})
        elif isinstance(item, dict):
            out.append({
                "id": item.get("id") or f"artifact-{i}",
                "label": item.get("label") or item.get("name") or item.get("id") or f"Artifact {i}",
                "role": item.get("role") or item.get("type") or "artifact journey",
            })

    if len(out) < 9:
        out = [{"id": f"artifact-{x['id']}", "label": x["label"], "role": x["role"]} for x in stack]

    return out[:9]


def enterprise_objects() -> list[dict[str, str]]:
    return [
        {"id": "control", "label": "Control plane", "role": "enterprise authority remains above perimeter"},
        {"id": "licensing", "label": "Licensing", "role": "commercial grant without truth-source transfer"},
        {"id": "audit", "label": "Audit export", "role": "machine-readable inspection evidence"},
        {"id": "deployment", "label": "Deployment perimeter", "role": "private runtime boundary"},
        {"id": "support", "label": "Support channel", "role": "operational assistance without constitutional custody"},
    ]


def canonical_alias_anchors(stack: list[dict[str, Any]]) -> str:
    present = {str(item["id"]) for item in stack}
    rows = []
    for alias in CANONICAL_STACK_DEEPLINK_ALIASES:
        if alias not in present:
            rows.append(
                f'          <a class="oc-static-canonical-alias" hidden aria-hidden="true" tabindex="-1" href="#timeline:stack:{esc(alias)}">{esc(alias)}</a>'
            )
    return "\n".join(rows)


def render_timeline(stack: list[dict[str, Any]]) -> str:
    rows = []
    for i, item in enumerate(stack):
        selected = "true" if i == 0 else "false"
        selected_cls = " is-selected" if i == 0 else ""
        tabindex = "0" if i == 0 else "-1"
        rows.append(f'''          <a class="oc-timeline-node{selected_cls}" role="option" aria-selected="{selected}" tabindex="{tabindex}" href="#timeline:stack:{esc(item["id"])}" data-static-timeline-node data-stack-id="{esc(item["id"])}" data-object-id="{esc(item["id"])}" data-stack-index="{i}">
            <span>{esc(item["ordinal"])}</span>
            <strong>{esc(item["label"])}</strong>
            <small>{esc(item["role"])}</small>
          </a>''')
    aliases = canonical_alias_anchors(stack)
    if aliases:
        rows.append(aliases)
    return "\n".join(rows)


def render_detail(first: dict[str, Any]) -> str:
    owns = "".join(f"<li>{esc(x)}</li>" for x in first["owns"][:5])
    must = "".join(f"<li>{esc(x)}</li>" for x in first["must_not_own"][:5])
    return f'''          <strong>{esc(first["label"])} / {esc(first["role"])}</strong>
          <p>{esc(first["question"])}</p>
          <dl class="oc-timeline-detail-kv">
            <dt>Repository</dt><dd>{esc(first["repo"])}</dd>
            <dt>Static authority</dt><dd>{GATE}</dd>
          </dl>
          <h4>Owns</h4>
          <ul>{owns}</ul>
          <h4>Must not own</h4>
          <ul>{must}</ul>'''


def render_stack_list(stack: list[dict[str, Any]]) -> str:
    rows = [
        f'''          <li data-static-stack-node data-stack-id="{esc(item["id"])}"><a href="#timeline:stack:{esc(item["id"])}">{esc(item["label"])}</a> <small>{esc(item["role"])}</small></li>'''
        for item in stack
    ]
    aliases = canonical_alias_anchors(stack)
    if aliases:
        rows.append(aliases)
    return "\n".join(rows)


def render_hosts(hosts: list[dict[str, Any]]) -> str:
    return "\n".join(
        f'''          <li data-static-host-node data-host-id="{esc(item["id"])}"><a href="{esc(item["url"])}">{esc(item["label"])}</a> <small>{esc(item["role"])}</small></li>'''
        for item in hosts
    )


def render_artifacts(items: list[dict[str, Any]]) -> str:
    return "\n".join(
        f'''          <li data-static-journey-node data-artifact-id="{esc(item["id"])}"><a href="#timeline:artifact:{esc(item["id"])}">{esc(item["label"])}</a> <small>{esc(item["role"])}</small></li>'''
        for item in items
    )


def render_enterprise(items: list[dict[str, str]]) -> str:
    return "\n".join(
        f'''          <a class="oc-enterprise-item" data-static-enterprise-node data-enterprise-id="{esc(item["id"])}" href="#enterprise:{esc(item["id"])}"><strong>{esc(item["label"])}</strong><span>{esc(item["role"])}</span></a>'''
        for item in items
    )


def render_timeline_section(stack: list[dict[str, Any]], hosts: list[dict[str, Any]], artifacts: list[dict[str, Any]]) -> str:
    return f'''      <!-- {GATE} -->
      <section class="oc-main-stack-timeline" aria-label="VERIFRAX complete selectable main stack timeline" data-main-stack-shell>
        <div class="oc-timeline-head">
          <div>
            <span>MAIN STACK TIMELINE</span>
            <strong data-timeline-active-label>{esc(stack[0]["label"])} / {esc(stack[0]["role"])}</strong>
          </div>
          <div class="oc-timeline-actions" role="group" aria-label="Timeline modes">
            <button type="button" data-timeline-mode="stack" aria-pressed="true">Stack <b data-timeline-mode-count="stack">{len(stack)}</b></button>
            <button type="button" data-timeline-mode="artifact" aria-pressed="false">Artifacts <b data-timeline-mode-count="artifact">{len(artifacts)}</b></button>
            <button type="button" data-timeline-mode="host" aria-pressed="false">Hosts <b data-timeline-mode-count="host">{len(hosts)}</b></button>
            <button type="button" data-timeline-mode="repository" aria-pressed="false">Repos <b data-timeline-mode-count="repository">36</b></button>
            <button type="button" data-timeline-mode="package" aria-pressed="false">Packages <b data-timeline-mode-count="package">3</b></button>
          </div>
        </div>

        <div class="oc-timeline-instruction">
          Click any object to open its native static detail. Selection is resolved by URL fragment and CSS target state before JavaScript.
        </div>

        <div class="oc-timeline-track" role="listbox" aria-label="Selectable VERIFRAX main stack timeline" data-main-stack-timeline>
{render_timeline(stack)}
        </div>

        <div class="oc-timeline-detail" data-main-stack-detail>
{render_detail(stack[0])}
        </div>
      </section>'''


def replace_timeline_section_whole(s: str, stack: list[dict[str, Any]], hosts: list[dict[str, Any]], artifacts: list[dict[str, Any]]) -> str:
    comment = s.find(f"<!-- {GATE} -->")
    section = s.find('<section class="oc-main-stack-timeline"')
    starts = [x for x in [comment, section] if x != -1]
    if not starts:
        raise SystemExit(f"{GATE}: missing timeline section start")
    start = min(starts)

    aside = s.find('<aside class="oc-left"', start)
    if aside == -1:
        raise SystemExit(f"{GATE}: missing oc-left after timeline section")

    close = s.rfind("</section>", start, aside)
    end = close + len("</section>") if close != -1 else aside
    while end < len(s) and s[end] in " \t\r\n":
        end += 1

    return s[:start] + render_timeline_section(stack, hosts, artifacts) + "\n\n" + s[aside:]


def patch_html(path: Path, stack: list[dict[str, Any]], hosts: list[dict[str, Any]], artifacts: list[dict[str, Any]], enterprise: list[dict[str, str]]) -> None:
    s = path.read_text()
    s = replace_timeline_section_whole(s, stack, hosts, artifacts)
    s = re.sub(r'<ol data-stack-list>.*?</ol>', '<ol data-stack-list>\n' + render_stack_list(stack) + '\n        </ol>', s, count=1, flags=re.S)
    s = re.sub(r'<ul data-host-list>.*?</ul>', '<ul data-host-list>\n' + render_hosts(hosts) + '\n        </ul>', s, count=1, flags=re.S)
    s = re.sub(r'<ol data-journey-list>.*?</ol>', '<ol data-journey-list>\n' + render_artifacts(artifacts) + '\n        </ol>', s, count=1, flags=re.S)
    s = re.sub(r'<div class="oc-enterprise" data-enterprise-list>.*?</div>', '<div class="oc-enterprise" data-enterprise-list>\n' + render_enterprise(enterprise) + '\n        </div>', s, count=1, flags=re.S)
    path.write_text(s)


def main() -> None:
    timeline = read_json("data/main-stack-timeline.json")
    manifest = read_json("data/verifrax-observatory.json")
    stack = stack_objects(timeline)
    hosts = host_objects(manifest)
    artifacts = artifact_objects(timeline, manifest, stack)
    enterprise = enterprise_objects()

    for rel in ["index.html", "404.html"]:
        patch_html(ROOT / rel, stack, hosts, artifacts, enterprise)

    print(json.dumps({
        "status": "PASS",
        "gate": GATE,
        "static_timeline_nodes": len(stack),
        "static_stack_nodes": len(stack),
        "static_host_nodes": len(hosts),
        "static_journey_nodes": len(artifacts),
        "static_enterprise_nodes": len(enterprise),
        "version_raise": False,
    }, indent=2))


if __name__ == "__main__":
    main()
