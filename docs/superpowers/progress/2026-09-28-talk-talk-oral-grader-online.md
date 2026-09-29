# Progress — Talk Talk + Oral Grader online integration

Date: 2026-09-28
Execution branch: `feature/oral-grader-talk-talk-online-20260928`
Plan: `docs/superpowers/plans/2026-09-28-talk-talk-oral-grader-online-integration.md` on the Talk Talk integration branch.

## Execution ruling

This harness has no local git checkout/worktree for the connected GitHub repository.

Ruling:
- Use an isolated GitHub feature branch instead of a local worktree.
- Never implement Task 1 on `main` or the canonical OG branch directly.
- Cost if wrong: branch-level changes could need replay/cherry-pick instead of a local worktree merge; production remains untouched.

## Task 1 — Recover and lock the Oral Grader final-scoring contract

Status: COMPLETE.

### Historical investigation

Verified score history:
- `Oral-Grader/rubrics/paul-paulina-rubric-draft.json`
- `Oral-Grader/rubrics/units-1-4-scoring-calibration.md`
- `Oral-Grader/rubrics/units-1-4-final-batch-scores.json`

Commit history shows final scores were stored as calibrated, teacher-reviewable evaluation data.
No committed deterministic scorer existed before this task.

Important conclusion:
- Do not infer a numeric error-count formula from historical scores.
- Final scoring is a rubric judgment over accepted evidence.
- The new scorer belongs to Oral Grader, not Talk Talk.

### Stage 3 implemented

New executable:
- `Oral-Grader/stage3/score-rubric.py`
- implementation commit: `77cb80e78b6987be119aa202b4fc191e5f3b5273`

Inputs:
- accepted Stage-1 literal transcript;
- accepted Stage-2 analysis/evidence;
- Stage-2 review with `accepted_for_rubric=true`;
- course scoring calibration.

Output:
- five integer 0–8 rubric dimensions per student;
- total /40;
- confidence;
- review-required flag;
- evidence-grounded rationale/comments/references;
- `scoring_status: automatic_rubric_complete`.

Scoring method:
- Gemini rubric judgment using the established course calibration.
- Not a local Talk Talk heuristic.
- Not an error-count formula.
- Historical Paul/Paulina scores are contract/calibration evidence, not hardcoded output.

Evidence protections:
- Stage 1 and Stage 2 inputs are not mutated.
- Literal heard evidence remains immutable.
- Teacher-confirmed evidence is authoritative.
- Uncertain evidence cannot be converted into confident pronunciation penalty by policy prompt.
- Exact total must equal the five scores.

### TDD evidence

Initial environment-only failure:
- run `36516855585`: invalid RED because pytest was missing.

Valid RED:
- run `36516910363`
- 7/7 Stage-3 tests failed because `Oral-Grader/stage3/score-rubric.py` did not exist.

First Stage-3 GREEN:
- run `36517003744`: SUCCESS.

Full Oral Grader suite investigation:
- run `36517050136` failed because `pytest Oral-Grader/tests` discovers no historical hyphenated test filenames.
- root cause was test discovery naming, not production code.

Full suite GREEN:
- run `36517191993`: SUCCESS.
- explicit suite includes:
  - `test-gemini-transcribe.py`
  - `test-stage2-audio-analysis.py`
  - `test-stage3-rubric-scoring.py`

### Workflow ruling

A temporary manually-dispatched Stage-3 GitHub Actions workflow was attempted and produced workflow-definition failures on the feature branch.

Ruling:
- remove that premature workflow rather than leave permanent red CI;
- keep Stage 3 as a tested executable CLI;
- build the real online invocation boundary under Task 4, where authentication, idempotency and job persistence are designed together.

Removed in:
- `0edc92ce3268da91e175188bb6c29c58b88b02f5`

Cost if wrong:
- Stage 3 currently has no standalone UI dispatch button; this is intentional because Talk Talk must invoke it through the future authenticated online job boundary, not through GitHub Actions.

## Exact next task

Task 2 — define the Talk Talk ↔ Oral Grader job/result schemas.

Required branch:
- `talk-talk-standalone-preview` or a new integration branch based from it.

Do not duplicate Stage-3 scoring in JavaScript.
Talk Talk only validates/maps the Oral Grader contract.
