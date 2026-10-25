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


## Task 4 — authenticated online grading-job boundary

Status: COMPLETE IN CODE / NOT DEPLOYED YET.

### Talk Talk client branch

Branch:
- `feature/talk-talk-oral-grader-online-20260928`

Implemented:
- `Talk-Talk/evaluation/oral-grader-client.mjs`
- preview login obtains a short-lived server-signed token;
- accepted audio uploads as multipart data;
- metadata uses the canonical job schema;
- server assigns `jobId`;
- retries reuse the same idempotency key;
- status polling returns processing state or canonical completed result;
- HTTP retryability is surfaced to the UI layer.

Verification:
- Talk Talk suite run `36532577640` — SUCCESS.

### Oral Grader backend branch

Branch:
- `feature/oral-grader-talk-talk-online-20260928`

Implemented:
- `Oral-Grader/main.py`
- `Oral-Grader/online/auth.py`
- `Oral-Grader/online/job-service.py`
- `Oral-Grader/online/firebase-adapter.py`
- `Oral-Grader/online/processor.py`
- Firebase Python runtime under `Oral-Grader/`.

Backend behavior:
- HTTPS preview login endpoint;
- HTTPS grading submission endpoint;
- HTTPS job-status endpoint;
- HMAC-signed temporary preview sessions;
- RTDB authoritative job state under `classroomGames/talkTalk/oralGrader/jobs/{jobId}`;
- temporary Cloud Storage audio;
- deterministic/idempotent job identity;
- duplicate submission does not duplicate the job/audio;
- asynchronous RTDB-created trigger;
- real Stage 1 -> Stage 2 -> Stage 3 processing;
- statuses: transcribing -> analyzing -> scoring -> completed/review_required;
- raw audio deleted after completed result;
- raw audio retained for retry/review-required cases;
- server-side Gemini secret binding only.

Peer-conversation adaptation:
- Talk Talk does not require a teacher voice in the recording.
- controlled first-speaker order maps diarized speakers to Talk Talk student identity order;
- mismatched/ambiguous diarization produces `review_required`, never guessed identity;
- Stage 2 accepts explicit `peer_conversation` context without requiring `Teacher`.

Verification:
- RED processor run `36533118950` — missing processor + peer-conversation support as expected.
- Final backend suite run `36533554028` — SUCCESS, 65 tests passing.
- Backend HEAD at verification: `ee7dc8f65d16f9905ac2b69067a346142bed10e4`.

Deployment status:
- Firebase Functions have NOT been deployed yet.
- `TALK_TALK_SESSION_SECRET` and `GEMINI_API_KEY` must exist in Firebase Secret Manager before deployment.
- Do not claim online grading is live until the deployed endpoints and an actual audio job are verified.

Exact next task:
- Task 5: replace the standalone local Finish/grading transition with explicit `Califica` online submission while keeping Review audio / Record again and local recovery until server acknowledgement.
