#!/usr/bin/env python3
import json
import pathlib
import struct
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "prompt-script.json"
MANIFEST = ROOT / "manifest.json"
ASSETS = ROOT / "assets"


def parse_wav(path):
    data = path.read_bytes()
    if len(data) < 12 or data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        raise ValueError("not RIFF/WAVE")

    offset = 12
    fmt = None
    while offset + 8 <= len(data):
        cid = data[offset:offset+4]
        size = struct.unpack_from("<I", data, offset + 4)[0]
        body = offset + 8
        if body + size > len(data):
            raise ValueError("truncated chunk")

        if cid == b"fmt ":
            if size < 16:
                raise ValueError("short fmt")
            audio_format, channels, rate = struct.unpack_from("<HHI", data, body)
            block_align, bits = struct.unpack_from("<HH", data, body + 12)
            fmt = {
                "audioFormat": audio_format,
                "channels": channels,
                "sampleRate": rate,
                "blockAlign": block_align,
                "bitsPerSample": bits,
            }
        elif cid == b"data":
            if fmt is None:
                raise ValueError("data before fmt")
            fmt["dataBytes"] = size
            return fmt

        offset = body + size + (size & 1)

    raise ValueError("missing data")


def main():
    prompt = json.loads(SCRIPT.read_text())
    manifest = json.loads(MANIFEST.read_text())
    expected = {row["filename"] for row in prompt["prompts"]}
    actual = {p.name for p in ASSETS.glob("*.wav")}

    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing or extra:
        print("missing:", missing)
        print("extra:", extra)
        return 1

    total = 0
    for name in sorted(expected):
        path = ASSETS / name
        info = parse_wav(path)
        total += path.stat().st_size

        if info["audioFormat"] != 0x11:
            raise SystemExit(f"{name}: expected IMA ADPCM (0x11), got {info['audioFormat']}")
        if info["channels"] != 1:
            raise SystemExit(f"{name}: expected mono")
        if info["sampleRate"] != 10000:
            raise SystemExit(f"{name}: expected 10000 Hz")
        if info["bitsPerSample"] != 4:
            raise SystemExit(f"{name}: expected 4-bit ADPCM")
        if not (4 <= info["blockAlign"] <= 1024):
            raise SystemExit(f"{name}: unsupported blockAlign {info['blockAlign']}")

    if total != manifest["totalBytes"]:
        raise SystemExit(f"manifest size {manifest['totalBytes']} != actual {total}")
    if total > manifest["budgetBytes"]:
        raise SystemExit(f"audio pack {total} exceeds budget {manifest['budgetBytes']}")

    print(f"verified {len(expected)} clips, {total} bytes, IMA-ADPCM mono 10 kHz")
    return 0


if __name__ == "__main__":
    sys.exit(main())
