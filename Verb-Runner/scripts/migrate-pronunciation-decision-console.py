from __future__ import annotations

import json
import sys
from pathlib import Path

VOICE = "af_bella"

ROUND1_MAP = {
    "0.8": "bella-08-text",
    "0.9-phoneme": "bella-09-phoneme",
    "none": "none",
}

ROUND2_MAP = {
    "a": "a-105-text",
    "b": "b-110-text",
    "c": "c-100-phoneme",
    "none": "none",
}


def load_json(path: str):
    p = Path(path)
    if not p.exists():
        return {}
    text = p.read_text(encoding="utf-8").strip()
    if not text or text == "null":
        return {}
    value = json.loads(text)
    return value if isinstance(value, dict) else {}


def normalize_round1(record: dict) -> dict:
    selected = record.get("selectedCandidate") or record.get("selected")
    if not selected:
        decision = record.get("decision")
        preferred = record.get("preferred")
        if decision == "ok":
            selected = "bella-10-text"
        elif decision == "no":
            selected = ROUND1_MAP.get(preferred)
    result = {}
    if selected:
        result["selectedCandidate"] = selected
    if record.get("note"):
        result["note"] = record["note"]
    if record.get("updatedAt"):
        result["legacyUpdatedAt"] = record["updatedAt"]
    return result


def normalize_round2(record: dict) -> dict:
    selected = record.get("selectedCandidate")
    if not selected:
        selected = ROUND2_MAP.get(record.get("choice"))
    result = {}
    if selected:
        result["selectedCandidate"] = selected
    if record.get("note"):
        result["note"] = record["note"]
    if record.get("updatedAt"):
        result["legacyUpdatedAt"] = record["updatedAt"]
    return result


def items_from_round1(raw: dict) -> dict:
    if "results" in raw and isinstance(raw["results"], dict):
        return raw["results"]
    if "items" in raw and isinstance(raw["items"], dict):
        return raw["items"]
    return raw


def items_from_round2(raw: dict) -> dict:
    if "items" in raw and isinstance(raw["items"], dict):
        return raw["items"]
    return raw


def current_items(current: dict, batch_id: str) -> dict:
    batches = current.get("batches") or {}
    batch = batches.get(batch_id) or {}
    items = batch.get("items") or {}
    return items if isinstance(items, dict) else {}


def add_missing(patch: dict, current: dict, batch_id: str, source: dict, normalizer):
    existing = current_items(current, batch_id)
    for slug, record in source.items():
        if not isinstance(record, dict):
            continue
        normalized = normalizer(record)
        if not normalized:
            continue
        current_record = existing.get(slug) or {}
        for key, value in normalized.items():
            if key in current_record:
                continue
            patch[f"batches/{batch_id}/items/{slug}/{key}"] = value
        if slug not in existing or not current_record.get("batchId"):
            patch[f"batches/{batch_id}/items/{slug}/batchId"] = batch_id
        if slug not in existing or not current_record.get("voice"):
            patch[f"batches/{batch_id}/items/{slug}/voice"] = VOICE
        if slug not in existing or not current_record.get("migratedFrom"):
            patch[f"batches/{batch_id}/items/{slug}/migratedFrom"] = f"legacy-{batch_id}"


def main():
    if len(sys.argv) != 4:
        raise SystemExit(
            "usage: migrate-pronunciation-decision-console.py "
            "<round1-json> <round2-json> <current-console-json>"
        )

    round1 = load_json(sys.argv[1])
    round2 = load_json(sys.argv[2])
    current = load_json(sys.argv[3])

    patch = {}
    add_missing(patch, current, "round1", items_from_round1(round1), normalize_round1)
    add_missing(patch, current, "round2", items_from_round2(round2), normalize_round2)

    out = Path("/tmp/pronunciation-decision-console-migration-patch.json")
    out.write_text(
        json.dumps(patch, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"Prepared {len(patch)} decision-console migration fields.")


if __name__ == "__main__":
    main()
