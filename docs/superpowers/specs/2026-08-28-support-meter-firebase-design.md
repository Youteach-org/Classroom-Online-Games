# Support Meter Firebase Migration Design

## Goal

Move all Support Meter live state, sessions, responses, results, presence, and teacher redirection from Supabase to Firebase Realtime Database in project `youteach-d9a79`, while preserving the approved student game and Teacher Monitor behavior and remaining compatible with the no-cost Spark plan.

## Data ownership and paths

All data lives below `classroomGames/supportMeter` so it cannot collide with attendance, groups, teams, or buzzer data.

- `sessions/{sessionId}`: assigned session metadata (`setNumber`, `joinToken`, `status`, `createdAt`, `lastActivity`).
- `sessionTokens/{joinToken}`: lookup from a student link to an open assigned session.
- `runs/{runId}`: current student state, including `sessionId` (`free` or assigned ID), `lastSeen`, progress, score, live selections, and redirect control.
- `responses/{runId}/{responseId}`: final and attempted answers used by CSV download.

`Free Mode` is a virtual session and is shown only when at least one non-expired free run exists. Assigned sessions are listed even before students join. Selecting a session starts its filtered student listener; no student cards render before selection.

## Live behavior

Student clients write immediately for meaningful actions and send a lightweight presence heartbeat every 30 seconds. Teacher Monitor uses Firebase listeners, not 5-second full-table polling. A run is LIVE when its last activity is within 40 seconds, OFFLINE afterward, and excluded from the monitor after one hour.

Teacher redirection updates the run in place: responses are deleted, score/progress/meter/attempts are reset, `sessionId` and `setNumber` change, and a redirect notice is written. The student listens to its own run, receives the explanation, accepts it, and restarts from story 1 in the target session's fixed order.

## Retention

- Assigned session: retained until results are downloaded and the teacher confirms deletion.
- Completed Free Mode run: eligible for deletion five minutes after completion.
- Incomplete Free Mode run: hidden after one hour offline and eligible for cleanup after 24 hours.
- Cleanup is opportunistic from active student/teacher pages so Spark does not require Cloud Functions or Blaze billing.

## Cost controls

- Firebase Realtime Database, not Firestore.
- Spark-compatible browser SDK only; no Cloud Functions.
- 30-second heartbeat, event-driven state writes, scoped listeners, compact payloads.
- No images are stored in Firebase; story assets remain static on Vercel.

## Security boundary

This release keeps the previously accepted temporary open classroom model: active sessions are visible to the Teacher Monitor without teacher authentication. Firebase validation rules restrict data shapes and writable paths. Proper teacher identity and authorization remain a later feature and must replace the temporary public monitor/redirect access.

## UI changes included

- Zoom-out cards use the same compact dimensions as non-focused thumbnails.
- Session catalog lists assigned sessions and Free Mode; students remain hidden until selection.
- Mobile top row places Back to Student Menu on the left and Coach ON/OFF on the right without overlays.
- Visible version becomes v22.

## Verification

Node tests cover catalog normalization, selection gating, one-hour visibility, redirect reset, retention decisions, and static mobile/card layout. Browser verification covers free entry, assigned link entry, two-way live updates, redirect notice/reset, CSV deletion flow, and mobile controls.
