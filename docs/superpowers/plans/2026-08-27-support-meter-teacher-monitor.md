# Support Meter Teacher Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver assigned Support Meter sessions, secure live monitoring, CSV cleanup, five-minute free-run cleanup, and the approved student/mobile corrections.

**Architecture:** Keep the static HTML/CSS application, extract deterministic game/session helpers into a browser-and-Node-compatible module, and use narrow Supabase RPCs for assignment management and deletion. Supabase Realtime feeds a stable card grid/focus layout; PostgreSQL owns cleanup so it does not depend on an open browser.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase PostgreSQL/RLS/Realtime/pg_cron, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-27-support-meter-teacher-monitor-design.md`

## Global Constraints

- Preserve the approved student game layout except for the explicitly approved menu, meter, answer-option, image-fit, and Coach corrections.
- All student-facing and Connectivity 5 interface copy remains English.
- New runs start at Support Meter 0%, score 0, streak 0, story 1/8, attempt 1.
- Assigned students receive the selected set in canonical order; free students receive all eight target expressions once in randomized order.
- Completed free runs are deleted five minutes after `completed_at`.
- Assigned results remain until CSV download and explicit cleanup confirmation.
- Student links contain only the join token; management tokens remain in the teacher browser.

---

### Task 1: Deterministic game data and student behavior

**Files:**
- Create: `Connectivity5/Support-Meter/game-core.js`
- Create: `Connectivity5/Support-Meter/tests/game-core.test.js`
- Modify: `Connectivity5/Support-Meter/game.js`
- Modify: `Connectivity5/Support-Meter/index.html`

**Interfaces:**
- Produces: `window.SupportMeterCore` and CommonJS exports: `INITIAL_STATE`, `storySets`, `buildRun({ setNumber, assigned, random })`, `parseJoinToken(search)`, `shouldWarnBeforeExit(state)`, `buildCsv(rows)`.
- Consumes: no application globals; pure inputs only.

- [ ] **Step 1: Write failing Node tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../game-core.js');

test('new runs are zeroed', () => assert.deepEqual(core.INITIAL_STATE, {
  meter: 0, score: 0, streak: 0, storyIndex: 0, attempt: 1
}));

test('assigned run keeps canonical order', () => {
  assert.deepEqual(core.buildRun({setNumber: 2, assigned: true}).map(s => s.id), [1,2,3,4,5,6,7,8]);
});

test('every story has one correct plus two unambiguous choices', () => {
  for (const set of core.storySets) for (const story of set) {
    assert.equal(story.options.length, 3);
    assert.equal(story.options.filter(x => x === story.expression).length, 1);
    assert.notDeepEqual(new Set(story.options), new Set(['That must be tough.','I hear you.','Hang in there.']));
  }
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `node --test Connectivity5/Support-Meter/tests/game-core.test.js`

Expected: FAIL because `game-core.js` does not exist.

- [ ] **Step 3: Implement pure game data and helpers**

Create a UMD-style module that exports the constants/functions above. Give each of the 24 stories an explicit three-item `options` array and remove automatic `supportDistractors` generation. `buildRun` returns canonical order for assigned mode and Fisher–Yates shuffled order for free mode.

- [ ] **Step 4: Integrate the module and exit control**

Load `game-core.js` before `game.js`. Initialize state and HTML meter fallback at `0`. Add `#studentMenuBtn` and an accessible `#exitDialog` with **Cancel** and **Leave and delete progress**. In unfinished state, confirm deletion through `delete_support_meter_run`; redirect to `/` only when it succeeds. Completed state redirects immediately. Register `beforeunload` only while unfinished.

- [ ] **Step 5: Run tests**

Run: `node --test Connectivity5/Support-Meter/tests/game-core.test.js`

Expected: all tests PASS.

- [ ] **Step 6: Commit**

Commit message: `fix: reset and clarify Support Meter student runs`

---

### Task 2: Mobile layout corrections

**Files:**
- Modify: `Connectivity5/Support-Meter/styles.css`
- Create: `Connectivity5/Support-Meter/tests/mobile-layout.test.js`

**Interfaces:**
- Consumes: `#studentMenuBtn`, `.exit-dialog`, `.story-image`, `.expressions button`, `.feedback`, `.bottombar`.
- Produces: stable containment at 320 and 390 CSS-pixel portrait widths.

- [ ] **Step 1: Write a failing CSS contract test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const css = fs.readFileSync(require.resolve('../styles.css'), 'utf8');
test('mobile shows complete artwork', () => assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.story-image\{[^}]*object-fit:contain/));
test('mobile radios use fixed geometry', () => assert.match(css, /\.expressions button:before\{[^}]*width:22px/));
test('coach reserves action area', () => assert.match(css, /bottom:calc\([^)]*92px[^)]*safe-area-inset-bottom/));
```

- [ ] **Step 2: Run test and confirm failure**

Run: `node --test Connectivity5/Support-Meter/tests/mobile-layout.test.js`

Expected: FAIL on current `object-fit:cover`, percentage radio, and 4px Coach offset.

- [ ] **Step 3: Implement the responsive CSS**

Within the final mobile media block, set `.story-image{object-fit:contain}`, use `.expressions button{padding-left:52px;min-width:0;overflow-wrap:anywhere}` and `.expressions button:before{left:14px;width:22px;height:22px;border-width:3px}`, and position `.feedback` with `bottom:calc(92px + env(safe-area-inset-bottom))`. Add non-overlapping styles for the menu button/dialog.

- [ ] **Step 4: Run test**

Run: `node --test Connectivity5/Support-Meter/tests/mobile-layout.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: contain Support Meter mobile content`

---

### Task 3: Secure Supabase session model and cleanup

**Files:**
- Create: `supabase/migrations/202608270001_support_meter_assignments.sql`
- Create: `supabase/tests/support_meter_assignments.sql`

**Interfaces:**
- Produces RPCs: `create_support_meter_assignment(p_set_number int)`, `resolve_support_meter_assignment(p_join_token text)`, `get_support_meter_monitor(p_manage_token text)`, `delete_support_meter_assignment(p_manage_token text)`, `delete_support_meter_run(p_session_id uuid, p_run_token text)`.
- Produces columns on `support_meter_sessions`: `assignment_id`, `mode`, `set_number`, `story_order`, `completed_at`, `run_token_hash`, `story_title`, `story_summary`, `latest_result`, `story_progress`.

- [ ] **Step 1: Write failing pgTAP/security assertions**

The SQL test must assert assignment set constraint 1–3, cascade deletion, five-minute completed-free predicate, wrong-token rejection, and absence of anonymous unrestricted `SELECT`/`UPDATE` policies.

- [ ] **Step 2: Apply migration on the Supabase development branch or production project after schema review**

The migration creates token hashes with `digest(token,'sha256')`, fixes function `search_path`, revokes default PUBLIC execution, grants only the required RPCs to `anon`, enables `pg_cron`, and schedules a once-per-minute cleanup function. Do not delete the 38 existing sessions during migration; classify legacy rows as free and let only completed/stale policy remove them.

- [ ] **Step 3: Run database assertions**

Run the SQL assertions through the Supabase SQL executor and verify every result is `ok`. Confirm unauthorized tokens return no data and cannot delete rows.

- [ ] **Step 4: Commit**

Commit message: `feat: add secure Support Meter assignments`

---

### Task 4: Assigned-mode student integration and live fields

**Files:**
- Modify: `Connectivity5/Support-Meter/game.js`
- Modify: `Connectivity5/Support-Meter/config.js`
- Modify: `Connectivity5/Support-Meter/tests/game-core.test.js`

**Interfaces:**
- Consumes: Task 1 helpers and Task 3 assignment/run RPCs.
- Produces: assigned/fixed or free/random run creation and complete live payloads.

- [ ] **Step 1: Add failing tests for `?join=` parsing and invalid-link state**

```js
test('join token parser accepts only URL-safe tokens', () => {
  assert.equal(core.parseJoinToken('?join=abc_DEF-123'), 'abc_DEF-123');
  assert.equal(core.parseJoinToken('?join=%3Cscript%3E'), null);
});
```

- [ ] **Step 2: Run test and confirm failure, then implement parser**

Run: `node --test Connectivity5/Support-Meter/tests/game-core.test.js`

Expected before implementation: FAIL; after implementation: PASS.

- [ ] **Step 3: Integrate RPC resolution and live payloads**

Resolve `?join=` before game start. For a valid assignment call `buildRun({assigned:true,setNumber})`; otherwise use a free run. Store the per-run deletion token only in memory/session storage. Update story title/summary, selections, result, progress, meter, score, streak, attempt, heartbeat, and `completed_at` at the matching interaction points.

- [ ] **Step 4: Verify free and assigned sequences manually**

Expected: two assigned tabs have identical set/order; two free tabs may differ but each contains eight unique target expressions.

- [ ] **Step 5: Commit**

Commit message: `feat: support assigned and free Support Meter runs`

---

### Task 5: Option A Teacher Monitor and CSV lifecycle

**Files:**
- Modify: `Connectivity5/Support-Meter/teacher.html`
- Modify: `Connectivity5/Support-Meter/teacher.css`
- Modify: `Connectivity5/Support-Meter/teacher.js`
- Create: `Connectivity5/Support-Meter/tests/teacher-core.test.js`

**Interfaces:**
- Consumes: Task 1 `buildCsv`, Task 3 assignment/monitor/delete RPCs and Realtime rows.
- Produces: session creation/link copy, compact grid, focused layout, CSV download/confirmed cleanup, `/teacher/` navigation.

- [ ] **Step 1: Write failing state tests**

```js
test('clicking focused card clears focus', () => assert.equal(toggleFocus('a','a'), null));
test('clicking another card changes focus', () => assert.equal(toggleFocus('a','b'), 'b'));
test('CSV quotes commas and quotes', () => assert.match(buildCsv([{student_name:'Doe, "A"'}]), /"Doe, ""A"""/));
```

- [ ] **Step 2: Implement session toolbar and menu navigation**

Add **Back to Teacher Menu** linking to `/teacher/`, set selector 1–3, **Create Session**, copyable student URL, session selector, **Download Results**, and cleanup confirmation. Persist `{assignmentId, manageToken, setNumber}` only in teacher local storage.

- [ ] **Step 3: Implement stable live grid/focus rendering**

Render compact cards with name, state, story/progress, phase, live feeling/expression, latest result, attempt, and score. Focus creates the approved left detail/right thumbnail arrangement. Update existing elements by session ID instead of rebuilding the whole grid.

- [ ] **Step 4: Implement CSV then cleanup sequence**

Fetch rows with management token, build/download CSV, then request confirmation. Only after confirmation call `delete_support_meter_assignment`; remove local session and close its student link.

- [ ] **Step 5: Run tests and commit**

Run: `node --test Connectivity5/Support-Meter/tests/teacher-core.test.js`

Expected: PASS.

Commit message: `feat: build live Support Meter teacher monitor`

---

### Task 6: End-to-end verification and production deployment

**Files:**
- Modify: `Connectivity5/Support-Meter/index.html` (version marker only after verification)
- Modify: `Connectivity5/Support-Meter/teacher.html` (version marker only after verification)

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: verified production deployment at `https://classroom-online-games.vercel.app/`.

- [ ] **Step 1: Run the complete local test suite**

Run: `node --test Connectivity5/Support-Meter/tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 2: Run browser verification at desktop, 390×844, and 320×568**

Verify zero meter, all frames uncropped, radio containment, Coach not covering actions, exit cancel/delete/completed paths, assigned same order, Realtime card changes, focus toggle, CSV content, post-download deletion, expired student link, and both menu buttons.

- [ ] **Step 3: Run database verification**

Confirm a completed free run remains before five minutes and disappears after the next scheduled cleanup at or after five minutes; confirm assigned data persists until download cleanup.

- [ ] **Step 4: Update version markers and commit**

Commit message: `chore: release Support Meter monitor update`

- [ ] **Step 5: Verify Vercel production**

Wait for the main-branch deployment, inspect build/runtime logs, then repeat the critical student and teacher flows on the production URL. Confirm the canonical domain points to the verified commit.

