#!/usr/bin/env python3
import json
import pathlib
import shutil
import subprocess
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCES = ROOT / "audio-sources.generated.json"
ASSETS = ROOT / "assets"
MANIFEST = ROOT / "manifest.json"
TARGET_RATE = 10000
BUDGET_BYTES = 1_750_000


def run(*args):
    subprocess.run(args, check=True)


def ffprobe(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_rate,channels,bits_per_sample",
        "-of", "json", str(path)
    ], text=True)
    return json.loads(out)["streams"][0]


def main():
    data = json.loads(SOURCES.read_text())
    clips = data["clips"]
    ASSETS.mkdir(parents=True, exist_ok=True)

    expected = {clip["filename"] for clip in clips}
    for path in ASSETS.glob("*.wav"):
        if path.name not in expected:
            path.unlink()

    built = []
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        for index, clip in enumerate(clips, 1):
            src = tmp / f"{index:03d}-source.wav"
            dst = ASSETS / clip["filename"]
            print(f"[{index:02d}/{len(clips)}] {clip['filename']}")
            urllib.request.urlretrieve(clip["url"], src)
            run(
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(src),
                "-ac", "1",
                "-ar", str(TARGET_RATE),
                "-c:a", "adpcm_ima_wav",
                str(dst),
            )
            meta = ffprobe(dst)
            built.append({
                "filename": clip["filename"],
                "bytes": dst.stat().st_size,
                "codec": meta.get("codec_name"),
                "sampleRate": int(meta.get("sample_rate", 0)),
                "channels": int(meta.get("channels", 0)),
                "bitsPerSample": int(meta.get("bits_per_sample", 0) or 0),
                "sourceDurationSeconds": clip["duration"],
            })

    total = sum(x["bytes"] for x in built)
    manifest = {
        "schemaVersion": 1,
        "storage": "LittleFS internal flash",
        "format": "WAV IMA-ADPCM mono",
        "sampleRate": TARGET_RATE,
        "budgetBytes": BUDGET_BYTES,
        "totalBytes": total,
        "sourceDurationSeconds": data["totalDurationSeconds"],
        "clips": built,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")

    if total > BUDGET_BYTES:
        raise SystemExit(f"Audio pack {total} bytes exceeds {BUDGET_BYTES}-byte budget")

    print(f"Audio pack: {len(built)} clips, {total} bytes / {BUDGET_BYTES} budget")


if __name__ == "__main__":
    main()
