# Wordy Visible Gravity + KEEP Phrases — Execution Ledger

**Date:** 2026-09-25  
**Branch:** `feature/wordy-game`  
**Plan:** `docs/superpowers/plans/2026-09-25-wordy-visible-gravity-and-keep-phrases.md`  
**Production baseline:** `5540768cd4947c89fa382133856472c2b5d24f34`

## User report

User confirmed two issues during production playtesting:

1. `KEEP UP` and `KEEP IN` should be valid English relationships.
2. POP removed READY tiles and replaced/refilled the board, but tiles did not visibly fall. The board looked like words disappeared and new words teleported into place.

## Root cause

The engine already performed the correct logical sequence:

`remove → settleGravity → refillFromTop → cascade detection`

However, the browser never received visual intermediate board states.

Before this repair:

- `resolvePlayerActivation()` stored only matches, removed IDs and score for each generation;
- `controller.pop()` synchronously calculated the final stable board;
- `playResolutionTimeline()` only changed text labels;
- the controller subscriber rendered the final board immediately.

Therefore gravity was correct in game state but invisible to the player.

## TDD chronology

### KEEP UP / KEEP IN

RED run: `36185718191`.

Failure:

`KEEP UP must exist in curated bank`

GREEN run: `36185809659`.

Added:

- `phrasal-verb:keep-up`
- `phrasal-verb:keep-in`

### Resolution stage snapshots

RED run: `36185909273`.

Failure:

`missing boardBefore`

Each resolution generation now preserves:

- `boardBefore`
- `boardAfterRemoval`
- `boardAfterGravity`
- `boardAfterRefill`

`buildResolutionEvents()` clones and forwards these snapshots plus `removedTileIds`.

GREEN run: `36186007807`.

### Visible browser timeline

RED run: `36186160519`.

It proved three missing behaviors:

- timeline did not execute remove/gravity/refill stages;
- `renderBoardSnapshot` did not exist;
- app subscriber rendered final controller state while timeline was active.

Fix:

- `renderBoardSnapshot(root, board, {matches, disabled})` renders intermediate board stages without touching the HUD;
- removal uses scale/fade over 170 ms;
- gravity uses stable tile IDs and FLIP movement over 300 ms;
- refill tiles enter from above over 340 ms;
- cascades replay the same visual sequence per generation;
- normal controller rendering is withheld while `timelinePlaying` is true;
- no-WAAPI fallback still reaches the final correct board.

Final branch suite run: `36186497856`.

- Wordy tests: **115/115 pass**
- production deploy guard: pass
- syntax check: pass

## Chromium branch verification

First browser run `36186648090` did not test the runtime because the temporary Node script was written under `/tmp` and could not resolve the locally installed Playwright package. No runtime change was made for this harness error.

Corrected browser run: `36186826373`.

Marker:

`VISIBLE_GRAVITY_BROWSER_OK`

Measured controlled animation:

- surviving KEEP tile: `translate(0px,-447.859375px)` → destination;
- refill entry examples: `translateY(-100.5625px)` through approximately `-542.421875px`;
- removal animation recorded;
- final survivor row matched the true gravity result.

## Selective production integration

Feature branch was highly diverged from production, so it was **not merged**.

Only these 12 files were promoted onto current production:

1. `Wordy/app.mjs`
2. `Wordy/data/relationships.mjs`
3. `Wordy/engine/resolution-events.mjs`
4. `Wordy/engine/resolution.mjs`
5. `Wordy/styles.css`
6. `Wordy/tests/entrypoint.test.mjs`
7. `Wordy/tests/relationship-bank.test.mjs`
8. `Wordy/tests/resolution.test.mjs`
9. `Wordy/tests/timeline.test.mjs`
10. `Wordy/tests/ui-contract.test.mjs`
11. `Wordy/ui/render.mjs`
12. `Wordy/ui/timeline.mjs`

Integration branch:

`integration/wordy-visible-gravity-20260925`

Production runtime commit:

`deec8182b1c8aa011de693125b0e51b0103d7d5b`

Integration verification run:

`36187189690`

Results:

- Wordy tests: **115/115 pass**
- deployment guard: pass
- syntax: pass

## Cloudflare deployment

Both production deployments for exact SHA `deec8182b1c8aa011de693125b0e51b0103d7d5b` completed successfully:

- `36187369363` → success
- `36187369200` → success

## Real production-browser verification

Run:

`36187570728`

Marker:

`LIVE_VISIBLE_GRAVITY_OK`

The verification loaded the actual canonical production page, seeded the live game, found a real productive Level A move and clicked the real POP button.

Live evidence:

- seed: 7;
- 8 productive moves available;
- READY relation formed: `TAKE A BREAK`;
- moves left after the setup swap: 17;
- phase after POP: `playing`;
- removal animation recorded for `tile-43`;
- surviving `tile-1` gravity animation: `translate(0px,-89.5625px)`, duration 300 ms;
- refill animation: `refill-1`, `translateY(-100.5625px)`, duration 340 ms;
- 24 animations recorded during the live POP;
- live relationship bank contained `phrasal-verb:keep-up` and `phrasal-verb:keep-in`.

## Publication state

**Published.**

Current production:

`deec8182b1c8aa011de693125b0e51b0103d7d5b`

Canonical route:

`https://classroom-online-games.pages.dev/Wordy/`

## 2026-09-26 follow-up: global curated validity + stronger motion

### User report

Production still felt wrong in two ways:

- `KEEP UP` / `KEEP IN` could be visible but not recognized when outside the active round neighborhood.
- The existing gravity/refill animation still felt like words disappeared and replacements appeared rather than clearly falling.

### Root cause

Validity remained scoped to `roundBank`, even though `KEEP UP` and `KEEP IN` were already in the full curated relationship bank.

Live animation instrumentation also showed that the existing browser path did animate, but a representative POP used only 300 ms gravity and 340 ms refill. This was technically correct but visually too subtle for the intended Candy-style feel.

Diagnostic run `36247133741` measured:

- 3 removal animations;
- 2 gravity animations at 300 ms;
- 3 refill animations at 340 ms.

### TDD

RED:

- `36247279935`: curated `KEEP IN` / `KEEP UP` outside the active pool were rejected.
- `36247284240`: stronger motion contract was absent.

GREEN:

- `36247392560`: **117/117 pass**, deploy guard pass, syntax pass.

### Runtime change

- full curated `bank` now drives ready matching, productive swap detection, scoring, review, cascade resolution and playability checks;
- `roundBank` remains responsible for generation/refill supply;
- gravity now has a 480 ms minimum with landing overshoot;
- refill now has a 520 ms minimum, lower initial opacity, landing overshoot and small stagger.

### Selective promotion

Production runtime:

`bdbe27a488742879bf36066a4a423545157c5d17`

Integration verification:

`36247507097` → **117/117**, deploy guard pass, syntax pass.

Cloudflare:

- `36247576021` → success;
- `36247576025` → success.

Public Chromium verification:

`36247810552` → `LIVE_WORDY_CURATED_GRAVITY_OK`

Live assertions:

- active relationship IDs: only `look-after`;
- `KEEP IN` still READY;
- `KEEP UP` productive swap accepted;
- forced gravity scenario: 15 falling survivors, each >=480 ms;
- 5 refill tiles, each >=520 ms;
- board stable at 49 tiles;
- phase `playing`, 17 moves remaining.

### Publication state

**Published.**

Canonical route:

`https://classroom-online-games.pages.dev/Wordy/`
