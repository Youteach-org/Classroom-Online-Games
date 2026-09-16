# Verb Runner pronunciation policy — 2026-09-15

## Decision

Pronunciation audio for Verb Runner grammar answers must represent the **grammatical role used in the game**, not an unrelated noun/adjective reading of the same spelling.

## Locked voice

The official pronunciation voice for **new or regenerated Verb Runner audio is Nichalia**, the bright, friendly American female ElevenLabs voice with ID `XfNU2rGpBa01ckF309OY`.

Do not substitute Bella, another female voice, a browser TTS voice, or any other engine/voice merely because it is available. Existing Bella/Kokoro files are legacy assets only; they are not the voice choice for new or regenerated pronunciation audio.

For isolated verb homographs, generation must not rely on lexical guessing. With the approved Nichalia/ElevenLabs v3 path, generate an explicitly disambiguated pronunciation (for example `live` as /lɪv/) and pin the approved resulting asset. The Kokoro/Misaki phoneme table in `Verb-Runner/scripts/generate-pronunciation.py` is retained only for an explicitly enabled emergency legacy rebuild.

Current protected verb homographs:

- `live` (verb “reside/exist”): /lɪv/. Never adjective `/laɪv/`.
- `close` (verb): /kloʊz/. Never adjective `/kloʊs/`.
- `use` (verb): /juːz/. Never noun `/juːs/`.
- `used` (simple past/past participle of `use`): /juːzd/. Do not substitute the reduced `used to` pronunciation /juːst/.
- `read` is context-sensitive despite identical spelling:
  - base/present verb: /riːd/
  - simple past/past participle: /rɛd/
  - the runtime must route bare `read` by grammatical context; spelling alone is not a valid pronunciation key.

## Generation rule

When new Verb Runner verb audio is added:

1. Determine the part of speech and intended meaning from the game item before generation.
2. If the spelling has multiple pronunciations by grammatical role or meaning, add an explicit phoneme override and a regression assertion before generating audio.
3. Do not accept an isolated-word TTS pronunciation merely because the spelling is correct.
4. The asset filename must include the pronunciation signature only when an override exists, so a phoneme correction forces regeneration while unchanged audio keeps its stable filename.
5. Generate every new or regenerated pronunciation asset with **Nichalia** (`XfNU2rGpBa01ckF309OY`).
6. If a Nichalia asset is missing, verification must fail rather than silently generating it with Bella/Kokoro.
7. Bella/Kokoro may be used only for an explicitly requested emergency legacy rebuild; it is not the production voice policy.
8. For heteronyms whose principal parts share the same spelling but not the same pronunciation (currently `read`), the pronunciation manifest must use distinct semantic keys such as `read::base` and `read::past`, and the game must pass the current challenge context to pronunciation lookup.
9. The approved Nichalia assets for `live`, `close`, `use`, `used`, `read::base`, and `read::past` are pinned in `APPROVED_AUDIO_OVERRIDES`. Superseded local Bella/Kokoro files for protected forms must not remain as active production assets.

## Regression history

The isolated answer `live` was generated as /laɪv/ instead of the intended verb /lɪv/. Root cause: the generator sent isolated orthography to TTS with no grammatical context and cached the result by spelling alone.

A second project-continuity error occurred when the correction was regenerated with Bella/Kokoro even though the selected project voice was Nichalia. Root cause: the voice choice had not been persisted in GitHub. The locked-voice rule above exists specifically to prevent that recurrence.


## 2026-09-15 expansion

A repository-wide review of Verb Runner content identified the currently relevant ambiguity set as `live`, `close`, `use`, `used`, and `read`. Other common English heteronyms such as `lead`, `wind`, `bow`, `row`, `sow`, `record`, `present`, `produce`, and `refuse` are not currently active Verb Runner pronunciation answers and therefore are not pinned yet. If any is later added as a spoken answer, it must be reviewed under this policy before generation.
