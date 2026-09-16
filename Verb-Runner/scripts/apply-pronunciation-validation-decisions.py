from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower()).strip("-") or "item"


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: apply-pronunciation-validation-decisions.py <review-json>")

    root = Path(__file__).resolve().parents[1]
    review_path = Path(sys.argv[1])
    corrections_path = root / "pronunciation-corrections.json"
    patch_path = Path("/tmp/pronunciation-validation-firebase-patch.json")

    review = json.loads(review_path.read_text(encoding="utf-8"))
    corrections = json.loads(corrections_path.read_text(encoding="utf-8"))
    excluded = corrections.get("excluded_as_correct") or {}
    revision = str(corrections.get("revision") or "unknown")

    audios = review.get("audios") or {}
    patch: dict[str, object] = {}
    stamp = int(time.time() * 1000)

    by_key = {
        str(record.get("key") or ""): (audio_id, record)
        for audio_id, record in audios.items()
        if isinstance(record, dict)
    }

    for key, decision in excluded.items():
        found = by_key.get(key)
        if not found:
            print(f"validation decision skipped: {key!r} not present in review data")
            continue

        audio_id, record = found
        reason = str(decision.get("reason") or "Validated as correct.")
        already_applied = (
            record.get("status") == "reviewed"
            and record.get("validationRevision") == revision
            and not any(
                isinstance(report, dict) and report.get("status") == "open"
                for report in (record.get("reports") or {}).values()
            )
        )
        if already_applied:
            continue

        record["status"] = "reviewed"
        record["reviewedBy"] = "Pronunciation validation"
        record["reviewedAt"] = stamp
        record["lastReviewedAt"] = stamp
        record["updatedAt"] = stamp
        record["validationDecision"] = "correct-existing"
        record["validationRevision"] = revision
        record["validationReason"] = reason

        base = f"audios/{audio_id}"
        patch[f"{base}/status"] = "reviewed"
        patch[f"{base}/reviewedBy"] = "Pronunciation validation"
        patch[f"{base}/reviewedAt"] = stamp
        patch[f"{base}/lastReviewedAt"] = stamp
        patch[f"{base}/updatedAt"] = stamp
        patch[f"{base}/validationDecision"] = "correct-existing"
        patch[f"{base}/validationRevision"] = revision
        patch[f"{base}/validationReason"] = reason

        reports = record.get("reports") or {}
        for report_id, report in reports.items():
            if not isinstance(report, dict) or report.get("status") != "open":
                continue
            report["status"] = "resolved"
            report["resolvedAt"] = stamp
            report["resolvedBy"] = "Pronunciation validation"
            patch[f"{base}/reports/{report_id}/status"] = "resolved"
            patch[f"{base}/reports/{report_id}/resolvedAt"] = stamp
            patch[f"{base}/reports/{report_id}/resolvedBy"] = "Pronunciation validation"

        history_id = f"validation-{slug(revision)}-{slug(key)}"
        history_item = {
            "action": "question-validated-correct",
            "at": stamp,
            "by": "Pronunciation validation",
            "reason": reason,
            "revision": revision,
        }
        record.setdefault("history", {})[history_id] = history_item
        patch[f"{base}/history/{history_id}"] = history_item

        print(f"validation decision applied: {key} -> reviewed ({reason})")

    review_path.write_text(
        json.dumps(review, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    patch_path.write_text(
        json.dumps(patch, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
