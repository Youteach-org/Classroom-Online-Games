# Talk Talk + Oral Grader Integration Plan

Date: 2026-09-23

## Goal

Use Talk Talk as the product/UI/session layer and Oral Grader as the oral transcription and evaluation engine.

## Existing reusable pieces

### Talk Talk
- Audio capture and recording
- Attempt pipeline
- Speaker identification
- STT adapter abstraction
- Prosody helpers
- Evaluation engine
- Interaction engine
- Teacher monitor
- Practice vs assessment modes
- Firebase session/state layer

### Oral Grader
- Stage 1: Gemini literal transcription
- Stage 2: audio analysis
- Transcript preservation
- Structured analysis output
- Rubric/report generation workflow

## Integration contract

Talk Talk should send an oral-attempt job containing:
- sessionId
- activityId
- groupId
- teamId
- student identities
- audio reference
- mode: practice | assessment
- rubricId
- language
- prompt/context

Oral Grader should return:
- transcript.heard_text
- transcript.speakers
- transcript.segments with timestamps
- analysis.intended_text where justified
- analysis.pronunciation
- analysis.grammar
- analysis.vocabulary
- analysis.fluency
- analysis.coherence
- analysis.interaction
- rubric_scores
- evidence references
- confidence/uncertainty markers
- report payload

## Non-negotiable rule

The literal transcription is immutable evidence. Later stages may add intended_text or interpretation, but must never overwrite heard_text.

## Proposed architecture

1. Talk Talk records audio.
2. Talk Talk creates an evaluation job.
3. Bridge adapter invokes Oral Grader Stage 1.
4. Stage 1 stores literal transcript.
5. Bridge adapter invokes Oral Grader Stage 2.
6. Stage 2 returns structured analysis.
7. Talk Talk maps analysis to its evaluation engine.
8. Teacher Monitor displays transcript, evidence, scores and comments.
9. Teacher may override any score/comment without modifying the original transcript.

## First implementation milestone

Build a local bridge using existing repository modules before any cloud/service deployment:
- Talk-Talk/evaluation/oral-grader-adapter.mjs
- Talk-Talk/evaluation/oral-grader-schema.mjs
- Talk-Talk/evaluation/oral-grader-mapper.mjs
- tests for a known Paul/Paulina Oral Grader fixture

The first proof should take the existing Paul/Paulina Stage 2 JSON and render it through Talk Talk's evaluation model without calling Gemini again.

## Second milestone

Connect a newly recorded Talk Talk attempt to Oral Grader Stage 1 + Stage 2.

## Third milestone

Add Teacher Monitor review UI:
- audio playback
- literal transcript
- speaker-separated transcript
- detected evidence
- rubric scores
- teacher override
- final report

## Modes

### Practice
Feedback only. Score may remain hidden.

### Assessment
Full rubric scoring and final report.

### Live Assessment
Session monitored in real time; full analysis runs after recording is closed.

## YouTeach integration later

Expose the same Oral Grader engine to YouTeach assignments so an uploaded oral recording can be graded using the same rubric pipeline without launching Talk Talk.
