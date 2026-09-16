from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

APPROVED_VOICE_NAME = 'Nichalia'
APPROVED_VOICE_ID = 'XfNU2rGpBa01ckF309OY'
LEGACY_KOKORO_VOICE = 'af_bella'
SPEED = 0.8

# Approved Nichalia assets are generated outside GitHub Actions and pinned here.
# Never replace these with a fallback voice.
APPROVED_AUDIO_OVERRIDES = {
    'live': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/03b52154-8af6-4836-8808-c9c264a897d3.mp3',
    'close': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/72a43561-e236-473d-b367-f538ce12efea.mp3',
    'use': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/0cb14a71-948d-49b5-9347-e1e79146fa10.mp3',
    'used': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/3400a4d2-052e-4dd5-aa74-f4485772b0be.mp3',
    'read::base': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/a8108e85-ff24-49ad-9cc7-ba01705ac86b.mp3',
    'read::past': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/1642b4b1-27d3-4052-980b-271c803795d6.mp3',
}
SAMPLE_RATE = 24000
LEAD_SILENCE_SECONDS = 0.04
TAIL_SILENCE_SECONDS = 0.35

# Isolated verb homographs must not rely on TTS lexical guessing.
# Kokoro/Misaki phoneme notation is used here (American English).
VERB_PHONEME_OVERRIDES = {
    'live': 'lˈɪv',   # verb: reside / exist; never adjective /laɪv/
    'close': 'klˈOz', # verb /kloʊz/; not adjective /kloʊs/
    'use': 'jˈuz',    # verb /juːz/; not noun /juːs/
    'used': 'jˈuzd',  # past/participle of use; not the reduced "used to" /juːst/
    'read::base': 'ɹˈid', # base/present /riːd/
    'read::past': 'ɹˈɛd', # simple past/past participle /rɛd/
}


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


def pronunciation_signature(answer: str) -> str:
    key = normalize(answer)
    phonemes = VERB_PHONEME_OVERRIDES.get(key, '')
    return f'{key}|{phonemes}' if phonemes else key


def asset_filename(answer: str) -> str:
    key = normalize(answer)
    slug = re.sub(r'[^a-z0-9]+', '-', key).strip('-')[:54] or 'answer'
    digest = hashlib.sha1(pronunciation_signature(key).encode('utf-8')).hexdigest()[:10]
    return f'{slug}-{digest}.wav'


def build_manifest(answers: set[str]) -> dict[str, str]:
    return {
        key: APPROVED_AUDIO_OVERRIDES.get(
            key,
            f'./audio/pronunciation/{asset_filename(key)}',
        )
        for key in sorted(answers)
    }


def _as_numpy(audio):
    import numpy as np
    if hasattr(audio, 'detach'):
        audio = audio.detach().cpu().numpy()
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def generate_audio(root: Path, answers: set[str]) -> None:
    import os

    out_dir = root / 'audio' / 'pronunciation'
    out_dir.mkdir(parents=True, exist_ok=True)
    expected: set[str] = set()
    legacy_pipeline = None

    for index, answer in enumerate(sorted(answers), 1):
        if answer in APPROVED_AUDIO_OVERRIDES:
            continue

        filename = asset_filename(answer)
        expected.add(filename)
        path = out_dir / filename
        if path.exists() and path.stat().st_size > 1000:
            continue

        if os.getenv('ALLOW_LEGACY_KOKORO_REBUILD') != '1':
            raise RuntimeError(
                f"Missing approved Nichalia asset for: {answer!r}. "
                f"Generate it with {APPROVED_VOICE_NAME} ({APPROVED_VOICE_ID}) "
                "and add it to APPROVED_AUDIO_OVERRIDES."
            )

        # Emergency legacy rebuild only. Production/new assets must use Nichalia.
        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
        if legacy_pipeline is None:
            legacy_pipeline = KPipeline(lang_code='a')
        lead = np.zeros(int(SAMPLE_RATE * LEAD_SILENCE_SECONDS), dtype=np.float32)
        tail = np.zeros(int(SAMPLE_RATE * TAIL_SILENCE_SECONDS), dtype=np.float32)

        pieces = []
        override_phonemes = VERB_PHONEME_OVERRIDES.get(answer)
        if override_phonemes:
            generated = legacy_pipeline.generate_from_tokens(
                tokens=override_phonemes,
                voice=LEGACY_KOKORO_VOICE,
                speed=SPEED,
            )
        else:
            generated = legacy_pipeline(
                spoken_text(answer),
                voice=LEGACY_KOKORO_VOICE,
                speed=SPEED,
            )

        for _graphemes, _phonemes, audio in generated:
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
    answers = set(answers) | set(APPROVED_AUDIO_OVERRIDES)
    print(
        f'Verifying {len(answers)} pronunciation assets. '
        f'Approved voice: {APPROVED_VOICE_NAME} ({APPROVED_VOICE_ID}).'
    )
    generate_audio(root, answers)
    write_manifest(root, answers)


if __name__ == '__main__':
    main()
