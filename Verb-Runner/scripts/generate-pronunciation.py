from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

VOICE = 'af_bella'
SPEED = 0.8
SAMPLE_RATE = 24000
LEAD_SILENCE_SECONDS = 0.04
TAIL_SILENCE_SECONDS = 0.35


def normalize(value: str) -> str:
    return re.sub(r'\s+', ' ', str(value or '').strip().lower())


def _quoted_values(text: str) -> list[str]:
    return [m.group(2) for m in re.finditer(r'(["\'])(.*?)\1', text, flags=re.S)]


def collect_answers(root: Path) -> set[str]:
    answers: set[str] = set()

    verb = (root / 'verb-bank.js').read_text(encoding='utf-8')
    for match in re.finditer(r'forms\s*:\s*\[([^\]]+)\]', verb):
        answers.update(normalize(v) for v in _quoted_values(match.group(1)))

    for filename in ('sentence-bank.js', 'final-race-bank.js'):
        text = (root / filename).read_text(encoding='utf-8')
        for match in re.finditer(r'["\']?correctAnswers["\']?\s*:\s*\[([^\]]+)\]', text, flags=re.S):
            answers.update(normalize(v) for v in _quoted_values(match.group(1)))

    perfect = (root / 'perfect-race-bank.js').read_text(encoding='utf-8')
    for match in re.finditer(r'\[\s*"[^"\n]*___[^"\n]*"\s*,\s*"([^"]+)"\s*,\s*\[', perfect):
        answers.add(normalize(match.group(1)))

    return {value for value in answers if value}


def spoken_text(answer: str) -> str:
    value = normalize(answer)
    if value == 'was / were':
        return 'was, were.'
    return value.rstrip('.!?') + '.'


def asset_filename(answer: str) -> str:
    key = normalize(answer)
    slug = re.sub(r'[^a-z0-9]+', '-', key).strip('-')[:54] or 'answer'
    digest = hashlib.sha1(key.encode('utf-8')).hexdigest()[:10]
    return f'{slug}-{digest}.wav'


def build_manifest(answers: set[str]) -> dict[str, str]:
    return {
        key: f'./audio/pronunciation/{asset_filename(key)}'
        for key in sorted(answers)
    }


def _as_numpy(audio):
    import numpy as np
    if hasattr(audio, 'detach'):
        audio = audio.detach().cpu().numpy()
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def generate_audio(root: Path, answers: set[str]) -> None:
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    out_dir = root / 'audio' / 'pronunciation'
    out_dir.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code='a')
    expected: set[str] = set()

    lead = np.zeros(int(SAMPLE_RATE * LEAD_SILENCE_SECONDS), dtype=np.float32)
    tail = np.zeros(int(SAMPLE_RATE * TAIL_SILENCE_SECONDS), dtype=np.float32)

    for index, answer in enumerate(sorted(answers), 1):
        filename = asset_filename(answer)
        expected.add(filename)
        path = out_dir / filename
        if path.exists() and path.stat().st_size > 1000:
            continue

        pieces = []
        for _graphemes, _phonemes, audio in pipeline(
            spoken_text(answer),
            voice=VOICE,
            speed=SPEED,
        ):
            segment = _as_numpy(audio)
            if segment.size:
                pieces.append(segment)
        if not pieces:
            raise RuntimeError(f'Kokoro returned no audio for: {answer!r}')

        speech = np.concatenate(pieces)
        peak = float(np.max(np.abs(speech))) if speech.size else 0.0
        if peak > 0.98:
            speech = speech * (0.96 / peak)
        clip = np.concatenate([lead, speech, tail])
        sf.write(path, clip, SAMPLE_RATE, subtype='PCM_16')
        print(f'[{index}/{len(answers)}] {answer} -> {filename}')

    for stale in out_dir.glob('*.wav'):
        if stale.name not in expected:
            stale.unlink()


def write_manifest(root: Path, answers: set[str]) -> None:
    manifest = build_manifest(answers)
    payload = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True)
    (root / 'pronunciation-manifest.js').write_text(
        '(function(global){global.VerbRunnerPronunciationManifest=' + payload + ";})(typeof window!=='undefined'?window:globalThis);\n",
        encoding='utf-8',
    )


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    answers = collect_answers(root)
    print(f'Generating {len(answers)} pronunciation clips with Kokoro {VOICE} at {SPEED}x')
    generate_audio(root, answers)
    write_manifest(root, answers)


if __name__ == '__main__':
    main()
