#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TIMELINE = ROOT / "data/main-stack-timeline.json"
OBSERVATORY = ROOT / "data/verifrax-observatory.json"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def count_timeline_mode(mode: str, timeline: dict, observatory: dict) -> int:
    if mode == "stack":
        return len(timeline.get("stack") or [])
    if mode == "package":
        return len(timeline.get("packages") or [])
    if mode == "repository":
        return len(observatory.get("repositories") or [])
    if mode == "host":
        hosts = observatory.get("hosts")
        if isinstance(hosts, list):
            return len(hosts)
        if isinstance(hosts, dict):
            return len(hosts)
        system = observatory.get("system") or {}
        return int(system.get("host_count") or system.get("hosts") or 0)
    if mode == "artifact":
        for key in ("artifacts", "artifact_journey", "journey", "artifact_chain"):
            value = timeline.get(key) or observatory.get(key)
            if isinstance(value, list):
                return len(value)
            if isinstance(value, dict):
                return len(value)
        return 0
    raise ValueError(f"unknown mode: {mode}")


def patch_html(path: Path, counts: dict[str, int]) -> None:
    s = path.read_text()

    for mode, count in counts.items():
        s = re.sub(
            rf'(<b data-timeline-mode-count="{re.escape(mode)}">)\d+(</b>)',
            rf'\g<1>{count}\2',
            s,
        )

    # Hard fail if any timeline count remains zero where the underlying mode is nonzero.
    for mode, count in counts.items():
        needle = f'data-timeline-mode-count="{mode}">{count}</b>'
        if needle not in s:
            raise SystemExit(f"{path}: missing static count {mode}={count}")

    path.write_text(s)


def patch_runtime_guard(path: Path, counts: dict[str, int]) -> None:
    s = path.read_text()
    marker = "/* VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY */"

    if marker not in s:
        s = s.replace(
            "/* VERIFRAX_TIMELINE_MODE_AUTHORITY_V3 */",
            "/* VERIFRAX_TIMELINE_MODE_AUTHORITY_V3 */\n/* VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY */",
            1,
        )

    expected = "const EXPECTED_TIMELINE_STATIC_COUNTS = " + json.dumps(counts, sort_keys=True) + ";"
    if "const EXPECTED_TIMELINE_STATIC_COUNTS =" in s:
        s = re.sub(
            r"const EXPECTED_TIMELINE_STATIC_COUNTS = \{[^;]*\};",
            expected,
            s,
            count=1,
        )
    else:
        anchor = "function hydrateCompleteMainStackTimeline(container, manifest, timelineContract = null) {"
        if anchor not in s:
            raise SystemExit("runtime: complete timeline hydrator missing")
        s = s.replace(anchor, expected + "\n" + anchor, 1)

    path.write_text(s)


def main() -> None:
    timeline = read_json(TIMELINE)
    observatory = read_json(OBSERVATORY)

    modes = timeline.get("selection_modes") or ["stack", "artifact", "host", "repository", "package"]
    counts = {mode: count_timeline_mode(mode, timeline, observatory) for mode in modes}

    if counts.get("stack") != 9:
        raise SystemExit(f"stack count must be 9, got {counts.get('stack')}")
    if counts.get("repository") != 36:
        raise SystemExit(f"repository count must be 36, got {counts.get('repository')}")
    if counts.get("package") != 3:
        raise SystemExit(f"package count must be 3, got {counts.get('package')}")
    if counts.get("host") != 12:
        raise SystemExit(f"host count must be 12, got {counts.get('host')}")

    for rel in ["index.html", "404.html"]:
        patch_html(ROOT / rel, counts)

    patch_runtime_guard(ROOT / "assets/observatory-webgl-runtime.js", counts)

    print(json.dumps({
        "status": "PASS",
        "gate": "VERIFRAX_TIMELINE_STATIC_COUNT_AUTHORITY_POSTPASS",
        "counts": counts,
        "version_raise": False
    }, indent=2))


if __name__ == "__main__":
    main()
