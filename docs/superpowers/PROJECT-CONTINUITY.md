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
