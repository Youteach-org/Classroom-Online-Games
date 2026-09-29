# Decision — Oral Grader teacher-review audio retention

Date: 2026-09-29
Status: CANONICAL for the online Talk Talk / Oral Grader integration

## Decision

Raw submitted audio remains temporary, but it is retained in Cloud Storage through the teacher-review window.

It is NOT deleted immediately when Stage 3 completes.

## Lifecycle

1. Student records locally.
2. Accepted take is uploaded to Oral Grader.
3. Stage 1 -> Stage 2 -> Stage 3 completes.
4. Canonical result is persisted.
5. Raw audio remains available only through an authenticated teacher playback endpoint.
6. Teacher reviews/overrides if needed.
7. Teacher publishes the final result.
8. Publish deletes the raw server audio.
9. A later expiry cleanup must delete abandoned/unpublished audio after the configured retention window.

## Security/privacy

- Never expose the Cloud Storage object key directly to the browser.
- Never commit raw audio to Git.
- Audio playback requires an authenticated teacher session.
- Teacher override is stored separately from immutable Oral Grader evidence.
- Literal heard_text remains immutable.
- Retention is temporary and must have expiry cleanup before production release.

## Why

The approved Teacher Monitor contains real recording playback. Evidence-grounded teacher review cannot depend on an audio object that was already deleted immediately after Stage 3.
