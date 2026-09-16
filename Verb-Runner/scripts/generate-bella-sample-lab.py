from __future__ import annotations

import json
from pathlib import Path

VOICE = "af_bella"
SAMPLE_RATE = 24000
LEAD = 0.04
TAIL = 0.35

WORDS = {
    "are-waiting": {
        "label": "are waiting",
        "text": "are waiting",
        "phonemes": "ɑɹ wˈATɪŋ",
    },
    "ask": {"label": "ask", "text": "ask", "phonemes": "ˈæsk"},
    "ate": {"label": "ate", "text": "ate", "phonemes": "ˈAt"},
    "bend": {"label": "bend", "text": "bend", "phonemes": "bˈɛnd"},
    "build": {"label": "build", "text": "build", "phonemes": "bˈɪld"},
    "dug": {"label": "dug", "text": "dug", "phonemes": "dˈʌɡ"},
    "start": {"label": "start", "text": "start", "phonemes": "stˈɑɹt"},
    "washed": {"label": "washed", "text": "washed", "phonemes": "wˈɔʃt"},
    "watched": {"label": "watched", "text": "watched", "phonemes": "wˈɑʧt"},
    "wrote": {"label": "wrote", "text": "wrote", "phonemes": "ɹˈOt"},
}

VARIANTS = {
    "bella-08-text": {
        "label": "Bella 0.8 · normal text",
        "speed": 0.8,
        "mode": "text",
    },
    "bella-10-text": {
        "label": "Bella 1.0 · normal text",
        "speed": 1.0,
        "mode": "text",
    },
    "bella-09-phoneme": {
        "label": "Bella 0.9 · explicit phonemes",
        "speed": 0.9,
        "mode": "phoneme",
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
    out_dir = root / "bella-samples" / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code="a")

    manifest = {"voice": VOICE, "sample_rate": SAMPLE_RATE, "variants": VARIANTS, "items": {}}

    lead = np.zeros(int(SAMPLE_RATE * LEAD), dtype=np.float32)
    tail = np.zeros(int(SAMPLE_RATE * TAIL), dtype=np.float32)

    for slug, item in WORDS.items():
        manifest["items"][slug] = {"label": item["label"], "files": {}}
        for variant_id, variant in VARIANTS.items():
            pieces = []
            if variant["mode"] == "phoneme":
                generated = pipeline.generate_from_tokens(
                    tokens=item["phonemes"],
                    voice=VOICE,
                    speed=variant["speed"],
                )
            else:
                generated = pipeline(
                    item["text"] + ".",
                    voice=VOICE,
                    speed=variant["speed"],
                )

            for _g, _p, audio in generated:
                segment = as_numpy(audio)
                if segment.size:
                    pieces.append(segment)

            if not pieces:
                raise RuntimeError(f"No audio returned for {slug} / {variant_id}")

            speech = np.concatenate(pieces)
            peak = float(np.max(np.abs(speech))) if speech.size else 0.0
            if peak > 0.98:
                speech = speech * (0.96 / peak)

            clip = np.concatenate([lead, speech, tail])
            filename = f"{slug}--{variant_id}.wav"
            sf.write(out_dir / filename, clip, SAMPLE_RATE, subtype="PCM_16")
            manifest["items"][slug]["files"][variant_id] = f"./audio/{filename}"
            print(f"{slug} / {variant_id} -> {filename}")

    (root / "bella-samples" / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
