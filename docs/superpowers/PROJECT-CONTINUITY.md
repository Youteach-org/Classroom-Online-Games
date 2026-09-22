# Superpowers project continuity policy

## Source of truth

GitHub is the durable source of truth for Classroom Online Games project decisions. Chat context or model memory alone is not sufficient.

## Required practice

Before declaring a project task complete:

1. Record every confirmed decision that can affect future implementation, design, content, provider/model choice, naming, behavior, or workflow under `docs/superpowers/decisions/` (or update the relevant existing decision document).
2. When a decision can be enforced mechanically, add or update a regression test, validation rule, or CI check.
3. Before changing an existing subsystem, read its relevant decision documents first.
4. Never silently substitute a specifically approved provider, model, voice, engine, asset, or workflow with a merely similar alternative. Any replacement requires a new explicit project decision and must be documented in GitHub.
5. If chat context conflicts with a newer GitHub decision document, investigate the conflict rather than guessing. The most recently confirmed user decision must then be persisted back to GitHub.

## Purpose

This policy exists so a later ChatGPT instance can continue the project without depending on hidden memory or reconstructing prior decisions from scattered conversation history.


## Required live integration specification

Before changing YouTeach ↔ Classroom Online Games live-session behavior, read:

- `docs/superpowers/specs/2026-09-20-live-cog-session-bridge.md`

It defines the teacher-controlled Buzzer → COG → Student Buzzer live-game lifecycle, group scoping, verified identity handoff, result return, and session expiration behavior.


## Interaction convention

- Number every assistant response to this user. Keep the response number visible at the beginning of each reply when working on this project.


## Talk Talk V1 checkpoint — 2026-09-21

Implementation branch: `feature/talk-talk-v1-20260921`.

Current verified COG source checkpoint: `5d5dd5fe224f543ef04e61d990aa9e16e8574cf1`.
Current verified YouTeach source checkpoint: `dd0650d97df69741e59c538421bff62e22075016` plus Talk Talk result sanitizer commit `6cb0b738a6371f4e927dde42a6136aa26b6d6def`.

Implemented vertical slice:
- `Tell Me What Happened` A2–B1 flow;
- local-first microphone/capability gate and evidence-first evaluation;
- learner memory with Observed → Recurring → Mastered and Past-ed Clinic;
- Talk Engine Lite fallback with optional local AI adapter;
- canonical YouTeach pair/group context and host selection;
- in-person/remote group timelines and fair individual interaction evidence;
- Practice vs Assessment policy and team-first Teacher Monitor;
- strict individual Talk Talk result summaries returned to YouTeach;
- minimal Creator Mode with local Test as Student preview;
- production Cloudflare packaging updated to include `Talk-Talk/`.

Verification completed:
- YouTeach full verification workflow passed, including function syntax, Live COG/Talk Talk tests, and `build-pages.sh`.
- COG full regression matrix passed: shared COG, Talk Talk, Verb Runner, Support Meter, and 100 Students Said.
- Cloudflare packaging regression test passed after adding `Talk-Talk` to both production copy commands.

V1 is NOT yet declared complete. Remaining gate:
1. deploy a feature preview for the exact Talk Talk branch commits;
2. run the real browser smoke flow against that preview, including network/storage checks for raw audio and idempotent retry/disconnect behavior;
3. verify the exact preview deployments are green.

Do not merge or publish production until those gates are satisfied.

## Talk Talk V1 verified preview checkpoint — 2026-09-21

COG implementation branch: `feature/talk-talk-v1-20260921`  
Verified COG commit: `e292f14964320a20bb863162a3d663cb8b96d2a8`  
Verified COG Actions run: `35678458509` — tests, preview deployment, HTTP probe, and Chrome headless all GREEN.  
COG preview: `https://talk-talk-v1-20260921.classroom-online-games.pages.dev`

YouTeach implementation branch: `feature/talk-talk-v1-20260921`  
Verified YouTeach head: `20fb55c7a9c012bed98a2cb9b8dd3bfde38f78a2`  
Verified YouTeach Actions run: `35676531388` — GREEN.  
YouTeach preview family: `https://talk-talk-v1-20260921.youteach.pages.dev`

Important origin rule:
- production COG = `https://utichgion.org`;
- Talk Talk YouTeach preview automatically maps to the same-named COG preview;
- other generic YouTeach previews do not get remapped;
- explicit allowed `COG_LIVE_ORIGIN` remains authoritative.

Do not declare classroom validation complete until a real authenticated teacher/student run exercises microphone capture, team confirmation, in-person host flow, remote flow, result return, retry/disconnect, and real-device local-model performance.
