# Wordy Gameplay Density Repair Plan

**Date:** 2026-09-24
**Branch:** feature/wordy-game

**Goal:** Implement the already-approved prototype direction that boards come from compatible relationship neighborhoods, maintain many plausible productive swaps, refill from the same active linguistic pool, and last long enough to feel like a casual puzzle rather than a scripted two-move demo.

**Binding sources:**
- docs/superpowers/specs/2026-09-17-wordy-game-decisions.md
- docs/superpowers/specs/2026-09-20-wordy-game-prototype-design.md
- docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md

## Root cause

The uniform-cell migration fixed geometry but preserved prototype fixtures that violate the intended content-generation experience:

1. Levels A-F are authored boards with large arbitrary filler rows and only one or two fixture moves.
2. The controlled generator draws individual words from the entire relationship bank and merely seeds a minimum of four productive swaps.
3. Refill uses the entire global bank rather than the board's active relationship neighborhood.
4. Early score targets (250/500) and single-mechanic completion goals can finish after one or two pops.
5. Because filler words from unrelated relationships coexist, the player sees plausible-looking but unvalidated pairs (for example adjective/noun or noun/noun neighbors) and cannot infer why one pair counts while another does not.

The relationship bank itself is not tiny: V1 already contains roughly the planned 60-100 curated relationships. The fix is to use it as a connected gameplay graph rather than as a global bag of isolated tokens.

## Task 1 — Connected relationship neighborhoods

Create a deterministic neighborhood selector in generator.mjs.

Requirements:
- accept required relationship IDs, target neighborhood size, category weights, and RNG;
- start from required relationships or a weighted seed relation;
- prefer additional relations that share one or more tokens with already selected relations;
- favor category diversity when connectivity is comparable;
- return only validated bank IDs;
- build board vocabulary only from the selected neighborhood.

Add tests proving:
- required IDs are preserved;
- requested size is met when the bank permits it;
- selected relations form a connected token graph whenever a connected choice exists;
- the resulting board is built only from active-neighborhood words.

## Task 2 — High-opportunity board generation

Replace random individual-word filling with relationship-bundle dealing.

Requirements:
- use complete relationship token bundles to populate the word deck before shuffling;
- seed at least 8 productive swaps on early boards and 10-12 on mixed boards;
- productive swaps span at least 4 rows and 4 columns;
- no starting ready relationship unless explicitly requested;
- bound duplicate tokens;
- reject boards with poor relationship coverage.

Define relationship coverage as the fraction of board tiles whose word has at least one partner token from one of its active relationships also present somewhere on the board.

Prototype floor: >= 0.85.

Add tests for:
- >=8 productive moves at the early profile;
- >=10 at mixed profile;
- row/column spread;
- >=0.85 relationship coverage;
- no initial match.

## Task 3 — Level profiles and round duration

Convert all normal playable levels A-G to generated neighborhood boards rather than arbitrary filler boards.

Each level gets:
- generated: true;
- relationshipPoolSize;
- minScoringMoves;
- minProductiveRows;
- minProductiveColumns;
- moves >= 18;
- score-based completion target high enough to require several pops.

Prototype values:
- A: 18 moves, score 900, pool 12, min moves 8
- B: 20 moves, score 1100, pool 14, min moves 8
- C: 22 moves, score 1400, pool 16, min moves 10
- D: 22 moves, score 1500, pool 16, min moves 10
- E: 24 moves, score 1700, pool 18, min moves 10
- F: 24 moves, score 1900, pool 18, min moves 10
- G: 26 moves, score 2300, pool 20, min moves 12

Keep titles/instructions as tutorial guidance, but do not end a level after merely demonstrating one mechanic.

The controller chooses one active neighborhood when loading a level and keeps it stable for that round.

Expose activeRelationshipIds in controller state for tests/debugging.

## Task 4 — Neighborhood-aware refill and sparse-board recovery

Refill must use only the current level's active relationship IDs.

Change the default refill profile to favor playable opportunities:
- cascade: 0.15
- opportunity: 0.70
- distractor: 0.15

After each completed POP/cascade sequence:
- if the board has a ready relationship, keep it;
- otherwise count productive swaps;
- if productive swaps fall below half the level's configured minimum, perform a no-cost validated reshuffle using the same active neighborhood;
- do not wait until the board reaches zero moves.

Add tests proving:
- refill candidates stay inside the active neighborhood;
- post-resolution stable boards remain meaningfully playable;
- sparse recovery preserves moves/score and active neighborhood.

## Task 5 — Player-facing validity clarity

Do not change V1 into an unrestricted grammar engine.

The four approved V1 relationship families remain:
- phrasal verbs;
- curated collocations;
- fixed expressions;
- irregular verb sets.

A phrase is accepted because it is a validated relationship, not merely because two English words can grammatically sit next to each other.

To avoid arbitrary-feeling boards:
- remove arbitrary filler vocabulary from normal play;
- use connected neighborhoods where most words have visible potential partners;
- when a swap rebounds, show a short neutral event label: `NO MATCH`;
- when a relationship becomes ready, event feedback may include its family label.

No live LLM validity check.

## Task 6 — Full gameplay verification

Full suite plus new integration tests must prove:
- all levels are 7x7 generated neighborhood boards;
- Level A initial board has >=8 productive swaps;
- Level G initial board has >=12 productive swaps;
- boards meet >=0.85 relationship coverage;
- rounds do not complete after one ordinary two-word relationship at zero prior score;
- refill/recovery remain within active neighborhood;
- no legacy span geometry returns;
- production deploy guard remains green.

Final commands:
- node --test Wordy/tests/*.test.mjs
- node --test tests/wordy-production-deploy.test.mjs
- node --check Wordy/app.mjs

Publication to main follows only after branch verification.
