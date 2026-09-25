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

**Published on 2026-09-24.**

Production `main` commit:

`852774b163c61e72b3210a35f985a757f0152bc7`

Selective integration details:

- base `main`: `4e6b9831d9ffc7a7510e0e1512b98018f284987a`;
- integration branch: `integration/wordy-density-20260924`;
- promoted files: the four Wordy runtime files and five Wordy tests from this repair only;
- integration verification run: `36075979198` → **97/97**, deploy guard pass, syntax pass;
- Cloudflare production runs: `36076082167` and `36076082190` → success;
- canonical live check: `36076204533` → success, `LIVE_WORDY_DENSITY_OK`.

The canonical production route now serves the gameplay-density repair.

## Vocabulary repetition follow-up

### User report

After the density repair was published, the user reported that the board still repeated a small set of words so heavily that the board felt pointless.

### Root-cause evidence

Diagnostic run `36076476886` measured the defect directly:

- A: 18–21 unique words / 49 (avg 19.6), max copies 4;
- B: 19–22 unique, max 4;
- C: 21–25 unique, max 4;
- D: 19–24 unique, max 4;
- E: 23–28 unique, max 4;
- F: 21–28 unique, max 4;
- G: 25–32 unique, max 4.

High-connectivity words such as A, TAKE, LOOK, MAKE, OF, IN and UP repeatedly hit the four-copy ceiling because the deck algorithm repeated complete relationship bundles.

A second feasibility diagnostic (`36076562041`) proved that merely widening the relationship pool was insufficient: the old deck algorithm could still collapse a 32-relation pool to only 29–37 visible unique words.

### TDD contract

New regression requirements:

- normal stable boards may contain at most 2 copies of any word;
- A/B minimum visible unique words: 34;
- C/D: 36;
- E/F: 38;
- G: 40;
- refill may not choose a word already at the current round copy cap.

RED run `36076804987` failed on the missing diversity behavior, old pool sizes, and refill copy-cap behavior.

### Fix

- relationship pools widened to 24 / 24 / 26 / 26 / 28 / 28 / 32;
- board generation now deals unique vocabulary before duplication;
- duplicate slots choose from the least-used words;
- productive-move seeding rearranges existing words by swapping instead of overwriting vocabulary;
- normal levels explicitly cap every word at 2 copies;
- refill filters out words already at the cap;
- callers without an explicit cap retain adaptive behavior for tiny test/demo banks.

### Verification

Final branch CI: `36077230294`.

- Wordy suite: 99/99 pass;
- production deploy guard: pass;
- syntax check: pass.

Post-fix real-level measurement run `36077378583`:

- A: 38–41 unique, max 2, min 8 productive moves;
- B: 39–43 unique, max 2, min 8 moves;
- C: 41–42 unique, max 2, min 13 moves;
- D: 39–46 unique, max 2, min 11 moves;
- E: 44–48 unique, max 2, min 10 moves;
- F: 42–47 unique, max 2, min 12 moves;
- G: 49/49 unique in all three sampled boards, max 1, min 12 moves.

Verified implementation/test HEAD: `2411ff8bddde409c9aa06f216cd9a5f598788506`.
Latest runtime change: `eb948e2ec2fa9594977fdc722af52224f6a882d0`.

### Publication state

Published on 2026-09-24.

- Production `main`: `c99b7c99a48d41a36a17d899173a02cfb78ff156`.
- Selective integration branch: `integration/wordy-vocabulary-diversity-20260924`.
- Integration verification run `36079368486`: **99/99 pass**, deploy guard pass, syntax pass.
- Cloudflare production deploys:
  - `36079434478` → success;
  - `36079434497` → success.
- Real-browser canonical-route verification: `36079518269` → success.
- Live Level A: 36 unique words / 49, max 2 copies.
- Live Level G: 49 unique words / 49, max 1 copy.
- Live verification marker: `LIVE_WORDY_VOCABULARY_DIVERSITY_OK`.

The canonical production route now serves the vocabulary-diversity repair.