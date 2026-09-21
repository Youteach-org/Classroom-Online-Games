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
    healed: list[tuple[str, str, str]] = []
    firebase_patch: dict[str, object] = {}
    stamp = int(time.time() * 1000)

    def patch_record(audio_id: str, record: dict[str, object], field: str, value: object) -> None:
        if record.get(field) == value:
            return
        record[field] = value
        firebase_patch[f"audios/{audio_id}/{field}"] = value

    for audio_id, record in (review.get("audios") or {}).items():
        if not isinstance(record, dict):
            continue

        cleanup_requested = bool(record.get("cleanupRequested"))
        duplicate = normalize(record.get("key"))
        original = normalize(record.get("duplicateOf"))
        known_alias = bool(duplicate and original and normalize(aliases.get(duplicate)) == original)
        already_duplicate = bool(
            record.get("cleanupApplied")
            or record.get("removedAsDuplicate")
            or known_alias
        )

        if not cleanup_requested and not already_duplicate:
            continue

        if not duplicate or not original:
            if cleanup_requested:
                raise RuntimeError(
                    f"Duplicate cleanup record {audio_id!r} is missing key or duplicateOf"
                )
            continue
        if duplicate == original:
            raise RuntimeError(f"Audio {duplicate!r} cannot alias itself")

        # Keep only the relationship/audit record for the duplicate key.
        # The generator resolves this alias to the canonical source and removes
        # any local WAV that is no longer referenced by a canonical answer.
        aliases[duplicate] = original

        if cleanup_requested:
            removed_source = str(record.get("source") or "").strip()
            if removed_source and not record.get("removedAssetSource"):
                patch_record(audio_id, record, "removedAssetSource", removed_source)
            processed.append((audio_id, duplicate, original))
        elif record.get("status") != "removed-duplicate" or not record.get("removedAsDuplicate"):
            healed.append((audio_id, duplicate, original))

        patch_record(audio_id, record, "cleanupRequested", False)
        patch_record(audio_id, record, "cleanupApplied", True)
        if not record.get("cleanupAppliedAt"):
            patch_record(audio_id, record, "cleanupAppliedAt", stamp)
        patch_record(audio_id, record, "removedAsDuplicate", True)
        patch_record(audio_id, record, "status", "removed-duplicate")

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

    if healed:
        for _audio_id, duplicate, original in healed:
            print(f"healed duplicate review state: {duplicate} -> {original}")


if __name__ == "__main__":
    main()
