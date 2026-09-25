# Wordy POP Loop and Indefinite Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Preserve manual global POP while making rounds continue after POP until moves are exhausted, and allow one canonical A tile to realize either A or AN inside validated relationships such as HAVE AN OPINION.

**Architecture:** Keep the current 7×7 equal-cell, READY, manual POP, gravity/refill, cascade, connected-neighborhood and diversity systems. Add a canonical playable-token layer where relationship token AN maps to board token A while the relationship retains its surface token AN for display/review. Change round termination so scoring is evaluated only when the movement budget is exhausted; if the last move leaves READY relations, the player receives one final free POP before result.

**Tech Stack:** Vanilla ES modules, Node test runner, GitHub Actions, Cloudflare Pages.

**Spec:** Current conversation decisions plus docs/superpowers/specs/2026-09-17-wordy-game-decisions.md and docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md.

## Global Constraints

- POP remains manual and global.
- Formed relationships remain READY until POP.
- POP consumes no move.
- POP removes every READY relationship together; shared crossing tiles are physically removed once.
- Gravity/refill/cascade happens after POP.
- The round does not end because a score target is reached early.
- The round ends when moves are exhausted.
- If moves reach zero while at least one relationship is READY, swaps stop but one final POP remains available.
- After that final POP, the result is evaluated using the level objective.
- A single canonical A tile may satisfy expected relationship token A or AN.
- The relationship/review surface keeps the grammatically correct token (AN when required).
- Normal board generation/refill must not create a separate AN tile; AN canonicalizes to A for board vocabulary.
- No live grammar/LLM validity expansion.

## Review Focus

- A tile forming HAVE AN OPINION horizontally and vertically must match and display AN while remaining canonical A in board state.
- Existing A relationships such as TAKE A BREAK must remain unchanged.
- Graph connectivity, board diversity, copy caps and refill must treat A/AN as one board word.
- Reaching a score target with moves remaining must not finish the round after POP.
- At zero moves with READY present, swaps must be disabled but POP must work and then finish the round.

---

### Task 1: Add canonical indefinite-article token behavior

**Files:**
- Modify: Wordy/engine/relationship-bank.mjs
- Modify: Wordy/engine/matcher.mjs
- Modify: Wordy/engine/generator.mjs
- Modify: Wordy/engine/refill.mjs
- Modify: Wordy/data/relationships.mjs
- Test: Wordy/tests/matcher.test.mjs
- Test: Wordy/tests/generator.test.mjs
- Test: Wordy/tests/refill.test.mjs

**Interfaces:**
- Produces: canonicalTileToken(value) -> uppercase playable board token, with AN -> A.
- Produces: tileTokenMatches(actual, expected) -> true when canonical playable tokens are equal.
- Match objects continue to expose relation.tokens as grammatical surface tokens.

- [ ] Write failing matcher tests: A tile matches expected AN in HAVE AN OPINION; A still matches expected A.
- [ ] Write failing generator/refill tests: active relation containing AN exposes/deals/refills A and never a separate AN board word.
- [ ] Add HAVE AN OPINION to curated collocations.
- [ ] Implement canonicalTileToken and tileTokenMatches.
- [ ] Apply canonical board-token mapping in matcher, relationship graph, coverage, generation deck, seeding and refill bag.
- [ ] Run focused tests and require green.

### Task 2: Render the grammatical surface form for READY article tiles

**Files:**
- Modify: Wordy/ui/render.mjs
- Test: Wordy/tests/ui-contract.test.mjs

**Interfaces:**
- Consumes match.tokens and match.tileIds aligned by index.
- Board tile.word remains A.
- Rendered text becomes AN while that tile participates in a READY match whose expected token at that position is AN.

- [ ] Write failing UI test for board tile word A rendering as AN in HAVE AN OPINION.
- [ ] Preserve A rendering for TAKE A BREAK.
- [ ] If the same tile is simultaneously required as A and AN by crossing READY matches, render A/AN rather than silently choosing one.
- [ ] Run UI tests and require green.

### Task 3: Make moves, not score, terminate the round

**Files:**
- Modify: Wordy/engine/controller.mjs
- Test: Wordy/tests/controller.test.mjs
- Test: Wordy/tests/gameplay-integration.test.mjs

**Interfaces:**
- attemptSwap is invalid when movesLeft === 0.
- If the last accepted move leaves no READY relation, finish immediately and evaluate success from objectiveComplete.
- If the last accepted move leaves READY relation(s), phase remains playing solely to permit POP; no more swaps are allowed.
- pop with movesLeft > 0 always returns to playing after resolution/recovery even if score target was reached.
- pop with movesLeft === 0 resolves READY/cascades/refill, then finishes and evaluates success.

- [ ] Write failing test proving an early score target does not end the level after POP while moves remain.
- [ ] Write failing test proving the last move with READY allows final free POP but no further swap.
- [ ] Write failing test proving final POP finishes and uses final score to determine success.
- [ ] Update E2E so POP with moves remaining must produce fall/refill and continue the same round.
- [ ] Implement minimal lifecycle changes.
- [ ] Run controller + integration tests and require green.

### Task 4: Full regression and handoff

**Files:**
- Modify: docs/superpowers/handoffs/WORDY-CURRENT.md
- Create: docs/superpowers/progress/2026-09-24-wordy-pop-loop-and-indefinite-article.md

- [ ] Run node --test Wordy/tests/*.test.mjs.
- [ ] Run node --test tests/wordy-production-deploy.test.mjs.
- [ ] Run node --check Wordy/app.mjs.
- [ ] Self-review matching, display, generator/refill canonicalization, zero-move final POP and repeated POP loop.
- [ ] Document verification SHA/run IDs and explicitly distinguish branch from production.
