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
