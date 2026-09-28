# AED Teacher Monitor Offline BLE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current monolithic AED browser prototype with an offline-first Teacher Monitor that configures and supervises one physical AED trainer over BLE on Android Chrome and iOS Bluefy.

**Architecture:** The monitor is a static web app with pure scenario/state modules, a transport-isolated BLE client, and a service-worker offline shell. The browser sends versioned semantic commands over a custom BLE GATT service; the physical trainer remains authoritative for live state and continues safely if BLE disconnects.

**Tech Stack:** HTML/CSS/vanilla JavaScript ES modules, Web Bluetooth, Service Worker/Cache Storage, Web App Manifest, Node.js built-in `node:test` + `assert`.

**Spec:** `docs/superpowers/specs/2026-09-27-aed-teacher-monitor-ble-offline-design.md`

## Global Constraints

- Teacher Monitor is the only Classroom Games UI for this AED project.
- Runtime training sessions must not require Wi-Fi, mobile data, Firebase, Cloudflare APIs, remote fonts, analytics, or CDN assets.
- Android target: Chrome/Chromium Web Bluetooth.
- iOS target: Bluefy Web Bluetooth, with a real-device offline acceptance gate before release.
- One actively controlled trainer per Teacher Monitor session in V1.
- The physical trainer, not the browser, is authoritative for live trainer state.
- BLE disconnect must never enable SHOCK or change a shock/no-shock decision.
- AED voice and paramedic-companion voice remain semantically separate.
- `DAR PISTA` must log/increment hint usage and must not directly reveal the full answer.
- No real therapeutic shock, autonomous diagnosis, or ECG-driven treatment decision.

## Review Focus

1. **Stale reconnect state:** after BLE reconnect, controls must stay disabled until a full authoritative state read completes. Covered in Task 4.
2. **Repeated command delivery:** reusing a sequence ID must not execute an action twice. Covered in Task 2 and Task 4.
3. **Offline cache partial/corrupt state:** UI must show not-ready instead of pretending the app is offline-capable. Covered in Task 5.
4. **Unavailable hint:** `DAR PISTA` must disable/refuse when no unused hint exists. Covered in Task 2 and Task 6.
5. **Protocol mismatch:** monitor must refuse control when firmware protocol version is incompatible. Covered in Task 4 and Task 6.

---

### Task 1: Extract scenario catalogs and prompt catalog

**Files:**
- Create: `Medicine/AED-Trainer/aed-scenarios.js`
- Create: `Medicine/AED-Trainer/scene-twists.js`
- Create: `Medicine/AED-Trainer/clinical-cases.js`
- Create: `Medicine/AED-Trainer/prompt-catalog.js`
- Create: `Medicine/AED-Trainer/tests/catalogs.test.mjs`

**Interfaces:**
- Produces: `AED_SCENARIOS`, `SCENE_TWISTS`, `CLINICAL_CASES`, `PROMPTS` named exports.
- Prompt IDs use prefixes `AED_`, `PARAMEDIC_CONTEXT_`, `PARAMEDIC_HINT_`.

- [ ] **Step 1: Write failing catalog tests**
  - Assert A1–A8 exist and expose ordered analysis outcomes.
  - Assert T0–T8 and C0–C16 exist exactly once.
  - Assert every nonzero twist/clinical case with a hintable situation has a context prompt ID and optional hint prompt ID.
  - Assert no paramedic prompt uses an `AED_` prefix and vice versa.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/catalogs.test.mjs`
  - Expected: FAIL because modules/exports do not exist.

- [ ] **Step 3: Implement the four catalog modules**
  - Keep data declarative; no DOM or Bluetooth calls.
  - A scenario entry exposes `id`, `label`, and `analysisSequence`.
  - Twist/clinical entries expose `id`, `label`, `contextPromptId`, `hintPromptIds`.
  - Prompt entries expose `id`, `role` (`aed` or `paramedic`), `text`, and `audioAsset`.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/catalogs.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add scenario and prompt catalogs`

### Task 2: Build pure trainer scenario engine

**Files:**
- Create: `Medicine/AED-Trainer/trainer-engine.js`
- Create: `Medicine/AED-Trainer/tests/trainer-engine.test.mjs`

**Interfaces:**
- Consumes: catalog exports from Task 1.
- Produces:
  - `createSession(config)`
  - `applyInstructorEvent(session, event)`
  - `consumeNextAnalysis(session)`
  - `consumeHint(session)`
  - `serializeCaseConfig(session)`
- Session tracks `scenarioId`, `twistId`, `clinicalId`, `analysisIndex`, `nextAnalysisOverride`, `hintsUsed`, `usedHintIds`, and event log.

- [ ] **Step 1: Write failing engine tests**
  - A1–A8 produce exactly the cataloged analysis order.
  - next-analysis override affects one analysis only.
  - refibrillation inserts a future SHOCK at reassessment.
  - duplicate instructor event sequence IDs are ignored/rejected.
  - `consumeHint` returns the first unused hint, increments `hintsUsed` once, logs it, and rejects when exhausted.
  - invalid events do not mutate session state.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/trainer-engine.test.mjs`
  - Expected: FAIL because engine does not exist.

- [ ] **Step 3: Implement minimal pure engine**
  - No browser APIs.
  - Return new/updated plain objects predictably so tests can inspect them.
  - Event IDs are strings/integers supplied by caller; duplicate IDs are tracked.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/trainer-engine.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add deterministic scenario engine`

### Task 3: Freeze BLE protocol and codec

**Files:**
- Create: `Medicine/AED-Trainer/ble-protocol.js`
- Create: `Medicine/AED-Trainer/tests/ble-protocol.test.mjs`

**Interfaces:**
- Produces protocol constant `AED_PROTOCOL_VERSION = 1`.
- Produces UUID constants:
  - Service: `7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Device Status: `7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Trainer State: `7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Instructor Command: `7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Event Stream: `7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40`
  - ECG Stream: `7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40`
- Produces `encodeCommand(command)`, `decodeMessage(bytes)`, `validateStateMessage(message)`.

**Protocol decision:** V1 messages are compact UTF-8 JSON with mandatory `v` protocol version and `seq` sequence ID on commands/events. This is intentionally human-debuggable for V1; all payloads used in this plan must remain below 180 UTF-8 bytes.

- [ ] **Step 1: Write failing codec tests**
  - round-trip case-load, live-event, hint, and lifecycle commands;
  - reject missing/incorrect protocol version;
  - reject malformed state payloads;
  - assert representative payload byte lengths stay below 180.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/ble-protocol.test.mjs`
  - Expected: FAIL because codec module does not exist.

- [ ] **Step 3: Implement codec/constants**

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/ble-protocol.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): freeze BLE protocol v1`

### Task 4: Implement Web Bluetooth client with reconnect resync

**Files:**
- Create: `Medicine/AED-Trainer/ble-client.js`
- Create: `Medicine/AED-Trainer/tests/ble-client.test.mjs`

**Interfaces:**
- Consumes protocol UUIDs/codec from Task 3.
- Produces `createBleClient({ bluetooth })` with methods:
  - `scanAndConnect()`
  - `disconnect()`
  - `sendCommand(command)`
  - `readAuthoritativeState()`
  - `subscribe(listener)`
  - `getConnectionState()`
- Emits connection states `disconnected | connecting | syncing | ready | incompatible`.

- [ ] **Step 1: Write failing tests with injected fake Bluetooth/GATT objects**
  - filters by service UUID;
  - subscribes to state/event notifications;
  - writes encoded commands;
  - on disconnect moves to `disconnected`;
  - on reconnect stays `syncing` until device status + trainer state are read;
  - incompatible protocol moves to `incompatible` and refuses commands;
  - stale/repeated event sequence IDs do not duplicate timeline events.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/ble-client.test.mjs`
  - Expected: FAIL because client does not exist.

- [ ] **Step 3: Implement BLE client using only injected `bluetooth` at module boundary**
  - Browser app passes `navigator.bluetooth`.
  - Tests pass a fake adapter.
  - No Wi-Fi/network fallback.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/ble-client.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add Web Bluetooth monitor client`

### Task 5: Add offline-first application shell

**Files:**
- Create: `Medicine/AED-Trainer/manifest.webmanifest`
- Create: `Medicine/AED-Trainer/service-worker.js`
- Create: `Medicine/AED-Trainer/offline.js`
- Create: `Medicine/AED-Trainer/tests/offline.test.mjs`

**Interfaces:**
- Produces `registerOfflineSupport()` and `getOfflineReadiness()`.
- UI readiness is `ready | installing | incomplete | unsupported`.

- [ ] **Step 1: Write failing tests**
  - service worker cache manifest contains every local runtime asset;
  - no cache entry points to CDN/remote origin;
  - readiness reports `incomplete` if a required local asset is missing;
  - current cache version change replaces old shell safely.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/offline.test.mjs`
  - Expected: FAIL because offline modules do not exist.

- [ ] **Step 3: Implement manifest, service worker, and readiness helper**
  - Cache only same-origin AED monitor assets.
  - Do not cache BLE data or live case state as authoritative device state.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/offline.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): make Teacher Monitor offline first`

### Task 6: Replace prototype UI with Teacher Monitor

**Files:**
- Modify: `Medicine/AED-Trainer/index.html`
- Create: `Medicine/AED-Trainer/styles.css`
- Create: `Medicine/AED-Trainer/app.js`
- Create: `Medicine/AED-Trainer/tests/ui-contract.test.mjs`

**Interfaces:**
- Consumes Tasks 1–5.
- Produces DOM controls with stable IDs:
  - `connectTrainer`, `connectionStatus`, `offlineStatus`
  - `baseScenario`, `sceneTwist`, `clinicalCondition`, `startCase`
  - `giveHint`, `hintsUsed`
  - `forceShock`, `forceNoShock`, `triggerRefib`
  - `padFault`, `clearPadFault`, `movement`, `clearMovement`
  - `standClearViolation`, `clearStandClearViolation`
  - `pauseCase`, `resumeCase`, `restartCase`, `endCase`
  - `trainerState`, `deviceId`, `batteryLevel`, `eventTimeline`

- [ ] **Step 1: Write failing UI contract tests**
  - all required controls/IDs exist;
  - no student-facing control/pad simulator remains;
  - warning contains TRAINING/SIMULATION boundary;
  - `DAR PISTA` exists and hint count is visible;
  - no inline browser speech synthesis is used;
  - no Firebase/CDN/remote runtime dependency appears in the HTML/JS/CSS.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/ui-contract.test.mjs`
  - Expected: FAIL against the existing prototype.

- [ ] **Step 3: Build the Teacher Monitor UI**
  - Mobile/tablet touch-first, portrait and landscape.
  - Keep hidden case details visible only in instructor sections.
  - Disable remote controls unless BLE client state is `ready`.
  - Disable `DAR PISTA` when no unused hint exists.
  - Show last command + ACK/rejection and stale/disconnected state.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/ui-contract.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Run full web test suite**
  - Run: `node --test Medicine/AED-Trainer/tests/*.test.mjs`
  - Expected: all PASS.

- [ ] **Step 6: Commit**
  - Commit: `feat(aed): build offline BLE Teacher Monitor`

### Task 7: Add real-device acceptance checklist and update project docs

**Files:**
- Create: `Medicine/AED-Trainer/REAL-DEVICE-ACCEPTANCE.md`
- Modify: `Medicine/AED-Trainer/README.md`

**Interfaces:**
- Documents the exact Android Chrome and iOS Bluefy offline/BLE acceptance procedure.

- [ ] **Step 1: Write acceptance checklist**
  - preload/cache monitor;
  - disable Wi-Fi and mobile data;
  - fully close/reopen runtime;
  - connect to ESP32 by BLE;
  - load A1 + one twist + one clinical case;
  - use `DAR PISTA`;
  - inject a live event;
  - verify telemetry;
  - force disconnect/reconnect and verify authoritative resync;
  - finish/reset case.

- [ ] **Step 2: Update README**
  - remove obsolete browser simulator/student framing;
  - state BLE/offline architecture and Bluefy iOS path;
  - link to spec, plan, and acceptance checklist.

- [ ] **Step 3: Verify docs and tests**
  - Run: `node --test Medicine/AED-Trainer/tests/*.test.mjs`
  - Expected: all PASS.

- [ ] **Step 4: Commit**
  - Commit: `docs(aed): add BLE offline acceptance procedure`

## Completion Gate

Before this plan is considered complete:

- all Node tests are green;
- the monitor contains no required remote runtime dependencies;
- protocol constants are frozen and documented;
- the browser UI is Teacher Monitor only;
- `DAR PISTA` behavior is tested;
- real-device Android/iOS checklist exists;
- actual Android/iOS BLE/offline acceptance remains explicitly pending until physical testing is performed.
