from __future__ import annotations

import json
import urllib.request
from pathlib import Path

def main() -> None:
    root = Path(__file__).resolve().parents[1]
    cfg = json.loads((root / "pronunciation-corrections.json").read_text(encoding="utf-8"))
    for key, spec in (cfg.get("items") or {}).items():
        source = str(spec.get("approved_source") or "").strip()
        remote = str(spec.get("approved_source_url") or "").strip()
        if not source.startswith("./audio/pronunciation/external/") or not remote:
            continue
        target = root / source.removeprefix("./")
        if target.exists() and target.stat().st_size > 1000:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(remote, headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            data = response.read()
        if len(data) <= 1000:
            raise RuntimeError(f"Downloaded external pronunciation asset is too small: {key}")
        target.write_bytes(data)
        print(f"cached approved external pronunciation: {key} -> {target}")

if __name__ == "__main__":
    main()
