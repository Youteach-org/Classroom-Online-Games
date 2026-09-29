# Decision — Oral Grader online backend uses Firebase Functions Python

Date: 2026-09-28
Status: CANONICAL for the Talk Talk online-integration implementation
Repository: `Youteach-org/Classroom-Online-Games`

## Decision

The online Oral Grader backend will run as **Firebase Cloud Functions using Python**, attached to the existing Firebase project `youteach-d9a79`.

Cloudflare Pages remains the Talk Talk frontend host.

## Why

The canonical Oral Grader implementation is already Python:
- `Oral-Grader/stage1/gemini-transcribe.py`
- `Oral-Grader/stage2/analyze-audio.py`
- `Oral-Grader/stage3/score-rubric.py`

Running the backend in Python avoids:
- duplicating Stage 1/2/3 in JavaScript;
- creating a second scoring engine;
- exposing `GEMINI_API_KEY` to the browser;
- making GitHub Actions the production request runtime.

The repository already targets Firebase project:
- `.firebaserc` -> `youteach-d9a79`
- Realtime Database is already used by Talk Talk online/session code.

## Online job architecture

1. Talk Talk records and reviews audio in the browser.
2. The accepted take remains locally recoverable until server acknowledgement.
3. Talk Talk POSTs the audio + canonical job metadata to an HTTPS Firebase Function.
4. The function authenticates the request.
5. The function creates or returns the idempotent job.
6. Raw audio is stored temporarily in Cloud Storage under an unguessable job path.
7. Job metadata/state is stored in Realtime Database under:
   `classroomGames/talkTalk/oralGrader/jobs/{jobId}`
8. The Oral Grader processor consumes the temporary audio and runs the canonical Python Stage 1 -> Stage 2 -> Stage 3 pipeline.
9. Processing state/result is written to the same online job record.
10. Talk Talk student and Teacher Monitor read the shared job/result.
11. Raw temporary audio is deleted after successful processing/result persistence.
12. Retryable processing failures retain the audio long enough for retry according to retention policy.

## Authentication

During the current standalone testing phase:
- the temporary simple student/teacher credentials may obtain a short-lived server-signed test session token;
- grading endpoints require that signed token;
- the signing secret exists only in Firebase Secret Manager.

This is preview authentication, not final YouTeach authentication.

Production YouTeach integration later replaces the preview token issuer with the existing verified YouTeach identity/bridge contract without changing the Oral Grader job schema.

## Secrets

Server-only:
- `GEMINI_API_KEY` / explicitly supported Google API key
- `TALK_TALK_SESSION_SECRET`

Never:
- commit these secrets;
- return them to the browser;
- place them in Talk Talk JavaScript;
- store them in RTDB job payloads.

## Persistence ownership

Browser:
- temporary recording/recovery only.

Cloud Storage:
- temporary raw audio only.

Realtime Database:
- authoritative online job state;
- processing status;
- canonical Oral Grader result;
- teacher override/publish state later.

Git:
- code, tests, calibration policy, non-sensitive fixtures;
- never raw student audio.

## Idempotency

The final grading action must carry an `idempotencyKey`.

Submitting the same accepted attempt/key again:
- returns the existing job;
- must not store another audio object;
- must not launch a second Oral Grader run.

## Required status lifecycle

At minimum:
- submitted
- transcribing
- analyzing
- scoring
- completed
- review_required
- failed_retryable
- failed_terminal

No processing state may fabricate rubric scores.

## Deployment boundary

Task 4 implements and tests the backend/client contract.

Creating production cloud resources, secrets, or deploying Firebase Functions is a separate publish/security side effect and must not be claimed complete merely because repository tests are green.

## Sources checked before decision

Current repository:
- no existing Cloudflare Worker/Pages Function backend;
- Cloudflare deployment is static frontend only;
- Firebase RTDB project already exists.

The implementation choice preserves Oral Grader as the single grading engine.


## Amendment — teacher playback retention (2026-09-29)

The earlier statement "delete raw temporary audio immediately after successful processing/result persistence" is superseded for Talk Talk.

Reason:
- the approved Teacher Monitor includes real recording playback;
- teacher review/override must be evidence-grounded;
- deleting the source immediately after Stage 3 would make that approved control non-functional.

Canonical retention rule:
- browser copy remains temporary recovery only;
- server raw audio remains temporary in Cloud Storage after Stage 3 while teacher review is pending;
- teacher may play the submitted source recording through an authenticated server endpoint;
- publishing the teacher result deletes the raw server audio;
- a separate expiry/cleanup policy must delete abandoned/unpublished raw audio after the configured retention window;
- the raw object key is never exposed directly to the browser;
- raw audio is never committed to Git.

Cost if wrong:
- retaining audio until publish increases temporary Storage/privacy exposure; therefore authenticated access, publish deletion, and expiry cleanup are mandatory.
