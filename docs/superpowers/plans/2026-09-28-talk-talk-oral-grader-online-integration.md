# Talk Talk + Oral Grader Online Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the working Talk Talk recording flow to Oral Grader online so an accepted recording produces literal transcript, structured oral evidence, five automatic 0-8 rubric scores, total /40, Teacher Monitor review, and a report payload.

**Architecture:** Talk Talk remains a browser UI/session client with temporary recording recovery. A server-side online job boundary accepts the audio and invokes the canonical Oral Grader pipeline. Oral Grader remains the only oral-evaluation engine; Talk Talk maps and renders its result without rewriting literal evidence.

**Tech Stack:** Talk Talk HTML/CSS/ES modules, browser MediaRecorder/IndexedDB for temporary recovery, existing Firebase/online session infrastructure where applicable, Oral Grader Python + Gemini implementation, GitHub CI, Cloudflare Pages frontend.

**Spec:** `docs/superpowers/specs/2026-09-28-talk-talk-oral-grader-online-integration.md`

## Global Constraints

- GitHub is the durable source of truth.
- Talk Talk = UI/session/product layer.
- Oral Grader = transcription/evidence/rubric engine.
- `heard_text` is immutable.
- Raw student audio must never be committed to Git.
- Browser storage is temporary recovery only.
- No Gemini/GitHub secret may be exposed to the browser.
- No local Talk Talk prosody score may masquerade as the final Oral Grader rubric.
- Every material change updates the current handoff in the same task/commit sequence.
- Use TDD: RED before implementation, GREEN before commit.
- Files use hyphens where new filenames are introduced.

## Review Focus

- Network loss after recording but before server acknowledgement: retain the accepted local take and allow idempotent retry.
- Duplicate taps/retries: create exactly one grading job for the same attempt/idempotency key.
- Low-confidence/unclear audio: return `review_required`; never fabricate certainty.
- Multi-student audio: preserve speaker attribution and score each student separately.
- Teacher override: change scores/comments without mutating literal transcript or raw automatic evidence.

---

### Task 1: Recover and lock the Oral Grader final-scoring contract

**Files:**
- Inspect: `Oral-Grader/` on `feature/oral-grader-v1-20260922`
- Inspect: final score/report artifacts under `Oral-Grader/rubrics/` and `Oral-Grader/reports/`
- Create/modify under `Oral-Grader/` only if the existing final scorer is not already committed
- Test: new Oral Grader rubric-stage tests
- Update: `docs/superpowers/handoffs/2026-09-23-talk-talk-current.md`

**Interfaces:**
- Consumes: accepted Stage-1 evidence + Stage-2 evidence.
- Produces: canonical per-student `rubric_scores`, `total`, comments, confidence/review-required, report payload.

- [ ] **Step 1: Write a failing test for the known Paul/Paulina fixture**

Assert the rubric-stage contract returns five 0-8 dimensions and total /40 without changing Stage-1 heard evidence.

- [ ] **Step 2: Run the test and verify RED**

Expected: FAIL if the final scorer is not currently exposed as executable code.

- [ ] **Step 3: Locate/recover existing scoring logic before writing a replacement**

Check prior branches/artifacts/history for the logic that generated the existing final scores. Do not invent a second rubric engine while recoverable logic exists.

- [ ] **Step 4: If necessary, formalize recovered logic as an Oral Grader rubric-stage executable**

The executable belongs under `Oral-Grader/`, not `Talk-Talk/`.

- [ ] **Step 5: Run all Oral Grader tests**

Expected: Stage 1, Stage 2 and rubric-stage tests GREEN.

- [ ] **Step 6: Commit and update handoff**

---

### Task 2: Define the Talk Talk ↔ Oral Grader job/result schemas

**Files:**
- Create: `Talk-Talk/evaluation/oral-grader-schema.mjs`
- Create: `Talk-Talk/tests/oral-grader-schema.test.mjs`
- Update handoff

**Interfaces:**
- Produces: validation/normalization for submission jobs and OG result payloads.

- [ ] **Step 1: Write RED tests for required job fields and result fields**
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement schema validators**
- [ ] **Step 4: Verify GREEN and run Talk Talk suite**
- [ ] **Step 5: Commit and document**

---

### Task 3: Map existing real Oral Grader fixtures into Talk Talk

**Files:**
- Create: `Talk-Talk/evaluation/oral-grader-mapper.mjs`
- Create: `Talk-Talk/evaluation/oral-grader-adapter.mjs`
- Create: `Talk-Talk/tests/oral-grader-mapper.test.mjs`
- Use real fixture data from Oral Grader without calling Gemini
- Update handoff

**Interfaces:**
- Consumes: canonical OG result payload.
- Produces: Talk Talk student/teacher view model.

- [ ] **Step 1: Write RED test using Paul/Paulina OG evidence/result fixture**
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement minimal mapping**
- [ ] **Step 4: Verify literal `heard_text` remains unchanged**
- [ ] **Step 5: Verify rubric scores map to five Teacher Monitor rows**
- [ ] **Step 6: Run suite, commit, document**

---

### Task 4: Add the online grading-job boundary

**Files:**
- Create server-side job endpoint/module in the chosen existing online backend boundary
- Create client: `Talk-Talk/evaluation/oral-grader-client.mjs`
- Create tests for upload/idempotency/status
- Update handoff

**Interfaces:**
- Client produces: `submitAttempt(audioBlob, metadata, idempotencyKey)`
- Server returns: `{jobId,status}`
- Status endpoint returns canonical job/result state.

- [ ] **Step 1: Write RED tests for submit, duplicate retry and status**
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Implement authenticated server-side submission boundary**
- [ ] **Step 4: Keep Gemini/repository credentials server-side**
- [ ] **Step 5: Add temporary raw-audio lifecycle**
- [ ] **Step 6: Run tests, commit, document**

---

### Task 5: Replace local 'Finish' grading with explicit online Califica flow

**Files:**
- Modify: `Talk-Talk/index.html`
- Modify: `Talk-Talk/app.mjs`
- Modify: `Talk-Talk/standalone-session.mjs` only for temporary recovery semantics
- Modify/add tests: `Talk-Talk/tests/standalone-ui-flow.test.mjs` and grading-flow tests
- Update handoff

**Interfaces:**
- Consumes: Task 4 client.
- Produces: accepted take -> online job.

- [ ] **Step 1: RED test: accepted recording exposes Review audio, Record again and Califica**
- [ ] **Step 2: RED test: Califica uploads once and keeps local recovery until acknowledgement**
- [ ] **Step 3: Implement submission UI states**
- [ ] **Step 4: Implement idempotent retry**
- [ ] **Step 5: Delete/expire local recovery only after server acknowledgement**
- [ ] **Step 6: Run suite, commit, document**

---

### Task 6: Render real Oral Grader processing/result in Student views

**Files:**
- Modify: `Talk-Talk/index.html`
- Modify: `Talk-Talk/app.mjs`
- Add result-render tests
- Update handoff

**Interfaces:**
- Consumes: canonical job/result state.
- Produces: processing UI and real student feedback.

- [ ] **Step 1: RED tests for processing, completed and review-required states**
- [ ] **Step 2: Implement polling/subscription**
- [ ] **Step 3: Remove local diagnostic scores from the production grading result**
- [ ] **Step 4: Render only real OG evidence**
- [ ] **Step 5: Run suite, commit, document**

---

### Task 7: Make Teacher Monitor online and Oral-Grader-backed

**Files:**
- Modify: `Talk-Talk/teacher-app.mjs`
- Modify: `Talk-Talk/teacher.html`
- Modify/add Teacher Monitor tests
- Update handoff

**Interfaces:**
- Consumes: shared online jobs/results.
- Produces: teacher queue, audio/transcript/evidence/scores/override/publish UI.

- [ ] **Step 1: RED test: teacher on a separate browser session sees submitted job**
- [ ] **Step 2: RED test: five automatic rubric scores and total render from OG**
- [ ] **Step 3: Implement shared online job list/result view**
- [ ] **Step 4: Implement override layer without transcript mutation**
- [ ] **Step 5: Implement final publish state**
- [ ] **Step 6: Run suite, commit, document**

---

### Task 8: End-to-end production-readiness verification

**Files:**
- Add E2E/smoke tests and deployment workflow gates
- Update handoff and continuity docs

**Interfaces:**
- Validates Tasks 1-7 together.

- [ ] **Step 1: Record from student session/device A**
- [ ] **Step 2: Review/re-record and press Califica**
- [ ] **Step 3: Verify online job survives page/device changes**
- [ ] **Step 4: Verify real Stage 1 transcript**
- [ ] **Step 5: Verify real Stage 2 evidence**
- [ ] **Step 6: Verify all five automatic scores + /40**
- [ ] **Step 7: Verify teacher session/device B receives result**
- [ ] **Step 8: Verify override cannot alter literal transcript**
- [ ] **Step 9: Verify no raw audio entered Git**
- [ ] **Step 10: Run complete Talk Talk + Oral Grader suites**
- [ ] **Step 11: Request code review**
- [ ] **Step 12: Only after GREEN, follow finishing-development-branch integration process**
- [ ] **Step 13: Verify production URLs directly before claiming production**

## Self-review

Spec coverage:
- temporary local recording: covered Tasks 4-5;
- online Oral Grader submission: Tasks 4-5;
- Stage 1/2 + final rubric: Tasks 1-3;
- immutable heard transcript: Tasks 1, 3, 7, 8;
- five 0-8 scores + /40: Tasks 1, 3, 7, 8;
- multi-device teacher flow: Tasks 4, 7, 8;
- no fake/local replacement grading: Tasks 5-6;
- handoff/documentation on every material task: global constraint + every task.

Known dependency:
- Task 1 must establish where the already-produced final rubric scores are generated before production integration can honestly be called fully automatic.
