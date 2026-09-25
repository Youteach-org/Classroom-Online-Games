# Wordy POP Loop + Indefinite Article — Execution Ledger

**Date:** 2026-09-24  
**Branch:** `feature/wordy-game`  
**Plan:** `docs/superpowers/plans/2026-09-24-wordy-pop-loop-and-indefinite-article.md`  
**Production baseline:** `c99b7c99a48d41a36a17d899173a02cfb78ff156`

## User decisions

The existing manual POP mechanic remains authoritative.

Correct round loop:

`swap → form READY relation(s) → optionally keep searching → POP → destroy all READY tiles → vertical gravity → top refill → automatic cascades → stable board → continue playing`

Rules fixed in this conversation:

- POP does **not** end the game while moves remain.
- POP consumes no move.
- The round ends because the movement budget reaches zero, not because the score target was reached early.
- If the last move leaves READY relationships, the player receives one final free POP.
- At zero moves, no more swaps may be attempted; only that final POP remains available.
- After the final POP resolves gravity/refill/cascades, the level result is evaluated.
- A physical `A` tile can realize grammatical surface form `A` or `AN` according to the validated relationship.
- Example added to the curated bank: `HAVE AN OPINION`.
- There is no separate physical `AN` tile.

## Implementation

### Canonical indefinite article

`Wordy/engine/relationship-bank.mjs` now exports:

```js
canonicalTileToken(value)
tileTokenMatches(actual, expected)
```

Canonical board rule:

- `A → A`
- `AN → A`

Relationship surface tokens are not rewritten. A relationship may still store:

```js
['HAVE','AN','OPINION']
```

while the physical board contains:

```js
['HAVE','A','OPINION']
```

The matcher compares canonical playable tokens and returns the original grammatical relation tokens.

### Generation and refill

Generator graph connectivity, relationship coverage, board vocabulary, productive seeding and unique-word calculations now use canonical board tokens.

Refill bags merge `A` and `AN` into the same physical `A` candidate.

Custom refill hooks are also canonicalized, so returning `AN` still creates a physical `A` tile.

### Rendering

The board state remains canonical.

When a READY match requires `AN`, the physical `A` tile renders visually as `AN`.

When a READY match requires `A`, it renders `A`.

If one shared crossing tile were simultaneously required as `A` and `AN`, renderer fallback is `A/AN`.

### Round lifecycle

`attemptSwap()` now rejects every swap once `movesLeft === 0`.

When the last accepted move leaves READY relationships:

- state remains `playing`;
- tiles cannot be moved;
- POP remains enabled.

`pop()` behavior:

- if moves remain after resolution, always return to `playing`, even when the score target has already been exceeded;
- if moves are zero, resolve the final POP completely, then call `finishRound(objectiveComplete(...))`.

Therefore score/objective determines the final result, but **never terminates the round early**.

## TDD evidence

### A/AN canonical token

RED:
- run `36096624899`: missing `canonicalTileToken` export.
- run `36096815763`: READY article still rendered `A` instead of `AN`.

GREEN:
- run `36096799184`: canonical article matching/generation/refill suite green after graph-test canonicalization.
- run `36096879564`: visual A→AN behavior green.

### Move-budget lifecycle

RED:
- run `36096922960`:
  - early score target POP incorrectly entered `result`;
  - zero-move board still allowed a swap/rebound.
- run `36097129289`: zero-move tile UI still appeared movable.

GREEN:
- run `36097071479`: lifecycle and POP continuation green after playable-fixture correction.
- run `36097173630`: zero-move UI exposes final POP only.

### No physical AN refill

RED:
- run `36097313407`: custom refill returning AN produced physical AN tiles.

GREEN:
- run `36097367881`: custom refill canonicalization and full suite green.

## Final verification

Fresh final run: `36097367881` on runtime commit `4e24d924f636709bf4b857fc7f7827a4058e1282`.

- `node --test Wordy/tests/*.test.mjs` → **109/109 pass**.
- failures: **0**.
- root production deployment guard → **1/1 pass**.
- `node --check Wordy/app.mjs` → pass.

E2E now explicitly verifies that a normal POP with moves remaining:

- destroys every READY tile;
- spends no additional move;
- refills with new tile IDs after gravity;
- restores a stable 49-cell board;
- keeps the same active relationship neighborhood;
- returns to `playing`;
- exposes meaningful continuation opportunities.

## Final review

Self-review performed because no reviewer subagent is exposed in this harness.

Review findings checked:

1. `objectiveComplete()` is now only used when movement budget is exhausted.
2. normal and custom refill paths both canonicalize `AN → A`.
3. generator vocabulary/graph/coverage all use the same canonical article rule.
4. relationship surface token remains `AN`, so review/learning text stays grammatical.
5. zero-move controller rejects swaps while renderer leaves POP available when READY exists.
6. global manual POP, gravity, refill and automatic cascade behavior remain unchanged.

No Critical or Important findings remained.

## Publication state

**Published on 2026-09-25.**

Production `main` commit:

`5540768cd4947c89fa382133856472c2b5d24f34`

Selective integration details:

- integration branch: `integration/wordy-pop-loop-20260925`;
- integration verification run `36183857726` → **109/109 pass**, deploy guard pass, syntax pass;
- Cloudflare production runs `36184008106` and `36184007994` → success;
- real-browser production verification `36184160428` → success with `LIVE_WORDY_POP_LOOP_OK`;
- early POP stayed in `playing` with moves unchanged;
- final zero-move POP ended the round;
- canonical `A` rendered as `AN` inside `HAVE AN OPINION`.

The canonical production route now serves this repair.
