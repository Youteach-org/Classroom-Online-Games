# Audit — Talk Talk / Oral Grader integration state

Date: 2026-09-28  
Repository: `Youteach-org/Classroom-Online-Games`

## Purpose

Record the repository state verified before continuing Talk Talk automatic-grading integration.

## Branches verified

Oral Grader:
- `feature/oral-grader-v1-20260922`

Prior Talk Talk integration work:
- `feature/talk-talk-oral-grader-integration-20260923`

Current Talk Talk UI/recording work:
- `talk-talk-standalone-preview`

## Oral Grader files verified

Stage 1:
- `Oral-Grader/stage1/gemini-transcribe.py`
- `Oral-Grader/tests/test-gemini-transcribe.py`
- `.github/workflows/oral-grader-v1.yml`

Stage 2:
- `Oral-Grader/stage2/analyze-audio.py`
- `Oral-Grader/tests/test-stage2-audio-analysis.py`
- `.github/workflows/oral-grader-stage2.yml`

Real artifacts:
- `Oral-Grader/transcripts/paul-paulina-stage1.json`
- `Oral-Grader/transcripts/adrian-stage1.json`
- `Oral-Grader/analysis/paul-paulina-stage2.json`
- `Oral-Grader/analysis/adrian-stage2.json`
- `Oral-Grader/reviews/paul-paulina-stage2-review.json`
- `Oral-Grader/rubrics/units-1-4-final-batch-scores.json`
- `Oral-Grader/reports/paul-paulina-final-report.json`

## Verified behavior

Stage 1:
- Gemini literal transcription;
- diarization;
- timestamps;
- immutable evidence intent.

Stage 2:
- original audio analyzed again;
- pronunciation evidence;
- grammar/vocabulary evidence;
- fluency/discourse evidence;
- teacher-intervention evidence;
- uncertainty rules;
- Stage 1 immutability.

Paul/Paulina Stage-2 review contains:
- `accepted_for_rubric: true`

The repository also contains final 0-8 rubric scores and total /40 artifacts.

## Important status finding

The Stage-2 workflow explicitly validates:

`scoring_status = "evidence_only_not_final_rubric"`

The recursive `Oral-Grader/` tree on the verified OG branch contains:
- stage1
- stage2
- analysis
- transcripts
- reviews
- rubrics
- reports
- tests

It does NOT contain a clearly named committed executable for a final Stage-3/rubric-scoring engine.

Therefore the next integration task is not to invent scoring in Talk Talk. It is to locate/recover/formalize the Oral Grader logic that produced the existing final rubric artifacts so that the complete grading path is executable and callable online.

## Prior integration plan verified

`docs/superpowers/plans/2026-09-23-talk-talk-oral-grader-integration.md` on `feature/talk-talk-oral-grader-integration-20260923` already states:

- Talk Talk = product/UI/session layer
- Oral Grader = transcription/evaluation engine
- Oral Grader returns `rubric_scores`
- Teacher Monitor renders transcript/evidence/scores
- literal transcript remains immutable
- first integration proof uses Paul/Paulina OG fixture

This architecture remains valid and is superseded only where the 2026-09-28 decision adds the online submission/persistence requirements.

## Current Talk Talk preview

Current preview already proves:
- microphone capture;
- real MediaRecorder recording;
- review audio;
- record again;
- accepted take;
- local recovery;
- student and teacher UI shells.

Local prosody/duration evidence is only a temporary preview diagnostic and is not the production Oral Grader result.

## Canonical next documents

Read in this order:
1. `docs/superpowers/decisions/2026-09-28-talk-talk-oral-grader-online-architecture.md`
2. `docs/superpowers/specs/2026-09-28-talk-talk-oral-grader-online-integration.md`
3. `docs/superpowers/plans/2026-09-28-talk-talk-oral-grader-online-integration.md`
4. `docs/superpowers/handoffs/2026-09-23-talk-talk-current.md`
