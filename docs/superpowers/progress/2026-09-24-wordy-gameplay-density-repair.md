# Wordy Gameplay Density Repair — Execution Ledger

**Date:** 2026-09-24  
**Branch:** `feature/wordy-game`  
**Plan:** `docs/superpowers/plans/2026-09-24-wordy-gameplay-density-repair.md`  
**Production baseline:** `9c3677b595dd7d082cfa29b19cad408738f982bc`

## User-reported regression

The published 7×7 prototype felt boring and arbitrary:

- early boards exposed only one or two obvious productive combinations;
- one or two POPs could end the round;
- authored filler words made many plausible-looking pairs appear even though they were not validated;
- runtime used the global relationship bank, so incidental combinations could be accepted even when they were outside the round's intended content pool.

Examples discussed by the user included the contrast between validated `BAD HABIT` and plausible-looking but non-bank combinations such as `COLD MONEY` and `SCHOOL FOOD`.

## Root cause

The uniform-cell architecture was implemented, but the original gameplay-content plan was not fully carried through.

The original design explicitly required:

- roughly 60–100 curated relationships;
- controlled-random boards from compatible relationship neighborhoods;
- many plausible future relationships;
- controlled distractors;
- rejection of sterile starts;
- opportunity-density as a difficulty dimension.

The relationship bank already had roughly the intended prototype scale. The main problem was how it was used:

1. Levels A–F remained scripted filler boards.
2. Early score/structural targets could end after one or two resolutions.
3. The generator drew individual words from the global bank and force-seeded only a small number of moves.
4. Refill used a global relationship bag rather than the round's active content neighborhood.
5. Gameplay matching/scoring still consulted the global bank even after an active relationship pool was introduced.

## Implemented repair

### 1. Connected relationship neighborhoods

`Wordy/engine/generator.mjs` now exports and uses `selectRelationshipNeighborhood()`.

Behavior:

- relationship pools are selected from the curated bank;
- required tutorial relationships are retained;
- pools are graph-connected through shared tokens;
- the selector chooses a connected component large enough for the requested pool;
- required relationships are joined using graph paths before optional relations are added;
- no fallback to unrelated/disconnected relationships is allowed.

Representative pool sizes tested: 12, 16, 20.

The review caught an earlier implementation that exhausted a small component such as `GO OUT / GO WENT GONE / FIND OUT` and then appended unrelated relations. Regression tests now prohibit that.

### 2. Dense generated boards

`createControlledBoard()` now builds from complete relationship token bundles rather than arbitrary global words.

Validation includes:

- 7×7 / 49 occupied cells;
- no starting ready relation unless explicitly allowed;
- configured minimum productive swaps;
- productive-row spread;
- productive-column spread;
- active-neighborhood-only vocabulary;
- relationship coverage floor;
- duplicate bounds.

The generator first accepts naturally dense neighborhood boards; forced productive seeding is only a rescue path.

### 3. Long-form generated A–G levels

`Wordy/data/levels.mjs` now uses generated profiles for every normal level:

| Level | Moves | Score target | Active relations | Min productive swaps |
|---|---:|---:|---:|---:|
| A | 18 | 900 | 12 | 8 |
| B | 20 | 1100 | 14 | 8 |
| C | 22 | 1400 | 16 | 10 |
| D | 22 | 1500 | 16 | 10 |
| E | 24 | 1700 | 18 | 10 |
| F | 24 | 1900 | 18 | 10 |
| G | 26 | 2300 | 20 | 12 |

All profiles require at least 4 productive rows, 4 productive columns, and relationship coverage >= 0.85.

Tutorial titles/instructions remain, but a single mechanic demonstration no longer ends the level.

### 4. Stable active relationship bank per round

The controller now chooses `activeRelationshipIds` once per round and exposes them in state.

That active set controls:

- initial board generation;
- productive-swap validation;
- ready-match detection;
- missed-opportunity detection;
- scoring;
- refill candidate evaluation;
- cascades;
- end-of-round review.

A round-specific relationship bank is created from the active IDs. The global bank is no longer the runtime validity authority inside an active round.

Regression coverage proves that a global relation such as `LOOK UP` is rejected when it is outside a round whose only active relation is `LOOK AFTER`.

### 5. Neighborhood-aware refill

Default refill profile is now:

```js
{
  cascadeWeight: 0.15,
  opportunityWeight: 0.70,
  distractorWeight: 0.15
}
```

Refill is drawn only from the current round neighborhood.

After POP/cascade stabilization, generated rounds check opportunity density. When productive swaps fall below half of the configured level floor and no ready relation is waiting, the board is regenerated at no move cost using the same active neighborhood.

### 6. Player feedback

A valid geometric swap that produces no active relationship now rebounds and sets:

`NO MATCH`

It does not consume a move.

### 7. Generation robustness

Some randomly selected neighborhoods could not satisfy a level's density constraints. The controller now rejects those pools before display and retries a new neighborhood, bounded to 12 attempts.

This prevents a legitimate RNG seed from failing level startup.

## TDD / verification history

Key RED/GREEN checkpoints:

- `36062707874`: RED — neighborhood-selection / density APIs missing.
- `36063152186`: GREEN — connected selector API + natural dense generation focused tests.
- `36063313609`: RED — old A–G profiles, global refill profile, no active pool state, no NO MATCH feedback.
- `36063531924`: GREEN — generated profiles, active pool, scoped refill, NO MATCH focused tests.
- `36063775837`: RED — legacy scripted Level A E2E and stale branch shell assumptions.
- `36063889855`: GREEN — 94/94 after generated-round retry and shell reconciliation.
- `36064193998`: RED — proved global-bank relation could leak into round validity.
- `36064378615`: GREEN — 95/95 after round-bank scoping.
- `36064567558`: RED — found disconnected relationship pool fallback.
- `36064716403`: GREEN — 97/97 after graph-connected-component/path repair.
- `36064806265`: final fresh verification — **97/97 Wordy tests pass**, production-deploy guard passes, `node --check Wordy/app.mjs` passes.

Final E2E verifies:

- Level A begins with >=8 productive swaps;
- Level G begins with >=12;
- initial relationship coverage >=0.85;
- rebound uses NO MATCH and does not spend a move;
- any productive move can be selected without a hard-coded solution;
- POP restores a stable 49-cell board;
- POP/recovery does not spend an extra move;
- score increases;
- active relationship IDs remain stable;
- refill/recovery does not leak words outside the active neighborhood;
- a continuing board exposes at least 4 productive swaps.

## Review

No reviewer subagent is available in the current harness, so a final self-review was performed against the plan.

Important findings found and fixed during review:

1. global-bank validity leaked relations outside the active pool;
2. relationship selection could exhaust a small graph component then append disconnected filler.

Both now have explicit regression tests.

## Publication state

**Not published.**

Production remains on `main` commit:

`9c3677b595dd7d082cfa29b19cad408738f982bc`

That production version contains the 7×7 uniform-cell architecture and deploy-race fix, but **does not yet contain this gameplay-density repair**.

The repaired implementation is on `feature/wordy-game`. Promotion to `main` / Cloudflare requires a separate explicit integration step.
