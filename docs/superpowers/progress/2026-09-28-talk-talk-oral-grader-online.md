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
