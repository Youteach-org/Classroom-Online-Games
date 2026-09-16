from __future__ import annotations

import json
import sys
import time
from pathlib import Path


def normalize(value: object) -> str:
    return " ".join(str(value or "").strip().lower().split())


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: apply-pronunciation-duplicates.py <review-json>")

    root = Path(__file__).resolve().parents[1]
    review_path = Path(sys.argv[1])
    aliases_path = root / "pronunciation-aliases.json"
    patch_path = Path("/tmp/pronunciation-cleanup-firebase-patch.json")

    review = json.loads(review_path.read_text(encoding="utf-8"))
    aliases = json.loads(aliases_path.read_text(encoding="utf-8"))
    if not isinstance(aliases, dict):
        raise RuntimeError("pronunciation-aliases.json must contain an object")

    processed: list[tuple[str, str, str]] = []
    firebase_patch: dict[str, object] = {}
    stamp = int(time.time() * 1000)

    for audio_id, record in (review.get("audios") or {}).items():
        if not isinstance(record, dict):
            continue
        if not record.get("cleanupRequested"):
            continue

        duplicate = normalize(record.get("key"))
        original = normalize(record.get("duplicateOf"))
        if not duplicate or not original:
            raise RuntimeError(
                f"Duplicate cleanup record {audio_id!r} is missing key or duplicateOf"
            )
        if duplicate == original:
            raise RuntimeError(f"Audio {duplicate!r} cannot alias itself")

        aliases[duplicate] = original
        processed.append((audio_id, duplicate, original))

        record["cleanupRequested"] = False
        record["cleanupApplied"] = True
        record["cleanupAppliedAt"] = stamp
        record["removedAsDuplicate"] = True
        record["status"] = "removed-duplicate"

        firebase_patch[f"audios/{audio_id}/cleanupRequested"] = False
        firebase_patch[f"audios/{audio_id}/cleanupApplied"] = True
        firebase_patch[f"audios/{audio_id}/cleanupAppliedAt"] = stamp
        firebase_patch[f"audios/{audio_id}/removedAsDuplicate"] = True
        firebase_patch[f"audios/{audio_id}/status"] = "removed-duplicate"

    aliases_path.write_text(
        json.dumps(dict(sorted(aliases.items())), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    review_path.write_text(
        json.dumps(review, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    patch_path.write_text(
        json.dumps(firebase_patch, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if processed:
        for _audio_id, duplicate, original in processed:
            print(f"deduplicate: {duplicate} -> {original}")
    else:
        print("No pending pronunciation duplicate cleanup requests.")


if __name__ == "__main__":
    main()
