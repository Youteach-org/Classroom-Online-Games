# Progress — Talk Talk + Oral Grader online integration

Date: 2026-09-28  
Branch: `talk-talk-standalone-preview`

## Current checkpoint

The Talk Talk visual/recording preview is working.

Verified student UX:
- real microphone capture
- real MediaRecorder recording
- stop
- Review audio
- Record again
- Finish/accept take

The current local storage/evaluation implementation is a temporary preview scaffold only.

## Canonical architecture documentation completed

Decision:
- `docs/superpowers/decisions/2026-09-28-talk-talk-oral-grader-online-architecture.md`
- commit `18685f95a620664f2df1030e8a49867e170f4567`

Spec:
- `docs/superpowers/specs/2026-09-28-talk-talk-oral-grader-online-integration.md`
- commit `e815623341d36f268b20f09ea6f3de524a024f51`

Implementation plan:
- `docs/superpowers/plans/2026-09-28-talk-talk-oral-grader-online-integration.md`
- commit `a3091af0d1974d802ba76b6b1f6dabc511cf6de2`

Repository audit:
- `docs/superpowers/audits/2026-09-28-talk-talk-oral-grader-state.md`
- commit `1d396aad35a501d4baa8cfc85c2da749e2b01cac`

Handoff correction:
- `docs/superpowers/handoffs/2026-09-23-talk-talk-current.md`
- commit `d72b57bd3c30c271a3176dc3c8de9cd08e65ac06`

Continuity enforcement:
- `docs/superpowers/PROJECT-CONTINUITY.md`
- commit `4b3f3a3c5c8ea4da404c124c987b1e8005c737dc`

## Verified Oral Grader status

Canonical OG branch:
- `feature/oral-grader-v1-20260922`

Prior integration branch:
- `feature/talk-talk-oral-grader-integration-20260923`

Verified OG implementation:
- Stage 1 Gemini transcription
- Stage 2 Gemini audio analysis
- unit tests
- real transcripts/analysis for Paul/Paulina and Adrian
- accepted Paul/Paulina Stage-2 review
- final rubric score artifacts
- final report metadata

Known repository-status question:
- Stage 2 explicitly says `evidence_only_not_final_rubric`.
- No dedicated final rubric-scoring executable was found in the recursive `Oral-Grader/` tree.
- Existing final score artifacts prove final scoring work has already been done, but the executable path must be located/recovered/formalized before Talk Talk can honestly call one endpoint and get a full automatic /40 result.

## Do not do

- Do not build a competing Talk Talk oral scorer.
- Do not treat local prosody/duration as the production score.
- Do not keep grading authoritative only in IndexedDB/localStorage.
- Do not require teacher and student to use the same browser/device.
- Do not overwrite literal `heard_text`.
- Do not expose Gemini/GitHub secrets to the browser.
- Do not commit raw student audio.

## Exact next task

Execute Task 1 of:
- `docs/superpowers/plans/2026-09-28-talk-talk-oral-grader-online-integration.md`

Task 1:
- recover and lock the Oral Grader final-scoring contract;
- write a failing rubric-stage test using the known Paul/Paulina fixture;
- locate/recover the scoring logic that produced existing final score artifacts;
- formalize it inside `Oral-Grader/` if necessary;
- do not proceed to the Talk Talk online submission endpoint until Oral Grader can return the complete five-dimension rubric and total /40 programmatically.

## Execution discipline

Use Superpowers:
- test-driven-development for each production change;
- systematic-debugging for failures;
- verification-before-completion before claims;
- update this progress file and current handoff after each material task.


## Task 2 — Talk Talk ↔ Oral Grader schemas

Status: COMPLETE.

Files:
- `Talk-Talk/evaluation/oral-grader-schema.mjs`
- `Talk-Talk/tests/oral-grader-schema.test.mjs`

Contract locked:
- submission job identity/session/activity fields;
- student identities;
- mode: practice | assessment | live_assessment;
- rubric/language/prompt context;
- audio MIME metadata;
- idempotency key;
- processing states without fabricated scores;
- completed/review-required result with immutable literal `heard_text`;
- exactly five 0–8 rubric dimensions;
- total equals the five-score sum;
- confidence and review-required flags.

TDD:
- RED: run `36517478346` — module missing as expected.
- GREEN: run `36517589556` — full Talk Talk standalone/UI + schema suite SUCCESS.

Implementation commit:
- `27bbe0b5fd8a4ea07b8e0a837b9287cd64fe732b`

Next:
- Task 3: map a real Paul/Paulina Oral Grader fixture into Talk Talk without calling Gemini.


## Task 3 — Real Oral Grader fixture mapping

Status: COMPLETE.

Files:
- `Talk-Talk/tests/fixtures/paul-paulina-oral-grader-result.json`
- `Talk-Talk/tests/oral-grader-mapper.test.mjs`
- `Talk-Talk/evaluation/oral-grader-mapper.mjs`
- `Talk-Talk/evaluation/oral-grader-adapter.mjs`

Fixture sources are real versioned Oral Grader evidence/results:
- Paul/Paulina Stage-1 transcript;
- Stage-2 evidence including teacher-confirmed `fires -> fathers`;
- calibrated rubric result: Paul 33/40, Paulina 32/40.

Mapper rules:
- preserve `heard_text` exactly;
- preserve evidence;
- preserve OG scores exactly;
- expose five ordered Teacher Monitor rubric rows;
- do not rescore or reinterpret.

TDD:
- RED: `36517709942` — mapper module missing.
- GREEN: `36517769299` — complete integration-branch Talk Talk suite SUCCESS.

Next:
- Task 4: authenticated online grading-job boundary with audio upload, idempotency and server-side Oral Grader execution.


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


## Task 5 — Califica online submission

Status: COMPLETE IN CODE / awaiting deployed backend for live E2E.

Implemented:
- `Talk-Talk/evaluation/oral-grader-submission.mjs`
- `Talk-Talk/evaluation/oral-grader-config.mjs`
- preview login now obtains/stores server `onlineToken`;
- recording screen keeps `Finish` as stop/accept;
- after stopping: Review audio / Record again / Califica;
- `Califica` is the only grading submission action;
- accepted recording remains in IndexedDB during upload and after server acknowledgement;
- idempotency key is `<attemptId>:grade`;
- retryable failure preserves the same key and local audio;
- successful submission stores the server `jobId`;
- integration app does not pretend the local prosody diagnostic is the Oral Grader result.

TDD:
- RED: run `36533854389` — missing submission module.
- GREEN: run `36534266881` — complete Talk Talk integration suite SUCCESS.

Current limitation:
- backend code exists but is not deployed, so the integration-branch login/Califica cannot complete live until Firebase Functions + secrets are deployed.

Exact next task:
- Task 6: monitor the shared online job and render real Oral Grader transcript/evidence/result in the student views.
