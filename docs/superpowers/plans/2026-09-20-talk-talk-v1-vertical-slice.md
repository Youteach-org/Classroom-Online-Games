# Talk Talk V1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real Talk Talk A2–B1 vertical slice, “Tell Me What Happened,” with zero-cost local speech processing, YouTeach-controlled identity/teams, individual and group speaking, actionable feedback, Personal Practice, Teacher Monitor, and automatic result return.

**Architecture:** Talk Talk is a new isolated COG module that consumes the existing secure Live COG ↔ YouTeach bridge. Browser-side adapters separate capture, model inference, evaluation, student memory, group orchestration, and UI so heavy models can degrade independently on modest devices. YouTeach remains authoritative for identity, groups, teams, live-session eligibility, and school-side result ownership.

**Tech Stack:** Static HTML/CSS/ES modules; Node built-in test runner; Web Audio/MediaRecorder; Web Workers; IndexedDB/Cache API; WebGPU when available with WASM/CPU fallback; open local speech/model runtimes only; Firebase Realtime Database for Talk Talk ephemeral/realtime state; Cloudflare Pages deployment; existing YouTeach Cloudflare Functions and Live COG bridge.

**Spec:** `docs/superpowers/specs/2026-09-20-talk-talk-speaking-system-design.md`

## Global Constraints

- Mandatory operating cost for essential Talk Talk behavior: **$0**.
- No essential behavior may require Azure, OpenAI API, ElevenLabs, paid speech APIs, paid LLM APIs, or per-minute/per-token billing.
- Ordinary raw audio remains on-device and is deleted after processing/synchronization.
- Raw audio may be retained only for an explicitly configured Assessment evidence flow.
- Permanent voice prints are prohibited; in-person speaker embeddings are session-scoped and deleted after synchronization.
- YouTeach is authoritative for teacher/student identity, groups, team formation, live launch context, and academic ownership.
- Talk Talk does not create a second permanent student/team system.
- In-person group capture may use one Host Recorder; participants must not touch or watch the host phone while conversing.
- Remote group capture uses one device/microphone per learner; V1 does not build videoconferencing.
- Low-confidence technical evidence never lowers an academic result.
- Talk Talk working branding must remain replaceable in identifiers and stored schemas.
- V1 content scope is the A2–B1 unit **Tell Me What Happened**.
- Implementation starts from the current Live COG integration branches, not from an older `main` snapshot:
  - COG: `Youteach-org/Classroom-Online-Games@feature/live-cog-session-current-20260920` (planning checkpoint `9dbf1e3709bc4ac668054f510972f8bb37c62050`)
  - YouTeach: `Youteach-org/YouTeach@feature/live-cog-session-current-20260920` (planning checkpoint `133e720923a90e233a0002795789c9650e75c299`)
- Before implementation begins, refresh both branch HEADs and reconcile any new live-bridge changes instead of resetting them to these planning checkpoints.
- Existing Live COG authentication, result validation, presence, expiry, and idempotency are reused, not reimplemented.

## Review Focus

1. **Modest Android device without WebGPU:** the lesson must fall back to Basic processing and remain completable without a local LLM.
2. **Noisy in-person group audio / uncertain speaker identity:** ambiguous and overlapping segments must be excluded from individual scoring rather than guessed.
3. **Temporary network loss:** active conversation continues locally and derived results retry synchronization without duplicate YouTeach results.
4. **Microphone denial or unusable input level:** the user receives a technical recovery path; no academic failure is recorded.
5. **Remote devices with clock skew:** turn ordering uses a session time-offset handshake and normalized timestamps rather than trusting raw client clocks.

---

## File Structure Locked by This Plan

### Classroom Online Games

`Talk-Talk/`
- `index.html` — student shell.
- `teacher.html` — Talk Talk Teacher Monitor shell.
- `styles.css` — Talk Talk visual system.
- `app.mjs` — student composition root only.
- `teacher-app.mjs` — teacher composition root only.
- `config.mjs` — stable ids, paths, thresholds, feature flags.
- `curriculum/tell-me-what-happened.mjs` — first unit content/schema.
- `core/activity-schema.mjs` — schema validation/normalization.
- `core/activity-engine.mjs` — Hear→Adapt state machine.
- `core/capability-profile.mjs` — Basic/Standard/Enhanced selection.
- `core/student-memory.mjs` — Observed/Recurring/Mastered skill state.
- `core/personal-practice.mjs` — Past -ed Clinic generation.
- `evaluation/evaluation-engine.mjs` — dimension aggregation/confidence.
- `evaluation/interaction-engine.mjs` — turn-level interaction evidence.
- `speech/audio-capture.mjs` — microphone lifecycle and local blobs.
- `speech/audio-worker.mjs` — off-main-thread preprocessing/inference dispatch.
- `speech/model-manifest.mjs` — only approved open/local model assets and licenses.
- `speech/stt-adapter.mjs` — local STT adapter boundary.
- `speech/phoneme-adapter.mjs` — local phoneme/forced-alignment boundary.
- `speech/prosody.mjs` — pauses/rate/pitch/energy features.
- `speech/speaker-id.mjs` — in-person diarization + temporary embedding match.
- `conversation/talk-engine-lite.mjs` — deterministic/intent conversation engine.
- `conversation/local-ai-adapter.mjs` — optional local-LLM boundary with fallback.
- `group/group-session.mjs` — team confirmation, host election, capture mode.
- `group/remote-timeline.mjs` — normalized remote turn timeline.
- `live/youteach-talk-talk-live.mjs` — Talk Talk adapter over `shared/youteach-live-bridge.mjs`.
- `live/sync-queue.mjs` — retry/idempotent derived-data synchronization.
- `storage/local-store.mjs` — IndexedDB/cache wrapper for models/pending results.
- `firebase-client.mjs` — Talk Talk ephemeral/realtime Firebase state only.
- `tests/*.test.mjs` — Node tests, one responsibility per file.

Existing COG files modified:
- `index.html` — add Talk Talk teacher-selectable card.
- `shared/youteach-live-bridge.mjs` — backward-compatible optional team/activity context helpers only.
- `firebase.json` and/or Talk Talk rules file — Talk Talk realtime path.
- `.github/workflows/cloudflare-pages-main.yml` only if Talk Talk static assets require verification paths.

### YouTeach

Create:
- `functions/api/talk-talk-profile-get.js`
- `functions/api/talk-talk-profile-upsert.js`
- `functions/_shared/talk-talk-profile.js`
- `tests/talk-talk-profile.test.mjs`
- `tests/talk-talk-team-context.test.mjs`

Modify:
- `buzzer.js` — expose existing team snapshot to the Talk Talk launch flow; do not create a second team builder.
- `functions/api/cog-live-student-resolve.js` — include sanitized optional `teamContext`.
- `functions/api/cog-live-result-submit.js` — accept strictly sanitized Talk Talk summary metrics while preserving schemaVersion 1 compatibility.
- matching Live COG tests for result and student resolve.

---

### Task 1: Establish Talk Talk module shell and baseline tests

**Repository:** COG

**Files:**
- Create: `Talk-Talk/index.html`
- Create: `Talk-Talk/teacher.html`
- Create: `Talk-Talk/styles.css`
- Create: `Talk-Talk/app.mjs`
- Create: `Talk-Talk/teacher-app.mjs`
- Create: `Talk-Talk/config.mjs`
- Create: `Talk-Talk/tests/module-shell.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Produces `TALK_TALK_GAME_ID = "talk-talk"`, `TALK_TALK_GAME_NAME = "Talk Talk"`, and route constants.
- No task may use the brand string as a database root; use `GAME_DATA_KEY = "speaking-v1"`.

- [ ] **Step 1: Write the failing shell test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Talk Talk shell exposes student and teacher entry points", async () => {
  const student = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const teacher = await readFile(new URL("../teacher.html", import.meta.url), "utf8");
  assert.match(student, /<script type="module" src="\.\/app\.mjs"><\/script>/);
  assert.match(teacher, /<script type="module" src="\.\/teacher-app\.mjs"><\/script>/);
});
```

- [ ] **Step 2: Run RED**

Run:
```bash
node --test Talk-Talk/tests/module-shell.test.mjs
```

Expected: FAIL because `Talk-Talk/index.html` does not exist.

- [ ] **Step 3: Create minimal shells and stable config**

```js
// Talk-Talk/config.mjs
export const TALK_TALK_GAME_ID = "talk-talk";
export const TALK_TALK_GAME_NAME = "Talk Talk";
export const GAME_DATA_KEY = "speaking-v1";
export const DEFAULT_UNIT_ID = "tell-me-what-happened";
export const RESULT_SCHEMA_VERSION = 1;
```

Student UI must contain only these first-route regions: `#homeView`, `#lessonView`, `#resultsView`, `#joinClassAction`.
Teacher UI must contain `#sessionState`, `#teamGrid`, `#teamDetail`, `#endActivityBtn`.

- [ ] **Step 4: Run shell and existing bridge suites**

```bash
node --test Talk-Talk/tests/module-shell.test.mjs
node --test tests/*.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk index.html
git commit -m "feat: add Talk Talk module shell"
```

---

### Task 2: Define the first curriculum unit and activity state machine

**Repository:** COG

**Files:**
- Create: `Talk-Talk/core/activity-schema.mjs`
- Create: `Talk-Talk/core/activity-engine.mjs`
- Create: `Talk-Talk/curriculum/tell-me-what-happened.mjs`
- Create: `Talk-Talk/tests/activity-engine.test.mjs`

**Interfaces:**
- Produces `normalizeActivity(raw): ActivityDefinition`.
- Produces `createActivitySession(activity, learner): ActivitySession`.
- Produces `advanceActivity(session, event): ActivitySession`.
- Canonical phases: `hear, notice, say, use, react, speak, challenge, results, adapt`.

- [ ] **Step 1: Write failing schema/state tests**

```js
test("Tell Me What Happened carries the approved A2-B1 targets", () => {
  const a = normalizeActivity(TELL_ME_WHAT_HAPPENED);
  assert.equal(a.id, "tell-me-what-happened");
  assert.deepEqual(a.cefr, ["A2", "B1"]);
  assert.deepEqual(a.pronunciationTargets, ["past-ed-t", "past-ed-d", "past-ed-id"]);
  assert.ok(a.interactionTargets.includes("follow-up-question"));
});

test("activity advances through the canonical Talk Talk phase order", () => {
  let s = createActivitySession(normalizeActivity(TELL_ME_WHAT_HAPPENED), { studentKey: "s1" });
  for (const phase of ["hear","notice","say","use","react","speak","challenge","results","adapt"]) {
    assert.equal(s.phase, phase);
    s = advanceActivity(s, { type: "PHASE_COMPLETE" });
  }
  assert.equal(s.status, "complete");
});
```

- [ ] **Step 2: Run RED**

```bash
node --test Talk-Talk/tests/activity-engine.test.mjs
```

- [ ] **Step 3: Implement the normalized shape**

The activity definition must include:
```js
{
  id,
  title,
  cefr,
  practiceMode: "practice",
  languageTargets,
  pronunciationTargets,
  speakingTargets,
  interactionTargets,
  phases,
  pairGroup: {
    modes: ["role-play", "information-gap", "problem-solving", "open-discussion"],
    twistEnabled: true
  }
}
```

Reject activities with missing id/title/phases or unknown phase names.

- [ ] **Step 4: Run tests**

```bash
node --test Talk-Talk/tests/activity-engine.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk/core Talk-Talk/curriculum Talk-Talk/tests/activity-engine.test.mjs
git commit -m "feat: add Talk Talk activity engine and first unit"
```

---

### Task 3: Add capability profiling and microphone technical gate

**Repository:** COG

**Files:**
- Create: `Talk-Talk/core/capability-profile.mjs`
- Create: `Talk-Talk/speech/audio-capture.mjs`
- Create: `Talk-Talk/speech/audio-worker.mjs`
- Create: `Talk-Talk/tests/capability-profile.test.mjs`
- Create: `Talk-Talk/tests/audio-capture.test.mjs`

**Interfaces:**
- `detectCapabilityProfile(env): { tier: "basic"|"standard"|"enhanced", webgpu, worker, memoryClass }`
- `analyzeInputLevel(samples): { usable, rms, clipped }`
- `createAudioCapture({ mediaDevices, AudioContextClass }): AudioCaptureController`

- [ ] **Step 1: Write failing Basic fallback and microphone tests**

```js
test("no WebGPU falls back to basic without blocking speaking", () => {
  const profile = detectCapabilityProfile({ gpu: null, deviceMemory: 2, Worker: function Worker(){} });
  assert.equal(profile.tier, "basic");
  assert.equal(profile.canCompleteCoreLesson, true);
});

test("silent microphone is technical failure, not learner failure", () => {
  const result = analyzeInputLevel(new Float32Array(16000));
  assert.equal(result.usable, false);
  assert.equal(result.reason, "input-too-low");
});
```

- [ ] **Step 2: Run RED**

```bash
node --test Talk-Talk/tests/capability-profile.test.mjs Talk-Talk/tests/audio-capture.test.mjs
```

- [ ] **Step 3: Implement capability and input-level rules**

Rules:
- Basic: no WebGPU or low memory; core lesson remains allowed.
- Standard: WebGPU available and memory class >= 4 GB.
- Enhanced: WebGPU plus memory class >= 8 GB.
- Input RMS below the configured floor returns `input-too-low`.
- Clipping over the configured fraction returns `input-clipping`.
- Permission denial maps to `microphone-denied`.
- None of those states create academic evidence.

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk/core/capability-profile.mjs Talk-Talk/speech Talk-Talk/tests
git commit -m "feat: add Talk Talk device and microphone gate"
```

---

### Task 4: Lock local model licensing and runtime adapters before shipping inference

**Repository:** COG

**Files:**
- Create: `Talk-Talk/speech/model-manifest.mjs`
- Create: `Talk-Talk/tests/model-manifest.test.mjs`
- Create: `Talk-Talk/docs/model-evaluation.md`

**Interfaces:**
- `APPROVED_MODEL_ASSETS` entries require `id, purpose, source, license, browserRuntime, maxDownloadBytes`.
- `assertModelManifest(manifest)` throws on missing license/source or prohibited remote paid service.

- [ ] **Step 1: Write the failing license-gate test**

```js
test("essential models must be local/open and license-documented", () => {
  for (const asset of APPROVED_MODEL_ASSETS) {
    assert.match(asset.source, /^https:\/\//);
    assert.ok(asset.license);
    assert.notEqual(asset.runtime, "paid-api");
    assert.equal(asset.requiredForCore, asset.purpose !== "local-llm");
  }
});
```

- [ ] **Step 2: Run RED**

```bash
node --test Talk-Talk/tests/model-manifest.test.mjs
```

- [ ] **Step 3: Populate an ordered V1 evaluation set**

The evaluation document must measure these local candidates before one is marked `approved: true`:
- STT candidate: `onnx-community/whisper-tiny.en` through `@huggingface/transformers`; browser/local only.\n- Phoneme candidate: `onnx-community/wav2vec2-ljspeech-gruut-ONNX` using the quantized `onnx/model_q4f16.onnx` asset; Apache-2.0 model card; browser/local only.\n- Speaker candidate: sherpa-onnx WASM with `wespeaker_en_voxceleb_resnet34.onnx`; sherpa-onnx and WeSpeaker are Apache-2.0, but the exact redistributed model asset must also pass the manifest license/source check before approval.
- Local LLM: optional only; no candidate is required for core acceptance.

Acceptance thresholds for required models:
- license explicitly permits the planned use;
- runs locally after asset download;
- no API key;
- no raw-audio upload;
- Basic path has a non-LLM fallback;
- model size and cold-start measurements are recorded on at least one modest Android test device before being marked approved.

Do not vendor a model whose license is unclear; leave it out of `APPROVED_MODEL_ASSETS` and keep the corresponding capability disabled until a compliant candidate passes.

- [ ] **Step 4: Run manifest test and record measured candidate results in `Talk-Talk/docs/model-evaluation.md`**

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk/speech/model-manifest.mjs Talk-Talk/tests/model-manifest.test.mjs Talk-Talk/docs/model-evaluation.md
git commit -m "chore: gate Talk Talk local models by license and device fit"
```

---

### Task 5: Implement local speech adapters and the evidence-first Evaluation Engine

**Repository:** COG

**Files:**
- Create: `Talk-Talk/speech/stt-adapter.mjs`
- Create: `Talk-Talk/speech/phoneme-adapter.mjs`
- Create: `Talk-Talk/speech/prosody.mjs`
- Create: `Talk-Talk/evaluation/evaluation-engine.mjs`
- Create: `Talk-Talk/tests/evaluation-engine.test.mjs`

**Interfaces:**
- `transcribeLocal(audio, options): Promise<TranscriptEvidence>`
- `analyzePhonemes(audio, target, options): Promise<PhonemeEvidence>`
- `analyzeProsody(samples, sampleRate): ProsodyEvidence`
- `evaluateAttempt({ task, transcript, phonemes, prosody, languageEvidence, interactionEvidence }): EvaluationResult`

`EvaluationResult`:
```js
{
  dimensions: {
    pronunciation: { value, confidence, evidence },
    fluency: { value, confidence, evidence },
    grammarVocabulary: { value, confidence, evidence },
    interaction: { value, confidence, evidence },
    taskCompletion: { value, confidence, evidence }
  },
  strength,
  primaryFocus,
  technicalRetry
}
```

- [ ] **Step 1: Write failing confidence and -ed evidence tests**

```js
test("low-confidence phoneme evidence cannot lower pronunciation", () => {
  const result = evaluateAttempt({
    task: { kind: "pronunciation", targetSkill: "past-ed-t" },
    phonemes: { confidence: "low", errors: [{ type: "extra-syllable" }] },
    transcript: { confidence: "high", text: "worked" }
  });
  assert.equal(result.technicalRetry, true);
  assert.equal(result.dimensions.pronunciation.value, null);
});

test("feedback names one actionable past-ed focus", () => {
  const result = evaluateAttempt({
    task: { kind: "pronunciation", targetSkill: "past-ed-t" },
    phonemes: { confidence: "high", errors: [{ type: "extra-syllable", word: "worked" }] }
  });
  assert.equal(result.primaryFocus.skillId, "past-ed-t");
  assert.equal(result.primaryFocus.action, "practice-final-ed-without-extra-syllable");
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement evidence aggregation**

Rules:
- no raw provider score becomes the final result;
- a missing/unreliable dimension is `null`, never zero;
- a task supplies dimension weights;
- confidence gates are applied before weighted aggregation;
- the output chooses one primary focus;
- pronunciation feedback distinguishes expected /t/, /d/, /ɪd/ for the first unit.

- [ ] **Step 4: Run**

```bash
node --test Talk-Talk/tests/evaluation-engine.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk/speech Talk-Talk/evaluation Talk-Talk/tests/evaluation-engine.test.mjs
git commit -m "feat: add Talk Talk local evaluation engine"
```

---

### Task 6: Add skill memory and Past -ed Clinic

**Repository:** COG + YouTeach

**COG Files:**
- Create: `Talk-Talk/core/student-memory.mjs`
- Create: `Talk-Talk/core/personal-practice.mjs`
- Create: `Talk-Talk/tests/student-memory.test.mjs`

**YouTeach Files:**
- Create: `functions/_shared/talk-talk-profile.js`
- Create: `functions/api/talk-talk-profile-get.js`
- Create: `functions/api/talk-talk-profile-upsert.js`
- Create: `tests/talk-talk-profile.test.mjs`

**Interfaces:**
- COG `recordSkillEvidence(profile, evidence): profile`
- COG `buildPersonalPractice(profile): PersonalPracticeMission[]`
- YouTeach profile stores normalized skill state, counts, lastEvidenceAt, trend, and current focus; it never stores raw audio.

- [ ] **Step 1: Write failing lifecycle tests**

```js
test("one failure is observed, repeated cross-context evidence becomes recurring", () => {
  let p = createEmptyProfile("s1");
  p = recordSkillEvidence(p, { skillId: "past-ed-t", outcome: "miss", context: "word", confidence: "high" });
  assert.equal(p.skills["past-ed-t"].state, "observed");
  p = recordSkillEvidence(p, { skillId: "past-ed-t", outcome: "miss", context: "sentence", confidence: "high" });
  p = recordSkillEvidence(p, { skillId: "past-ed-t", outcome: "miss", context: "conversation", confidence: "high" });
  assert.equal(p.skills["past-ed-t"].state, "recurring");
});

test("later successful transfer can master a recurring skill", () => {
  const p = profileWithRecurringPastEd();
  const next = recordSkillEvidence(p, { skillId: "past-ed-t", outcome: "hit", context: "conversation-transfer", confidence: "high" });
  assert.equal(next.skills["past-ed-t"].transferHits, 1);
});
```

- [ ] **Step 2: Run RED in both repositories**

```bash
node --test Talk-Talk/tests/student-memory.test.mjs
node --test tests/talk-talk-profile.test.mjs
```

- [ ] **Step 3: Implement secure profile API**

Storage:
```
talkTalkProfiles/{studentKey}
```

The endpoint derives `studentKey` from the verified signed student session and rejects a body attempting to write another student id.

Allowed persistent fields are skill aggregates and current focus only.

- [ ] **Step 4: Run both suites**

- [ ] **Step 5: Commit separately**

COG:\n```bash\ngit add Talk-Talk/core/student-memory.mjs Talk-Talk/core/personal-practice.mjs Talk-Talk/tests/student-memory.test.mjs\ngit commit -m "feat: add Talk Talk learning memory and personal practice"\n```

YouTeach:
```bash
git add functions tests/talk-talk-profile.test.mjs
git commit -m "feat: store verified Talk Talk learner profiles"
```

---

### Task 7: Build the individual Tell Me What Happened lesson and Conversation Replay

**Repository:** COG

**Files:**
- Modify: `Talk-Talk/index.html`
- Modify: `Talk-Talk/styles.css`
- Modify: `Talk-Talk/app.mjs`
- Create: `Talk-Talk/ui/lesson-view.mjs`
- Create: `Talk-Talk/ui/results-view.mjs`
- Create: `Talk-Talk/ui/conversation-replay.mjs`
- Create: `Talk-Talk/tests/individual-flow.test.mjs`

**Interfaces:**
- UI consumes Activity Engine + EvaluationResult.
- Replay receives only local/derived turn objects: `{ turnId, transcript, evidence, retryPrompt }`.

- [ ] **Step 1: Write failing DOM-independent flow test**

Assert the unit can progress from Hear to Results with fixture audio evidence and results contain:
- one strength;
- one primary focus;
- a replayable learner turn;
- no raw Blob in persisted result.

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement the first complete student flow**

The recording control has explicit states:
`ready → listening → processing → feedback`.

Technical failure states:
`microphone-denied`, `input-too-low`, `input-clipping`, `model-unavailable`.

Only `model-unavailable` may downgrade capability tier; none creates a learner error.

- [ ] **Step 4: Run unit tests and browser smoke test locally**

- [ ] **Step 5: Commit**

```bash
git add Talk-Talk
git commit -m "feat: complete Talk Talk individual vertical flow"
```

---

### Task 8: Add Talk Engine Lite and optional local-AI boundary

**Repository:** COG

**Files:**
- Create: `Talk-Talk/conversation/talk-engine-lite.mjs`
- Create: `Talk-Talk/conversation/local-ai-adapter.mjs`
- Create: `Talk-Talk/tests/talk-engine-lite.test.mjs`

**Interfaces:**
- `createConversation(definition, learnerContext)`
- `respond(conversation, learnerTurn): { reply, state, completedGoals, optionalTwist }`
- `createLocalAiAdapter(runtime): { available(), respond() }`

- [ ] **Step 1: Write failing coherence/fallback tests**

```js
test("lite engine follows the learner's stated problem", () => {
  const c = createConversation(HOTEL_SCENARIO, {});
  const r = respond(c, { text: "My room is very noisy." });
  assert.match(r.reply.toLowerCase(), /noise|room|hear/);
});

test("local AI failure falls back without failing the activity", async () => {
  const adapter = createLocalAiAdapter({ generate: async () => { throw new Error("oom"); } });
  const out = await adapter.respond({ fallback: () => ({ reply: "Tell me what happened next." }) });
  assert.equal(out.reply, "Tell me what happened next.");
});
```

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement Lite state/intent engine and adapter fallback**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit `feat: add Talk Talk conversation engine fallback`**

---

### Task 9: Extend the Live COG bridge with YouTeach team context

**Repositories:** both

**YouTeach Files:**
- Modify: `buzzer.js`
- Modify: `functions/api/cog-live-student-resolve.js`
- Create: `tests/talk-talk-team-context.test.mjs`

**COG Files:**
- Modify: `shared/youteach-live-bridge.mjs`
- Create: `Talk-Talk/live/youteach-talk-talk-live.mjs`
- Create: `Talk-Talk/tests/youteach-team-context.test.mjs`

**Interfaces:**
- Student resolved context adds optional:
```js
teamContext: {
  teamKey: "team3",
  teamLabel: "Team 3",
  memberKeys: ["s1","s2","s3"],
  memberNames: ["Sandra","Paul","Nicole"],
  teamRevision: "..."
}
```
- Existing games that ignore `teamContext` remain unchanged.

- [ ] **Step 1: Write YouTeach failing tests proving team data comes from the existing session teams, not request input**

A forged requested `teamKey` must be ignored/rejected.

- [ ] **Step 2: Write COG failing normalization test**

- [ ] **Step 3: Implement backward-compatible context extension**

`buzzer.js` continues using its current `buildSmartTeams()` and `savePairHistory()`; Talk Talk does not add another team algorithm.

- [ ] **Step 4: Run Live COG regression suites in both repositories**

YouTeach:
```bash
node --test tests/cog-live-*.test.mjs tests/talk-talk-team-context.test.mjs
```

COG:
```bash
node --test tests/*.test.mjs Talk-Talk/tests/youteach-team-context.test.mjs
```

- [ ] **Step 5: Commit in both repositories**

---

### Task 10: Add Talk Talk realtime team confirmation and Host Recorder election

**Repository:** COG

**Files:**
- Create: `Talk-Talk/group/group-session.mjs`
- Create: `Talk-Talk/firebase-client.mjs`
- Create: `Talk-Talk/live/sync-queue.mjs`
- Create: `Talk-Talk/storage/local-store.mjs`
- Create: `Talk-Talk/tests/group-session.test.mjs`
- Create: `Talk-Talk/tests/sync-queue.test.mjs`
- Modify Firebase rules/config as required.

**Interfaces:**
- `confirmTeamMember(session, studentContext, capabilityProfile)`
- `chooseHost(teamConfirmations): studentKey`
- `enqueueDerivedResult(result)`
- `flushSyncQueue(send)`

Ephemeral realtime shape:
```
classroomGames/talkTalk/sessions/{cogSessionId}/teams/{teamKey}/
  confirmations/{studentKey}
  hostStudentKey
  status
  captureMode
  turnEvents
```

- [ ] **Step 1: Write failing host-election test**

Host ranking is deterministic:
1. usable microphone;
2. Enhanced > Standard > Basic;
3. available storage;
4. stable tie-break by studentKey.

- [ ] **Step 2: Write failing network retry/idempotency test**

A queued derived result survives a simulated failed send and is removed only after an accepted receipt for the same `resultId`.

- [ ] **Step 3: Implement confirmation/host election and local queue**

No personal code entry is introduced. Team membership comes from YouTeach; student action is only Confirm.

- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit `feat: add Talk Talk team confirmation and host selection`**

---

### Task 11: Implement passive in-person speaker identification

**Repository:** COG

**Files:**
- Create: `Talk-Talk/speech/speaker-id.mjs`
- Create: `Talk-Talk/tests/speaker-id.test.mjs`
- Modify: `Talk-Talk/group/group-session.mjs`
- Modify: `Talk-Talk/speech/audio-worker.mjs`

**Interfaces:**
- `createTemporaryVoiceReference(samples): Promise<SpeakerEmbedding>`
- `attributeSegments({ segments, references, threshold }): AttributedSegment[]`
- Segment speaker is a `studentKey` or `null`.
- `overlap: true` segments are never individually scored.

- [ ] **Step 1: Write failing confidence-gate tests**

```js
test("uncertain segment stays unassigned", () => {
  const out = attributeSegments({
    segments: [{ id:"a", embedding:[0,1], overlap:false }],
    references: { s1:[1,0], s2:[0.9,0.1] },
    threshold: 0.8
  });
  assert.equal(out[0].studentKey, null);
});

test("overlap never becomes individual pronunciation evidence", () => {
  const out = attributeSegments({
    segments: [{ id:"a", embedding:[1,0], overlap:true }],
    references: { s1:[1,0] },
    threshold: 0.8
  });
  assert.equal(out[0].eligibleForIndividualScore, false);
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Wire the approved local diarization/speaker model from Task 4**

At session start, each confirmed member records a short calibration phrase on their own phone; only the temporary embedding is sent to the host session.

Host starts one continuous local recording after all confirmations or teacher override.

There is no `My Turn`, no `Who said this?`, and no end-of-session attribution questionnaire.

- [ ] **Step 4: Verify temporary references are deleted after successful result synchronization**

Add a test that `cleanupTeamCapture()` removes embeddings/audio cache but leaves derived results.

- [ ] **Step 5: Commit `feat: add passive Talk Talk in-person speaker attribution`**

---

### Task 12: Implement remote one-device-per-learner capture and normalized timeline

**Repository:** COG

**Files:**
- Create: `Talk-Talk/group/remote-timeline.mjs`
- Create: `Talk-Talk/tests/remote-timeline.test.mjs`
- Modify: `Talk-Talk/group/group-session.mjs`
- Modify: `Talk-Talk/live/youteach-talk-talk-live.mjs`

**Interfaces:**
- `syncSessionClock(serverNow, clientNow): offsetMs`
- `normalizeTurn(turn, offsetMs): NormalizedTurn`
- `mergeRemoteTurns(turns): ConversationTimeline`

- [ ] **Step 1: Write failing clock-skew test**

```js
test("remote timeline corrects two-minute client clock skew", () => {
  const a = normalizeTurn({ studentKey:"a", startedAtClient:120000, endedAtClient:125000 }, -120000);
  const b = normalizeTurn({ studentKey:"b", startedAtClient:6000, endedAtClient:9000 }, 0);
  const timeline = mergeRemoteTurns([b,a]);
  assert.deepEqual(timeline.map(t => t.studentKey), ["a","b"]);
});
```

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement launch-time/session-time offset handshake**

Use a YouTeach/COG bridge response timestamp or a tiny Talk Talk session-time request; do not trust raw device wall clocks.

Remote devices analyze their own raw audio locally and publish only derived turns/transcripts/evidence to the shared session.

- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit `feat: add Talk Talk remote conversation timeline`**

---

### Task 13: Evaluate interaction and deliver individual group feedback

**Repository:** COG

**Files:**
- Create: `Talk-Talk/evaluation/interaction-engine.mjs`
- Create: `Talk-Talk/tests/interaction-engine.test.mjs`
- Modify: `Talk-Talk/evaluation/evaluation-engine.mjs`
- Modify: `Talk-Talk/ui/results-view.mjs`

**Interfaces:**
- `analyzeInteraction(timeline, studentKey, task): InteractionEvidence`

Evidence fields:
`respondedTurns, relevantFollowUps, clarificationMoves, repairMoves, initiatedTurns, sustainedExchange`.

- [ ] **Step 1: Write failing fairness tests**

One silent partner must not lower the other learner’s pronunciation or grammar.

A learner who meaningfully responds but speaks less time can still receive strong interaction evidence.

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement turn-behavior analysis and group-to-individual result mapping**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit `feat: evaluate Talk Talk group interaction fairly`**

---

### Task 14: Add Talk Talk Teacher Monitor and Practice/Assessment behavior

**Repository:** COG

**Files:**
- Modify: `Talk-Talk/teacher.html`
- Modify: `Talk-Talk/teacher-app.mjs`
- Create: `Talk-Talk/teacher/monitor-model.mjs`
- Create: `Talk-Talk/tests/teacher-monitor.test.mjs`

**Interfaces:**
- Team state: `ready|speaking|finished|offline|technical-problem`.
- `buildMonitorSnapshot(sessionState)`.
- `buildAssessmentPolicy(mode)`.

- [ ] **Step 1: Write failing monitor/policy tests**

Practice permits hints/retries.
Assessment disables hints and mid-task corrective feedback and raises the minimum confidence accepted for scored evidence.

Monitor card shows team state first; linguistic scores appear only after reportable evidence exists.

- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement team-centric monitor, Twist dispatch, end activity, and individual detail**
- [ ] **Step 4: Run tests and browser smoke test**
- [ ] **Step 5: Commit `feat: add Talk Talk teacher monitor and assessment policy`**

---

### Task 15: Return Talk Talk summaries to YouTeach without weakening result validation

**Repositories:** both

**YouTeach Files:**
- Modify: `functions/api/cog-live-result-submit.js`
- Modify: `tests/cog-live-results.test.mjs`
- Create: `tests/talk-talk-results.test.mjs`

**COG Files:**
- Modify: `Talk-Talk/live/youteach-talk-talk-live.mjs`
- Create: `Talk-Talk/tests/result-submit.test.mjs`

**Interfaces:**
Talk Talk submits `resultType:"individual"` with existing schemaVersion 1.

Sanitized `metrics` adds only:
```js
{
  pronunciation: 0..100 | null,
  fluency: 0..100 | null,
  grammarVocabulary: 0..100 | null,
  interaction: 0..100 | null,
  taskCompletion: 0..100 | null,
  evidenceConfidence: 0..100 | null,
  unitId: "tell-me-what-happened",
  cefr: "A2" | "B1",
  primaryFocus: "past-ed-t" | "past-ed-d" | "past-ed-id" | "follow-up-question" | "fluency"
}
```

- [ ] **Step 1: Write failing server tests for unknown metric keys, forged student/session, duplicate resultId, and valid Talk Talk metrics**
- [ ] **Step 2: Run RED**
- [ ] **Step 3: Extend strict sanitizer; do not accept arbitrary nested client JSON**
- [ ] **Step 4: Run complete Live COG suites**
- [ ] **Step 5: Commit in both repositories**

---

### Task 16: Add minimal Creator Mode for the vertical slice

**Repository:** COG

**Files:**
- Create: `Talk-Talk/creator.html`
- Create: `Talk-Talk/creator.mjs`
- Create: `Talk-Talk/core/activity-draft.mjs`
- Create: `Talk-Talk/tests/activity-draft.test.mjs`

**Interfaces:**
- `duplicateActivity(activity): editableDraft`
- `validateDraft(draft): { valid, errors, activity }`

- [ ] **Step 1: Write failing duplicate/edit/validation test**
- [ ] **Step 2: Run RED**
- [ ] **Step 3: Implement edit fields for level, situation, instructions, roles, private information, prompts, Twist, pronunciation/language/interaction targets, duration, Practice/Assessment**
- [ ] **Step 4: Add visible `Test as Student` action that launches the draft locally without publishing**
- [ ] **Step 5: Commit `feat: add Talk Talk vertical-slice creator mode`**

---

### Task 17: Cross-repository regression and browser verification

**Repositories:** both

**Files:**
- Create/update targeted Talk Talk browser-verification notes under `docs/superpowers/progress/`.
- Update `docs/superpowers/PROJECT-CONTINUITY.md` in COG with final Talk Talk V1 checkpoint.

- [ ] **Step 1: Run YouTeach tests**

```bash
find functions -name '*.js' -print0 | xargs -0 -n1 node --check
node --test tests/cog-live-*.test.mjs tests/talk-talk-*.test.mjs
sh build-pages.sh
```

Expected: PASS.

- [ ] **Step 2: Run COG tests**

```bash
node --test tests/*.test.mjs
node --test Talk-Talk/tests/*.test.mjs
node --test Verb-Runner/tests/*.test.mjs
node --test Support-Meter/*.test.js Support-Meter/*.test.mjs
node --test 100-Students-Said/*.test.js
```

Expected: PASS.

- [ ] **Step 3: Browser smoke test the real teacher/student story**

Verify:
1. teacher opens COG from YouTeach;
2. teacher launches Talk Talk for selected group;
3. existing YouTeach teams appear without re-entry codes;
4. each student confirms their existing team;
5. in-person flow recommends one host;
6. host may be left on the table during conversation;
7. no speaker-confirmation prompts interrupt conversation;
8. ambiguous/overlap audio does not create individual penalties;
9. remote mode uses one local recorder per learner;
10. each student receives personal feedback;
11. ordinary raw audio is absent from network/storage inspection;
12. recurring past-ed issue creates Past -ed Clinic;
13. later successful transfer updates skill memory;
14. Teacher Monitor shows teams live and individual results after completion;
15. Talk Talk result appears once in YouTeach despite a forced retry;
16. temporary disconnect queues/synchronizes derived results.

- [ ] **Step 4: Verify Cloudflare preview deployments for the exact commits in both repositories**

Do not call V1 complete until both exact commit deployments are green.

- [ ] **Step 5: Commit continuity documentation**

COG:
```bash
git add docs/superpowers
git commit -m "docs: record Talk Talk V1 verification checkpoint"
```

---

## Task Dependency Order

```
1 shell
  → 2 curriculum
  → 3 capability/audio
  → 4 model license/runtime gate
  → 5 evaluation
  → 6 memory/profile
  → 7 individual flow
  → 8 conversation engine
  → 9 YouTeach team context
  → 10 team confirmation/host
  → 11 in-person speaker attribution
  → 12 remote timeline
  → 13 interaction feedback
  → 14 teacher monitor
  → 15 YouTeach results
  → 16 creator mode
  → 17 end-to-end verification
```

Tasks 11 and 12 may be developed independently after Task 10, but both must be green before Task 13.

## Deliberately Deferred Beyond V1

The implementation plan does not include:
- the full A1–C1 content catalog;
- native Talk Talk videoconferencing;
- large mandatory local LLMs;
- public leaderboards or rewards store;
- institution-scale reporting;
- permanent raw-audio archives;
- permanent speaker biometric profiles.

Those are separate post-V1 plans after real classroom validation of this vertical slice.

## Completion Definition

V1 is complete only when a real YouTeach group can launch **Tell Me What Happened**, complete individual and in-person/remote speaking, receive confidence-gated individual feedback, generate Past -ed Clinic from recurring evidence, demonstrate later transfer, synchronize results back to YouTeach idempotently, and do all essential processing without a paid API.
