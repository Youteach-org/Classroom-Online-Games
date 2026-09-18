from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

def load_manifest(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"VerbRunnerPronunciationManifest=(\{.*\});", text, flags=re.S)
    if not match:
        raise RuntimeError("Could not parse pronunciation manifest")
    return json.loads(match.group(1))

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: finalize-pronunciation-repair-cycle.py <review-json>")
    root = Path(__file__).resolve().parents[1]
    review_path = Path(sys.argv[1])
    manifest = load_manifest(root / "pronunciation-manifest.js")
    review = json.loads(review_path.read_text(encoding="utf-8"))
    audios = review.get("audios") or {}
    patch: dict[str, object] = {}
    stamp = int(time.time() * 1000)

    for audio_id, record in audios.items():
        if not isinstance(record, dict):
            continue
        key = str(record.get("key") or "")
        current = manifest.get(key)
        previous = str(record.get("source") or "")
        if not current or not previous or current == previous:
            continue
        if record.get("status") not in {"reported", "needs-fix", "review-again"}:
            continue

        base = f"audios/{audio_id}"
        record["status"] = "review-again"
        record["repairAppliedAt"] = stamp
        record["repairSource"] = current
        record["updatedAt"] = stamp
        patch[f"{base}/status"] = "review-again"
        patch[f"{base}/repairAppliedAt"] = stamp
        patch[f"{base}/repairSource"] = current
        patch[f"{base}/updatedAt"] = stamp

        for report_id, report in (record.get("reports") or {}).items():
            if not isinstance(report, dict) or report.get("status") != "open":
                continue
            asset_source = str(report.get("assetSource") or "")
            if asset_source and asset_source != previous:
                continue
            report["status"] = "resolved"
            report["resolvedAt"] = stamp
            report["resolvedBy"] = "Pronunciation repair sync"
            patch[f"{base}/reports/{report_id}/status"] = "resolved"
            patch[f"{base}/reports/{report_id}/resolvedAt"] = stamp
            patch[f"{base}/reports/{report_id}/resolvedBy"] = "Pronunciation repair sync"

        history_id = f"repair-{stamp}-{re.sub(r'[^a-z0-9]+','-',key.lower()).strip('-') or 'audio'}"
        event = {"action":"repair-applied-review-again","at":stamp,"by":"Pronunciation repair sync","from":previous,"to":current}
        record.setdefault("history", {})[history_id] = event
        patch[f"{base}/history/{history_id}"] = event
        print(f"repair applied: {key} -> REVIEW AGAIN")

    review_path.write_text(json.dumps(review, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    Path("/tmp/pronunciation-repair-firebase-patch.json").write_text(
        json.dumps(patch, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

if __name__ == "__main__":
    main()
