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
