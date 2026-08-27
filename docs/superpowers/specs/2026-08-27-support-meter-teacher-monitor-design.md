# Support Meter Teacher Monitor — Design

Date: 2026-08-27

## Scope

Upgrade only Support Meter's Teacher Monitor and the minimum student/data plumbing needed for assigned sessions. Preserve the approved student game appearance and interaction.

## Teacher flow

1. The monitor header includes **Back to Teacher Menu**, linking to `/teacher/`.
2. The teacher chooses Set 1, 2, or 3 and creates a session.
3. The monitor returns a copyable student link containing a high-entropy join token. Every student using it receives the selected set in the same canonical order.
4. The new session becomes the active monitor. A session selector allows returning to another locally managed session.
5. **Download results (CSV)** creates one row per submitted attempt: student, set, story number/title, feeling, dialogue/expression, correctness for both choices, resolved status, attempt, score, support meter, and timestamp.
6. After the browser starts the CSV download, the teacher confirms permanent cleanup. The server validates the private management token, then atomically deletes responses, student runs, and the assignment. The join link is thereby closed.

The private management token stays in the teacher browser only; it is never placed in the student link. The monitor can store managed sessions in local storage so a refresh does not lose them.

## Free mode

The ordinary game URL remains free mode. Each run presents all eight target expressions once in randomized story order. When the run completes, it records `completed_at`. A database cleanup job removes completed free runs and their responses after five minutes. Abandoned runs receive a conservative stale-run cleanup later so unfinished tabs do not accumulate forever.

## Monitor layout (Option A)

### Normal view

A responsive compact card grid shows all students. Each card displays:

- name and live/offline state;
- current story title (for example, “Ethan's Driving Test”) and progress, such as 6/8;
- current phase;
- feeling currently selected;
- dialogue/expression currently selected;
- latest result: waiting, correct, or incorrect;
- attempt number and score.

Clicking or touching a card focuses that student.

### Focused view

The focused student occupies the large left panel and shows the three story frames, current story summary, current selections, latest result, attempt, score, support percentage, streak, and progress. All other students remain visible as compact live thumbnails in a right rail. Clicking another thumbnail switches focus; clicking/touching the large focused card again returns to the grid. Keyboard activation and visible focus styling mirror pointer behavior.

Updates are driven by Supabase Realtime and patched into the existing DOM so focus and scroll position are preserved.

## Data model

Add `support_meter_assignments` with:

- `id`, `join_token_hash`, `manage_token_hash`;
- `class_code`, `set_number` (1–3), `status` (`open`, `closed`);
- `created_at`, `downloaded_at`.

Extend `support_meter_sessions` with:

- `assignment_id` nullable foreign key;
- `mode` (`free` or `assigned`);
- `set_number`, `story_order`;
- `completed_at`;
- live fields needed by the cards: story title/summary, selected feeling, selected expression/dialogue, latest result, and progress.

Responses keep their current attempt-level detail. The response foreign key changes to cascade on session deletion.

## Database API and security

Use narrowly scoped RPC functions rather than anonymous broad table access:

- create an assignment and return join/manage tokens;
- resolve an open assignment by join token;
- read monitor data only with the matching manage token;
- close and delete an assignment only with its manage token.

Tokens are generated with `pgcrypto`; only hashes are stored. Functions validate token hashes, constrain inputs, set a fixed `search_path`, and expose only the minimum grants. Existing permissive anonymous select/update policies are replaced with session-scoped writes and RPC reads. Realtime remains enabled for the session/response tables.

A `pg_cron` job runs every minute and deletes completed free-mode sessions whose `completed_at` is at least five minutes old. Deletion cascades to responses.

## Student game integration

- No token: free mode; shuffle the eight-story practice order while covering each target expression exactly once.
- Valid join token: fetch the assignment, use its fixed set and canonical order, and attach the student run to that assignment.
- Invalid/closed token: show a clear expired-link message and a link back to the game menu.
- Every new run initializes the Support Meter at 0%, score at 0, streak at 0, story at 1/8, and attempt at 1. The HTML fallback values and database insert use the same initial values.
- Every meaningful interaction updates live session fields: story/phase, selected feeling, selected dialogue/expression, attempt in progress, latest result, score, support, streak, and heartbeat.
- Completion sets status to complete and records `completed_at`.

### Student exit behavior

Add a visible **Back to Student Menu** control that links to `/` without covering game content. If the run is unfinished, activation opens an accessible confirmation dialog explaining that progress and monitor activity will be permanently deleted. Confirming calls the scoped deletion API for that student run and redirects only after successful deletion; canceling preserves the run. If the game is complete, activation returns to `/` without a warning. Browser back/close receives the native unsaved-progress warning while a run is unfinished; because browsers do not guarantee async deletion during unload, server stale-run cleanup remains the fallback for abandoned tabs.

### Answer-option audit

Replace automatic category-wide distractor generation with an explicit reviewed option list for every one of the 24 stories. Each question presents three expressions: the correct target and two clearly incompatible distractors. No question may place the easily confused group “That must be tough.”, “I hear you.”, and “Hang in there.” together. Preserve coverage of all eight target expressions in each completed run.

### Mobile corrections

- Story artwork uses `object-fit: contain` in portrait/mobile layouts so the complete source image is visible. Letterboxing may use the existing navy background; no faces, heads, or story-relevant objects may be cropped.
- Expression radio indicators use a fixed touch-safe size and fixed inset, while button text uses matching fixed left padding and `min-width: 0`; neither indicator nor text may cross the question panel edge at 320 CSS pixels wide.
- The floating Coach remains an overlay, but on mobile its bottom offset reserves the action-control area. It must never overlap **Submit Answer** or **Next Story**, including safe-area insets.

## Verification

- Unit-level checks for query parsing, fixed assigned order, free-mode eight-expression coverage, CSV escaping, and focus toggle state.
- Unit-level checks for zeroed initial state, the 24 explicit option lists, unfinished/finished exit behavior, and deletion-before-redirect.
- Database checks for token isolation, unauthorized read/delete rejection, cascade deletion, and five-minute free cleanup.
- Browser checks on desktop and 320/390 CSS-pixel touch viewports: create link, join with two students, observe live selections/results, focus/switch/unfocus, download CSV, confirm deletion, verify closed link, verify both menu buttons, inspect all three frames without crop, inspect radio containment, and verify Coach/action-button separation.
- Regression check that the approved student game UI is visually unchanged in both free and assigned modes.
