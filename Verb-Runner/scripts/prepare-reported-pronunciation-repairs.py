from __future__ import annotations

import json
import sys
from pathlib import Path

SPEED_CYCLE = (1.0, 0.95, 1.05, 0.9)

def latest_current_report(record: dict) -> str:
    source = str(record.get("source") or "")
    rows = []
    for report in (record.get("reports") or {}).values():
        if not isinstance(report, dict) or report.get("status") != "open":
            continue
        if str(report.get("assetSource") or "") != source:
            continue
        stamp = int(report.get("updatedAt") or report.get("createdAt") or 0)
        rows.append((stamp, str(report.get("text") or "").strip()))
    rows.sort(reverse=True)
    return rows[0][1] if rows else ""

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: prepare-reported-pronunciation-repairs.py <review-json>")

    root = Path(__file__).resolve().parents[1]
    review = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    corrections_path = root / "pronunciation-corrections.json"
    corrections = json.loads(corrections_path.read_text(encoding="utf-8"))
    items = corrections.get("items") or {}
    changed = []

    for _audio_id, record in (review.get("audios") or {}).items():
        if not isinstance(record, dict):
            continue
        if record.get("status") not in {"reported", "needs-fix"}:
            continue
        requested = int(record.get("repairRequestedAt") or 0)
        handled = int(record.get("repairHandledAt") or 0)
        if requested <= handled:
            continue

        key = str(record.get("key") or "").strip().lower()
        spec = items.get(key)
        if not isinstance(spec, dict):
            print(f"manual repair required: no correction spec for {key!r}")
            continue

        method = str(spec.get("method") or "")
        if method == "external-approved-voice":
            print(f"manual repair required: external approved voice for {key!r}")
            continue

        attempt = int(spec.get("automatic_repair_attempt") or 0) + 1
        spec["automatic_repair_attempt"] = attempt
        spec["repair_request_id"] = str(record.get("repairRequestId") or "")
        spec["repair_requested_at"] = requested
        spec["latest_report_text"] = latest_current_report(record)
        spec["speed"] = SPEED_CYCLE[(attempt - 1) % len(SPEED_CYCLE)]

        if method == "approved-review-candidate":
            spec.pop("approved_source", None)
            spec.pop("approved_source_url", None)
            spec["method"] = "g2p_tokens"

        items[key] = spec
        changed.append(key)
        print(f"queued automatic repair attempt {attempt}: {key}")

    if not changed:
        print("No requested reported pronunciation repairs require regeneration.")
        return

    corrections["items"] = items
    corrections["revision"] = str(corrections.get("revision") or "repair") + "-auto"
    corrections_path.write_text(
        json.dumps(corrections, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

if __name__ == "__main__":
    main()
