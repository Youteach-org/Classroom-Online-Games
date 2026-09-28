# Talk Talk — Handoff / Project Continuity

Date: 2026-09-23
Repository: Youteach-org/Classroom-Online-Games
Production site: https://classroom-online-games.pages.dev
Application path: /Talk-Talk/

## Purpose

Talk Talk is the speaking/oral-assessment product inside Classroom Online Games.

Product/UI responsibility:
- student speaking/pronunciation practice
- creator mode for oral activities
- teacher monitor
- practice vs assessment modes
- group/team state
- audio capture
- eventual oral-result review and publishing

Oral intelligence responsibility:
- Talk Talk will consume the Oral-Grader pipeline instead of reimplementing it.
- Oral-Grader remains the transcription/evaluation engine.
- Gemini Stage 1 produces literal transcription.
- Stage 2 produces oral analysis and evidence.

## Non-negotiable evidence rule

The literal heard transcript is immutable evidence.
Later stages may add:
- intended_text
- interpretation
- pronunciation findings
- grammar/vocabulary findings
- fluency/coherence/interaction findings
- rubric scores
but must never overwrite heard_text.

## Current UI status

Talk Talk code is on main under:
- Talk-Talk/index.html
- Talk-Talk/app.mjs
- Talk-Talk/styles.css
- Talk-Talk/creator.html
- Talk-Talk/creator.mjs
- Talk-Talk/teacher.html
- Talk-Talk/teacher-app.mjs

Supporting modules exist under:
- Talk-Talk/core/
- Talk-Talk/conversation/
- Talk-Talk/curriculum/
- Talk-Talk/evaluation/
- Talk-Talk/group/
- Talk-Talk/live/
- Talk-Talk/speech/
- Talk-Talk/storage/
- Talk-Talk/teacher/
- Talk-Talk/ui/
- Talk-Talk/tests/

Visual system currently implemented:
- no green primary color
- plum/dark-purple primary
- amber/coral accent
- cream/light background
- large rounded cards
- responsive student and teacher layouts

Teacher Monitor includes a Preview layout button for viewing a populated demo without a live class session.

## Production integration history

Talk Talk was merged to main through PR #49.
Merge commit:
- 3cd6d2d6ca3e8a0f8196d0a0c18075ab7445645c

Important earlier integration branch:
- feature/talk-talk-oral-grader-integration-20260923

Clean production branch used for PR #49:
- talk-talk-live-20260923

## Deployment incident discovered 2026-09-23

Symptom:
- /Talk-Talk/ did not serve the Talk Talk app after merge.
- User saw the Classroom Online Games landing/card behavior instead.

Root cause:
- Talk-Talk existed in main but both Cloudflare deployment workflows copied only selected directories into dist.
- Talk-Talk was omitted from the copy list.
- Therefore the deployed static artifact did not contain /Talk-Talk/.

Affected workflows:
- .github/workflows/deploy-cloudflare-pages.yml
- .github/workflows/cloudflare-pages-main.yml

Fix branch:
- fix-talk-talk-deploy-20260923

Fix:
- add Talk-Talk to each cp -R ... dist/ list
- add Talk-Talk to the pinned Cloudflare Pages BUILD_COMMAND in cloudflare-pages-main.yml

Do not consider deployment complete until the production URL is opened and verified directly.

## Expected production URLs

Student:
https://classroom-online-games.pages.dev/Talk-Talk/

Teacher Monitor:
https://classroom-online-games.pages.dev/Talk-Talk/teacher.html

Creator:
https://classroom-online-games.pages.dev/Talk-Talk/creator.html

## Current functional modules already present

Speech:
- audio-capture.mjs
- attempt-recorder.mjs
- attempt-pipeline.mjs
- speaker-id.mjs
- stt-adapter.mjs
- prosody.mjs
- phoneme-adapter.mjs
- local-transformers-runtime.mjs
- model-manifest.mjs

Evaluation:
- evaluation-engine.mjs
- interaction-engine.mjs

Teacher:
- monitor-model.mjs
- teacher-app.mjs

Current modes:
- Practice
- Assessment

Planned mode:
- Live Assessment

## Oral-Grader integration plan

Talk Talk = product/session/UI layer.
Oral-Grader = transcription and oral-analysis engine.

Target pipeline:
1. Talk Talk records or receives audio.
2. Talk Talk creates an oral evaluation job.
3. Oral-Grader Stage 1 runs literal transcription.
4. Speaker-separated transcript and timestamps are stored.
5. Oral-Grader Stage 2 analyzes speech.
6. Structured evidence is mapped into Talk Talk.
7. Teacher Monitor displays recording, transcript, evidence and rubric scores.
8. Teacher may override scores/comments.
9. Original transcript remains immutable.
10. Final result can later be published to YouTeach.

Expected result fields:
- heard_text
- intended_text
- speakers
- segments/timestamps
- pronunciation
- grammar
- vocabulary
- fluency
- coherence
- interaction
- evidence
- rubric_scores
- uncertainty/confidence
- teacher_override

## Next implementation milestone

After production deployment is verified:
1. Build the Oral-Grader adapter inside Talk-Talk/evaluation/.
2. Use the existing Paul/Paulina Stage 2 fixture as the first integration test.
3. Render that real Oral-Grader result in the Teacher Monitor.
4. Then wire new Talk Talk recordings into Oral-Grader Stage 1 + Stage 2.
5. Add teacher score editing and final report publishing.
6. Later expose the same Oral-Grader engine to YouTeach oral assignments.

## Verification rule for future handoffs

Never report Talk Talk as deployed merely because:
- code is merged to main, or
- GitHub Actions is green.

Verify all three directly after every production change:
- /Talk-Talk/
- /Talk-Talk/teacher.html
- /Talk-Talk/creator.html

A successful handoff should record:
- exact production commit
- workflow run IDs
- direct route verification
- known remaining issues


## Visual target locked — 2026-09-23

The approved eight-screen mockup is the mandatory visual target for Talk Talk.

Do not reinterpret or simplify it.

Student views required:
1. Inicio (student)
2. Grabación (student)
3. Conversación (student)
4. Resultado de práctica (student)

Teacher views required:
5. Teacher Monitor
6. Detalle del equipo
7. Evaluación oral
8. Evidencia y transcripción

Visual decisions:
- KEEP the green visual identity from the approved mockup.
- Green is the primary interaction/status color.
- White cards on warm/light backgrounds.
- Rounded cards and controls.
- Include visible illustrated student characters/avatars.
- Include speech bubbles, audio waveforms, participant avatars, status chips, transcript bubbles, rubric bars, and issue tags.
- The characters are part of the UI target, not optional decoration.
- Mobile/responsive layout remains required.

Verification:
- Talk-Talk/tests/visual-contract.test.mjs defines the static visual contract.
- The feature must not be reported complete until the eight required view IDs and the green character system pass that contract.


## Current redesign implementation branch

Branch:
- talk-talk-mockup-v2-20260923

Visual contract:
- Talk-Talk/tests/visual-contract.test.mjs

CI workflow:
- .github/workflows/talk-talk-visual-contract.yml
- Runs JavaScript syntax checks plus all Talk-Talk tests.

Implementation files in this redesign:
- Talk-Talk/index.html
- Talk-Talk/app.mjs
- Talk-Talk/teacher.html
- Talk-Talk/teacher-app.mjs
- Talk-Talk/styles.css

Navigation model:
Student:
- studentHomeView -> studentRecordingView -> studentConversationView -> studentPracticeResultView
- Try again returns to recording.
- Full transcript returns to conversation.

Teacher:
- teacherMonitorView
- teacherTeamView
- teacherAssessmentView
- teacherEvidenceView
- team cards support selection; double click opens team detail.
- view buttons use data-teacher-view and showTeacherView().

Characters:
- Student home includes two large illustrated character components with speech bubbles.
- Recording and conversation screens reuse character-avatar components.
- Teacher monitor uses compact participant/avatar representations.
- Characters remain part of the approved design and must not be removed in later simplifications.


## Verification status — redesign branch

Feature branch:
- talk-talk-mockup-v2-20260923

Visual contract RED/GREEN evidence:
- Initial visual contract run: 35955105635 — FAILED against the previous UI, as expected.
- After implementation: 35955252998 — SUCCESS.
- Handoff-updated visual run: 35955265697 — SUCCESS.

Full Talk Talk matrix run:
- 35955436077
- Syntax: SUCCESS.
- Visual contract: SUCCESS.
- Student shell: SUCCESS.
- Teacher monitor: SUCCESS.
- Module shell: SUCCESS.
- Most functional Talk Talk tests: SUCCESS.
- Three tests remain red:
  - youteach-team-context.test.mjs
  - live-bootstrap.test.mjs
  - result-submit.test.mjs

Baseline comparison against clean main:
- Baseline branch: talk-talk-baseline-check-20260923
- youteach-team-context.test.mjs failed on clean main in run 35955477562.
- live-bootstrap.test.mjs and result-submit.test.mjs also fail on clean main in baseline matrix run 35955516187.
- Therefore these three failures predate the visual redesign; do not attribute them to the eight-screen UI implementation.

Integration rule:
- Do not claim the entire Talk Talk suite is green while these baseline failures remain.
- The visual redesign itself is verified by its dedicated contract and shell/monitor tests.
- Before production merge, either repair the three pre-existing integration tests or explicitly document an approved exception.


## Standalone testing mode — 2026-09-24

Purpose:
- Begin Talk Talk UI/flow testing without any YouTeach dependency.
- This is a temporary preview-only authentication layer, not production security.

Preview branch:
- talk-talk-standalone-preview

Temporary test credentials:
- Student: student / talktalk
- Teacher: teacher / talktalk

Standalone files:
- Talk-Talk/login.html
- Talk-Talk/login.mjs
- Talk-Talk/standalone-auth.mjs
- Talk-Talk/tests/standalone-auth.test.mjs

Behavior:
- Student credential routes to Talk-Talk/index.html.
- Teacher credential routes to Talk-Talk/teacher.html.
- Both views require the matching temporary standalone role.
- Log out clears the temporary browser session and returns to login.
- No YouTeach launch, team-context bridge, heartbeat or result-submit path is required for these preview UI tests.

Security note:
- Credentials are intentionally simple and client-side for temporary testing only.
- Do not reuse them for production or personal accounts.

Preview deployment:
- .github/workflows/talk-talk-standalone-preview.yml
- Deploys only this branch to a Cloudflare Pages preview, leaving main/production unchanged.


## Implementation lock — approved 8-screen mockup, real UI only

Source visual:
- Original approved artifact: `a_clean_ui_ux_product_mockup_collage_with_multiple.png`
- Dimensions: 1536 × 1024
- It is a REFERENCE and comparison target only. It must never be rendered as the application UI.

NON-NEGOTIABLE RULE — NO SHORTCUTS:
- The approved mockup is a visual specification, not inspiration.
- Reproduce each approved screen with real HTML/CSS/JS.
- Do not use screenshots, crops, full-screen images, image backgrounds, or transparent hotspot overlays to simulate implementation.
- Do not simplify, restyle, modernize, recolor, or reinterpret the approved screen without explicit user approval.
- If a function is not implemented, leave it visibly pending rather than faking it.
- Characters must be independent visual assets.
- Text, cards, buttons, tabs, waveforms, scores, transcript items, controls and status indicators must remain real DOM elements.
- The reference image may be retained only for side-by-side visual comparison and automated/manual validation.

Independent character assets currently used:
- `Talk-Talk/assets/home-characters.webp`
- `Talk-Talk/assets/paul-head.webp`
- `Talk-Talk/assets/paulina-head.webp`
- `Talk-Talk/assets/paulina-record.webp`

Required real views:
Student:
1. `studentHomeView` — Inicio
2. `studentRecordingView` — Grabación
3. `studentConversationView` — Conversación
4. `studentPracticeResultView` — Resultado de práctica

Teacher:
5. `teacherMonitorView` — Teacher Monitor
6. `teacherTeamView` — Detalle del equipo
7. `teacherAssessmentView` — Evaluación oral
8. `teacherEvidenceView` — Evidencia y transcripción

Current standalone branch:
- `talk-talk-standalone-preview`

Tests enforcing this rule:
- `Talk-Talk/tests/pixel-reference.test.mjs`
  - explicitly rejects screenshot/crop UI
  - requires independent character assets
  - requires the eight real views and navigation
- `Talk-Talk/tests/visual-contract.test.mjs`
  - requires real DOM panels and approved green system

TDD evidence for removing the screenshot shortcut:
- RED run: `36101106759`
- Failure occurred because the previous implementation still used the approved mockup as screen art.
- The new implementation replaces that shortcut with real DOM UI.

Future-session rule:
Before modifying Talk Talk visuals, read this section. If a proposed implementation would make a screenshot look finished without implementing the underlying UI, do not do it.


### Real-UI rebuild verification — 2026-09-25

The prior screenshot/crop implementation has been removed from visible student/teacher UI.

Verified branch state before this handoff update:
- UI commit: `f24a911338e002b1ffdb892bb80fd2ffb8fcf5bf`
- Standalone/UI tests: run `36101697406` — SUCCESS
- Cloudflare preview deploy: run `36101697331` — SUCCESS
- `Talk-Talk/index.html`: no approved-mockup image, no reference-art/reference-screen; uses independent character assets and real DOM panels.
- `Talk-Talk/teacher.html`: no approved-mockup image, no reference-art/reference-screen; uses independent character assets and real DOM panels.
- `Talk-Talk/styles.css`: no reference-art/reference-screen implementation.

TDD sequence:
- RED: `36101106759` caught the screenshot implementation.
- GREEN: `36101697406` verifies the real-DOM implementation contract.

Do not revert to the earlier direct-crop technique.


## Standalone functional flow — 2026-09-27

Status:
- Standalone UI is now functional without YouTeach.
- Authentication remains temporary/simple:
  - student / talktalk
  - teacher / talktalk

### Student flow now implemented

Real browser behavior:
1. Student opens the recording screen.
2. Microphone permission is requested through `speech/audio-capture.mjs`.
3. Recording uses the real browser `MediaRecorder` through `speech/attempt-recorder.mjs`.
4. The original audio Blob is retained for playback.
5. Audio is decoded to PCM and local prosody evidence is computed.
6. The attempt is persisted locally for later teacher review.
7. Student can play the saved recording.
8. Student can retry and replace the standalone attempt.
9. Student review shows only evidence actually available locally.

Persistence:
- Attempt metadata: browser `localStorage`
- Recorded audio Blob: browser `IndexedDB`
- Shared between the temporary student and teacher roles on the same browser/device.

### Evidence policy in standalone mode

Do not fabricate transcript or linguistic analysis.

Currently real/local:
- recording duration
- saved audio
- playback
- prosody / fluency evidence
- task-completion evidence based on the recorded attempt

Still pending Oral-Grader:
- literal transcript
- pronunciation
- grammar & vocabulary
- coherence
- interaction from multi-speaker evidence

The UI must display these as pending rather than filling them with fixture/demo values.

### Teacher flow now implemented

Teacher Monitor reads the latest standalone attempt.

Teacher can:
- see whether a real attempt exists
- open Team 1 detail
- play the student's actual saved recording
- see recording duration
- see local fluency evidence
- see explicit pending state for transcript/pronunciation/grammar/interaction
- enter manual 0–8 rubric scores
- add teacher comments
- publish the result locally for standalone testing
- generate a plain-text standalone review report
- queue the visible Twist locally for the next test attempt
- end the standalone activity locally

The previous hard-coded Paul/Paulina transcript and 28/40 assessment were removed from the functional preview.

### New standalone modules / contracts

- `Talk-Talk/standalone-session.mjs`
  - standalone attempt model
  - local evaluation builder
  - localStorage + IndexedDB persistence
  - teacher review state
  - local publish state
- `Talk-Talk/speech/attempt-recorder.mjs`
  - now returns the original recorded Blob in addition to decoded PCM

Functional tests:
- `Talk-Talk/tests/standalone-functional.test.mjs`
- `Talk-Talk/tests/standalone-ui-flow.test.mjs`
- `Talk-Talk/tests/attempt-recorder.test.mjs`

TDD evidence:
- Real functional RED after CI newline correction: run `36378694734` — FAILURE as expected.
- Functional GREEN: run `36378970291` — SUCCESS.
- Deploy workflow is now gated on the same standalone functional tests.

### Next milestone

Connect Oral-Grader to this real standalone attempt:
1. Send/use the saved recording as Oral-Grader input.
2. Preserve literal `heard_text`.
3. Map Stage 2 evidence into the teacher/student views.
4. Replace pending transcript/pronunciation/grammar/coherence/interaction states with real evidence.
5. Keep teacher override separate from immutable transcript evidence.

Do not reconnect YouTeach until the standalone end-to-end oral flow is stable.
