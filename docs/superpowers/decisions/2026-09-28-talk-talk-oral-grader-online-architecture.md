# Decision — Talk Talk uses Oral Grader as the online grading engine

Date: 2026-09-28  
Repository: `Youteach-org/Classroom-Online-Games`  
Current implementation branch: `talk-talk-standalone-preview`

## Status

CANONICAL / NON-NEGOTIABLE.

This decision supersedes any earlier wording that treats browser-local scoring or browser-local persistence as the intended production architecture.

## Product boundary

Talk Talk is the product/session/UI layer.

Talk Talk owns:
- student and teacher UI;
- activity/session state;
- microphone capture;
- recording review / re-record UX;
- temporary local recovery while a recording is still being prepared;
- submission state;
- rendering Oral Grader results;
- teacher review/override UI;
- final publishing to YouTeach later.

Oral Grader is the oral-evaluation engine.

Oral Grader owns:
- literal transcription;
- speaker separation/timestamps;
- heard-text preservation;
- intended-text inference when justified;
- pronunciation evidence;
- grammar/vocabulary evidence;
- fluency evidence;
- coherence evidence;
- interaction evidence;
- rubric scoring;
- total score;
- evidence/confidence markers;
- report payload.

Talk Talk must not replace Oral Grader with a reduced local scoring approximation.

## Required online flow

The accepted production flow is:

1. Student records in Talk Talk.
2. The recording may exist temporarily on the student's device while recording/review/re-record is in progress.
3. Student reviews the take or records again.
4. Student presses the final submit/grade action (`Califica` / equivalent accepted UI label).
5. Talk Talk sends the accepted audio plus job metadata to the online Oral Grader pipeline.
6. Oral Grader processes the submitted audio online.
7. Oral Grader returns the literal transcript, structured evidence, rubric scores and report payload.
8. Talk Talk displays the returned result to the student as appropriate for the activity mode and to Teacher Monitor.
9. Teacher may review/override scores/comments, but the literal heard transcript remains immutable evidence.
10. Temporary device audio may be deleted after successful online submission/result acknowledgement, subject to recovery policy.

Browser `localStorage` / `IndexedDB` are NOT the production grading backend.

## Audio handling

Allowed local use:
- in-progress recording;
- immediate playback;
- re-record flow;
- temporary recovery until submission succeeds.

Required online behavior:
- accepted recording is submitted to the online Oral Grader job;
- processing does not depend on student and teacher sharing the same browser/device;
- Teacher Monitor receives the online job/result through shared online state.

Raw student audio must not be committed to Git.

## Oral Grader evidence rule

`heard_text` is immutable evidence.

Later fields may include:
- `intended_text`;
- pronunciation interpretation;
- grammar/vocabulary interpretation;
- fluency/coherence/interaction evidence;
- rubric scores;
- teacher overrides.

None may rewrite the literal heard form.

## Existing Oral Grader implementation verified on 2026-09-28

Canonical OG branch:
- `feature/oral-grader-v1-20260922`

Verified implementation:
- `Oral-Grader/stage1/gemini-transcribe.py`
- `.github/workflows/oral-grader-v1.yml`
- `Oral-Grader/stage2/analyze-audio.py`
- `.github/workflows/oral-grader-stage2.yml`
- Stage-1 outputs for Paul/Paulina and Adrian
- Stage-2 outputs for Paul/Paulina and Adrian
- accepted Stage-2 review for Paul/Paulina
- final score artifacts for the Units 1-4 batch
- final Paul/Paulina report metadata

Verified existing integration branch:
- `feature/talk-talk-oral-grader-integration-20260923`

Existing integration plan:
- `docs/superpowers/plans/2026-09-23-talk-talk-oral-grader-integration.md`

That plan already defines:
- Talk Talk = UI/session layer
- Oral Grader = oral evaluation engine
- Oral Grader result contract includes `rubric_scores`
- Teacher Monitor renders transcript/evidence/scores
- literal transcript remains immutable

## Important implementation-status distinction

The current committed Stage-2 workflow validates:

`scoring_status = "evidence_only_not_final_rubric"`

The `Oral-Grader/` tree on `feature/oral-grader-v1-20260922` contains final score/report artifacts, but no dedicated committed Stage-3/rubric-scoring executable was found in the tree during the 2026-09-28 audit.

Therefore:

- do NOT conclude that Oral Grader lacks grading capability;
- do NOT invent a replacement scorer in Talk Talk;
- recover/identify the existing final-scoring logic if it exists outside the committed OG tree;
- if the final scoring logic was previously performed ad hoc, formalize it as a committed Oral Grader scoring stage before calling Talk Talk fully automatic;
- Talk Talk's production `Califica` flow is complete only when the returned Oral Grader payload includes the five 0-8 rubric scores and total /40.

## Talk Talk assessment rubric

Each student:
- Fluency — 0 to 8
- Coherence & Organization — 0 to 8
- Grammar & Vocabulary — 0 to 8
- Pronunciation & Intelligibility — 0 to 8
- Communicative Interaction — 0 to 8
- Total — 0 to 40

## One-click grading requirement

For Talk Talk, the normal user experience is one online grading flow after the recording is accepted.

The older standalone OG batch workflow may retain explicit review gates for teacher-controlled batch processing, but Talk Talk must not require the student/teacher to manually shuttle Stage 1 -> Stage 2 -> rubric as separate product steps.

Low-confidence or technically invalid evidence must produce a review-required state rather than fabricated certainty.

## Standalone preview status

The current standalone branch is a UI/recording integration test bed only.

Its local prosody/duration evaluation is diagnostic fallback evidence and MUST NOT be presented as the final production oral grade once Oral Grader integration is active.

## Required future-session read order

Before changing Talk Talk grading or Oral Grader integration:
1. this decision;
2. `docs/superpowers/specs/2026-09-28-talk-talk-oral-grader-online-integration.md`;
3. `docs/superpowers/handoffs/2026-09-23-talk-talk-current.md`;
4. the current OG branch and current Talk Talk branch.

Do not reconstruct this architecture from chat memory.
