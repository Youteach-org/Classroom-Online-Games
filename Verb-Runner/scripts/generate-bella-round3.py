from __future__ import annotations

import json
from pathlib import Path

VOICE = "af_bella"
SAMPLE_RATE = 24000
LEAD = 0.04
TAIL = 0.35

ITEMS = {
    "build": {
        "label": "build",
        "variants": {
            "a-100-cue": {
                "label": "A · Bella 1.00 · pronunciation cue",
                "mode": "text",
                "input": "billed",
                "speed": 1.00,
            },
            "b-092-cue": {
                "label": "B · Bella 0.92 · pronunciation cue",
                "mode": "text",
                "input": "billed",
                "speed": 0.92,
            },
            "c-095-phoneme": {
                "label": "C · Bella 0.95 · explicit phonemes",
                "mode": "phoneme",
                "input": "bˈɪld",
                "speed": 0.95,
            },
        },
    },
    "washed": {
        "label": "washed",
        "variants": {
            "a-100-cue": {
                "label": "A · Bella 1.00 · pronunciation cue",
                "mode": "text",
                "input": "woshed",
                "speed": 1.00,
            },
            "b-092-cue": {
                "label": "B · Bella 0.92 · pronunciation cue",
                "mode": "text",
                "input": "woshed",
                "speed": 0.92,
            },
            "c-095-phoneme": {
                "label": "C · Bella 0.95 · explicit phonemes",
                "mode": "phoneme",
                "input": "wˈɑʃt",
                "speed": 0.95,
            },
        },
    },
}


def as_numpy(audio):
    import numpy as np

    if hasattr(audio, "detach"):
        audio = audio.detach().cpu().numpy()
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def main():
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    root = Path(__file__).resolve().parents[1]
    out_dir = root / "bella-samples" / "round3-audio"
    out_dir.mkdir(parents=True, exist_ok=True)

    pipeline = KPipeline(lang_code="a")
    lead = np.zeros(int(SAMPLE_RATE * LEAD), dtype=np.float32)
    tail = np.zeros(int(SAMPLE_RATE * TAIL), dtype=np.float32)

    manifest = {
        "voice": VOICE,
        "sample_rate": SAMPLE_RATE,
        "variants": {},
        "items": {},
    }

    for slug, item in ITEMS.items():
        manifest["items"][slug] = {"label": item["label"], "files": {}}
        for variant_id, variant in item["variants"].items():
            manifest["variants"][variant_id] = {
                "label": variant["label"],
                "speed": variant["speed"],
                "mode": variant["mode"],
            }

            if variant["mode"] == "phoneme":
                generated = pipeline.generate_from_tokens(
                    tokens=variant["input"],
                    voice=VOICE,
                    speed=variant["speed"],
                )
            else:
                generated = pipeline(
                    variant["input"] + ".",
                    voice=VOICE,
                    speed=variant["speed"],
                )

            pieces = []
            for _graphemes, _phonemes, audio in generated:
                segment = as_numpy(audio)
                if segment.size:
                    pieces.append(segment)

            if not pieces:
                raise RuntimeError(f"No audio for {slug}/{variant_id}")

            speech = np.concatenate(pieces)
            peak = float(np.max(np.abs(speech))) if speech.size else 0.0
            if peak > 0.98:
                speech = speech * (0.96 / peak)

            clip = np.concatenate([lead, speech, tail])
            filename = f"{slug}--{variant_id}.wav"
            sf.write(out_dir / filename, clip, SAMPLE_RATE, subtype="PCM_16")
            manifest["items"][slug]["files"][variant_id] = f"./round3-audio/{filename}"
            print(slug, variant_id, filename)

    (root / "bella-samples" / "round3-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
