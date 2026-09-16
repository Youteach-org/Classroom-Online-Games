from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

VOICE = 'af_bella'
SPEED = 0.8

# Temporary external clips created during the Nichalia experiment. They remain
# playable until each item is re-reviewed/replaced, but they are NOT the
# production generation policy. New and corrected clips use Kokoro af_bella.
TRANSITIONAL_EXTERNAL_AUDIO = {
    'live': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/03b52154-8af6-4836-8808-c9c264a897d3.mp3',
    'close': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/72a43561-e236-473d-b367-f538ce12efea.mp3',
    'use': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/0cb14a71-948d-49b5-9347-e1e79146fa10.mp3',
    'used': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/3400a4d2-052e-4dd5-aa74-f4485772b0be.mp3',
    'read::base': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/a8108e85-ff24-49ad-9cc7-ba01705ac86b.mp3',
    'read::past': 'https://cdn.creativeclaw.co/u/ad2cc6b8/audio/1642b4b1-27d3-4052-980b-271c803795d6.mp3',
}
CONTEXTUAL_KEYS = {'read::base', 'read::past'}
SAMPLE_RATE = 24000
LEAD_SILENCE_SECONDS = 0.04
TAIL_SILENCE_SECONDS = 0.35

# Isolated verb homographs must not rely on TTS lexical guessing.
# Kokoro/Misaki phoneme notation is used here (American English).
VERB_PHONEME_OVERRIDES = {
    'live': 'lˈɪv',
    'close': 'klˈOz',
    'use': 'jˈuz',
    'used': 'jˈuzd',
    'read::base': 'ɹˈid',
    'read::past': 'ɹˈɛd',
}


def normalize(value: str) -> str:
    return re.sub(r'\s+', ' ', str(value or '').strip().lower())


def load_corrections(root: Path) -> dict[str, dict]:
    path = root / 'pronunciation-corrections.json'
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding='utf-8'))
    items = raw.get('items', {})
    if not isinstance(items, dict):
        raise RuntimeError('pronunciation-corrections.json items must be an object')
    return {normalize(key): value for key, value in items.items()}


def correction_phonemes(pipeline, spec: dict) -> str:
    explicit = str(spec.get('kokoro_phonemes') or '').strip()
    if explicit:
        return explicit

    target_text = str(spec.get('target_text') or '').strip()
    if not target_text:
        raise RuntimeError('Correction is missing target_text')

    _, tokens = pipeline.g2p(target_text)
    chunks = [ps for _gs, ps, _tks in pipeline.en_tokenize(tokens) if ps]
    phonemes = ' '.join(chunks).strip()
    if not phonemes:
        raise RuntimeError(f'No phonemes resolved for correction text: {target_text!r}')
    return phonemes


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


def pronunciation_signature(answer: str, corrections: dict[str, dict]) -> str:
    key = normalize(answer)
    correction = corrections.get(key)
    if correction:
        payload = json.dumps(correction, ensure_ascii=False, sort_keys=True)
        return f'{key}|reviewed-correction|{payload}'
    phonemes = VERB_PHONEME_OVERRIDES.get(key, '')
    return f'{key}|{phonemes}' if phonemes else key


def asset_filename(answer: str, corrections: dict[str, dict]) -> str:
    key = normalize(answer)
    slug = re.sub(r'[^a-z0-9]+', '-', key).strip('-')[:54] or 'answer'
    digest = hashlib.sha1(pronunciation_signature(key, corrections).encode('utf-8')).hexdigest()[:10]
    return f'{slug}-{digest}.wav'


def load_pronunciation_aliases(root: Path) -> dict[str, str]:
    path = root / 'pronunciation-aliases.json'
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(raw, dict):
        raise RuntimeError('pronunciation-aliases.json must contain an object')
    aliases = {
        normalize(key): normalize(value)
        for key, value in raw.items()
        if normalize(key) and normalize(value)
    }
    return aliases


def resolve_alias(key: str, aliases: dict[str, str]) -> str:
    current = normalize(key)
    seen: set[str] = set()
    while current in aliases:
        if current in seen:
            chain = ' -> '.join([*seen, current])
            raise RuntimeError(f'Pronunciation alias cycle detected: {chain}')
        seen.add(current)
        target = normalize(aliases[current])
        if not target or target == current:
            raise RuntimeError(f'Invalid pronunciation alias: {current!r} -> {target!r}')
        current = target
    return current


def validate_aliases(answers: set[str], aliases: dict[str, str]) -> None:
    for duplicate, original in aliases.items():
        if duplicate not in answers:
            raise RuntimeError(f'Pronunciation alias key is not used by Verb Runner: {duplicate!r}')
        resolved = resolve_alias(original, aliases)
        if resolved not in answers:
            raise RuntimeError(
                f'Pronunciation alias target is not used by Verb Runner: {duplicate!r} -> {resolved!r}'
            )


def source_for_key(key: str, aliases: dict[str, str], corrections: dict[str, dict]) -> str:
    canonical = resolve_alias(key, aliases)
    if canonical in corrections:
        correction = corrections[canonical]
        approved_source = str(correction.get('approved_source') or correction.get('approved_source_url') or '').strip()
        if approved_source:
            return approved_source
        return f'./audio/pronunciation/{asset_filename(canonical, corrections)}'
    return TRANSITIONAL_EXTERNAL_AUDIO.get(
        canonical,
        f'./audio/pronunciation/{asset_filename(canonical, corrections)}',
    )


def build_manifest(
    answers: set[str],
    aliases: dict[str, str],
    corrections: dict[str, dict],
) -> dict[str, str]:
    return {
        key: source_for_key(key, aliases, corrections)
        for key in sorted(answers)
    }


def _as_numpy(audio):
    import numpy as np
    if hasattr(audio, 'detach'):
        audio = audio.detach().cpu().numpy()
    return np.asarray(audio, dtype=np.float32).reshape(-1)


def generate_audio(
    root: Path,
    answers: set[str],
    aliases: dict[str, str],
    corrections: dict[str, dict],
) -> None:
    import os

    out_dir = root / 'audio' / 'pronunciation'
    out_dir.mkdir(parents=True, exist_ok=True)
    expected: set[str] = set()
    pipeline = None

    canonical_answers = sorted({resolve_alias(answer, aliases) for answer in answers})

    for index, answer in enumerate(canonical_answers, 1):
        correction = corrections.get(answer)
        approved_source = str((correction or {}).get('approved_source') or (correction or {}).get('approved_source_url') or '').strip()
        if approved_source:
            print(f"approved external voice exception: {answer!r} -> {approved_source}")
            continue
        if answer in TRANSITIONAL_EXTERNAL_AUDIO and not correction:
            continue

        filename = asset_filename(answer, corrections)
        expected.add(filename)
        path = out_dir / filename
        if path.exists() and path.stat().st_size > 1000:
            continue

        if os.getenv('ALLOW_KOKORO_BELLA_GENERATION') != '1':
            raise RuntimeError(
                f"Missing Kokoro Bella pronunciation asset for: {answer!r}. "
                "Run the pronunciation generation workflow with the locked af_bella profile."
            )

        import numpy as np
        import soundfile as sf
        from kokoro import KPipeline
        if pipeline is None:
            pipeline = KPipeline(lang_code='a')
        lead = np.zeros(int(SAMPLE_RATE * LEAD_SILENCE_SECONDS), dtype=np.float32)
        tail = np.zeros(int(SAMPLE_RATE * TAIL_SILENCE_SECONDS), dtype=np.float32)

        pieces = []
        if correction:
            override_phonemes = correction_phonemes(pipeline, correction)
            print(
                f"correction target: {answer!r} -> "
                f"{correction.get('target_text')!r} {correction.get('ipa_goal', '')} "
                f"phones={override_phonemes!r}"
            )
            generated = pipeline.generate_from_tokens(
                tokens=override_phonemes,
                voice=VOICE,
                speed=SPEED,
            )
        else:
            override_phonemes = VERB_PHONEME_OVERRIDES.get(answer)
            if override_phonemes:
                generated = pipeline.generate_from_tokens(
                    tokens=override_phonemes,
                    voice=VOICE,
                    speed=SPEED,
                )
            else:
                generated = pipeline(
                    spoken_text(answer),
                    voice=VOICE,
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
        print(f'[{index}/{len(canonical_answers)}] {answer} -> {filename}')

    for stale in out_dir.glob('*.wav'):
        if stale.name not in expected:
            stale.unlink()
            print(f'removed stale pronunciation asset: {stale.name}')


def write_manifest(
    root: Path,
    answers: set[str],
    aliases: dict[str, str],
    corrections: dict[str, dict],
) -> None:
    manifest = build_manifest(answers, aliases, corrections)
    payload = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True)
    (root / 'pronunciation-manifest.js').write_text(
        '(function(global){global.VerbRunnerPronunciationManifest=' + payload + ";})(typeof window!=='undefined'?window:globalThis);\n",
        encoding='utf-8',
    )


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    answers = collect_answers(root)
    answers = set(answers) | CONTEXTUAL_KEYS
    aliases = load_pronunciation_aliases(root)
    corrections = load_corrections(root)
    validate_aliases(answers, aliases)

    missing_corrections = sorted(set(corrections) - set(answers))
    if missing_corrections:
        raise RuntimeError(
            'Correction keys are not used by Verb Runner: '
            + ', '.join(missing_corrections)
        )

    print(
        f'Verifying {len(answers)} pronunciation keys, '
        f'{len(aliases)} aliases, {len(corrections)} reviewed corrections. '
        f'Locked generation profile: Kokoro {VOICE} at {SPEED}x.'
    )
    generate_audio(root, answers, aliases, corrections)
    write_manifest(root, answers, aliases, corrections)


if __name__ == '__main__':
    main()
