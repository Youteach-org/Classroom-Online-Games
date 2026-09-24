# Wordy — Uniform-Cell Candy Architecture

**Date:** 2026-09-22  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Branch:** `feature/wordy-game`  
**Status:** Proposed architecture pending user review

## 1. Purpose

Re-align Wordy with the intended Candy-Crush-like interaction model while preserving its linguistic relationship system.

The current variable-width microgrid causes three coupled problems:

1. tile width changes movement geometry, so vertical swaps are often impossible;
2. wide rigid blocks make gravity and refill behave unlike a column-based casual puzzle;
3. refill chooses words mainly by span compatibility and broad board context, so falling words rarely create useful local linguistic opportunities.

The replacement architecture makes every playable word a single logical cell of equal size. Word length affects typography only, never physics.

## 2. Core board model

The canonical board becomes a fixed rectangular matrix.

Initial prototype dimensions remain 7 rows × 7 columns unless playtesting shows another size is more legible.

Each occupied cell contains exactly one tile:

```js
{
  id,
  word,
  row,
  column
}
```

Rules:

- every tile occupies exactly one logical cell;
- every row and column has identical geometry;
- no span, footprint, or microcolumn exists in gameplay state;
- no word can block more than one column;
- word length changes only visual text treatment.

The board is the sole geometry authority for movement, matching, gravity, refill, replay, and generation.

## 3. Visual tile treatment

All tiles use the same physical width and height.

Typography adapts to the word:

- short/medium words use the normal game font size;
- long words step down through a small number of approved font-size classes;
- no tile changes physical size;
- no word wraps to a second line in the base prototype;
- extremely long candidates that cannot remain readable are excluded from the active board vocabulary until a later design explicitly supports them.

The visual goal is a regular Candy-style grid whose pieces remain easy to scan.

## 4. Swap behavior

A gesture swaps exactly two orthogonally adjacent cells:

- left;
- right;
- up;
- down.

No diagonal, jump, group swap, or free dragging.

Candy-style acceptance remains:

1. animate the attempted exchange;
2. evaluate the exchanged board;
3. if the move creates at least one new validated linguistic relationship, keep the swap and spend one move;
4. otherwise animate the two tiles back and do not spend a move.

Because every tile occupies one cell, every tile has conventional geometric neighbors whenever a neighboring cell exists.

## 5. Relationship geometry

A relationship is a straight contiguous ordered sequence of cells.

### Horizontal

Tokens occupy consecutive columns in the same row in canonical word order.

### Vertical

Tokens occupy consecutive rows in the same column in canonical word order.

### Crossings

A physical tile may participate in one horizontal and one vertical relationship simultaneously.

Shared tiles are removed once physically while each valid relationship scores independently.

The project relationship bank remains the only runtime authority for linguistic validity.

## 6. Ready state and global POP

Validated relationships formed by accepted player swaps become ready.

Ready relationships:

- remain on the board;
- are visually marked;
- may coexist;
- may share tiles;
- are not automatically removed by the deliberate player move.

The existing global POP action remains:

- POP resolves every relationship that is ready at that moment;
- POP does not spend an additional move;
- all participating tiles are removed in one batch;
- shared tiles are removed once.

## 7. Gravity

Gravity becomes conventional column gravity.

After removal:

1. process each column independently;
2. compact surviving tiles downward;
3. preserve relative vertical order of survivors in that column;
4. create empty cells only at the top of each column;
5. refill those top cells with new tiles.

No lateral cavity refill exists.

No rigid multi-cell blocks exist.

No partitioning of horizontal empty runs exists.

Every newly spawned tile enters from the top of one column and falls downward into a single cell.

## 8. Linguistically directed refill

Refill must not choose isolated words merely because they fit a geometric size.

The refill engine uses the validated relationship bank and the stabilized local board context to produce a controlled candidate set for every new tile.

### 8.1 Relationship bag

For the active level, build a weighted relationship bag containing approved relationships from the level's linguistic pool.

The bag supplies both:

- complete relationship candidates;
- individual tokens belonging to those relationships.

### 8.2 Local placement scoring

Before selecting a refill word for a top cell, evaluate candidate words against the board that will exist after gravity.

Candidate score should consider:

- whether the candidate immediately completes a valid horizontal relationship;
- whether it immediately completes a valid vertical relationship;
- whether it creates a one-swap opportunity;
- whether it connects with nearby tokens that belong to the same approved relationship;
- whether it duplicates a word excessively;
- whether it creates trivial or repetitive boards;
- current level difficulty and desired opportunity density.

### 8.3 Cascade control

Refill must permit natural cascades but not manufacture one after every POP.

Difficulty profiles define a target probability / density for:

- immediate cascade relationships;
- one-move opportunities;
- distractor-only drops.

The generator should select among several legal candidate words, weighted by those targets, rather than always choosing the highest-scoring linguistic placement.

### 8.4 No live LLM

All refill evaluation uses the local approved relationship bank.

No runtime LLM judges whether a word combination is valid.

## 9. Initial board generation

Initial board generation uses the same relationship-aware system.

A generated board must satisfy all of the following:

- full rectangular occupancy;
- no accidental unresolved impossible geometry;
- a configurable minimum number of productive swaps;
- productive swaps distributed across the board rather than concentrated in one row;
- no pre-existing ready relationship unless a tutorial level explicitly requires one;
- enough relationship connectivity that future refill can maintain useful play;
- bounded repetition of identical tokens.

Authored tutorial boards remain allowed.

## 10. Dead-board handling

A board is considered dead when no productive swap exists and no ready relationship is waiting for POP.

Recovery:

1. visibly reshuffle or replace the board;
2. do not spend a move;
3. validate the replacement against the same generation constraints;
4. preserve level objective and score.

## 11. Cascade cycle

After POP:

`remove -> vertical fall -> refill from top -> detect -> auto-resolve cascade -> repeat`

Relationships created directly by gravity/refill during the cascade phase resolve automatically.

When no cascade relationship remains:

- return control to the player;
- run dead-board validation;
- continue the round.

## 12. Scoring and learning systems

The existing concepts remain:

- relationship base score;
- length bonus;
- batch/setup bonus;
- crossing bonus;
- discovery bonus;
- cascade multiplier;
- compact end-of-round review;
- missed high-value opportunities;
- relationship-level learning history.

Any implementation detail that depended on tile span or microcolumn geometry must be rewritten around row/column cell identity.

## 13. Prototype scope

This architecture is still a validation prototype, not the full product.

Included:

- equal-cell board;
- four-direction adjacent swaps;
- rejected-swap rebound;
- relationship matching;
- ready state;
- global POP;
- column gravity;
- relationship-aware refill;
- controlled cascades;
- crossings;
- generated and authored boards;
- current score/objective/review flow.

Not included in this architecture pass:

- full level map;
- boosters;
- obstacles;
- complete Wordbook;
- adaptive learner model;
- Teacher Monitor;
- monetization;
- final art direction.

## 14. Migration from the 12-column span architecture

The following concepts are removed from canonical gameplay:

- `span`;
- `startColumn`;
- 12-microcolumn occupancy;
- variable-width logical pieces;
- exact-footprint vertical swaps;
- rigid multi-cell gravity;
- horizontal cavity partition/refill.

The following concepts are preserved:

- tile IDs;
- validated relationship bank;
- accepted/rebound swap result;
- global POP;
- simultaneous ready relationships;
- crossings;
- cascades;
- scoring;
- review/telemetry concepts;
- Cloudflare production path.

No compatibility layer should keep the span engine alive in parallel. The migration should replace it.

## 15. Acceptance criteria

Implementation is not complete until tests prove at least:

1. every tile occupies exactly one board cell;
2. all four orthogonal neighbor directions work on interior cells;
3. edge cells expose only their real neighbors;
4. nonproductive swaps visibly rebound and do not mutate canonical state;
5. productive swaps remain and consume exactly one move;
6. horizontal relationships use consecutive cells;
7. vertical relationships use consecutive cells;
8. crossings share one physical tile ID;
9. POP resolves every ready relationship in the batch;
10. gravity compacts each column downward with no lateral movement;
11. refill occurs only in top-of-column empty cells;
12. no stable board contains holes below occupied cells;
13. initial generated boards meet the productive-opportunity floor;
14. refill candidate selection demonstrably prefers locally useful relationship tokens over unrelated tokens;
15. refill can still choose distractors so cascades are not guaranteed;
16. cascade-created relationships auto-resolve;
17. dead boards recover without charging a move;
18. long words remain readable without changing tile geometry;
19. the canonical live prototype can be exercised entirely without any span/microcolumn state.

## 16. Validation focus

The prototype should be judged by player experience, not merely engine correctness.

Key questions:

- Does movement feel immediately familiar to a Candy Crush player?
- Can the player predict which pieces are neighbors?
- Does gravity visually read as normal falling pieces?
- Do new words entering from the top frequently create plausible opportunities without looking rigged?
- Do cascades happen often enough to feel rewarding but not constantly?
- Are long words still readable in equal-size tiles?
- Does the board feel like a game first rather than a worksheet?

A successful prototype should make the player think in local swaps and emerging linguistic patterns, not in tile widths or board geometry.
