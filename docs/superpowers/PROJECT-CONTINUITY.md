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


## Verified YouTeach live bridge checkpoint — 2026-09-23

Integration branch: `live-cog-20260922`.

Matching previews:
- YouTeach: `https://live-cog-20260922.youteach.pages.dev`
- COG: `https://live-cog-20260922.classroom-online-games.pages.dev`

Verified cross-repository behavior:
- COG consumes signed YouTeach teacher/student launch credentials; no passwords are passed.
- Verb Runner teacher session registration creates the canonical YouTeach `connectedGame`.
- Student Buzzer JOIN GAME resolves the canonical YouTeach student identity, including active multi-group context.
- Heartbeat, explicit END ACTIVITY, and result return use the shared live bridge contract.
- Result retries are idempotent.
- COG verification run `35828254105`: GREEN.
- COG preview deploy run `35828254080`: GREEN.
- Cross-repository browser smoke was driven from YouTeach run `35828301497` and passed through JOIN GAME, identity, heartbeat, result receipt/duplicate retry, Teacher Results UI, and END ACTIVITY.

Use the same short preview branch name in YouTeach and COG for cross-repository preview verification. Long branch names can be truncated/disambiguated differently by Cloudflare Pages and break derived preview-origin matching.
