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
            # Classroom profile: remove low-frequency energy that the small
            # speaker cannot use efficiently, compress speech dynamics, keep
            # average loudness high and hard-limit peaks before ADPCM.
            voice_filter = (
                "highpass=f=140,"
                "lowpass=f=4500,"
                "acompressor=threshold=0.10:ratio=4:attack=5:release=100:makeup=2,"
                "loudnorm=I=-13:LRA=4:TP=-1.0,"
                "alimiter=limit=0.95"
            )
            run(
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(src),
                "-af", voice_filter,
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
        "voiceProfile": "classroom-loud",
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
