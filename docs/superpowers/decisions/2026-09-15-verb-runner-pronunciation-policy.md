# Verb Runner pronunciation policy — 2026-09-15

## Decision

Pronunciation audio for Verb Runner grammar answers must represent the **grammatical role used in the game**, not an unrelated noun/adjective reading of the same spelling.

For isolated verb homographs, the audio generator must not rely on TTS lexical guessing. Use explicit Kokoro/Misaki phoneme overrides in `Verb-Runner/scripts/generate-pronunciation.py`.

Current protected verb homographs:

- `live` (verb “reside/exist”): /lɪv/ → Kokoro `lˈɪv`. Never adjective `/laɪv/`.
- `close` (verb): /kloʊz/ → Kokoro `klˈOz`. Never adjective `/kloʊs/`.
- `use` (verb): /juːz/ → Kokoro `jˈuz`. Never noun `/juːs/`.

## Generation rule

When new Verb Runner verb audio is added:

1. Determine the part of speech and intended meaning from the game item before generation.
2. If the spelling has multiple pronunciations by grammatical role or meaning, add an explicit phoneme override and a regression assertion before generating audio.
3. Do not accept an isolated-word TTS pronunciation merely because the spelling is correct.
4. The asset filename must include the pronunciation signature only when an override exists, so a phoneme correction forces regeneration while unchanged audio keeps its stable filename.
5. Keep the existing Bella/Kokoro voice pipeline unless the project explicitly changes voice policy.

## Regression history

The isolated answer `live` was generated as /laɪv/ instead of the intended verb /lɪv/. Root cause: the generator sent isolated orthography to TTS with no grammatical context and cached the result by spelling alone.
