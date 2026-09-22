# Wordy — Discrete Grid and Candy-Crush Swap Architecture

**Repository:** `Youteach-org/Classroom-Online-Games`  
**Branch:** `feature/wordy-game`  
**Date:** 2026-09-21  
**Status:** Proposed authoritative redesign; user review required before implementation planning

## 1. Purpose

This redesign corrects two prototype failures discovered during hands-on play:

1. Free-width flex tiles destroy board geometry and make the game visually irregular.
2. Restricting interaction to swaps that are already known to score makes most of the board feel inert and unlike a Candy Crush-style puzzle.

Wordy must feel like a tactile casual puzzle while preserving variable word-block sizes and clear English relationship rules.

This document supersedes the earlier prototype rules for:
- free-form variable-width flex rows;
- a 5×7 equal-cell logical matrix;
- “productive swaps only” as the only swaps the player can visibly attempt.

The linguistic relationship bank, ready-to-pop model, global POP action, crossings, scoring concepts, learning review, and COG integration remain unless explicitly changed here.

## 2. Board coordinate system

The board uses a fixed invisible **12 microcolumn × 7 row** coordinate system.

The microgrid is the only source of truth for geometry.

Each tile has:

```text
id
word
row
startColumn
span
```

Where:
- `row` is 0–6;
- `startColumn` is 0–11;
- `span` is 1, 2, 3, or 4;
- `startColumn + span <= 12`.

A tile occupies every microcell from `startColumn` through `startColumn + span - 1` in its row.

Rows must be packed without overlaps. Empty microcells may exist temporarily during POP/gravity/refill, but a stable playable board should be fully packed.

## 3. Discrete tile sizes

Tile width is variable but never arbitrary.

Initial size buckets:

| Span | Typical word length | Examples |
| --- | --- | --- |
| 1 microcolumn | 1–2 characters | A, I, OF, TO |
| 2 microcolumns | 3–5 characters | LOOK, MAKE, TAKE |
| 3 microcolumns | 6–8 characters | AFTER, HOMEWORK |
| 4 microcolumns | 9+ characters | ATTENTION, DIFFERENCE |

The mapping is deterministic and may later use measured text width, but the output must always be one of the four spans.

A word never receives a free CSS width.

### Visual rule

Rendering uses a 12-column CSS Grid. A tile is placed with its actual logical `startColumn` and `span`.

This gives the board:
- variable-size blocks;
- aligned edges;
- predictable movement;
- visual symmetry;
- no arbitrary flex distortion.

## 4. Geometric adjacency

A player move always involves exactly two tiles.

### 4.1 Horizontal adjacency

Two tiles are horizontal neighbors when:
- they are on the same row; and
- the right edge of one touches the left edge of the other.

Different spans are allowed.

Example:

```text
[ LOOK span 2 ][ ATTENTION span 4 ]
```

They may swap because their combined six-column footprint remains unchanged.

When two horizontally adjacent tiles swap, they exchange order inside their combined footprint.

### 4.2 Vertical adjacency

Two tiles are vertical swap partners only when:
- their rows differ by exactly one;
- they have the same `startColumn`;
- they have the same `span`.

A 3-column tile above three separate 1-column tiles does **not** have a legal two-tile vertical swap with that group.

This preserves the rule that one gesture swaps exactly two physical pieces.

### 4.3 Invalid geometry

No:
- diagonal swaps;
- long-distance swaps;
- group swaps;
- partial overlap swaps;
- free dragging;
- snapping a large tile into several smaller tiles.

A gesture toward a direction with no legal two-tile neighbor may show a small bump/blocked animation, but does not change game state.

## 5. Candy-Crush-style swap behavior

Every geometrically valid adjacent pair can be **attempted**.

The engine does not pre-disable a pair merely because it will fail to score.

### 5.1 Productive attempt

If the temporary exchanged board creates at least one new validated linguistic relationship:
- the swap remains;
- one move is consumed;
- relationship detection recalculates;
- newly created relationships become `ready to pop`;
- any ready relationship broken by the accepted swap loses ready state.

### 5.2 Non-productive attempt

If the temporary exchanged board creates no new validated relationship:
- the UI animates the tiles into the exchanged position;
- the UI animates them back;
- canonical board state remains unchanged;
- no move is consumed;
- no score changes;
- no missed-opportunity telemetry is created merely because of the failed attempt.

This is the Candy Crush interaction model: the board feels movable everywhere without allowing words to be walked across the board through useless setup moves.

## 6. Relationship geometry

A linguistic relationship remains a straight contiguous sequence.

### 6.1 Horizontal relationship

Tiles form a horizontal sequence when:
- they are on the same row;
- each tile's right edge exactly touches the next tile's left edge;
- token order matches the approved relationship definition.

Tile spans may differ.

Example:

```text
[ AS 1 ][ A 1 ][ MATTER 3 ][ OF 1 ][ FACT 2 ]
```

### 6.2 Vertical relationship

Vertical **matching** is less restrictive than vertical **swapping**.

A vertical relationship requires:
- consecutive rows;
- correct token order from top to bottom;
- at least one microcolumn that is occupied by every participating tile.

Equivalently, the intersection of the participating tile footprints must be non-empty.

This allows mixed-width phrases such as `TAKE / A / BREAK` to exist vertically while still reading as one visually continuous vertical stack.

Vertical **swapping** remains stricter: two tiles can swap vertically only when their complete footprints are identical.

### 6.3 Crossings

A tile may simultaneously participate in:
- one horizontal relationship; and
- one vertical relationship.

The existing crossing rules remain:
- each relationship scores independently;
- the shared tile is removed once;
- cross bonuses may apply.

## 7. Gravity

Gravity treats every tile as a rigid block.

After a POP:

1. Build a 12×7 occupancy map.
2. Scan tiles from lower rows upward.
3. A tile may fall one row only when **every microcell directly below its complete footprint is empty**.
4. Move the entire tile down one row.
5. Repeat until no tile can fall farther.

A tile never:
- shrinks;
- splits;
- overlaps another tile;
- pushes several smaller tiles sideways;
- partially falls.

Example:

A span-3 tile cannot fall if any of its three destination microcells is occupied. If three span-1 tiles occupy those cells, it remains supported. If all three are removed, the span-3 tile may fall into the resulting three-column opening.

## 8. Refill

After gravity stabilizes, refill operates on every remaining horizontal empty run.

Rigid multi-cell gravity can leave cavities below wider supported tiles; those cavities must not remain permanently empty. Logical refill therefore packs each remaining empty run in place.

Because span 1 exists, every positive-width empty run is fillable.

Refill:
- chooses only spans 1–4;
- never overlaps existing occupancy;
- uses a combination of spans whose total width exactly equals the empty run;
- uses controlled lexical generation rather than unconstrained random words;
- continues until all stable rows are fully packed.

Presentation may animate newly created blocks entering from above or fading/dropping into their run, but the engine does not pretend that a block passed through occupied geometry.

The generator should avoid visually pathological rows, such as excessive runs of span-1 tiles.

## 9. Board generation and playability

A generated board must satisfy both geometric and linguistic playability.

### 9.1 Geometric activity

Every stable board should contain many attemptable swaps.

Horizontal adjacency naturally provides this across every row. Vertical swaps add additional options where exact footprints align.

No board should visually suggest that only one or two pieces are interactive.

### 9.2 Productive opportunities

A board should contain multiple swaps that actually form relationships.

Initial validation target:
- at least 4 productive swaps;
- distributed across at least 3 different rows or board regions;
- not all derived from the same relationship.

Exact balancing can be tuned after playtesting.

### 9.3 Dead board

A dead board is one where no geometrically valid swap can create a new relationship and no ready relationship is already available.

Failed swap attempts are not themselves evidence of a dead board.

Automatic dead-board recovery remains free.

## 10. Input behavior

Swipe/tap interaction maps gestures to a geometric neighbor.

- left/right: touching tile in the same row;
- up/down: tile with identical `startColumn` and `span` in the adjacent row.

For a legal geometric pair:
1. animate exchange;
2. evaluate the resulting board;
3. keep or rebound based on relationship creation.

Input is temporarily locked during:
- forward swap animation;
- rebound animation;
- POP resolution;
- gravity;
- refill;
- cascades.

## 11. Rendering

Replace flex-width rows with CSS Grid.

Conceptual rendering:

```css
.wordy-board {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: repeat(7, minmax(0, 1fr));
}
```

Each tile uses:
- `grid-column: start / span N`;
- `grid-row` from its logical row;
- one consistent height;
- readable single-line text;
- typography that scales only within a narrow range.

Longer words receive more span rather than being crushed into tiny type.

## 12. Engine model changes

The current array-of-rows/equal-cell board model is no longer sufficient as the canonical geometry.

New canonical board representation should be tile-centric:

```js
{
  rows: 7,
  columns: 12,
  tiles: [
    { id, word, row, startColumn, span }
  ]
}
```

Derived helpers provide:
- occupancy map;
- horizontal neighbors;
- vertical swap partners;
- horizontal token sequences;
- vertical footprint lanes;
- gravity candidates;
- empty runs.

Rendering, matching, swapping, and gravity must all consume the same geometry authority.

No separate visual coordinate model.

## 13. Expected implementation impact

Primary modules expected to change:

- `Wordy/engine/board.mjs`
  - tile-centric board;
  - occupancy;
  - neighbor lookup;
  - geometric swap functions.

- `Wordy/engine/matcher.mjs`
  - horizontal touching-sequence matching;
  - vertical exact-footprint matching.

- `Wordy/engine/generator.mjs`
  - span-aware packing;
  - minimum productive-opportunity validation;
  - refill of empty microcell runs.

- `Wordy/engine/controller.mjs`
  - attempt/accept/rebound swap result;
  - move consumption only on accepted swaps.

- `Wordy/engine/resolution.mjs`
  - rigid-block gravity and refill.

- `Wordy/ui/input.mjs`
  - geometric neighbor gestures.

- `Wordy/ui/render.mjs`
  - 12-column CSS-grid coordinates.

- `Wordy/styles.css`
  - remove free-flex width classes;
  - introduce grid-based tile spans;
  - swap/rebound presentation states.

Tests must be rewritten around geometry rather than equal matrix cells.

## 14. TDD acceptance criteria

Implementation is not complete until tests prove at least:

1. span mapping always returns 1–4;
2. stable rows never overlap and remain inside 12 columns;
3. horizontal tiles of different spans can swap;
4. vertical swap requires exact footprint equality;
5. a span-3 tile cannot swap vertically with three span-1 tiles;
6. any geometrically valid non-scoring swap is attemptable and rebounds;
7. a rebounded swap consumes no move;
8. a productive swap remains and consumes exactly one move;
9. horizontal relations can contain mixed spans;
10. vertical relations require consecutive rows and a non-empty shared microcolumn intersection;
11. a span-3 tile falls only when all three cells below are empty;
12. refill can close every empty run, including cavities that rigid gravity cannot clear;
13. crossings still score correctly;
14. global POP still resolves all ready relationships;
15. generated boards meet the productive-opportunity floor;
16. rendered tiles use logical grid start/span, not arbitrary widths.

## 15. Deployment / workflow

Development continues in `feature/wordy-game`.

The playable Wordy page remains part of the existing Classroom Online Games site. Development code is promoted to the live COG Wordy route only when the user asks to review the current build online.

Do not create alternate hosting, githack mirrors, Vercel previews, Codespaces requirements, or local-download workflows for the user.

## 16. Superseded prototype decisions

This design explicitly replaces:

- “only productive swaps are interactable” with “all geometrically valid swaps can be attempted; non-productive attempts rebound”;
- arbitrary free-width flex tiles with discrete 1–4 span tiles on a 12-column microgrid;
- equal-cell row/column assumptions with tile footprints on a microgrid;
- ordinary single-cell gravity with rigid multi-cell block gravity.

Any older Wordy document or handoff statement that contradicts this specification is stale and must not override this document.
