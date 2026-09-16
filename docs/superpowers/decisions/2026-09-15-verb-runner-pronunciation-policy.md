# Verb Runner pronunciation policy — updated 2026-09-16

## Decision

Pronunciation audio for Verb Runner must represent the grammatical role used in the game and must remain acoustically consistent with the original pronunciation bank.

## Locked correction voice

The default production voice for **new or regenerated corrections is Kokoro Bella**, voice id/name `af_bella`.

This supersedes the temporary Nichalia decision made on 2026-09-15. The user clarified on 2026-09-16 that the intended reference voice was the original Kokoro/Bella bank and requested that corrections continue with the same configuration so corrected clips do not sound like a different speaker.

## Locked synthesis settings

Every regenerated correction must keep the original bank settings:

- Engine: Kokoro
- Language pipeline: American English, `KPipeline(lang_code='a')`
- Voice: `af_bella`
- Speed: `0.8`
- Sample rate: `24000 Hz`
- Lead silence: `0.04 s`
- Tail silence: `0.35 s`
- WAV subtype: `PCM_16`
- Peak protection: if speech peak is above `0.98`, normalize speech to `0.96` before adding silence.

Do not change voice, speed, silence, sample rate, format, or normalization per correction unless the user explicitly changes this policy.


## Approved voice exceptions

Two isolated words are explicit teacher-approved exceptions to the default Bella policy:

- `build` → AI Voice Generator, voice style `fancy`
- `washed` → AI Voice Generator, voice style `fancy`

These exceptions were approved on 2026-09-16 after multiple focused Kokoro `af_bella` variants were reviewed and rejected. They apply **only** to these two words. The rest of the pronunciation bank continues to use the locked Bella profile unless the teacher explicitly approves another exception.

The generator must preserve an `approved_source_url` for these items and must not overwrite them with Kokoro during future pronunciation-bank regeneration.

## Pronunciation disambiguation

Do not rely on spelling alone when a word can be pronounced in more than one way. Use an explicit phoneme override while keeping the same Bella voice/profile.

Protected cases:

- `live` verb: /lɪv/, never adjective /laɪv/.
- `close` verb: /kloʊz/, never adjective /kloʊs/.
- `use` verb: /juːz/, never noun /juːs/.
- `used` as past/participle of `use`: /juːzd/, not the reduced `used to` /juːst/.
- `read` is context-sensitive:
  - base/present: /riːd/
  - simple past/past participle: /rɛd/
  - runtime lookup uses separate semantic keys `read::base` and `read::past`.

## Transitional Nichalia clips

A small set of clips was temporarily replaced with Nichalia during the 2026-09-15 experiment: `live`, `close`, `use`, `used`, `read::base`, and `read::past`.

They remain playable only as transitional assets until the review/correction pass replaces them with Kokoro Bella. They are **not** the acoustic reference and must not be used as the model for later corrections.

## Generation rule

1. Review the intended grammatical role before regenerating.
2. Use the locked Kokoro Bella profile above.
3. Add a phoneme override for ambiguous/mispronounced items rather than changing the voice.
4. Keep unrelated audio files unchanged.
5. Preserve a previous-report/history record in the pronunciation review system.
6. After replacement, mark the asset as requiring re-review.
7. Do not silently remove duplicates from the game source. Mark a canonical original and queue the duplicate for cleanup first.

## Persistent review system

The canonical live review data is stored in Firebase at:

`classroomGames/verbRunnerV2/pronunciationReview`

The review console is:

`/Verb-Runner/pronunciation-review/`

Each reviewed asset tracks, where available:

- manifest key and source;
- asset creation date;
- reviewer;
- first/last review date;
- review status;
- previous reports;
- review/action history;
- duplicate-of relationship;
- duplicate cleanup request.

A GitHub Actions workflow backs the Firebase review data up to:

`docs/superpowers/audits/pronunciation-review-live-backup.json`

## Regression history

The original isolated `live` clip was pronounced /laɪv/ instead of verb /lɪv/. The root cause was lexical guessing from isolated spelling.

A later correction pass temporarily moved selected clips to Nichalia. On 2026-09-16 the user clarified that corrections must instead match the original Kokoro/Bella bank. This document records that correction to the project policy.


## Duplicate asset consolidation

When the reviewer marks one numbered pronunciation asset as duplicated and identifies the numbered original to keep:

1. The duplicated review item is removed from the active review list immediately.
2. Firebase records both the original reference number (`duplicateOfRef`) and original manifest key (`duplicateOf`), with `cleanupRequested=true`.
3. The repository sync converts that relationship into `Verb-Runner/pronunciation-aliases.json`.
4. The duplicate manifest key remains valid for game logic, but resolves to the original asset source.
5. The redundant local WAV is physically deleted from `Verb-Runner/audio/pronunciation/`.
6. Future pronunciation generation respects the alias and does not recreate the removed WAV.
7. Scheduled review sync checks pending cleanup requests every five minutes and only clears `cleanupRequested` after repository synchronization succeeds.

This preserves all logical answer keys while eliminating duplicate audio files.
