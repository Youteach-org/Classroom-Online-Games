from __future__ import annotations

import json
import urllib.request
from pathlib import Path


def is_probably_audio(data: bytes) -> bool:
    if len(data) <= 1000:
        return False
    head = data[:64].lstrip()
    lowered = head.lower()
    if lowered.startswith(b"<!doctype html") or lowered.startswith(b"<html"):
        return False
    if data.startswith(b"ID3"):
        return True
    if len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0:
        return True
    if data.startswith((b"RIFF", b"OggS", b"fLaC")):
        return True
    if len(data) >= 12 and data[4:8] == b"ftyp":
        return True
    return False


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    cfg = json.loads((root / "pronunciation-corrections.json").read_text(encoding="utf-8"))
    for key, spec in (cfg.get("items") or {}).items():
        source = str(spec.get("approved_source") or "").strip()
        remote = str(spec.get("approved_source_url") or "").strip()
        if not source.startswith("./audio/pronunciation/external/") or not remote:
            continue
        target = root / source.removeprefix("./")
        if target.exists():
            existing = target.read_bytes()
            if is_probably_audio(existing):
                continue
            print(f"replacing invalid external pronunciation cache: {key} -> {target}")
        target.parent.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(remote, headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        if not is_probably_audio(data):
            preview = data[:80].decode("utf-8", errors="replace").replace("\n", " ")
            raise RuntimeError(
                f"Downloaded external pronunciation asset is not recognized audio: {key}; "
                f"bytes={len(data)}; prefix={preview!r}"
            )
        target.write_bytes(data)
        print(f"cached approved external pronunciation: {key} -> {target}")


if __name__ == "__main__":
    main()
