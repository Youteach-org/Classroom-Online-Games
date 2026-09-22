# Oral Grader (OG) — Stage 2 Audio-First Pronunciation Analysis Design

Date: 2026-09-22  
Repository: `Youteach-org/Classroom-Online-Games`  
Branch: `feature/oral-grader-v1-20260922`  
Status: approved design / implementation pending  
Parent spec: `docs/superpowers/specs/2026-09-22-oral-grader-og-design.md`

## 1. Purpose

Stage 2 analyzes the accepted Stage-1 oral-exam evidence without rewriting it.

Its job is to identify, separately and transparently:

- what was actually heard;
- what word or phrase the student most likely intended;
- whether pronunciation is acceptable, incorrect, uncertain, or not scorable;
- whether the problem is instead grammar, vocabulary/word choice, malformed language, or transcription uncertainty.

Stage 2 is an **audio-first evidence layer**. It is not a transcript cleaner.

## 2. Preconditions

Stage 2 may run only when the pair's Stage-1 review explicitly contains:

- `accepted_for_stage2: true`;
- a speaker mapping;
- any teacher-confirmed corrections or pronunciation evidence already identified.

For the initial Paul/Paulina case, the current accepted mapping is:

- `spk:0` = Teacher
- `spk:1` = Paul
- `spk:2` = Paulina

The accepted Stage-1 review is:

- `Oral-Grader/reviews/paul-paulina-stage1-review.json`

The immutable raw transcript remains:

- `Oral-Grader/transcripts/paul-paulina-stage1.json`

## 3. Authority order

When sources disagree, Stage 2 must use this precedence:

1. **Teacher-confirmed direct listening evidence**
2. **Original audio**
3. **Accepted Stage-1 transcript**
4. **Model inference from linguistic context**

A later model response must never overwrite teacher-confirmed evidence.

Example already established:

- heard: `fires`
- intended: `fathers`
- student: Paul
- status: teacher-confirmed from audio

Gemini Stage 1 normalized relevant material toward `father/fathers`. Stage 2 must retain the teacher-confirmed `fires -> fathers` evidence and must not replace it with the normalized transcript token.

If Stage 2 cannot uniquely locate the teacher-confirmed item in the audio, it must leave its timestamp null rather than inventing one.

## 4. Audio-first analysis strategy

Stage 2 must send the **original audio** to Gemini again.

The accepted Stage-1 transcript is provided only as a temporal and speaker-reference aid. It is not treated as ground truth for pronunciation.

For each relevant segment, the analyzer should:

1. listen to the audio segment;
2. consult Stage 1 for approximate timing and speaker;
3. preserve the raw Stage-1 wording separately;
4. determine the best-supported heard form from audio;
5. infer an intended form only when context is sufficiently clear;
6. classify pronunciation independently from grammar and vocabulary;
7. mark uncertainty rather than guessing.

The analyzer may skip detailed token-level analysis for rapid exchanges that are immaterial to the final evaluation, provided they are not needed for interaction/fluency evidence.

## 5. Gemini model boundary

Stage 1 continues to use `gemini-3.5-transcribe`.

Stage 2 requires a Gemini model that can inspect audio and follow structured analysis instructions. The implementation must **validate the configured Stage-2 model against the authenticated Gemini API before the first live analysis** rather than hardcoding an unverified model name into the architecture.

The Stage-2 model name must be supplied through a dedicated configuration value such as:

- `ORAL_GRADER_STAGE2_MODEL`

There is no automatic provider or model fallback. If the configured Gemini model is unavailable or does not support the required audio analysis, the workflow fails explicitly and the model choice is revised in GitHub.

## 6. Classification rules

Every analyzed item must use one pronunciation verdict:

- `acceptable`
- `incorrect`
- `uncertain`
- `not_scored`

### acceptable

Use when the intended word is clear and the spoken realization is sufficiently intelligible/acceptable for the course level.

### incorrect

Use only when:

- the intended word is sufficiently clear;
- the audio supports a pronunciation mismatch;
- the mismatch is not merely a grammar or vocabulary error;
- transcription uncertainty is not the sole reason for the mismatch.

### uncertain

Use when:

- the audio is unclear;
- the intended word is ambiguous;
- two plausible interpretations remain;
- speaker overlap or recording quality prevents a defensible judgment.

`uncertain` must never directly lower the pronunciation score.

### not_scored

Use for items that are clearly grammar, vocabulary, malformed-language, discourse, or transcript issues rather than pronunciation evidence.

## 7. Error-category separation

Stage 2 must never collapse all errors into pronunciation.

Each item may independently contain:

- `pronunciation_note`
- `grammar_note`
- `vocabulary_note`
- `malformed_form_note`
- `transcription_note`

Examples:

- `when you was` → grammar, not pronunciation by default
- `say me` → grammar/usage, not pronunciation by default
- `angrys` → malformed form unless audio independently shows a pronunciation problem
- `arbit` when intended `referee` → likely vocabulary/word-choice or lexical substitution unless audio/context proves another intended word
- `fires -> fathers` → pronunciation evidence because the teacher directly confirmed the audio production and intended word

## 8. Repetitions, hesitations, and fluency evidence

Repetitions, fillers, pauses, false starts, self-corrections, and abandoned phrases remain relevant evidence for Fluency and sometimes Coherence.

They must not automatically be counted as pronunciation errors.

Stage 2 may record these as discourse/fluency observations without turning them into token-level pronunciation penalties.

## 9. Output structure

Stage 2 writes a new analysis file and never modifies Stage 1.

Canonical JSON path:

- `Oral-Grader/analysis/<pair-slug>-stage2.json`

Teacher-readable review path:

- `Oral-Grader/analysis/<pair-slug>-stage2.md`

The JSON top level must contain:

```json
{
  "project": "Oral-Grader",
  "stage": 2,
  "pair_slug": "paul-paulina",
  "stage1_source": "Oral-Grader/transcripts/paul-paulina-stage1.json",
  "stage1_review": "Oral-Grader/reviews/paul-paulina-stage1-review.json",
  "speaker_mapping": {
    "spk:0": "Teacher",
    "spk:1": "Paul",
    "spk:2": "Paulina"
  },
  "students": {},
  "evidence": []
}
```

Each evidence item must contain:

```json
{
  "speaker": "Paul",
  "start_offset": "113.600s",
  "end_offset": "114.100s",
  "stage1_heard": "father",
  "reviewed_heard": "fires",
  "intended": "fathers",
  "intent_confidence": "high",
  "pronunciation": "incorrect",
  "counts_toward_pronunciation": true,
  "pronunciation_note": "Teacher-confirmed heard form differs materially from intended word.",
  "grammar_note": null,
  "vocabulary_note": null,
  "malformed_form_note": null,
  "transcription_note": "Stage 1 normalized the token toward father/fathers.",
  "evidence_source": ["teacher-confirmed", "audio"]
}
```

The offsets above are illustrative only. The implementation must not assign them to `fires -> fathers` unless the live audio analysis uniquely supports that location.

## 10. Student summaries

The `students` object must contain separate summaries for Paul and Paulina.

For each student, Stage 2 should report:

- count of clearly incorrect pronunciation items;
- count of acceptable sampled items;
- count of uncertain items;
- representative grammar patterns;
- representative vocabulary/word-choice patterns;
- fluency/discourse observations;
- teacher interventions involving that student;
- concise evidence-based notes for later rubric scoring.

Counts are evidence summaries, not automatic final rubric scores.

## 11. Teacher overrides

Teacher review is authoritative.

Teacher corrections must be stored in a review/override layer, never by mutating the Gemini raw response.

The Stage-2 data model must support:

- adding a teacher-confirmed heard form;
- changing an intended form;
- changing a pronunciation verdict;
- marking an item irrelevant;
- adding a teacher note;
- preserving the previous model-produced value for auditability.

The final PDF must use the reviewed value, not an superseded model-only value.

## 12. Scoring boundary

Stage 2 does **not** assign the final 0–8 rubric scores by itself.

It produces the evidence used by the rubric stage.

Pronunciation scoring may consider:

- frequency of clearly supported pronunciation problems;
- intelligibility;
- whether errors repeatedly affect understanding;
- teacher-confirmed examples;
- the proportion and seriousness of errors in context.

It must not be reduced to a simple error-count formula.

Grammar & Vocabulary, Fluency, Coherence, and Interaction are evaluated separately under the established oral rubric.

## 13. Teacher intervention evidence

Teacher interventions already visible in the transcript must remain available to later rubric evaluation.

Stage 2 should tag teacher interventions when they:

- clarify what the student said;
- supply or confirm a word;
- reactivate a stalled response;
- materially affect Fluency or Interaction evaluation.

A teacher clarification such as repeating a suspected word is evidence, not proof that the student's original pronunciation was correct.

## 14. Fast exchanges and immaterial transcript gaps

The accepted Stage-1 review notes that some rapid exchanges are imperfectly captured.

Stage 2 is not required to reconstruct every low-value short exchange.

It must analyze them only when they materially affect:

- speaker attribution;
- pronunciation evidence;
- Fluency;
- Interaction;
- meaning needed to infer an intended word.

Otherwise they may remain outside the detailed evidence list.

## 15. Privacy and storage

Stage 2 follows the same privacy rules as Stage 1:

- original audio is runtime input only;
- raw student audio is not committed to Git;
- temporary authenticated audio URLs are not written to repository files or issues;
- generated Stage-2 JSON/Markdown may be committed;
- Gemini credentials remain GitHub Actions secrets.

## 16. Failure behavior

Stage 2 must fail explicitly when:

- Stage 1 is not accepted;
- speaker mapping is missing;
- original audio cannot be obtained;
- Gemini credentials are absent;
- the configured Stage-2 model is unavailable;
- Gemini returns malformed or unparsable structured analysis;
- output attempts to alter Stage-1 evidence rather than create a separate layer.

No alternate provider may be used automatically.

## 17. Testing requirements

Unit tests must verify at minimum:

- Stage-1 data is never mutated;
- teacher-confirmed evidence overrides conflicting model evidence;
- `uncertain` items never set `counts_toward_pronunciation=true`;
- grammar-only items are `not_scored` for pronunciation;
- speaker mapping is applied correctly;
- missing Stage-1 acceptance blocks execution;
- malformed Stage-2 model output is rejected;
- a teacher-confirmed item with no uniquely supported timestamp remains timestamp-null.

The first live validation remains Paul/Paulina.

## 18. Paul/Paulina first live Stage-2 acceptance criteria

Stage 2 is acceptable for this pair when:

1. Paul and Paulina are correctly separated using the accepted mapping;
2. the original audio is analyzed again;
3. `fires -> fathers` is preserved as teacher-confirmed evidence;
4. rapid low-value exchanges are not overinterpreted;
5. uncertain tokens are visibly marked and do not count against pronunciation;
6. grammar and vocabulary observations are separated from pronunciation;
7. no Stage-1 file is changed;
8. the resulting evidence is sufficient to support later rubric scoring and the final pair PDF.

## 19. Next step after Stage 2 review

After the teacher reviews the Stage-2 evidence, OG may proceed to rubric scoring and Stage 3 PDF generation.

No final PDF should be generated before the Stage-2 evidence has been reviewed.
