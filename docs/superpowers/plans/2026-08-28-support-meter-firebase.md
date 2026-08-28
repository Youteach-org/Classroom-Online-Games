# Support Meter Firebase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Support Meter's Supabase backend with Firebase Realtime Database and deliver the approved v22 monitor, redirection, retention, and mobile layout.

**Architecture:** A focused `firebase-client.js` adapter owns all RTDB calls while pure core modules own catalog, visibility, reset, and retention rules. Student and teacher pages consume the adapter and subscribe only after a run or monitor session is selected.

**Tech Stack:** Static HTML/CSS/JavaScript, Firebase Web SDK 10.12.2 modular API, Firebase Realtime Database, Node built-in test runner, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-28-support-meter-firebase-design.md`

## Global Constraints

- Use Firebase project `youteach-d9a79` and root path `classroomGames/supportMeter`.
- Remain compatible with Firebase Spark; do not add Cloud Functions or Firestore.
- Heartbeat interval is exactly 30 seconds; LIVE threshold remains 40 seconds.
- Hide runs after one hour offline; do not delete assigned results before confirmed download.
- Completed free runs expire after five minutes; incomplete free runs after 24 hours.
- All Connectivity 5 interface copy remains in English.
- Visible release is v22.

---

### Task 1: Pure Firebase data rules

**Files:**
- Create: `Connectivity5/Support-Meter/firebase-core.js`
- Modify: `Connectivity5/Support-Meter/tests/teacher-core.test.js`
- Create: `Connectivity5/Support-Meter/tests/firebase-core.test.js`

**Interfaces:**
- Produces: `normalizeSessions(value, now)`, `visibleRuns(value, sessionId, now)`, `resetForRedirect(run, target, now)`, `retentionDecision(run, now)`.

- [ ] Write failing Node tests for Free Mode catalog creation, hidden-before-selection, one-hour exclusion, complete redirect reset, five-minute completed cleanup, and 24-hour abandoned cleanup.
- [ ] Run `node --test Connectivity5/Support-Meter/tests/firebase-core.test.js` and verify missing exports fail.
- [ ] Implement pure functions without Firebase imports.
- [ ] Run the focused test and all Support Meter tests.

### Task 2: Firebase adapter and configuration

**Files:**
- Create: `Connectivity5/Support-Meter/firebase-client.js`
- Modify: `Connectivity5/Support-Meter/config.js`
- Create: `firebase.database.rules.json`

**Interfaces:**
- Consumes: Firebase project config for `youteach-d9a79`.
- Produces: `createAssignedSession`, `resolveJoinToken`, `createRun`, `updateRun`, `appendResponse`, `watchRun`, `watchSessions`, `watchRunsForSession`, `redirectRun`, `downloadSessionData`, `deleteAssignedSession`, `cleanupExpiredFreeRuns`.

- [ ] Write a static failing test that rejects Supabase configuration/scripts and requires the Firebase adapter exports.
- [ ] Add the modular Firebase initialization and root-path helpers.
- [ ] Add atomic multi-location updates for redirect and confirmed assigned-session deletion.
- [ ] Add validation/index rules for `sessionId`, `lastSeen`, `status`, and token lookup.
- [ ] Run static and unit tests.

### Task 3: Student game migration

**Files:**
- Modify: `Connectivity5/Support-Meter/index.html`
- Modify: `Connectivity5/Support-Meter/game.js`
- Modify: `Connectivity5/Support-Meter/styles.css`

**Interfaces:**
- Consumes: Firebase adapter run/session/response/control functions.
- Produces: event-driven live state and 30-second presence heartbeat.

- [ ] Write failing static tests for Firebase module loading, mobile control row, redirect dialog, and 30-second heartbeat.
- [ ] Remove Supabase script and RPC usage.
- [ ] Create free/assigned runs through Firebase and write meaningful actions immediately.
- [ ] Listen for redirect control, show the reason, then reset locally after acceptance.
- [ ] Place mobile menu left and Coach toggle right in a non-overlay top row.
- [ ] Run all tests.

### Task 4: Teacher Monitor migration

**Files:**
- Modify: `Connectivity5/Support-Meter/teacher.html`
- Modify: `Connectivity5/Support-Meter/teacher.js`
- Modify: `Connectivity5/Support-Meter/teacher-v21.css`

**Interfaces:**
- Consumes: Firebase session/run listeners, redirect, CSV data, cleanup, and deletion functions.
- Produces: selectable global session catalog and compact live student grid.

- [ ] Write failing tests for no automatic selection, Free Mode label, filtered students, compact zoom-out cards, and redirect controls.
- [ ] Render only the session catalog until a selection is made.
- [ ] Attach/detach the run listener when selection changes.
- [ ] Add per-student target-session control and confirmation; call atomic redirect.
- [ ] Preserve focus toggle and make zoom-out cards match compact thumbnail size.
- [ ] Download CSV, then delete only after confirmation.
- [ ] Run all tests.

### Task 5: Verification and release

**Files:**
- Modify: `Connectivity5/Support-Meter/index.html`
- Modify: `Connectivity5/Support-Meter/teacher.html`

**Interfaces:**
- Consumes: completed v22 implementation.
- Produces: GitHub main commit and READY Vercel production deployment.

- [ ] Run `node --test Connectivity5/Support-Meter/tests/*.test.js` and require zero failures.
- [ ] Search Support Meter production files for `supabase` and require zero matches.
- [ ] Verify version labels are v22.
- [ ] Commit only relevant code, tests, rules, spec, and plan to `youteachtk/Classroom-Online-Games`.
- [ ] Confirm the GitHub Vercel status is `success` and the deployment state is `READY`.
