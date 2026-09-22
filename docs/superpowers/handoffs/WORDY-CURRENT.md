# Wordy — Current Implementation Handoff

**Updated:** 2026-09-22  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Development branch:** `feature/wordy-game`  
**Uniform-cell verification commit:** `34bc8585ca681e842d79256b8153f8c528c4f84b`  
**Current production commit (`main`):** `60d8d0df4b68b047dbf4e494c1542ef5f22652b3`  
**New spec:** `docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md`  
**New plan:** `docs/superpowers/plans/2026-09-22-wordy-uniform-cell-candy-rebuild.md`  
**New ledger:** `docs/superpowers/progress/2026-09-22-wordy-uniform-cell-candy-rebuild.md`

## Authoritative continuation state

The **uniform-cell Candy architecture supersedes the 12-microcolumn/span architecture** for all future Wordy development.

Do not restore or continue any of the following:

- `span`;
- `startColumn`;
- `spanForWord`;
- `tile-size.mjs`;
- rigid multi-cell gravity;
- horizontal cavity partition/refill;
- variable-width logical pieces.

The current development branch is the authoritative new prototype. Production has **not yet been updated** to this architecture.

## Canonical board model

Wordy now uses a conventional rectangular equal-cell board:

```js
{
  rows: 7,
  columns: 7,
  tiles: [
    { id, word, row, column }
  ]
}
```

Rules:

- exactly 7 rows × 7 columns for the validation prototype;
- every word occupies exactly one logical cell;
- every physical tile has identical board dimensions;
- word length affects typography only;
- no gameplay geometry depends on character count;
- a stable board has exactly 49 occupied cells.

## Candy-style swap behavior

A player may attempt one orthogonally adjacent pair:

- left;
- right;
- up;
- down.

Rules:

- no diagonal swaps;
- no jumps;
- no footprint matching;
- every in-bounds orthogonal neighbor is geometrically swappable;
- a productive swap remains and spends exactly one move;
- a nonproductive valid swap animates forward and rebounds;
- rebound changes no canonical board state, move count, score, or ready relationship state.

## Matching

Relationships are straight contiguous ordered cell sequences.

### Horizontal

Tokens occupy consecutive columns in one row.

### Vertical

Tokens occupy consecutive rows in one column.

### Crossings

A physical tile can belong simultaneously to one horizontal and one vertical relation. Shared tiles are removed physically once while all valid relationships score.

Runtime linguistic validity still comes only from the curated relationship bank. There is no live LLM judge.

## POP, gravity, refill, and cascades

Global POP is preserved.

- all ready relationships resolve together;
- POP costs no extra move;
- shared crossing tiles are removed once;
- survivors fall vertically within their original column;
- survivors never move laterally;
- each column is compacted downward;
- all empty cells after gravity are at the top of columns;
- refill creates new one-cell tiles in those top cells;
- cascade-created relationships auto-resolve until the board stabilizes;
- dead-board recovery does not spend a move.

## Relationship-aware refill

Refill no longer chooses a word because it fits a physical width.

The refill system now:

1. builds a weighted bag from approved relationship tokens;
2. evaluates candidate words against the local post-gravity board;
3. rewards immediate valid relations;
4. rewards one-swap opportunities;
5. rewards adjacency to tokens from the same approved relationship;
6. penalizes excessive duplicate words;
7. selects between cascade, opportunity, and distractor buckets.

Current prototype bucket weights:

```js
{
  cascadeWeight: 0.18,
  opportunityWeight: 0.57,
  distractorWeight: 0.25
}
```

These are tuning values, not final game balance.

## Initial board generation

Generated boards are 7×7 equal-cell boards drawn from the approved relationship vocabulary.

The generator rejects boards that do not meet the configured constraints:

- full 49-cell occupancy;
- no starting relationship when `allowStartingMatches === false`;
- minimum productive swap count;
- productive swaps distributed across multiple rows;
- productive swaps distributed across multiple columns;
- bounded duplicate words.

Authored tutorial boards A–G remain available.

## UI

The board is a 7×7 CSS Grid.

- all tiles have equal dimensions;
- `row` and `column` are the only placement coordinates;
- long words use smaller typography classes:
  - `text-medium`;
  - `text-long`;
  - `text-xlong`;
- typography never changes tile dimensions;
- tap/swipe input resolves ordinary orthogonal neighbors;
- accepted swap animation and rejected rebound animation are preserved;
- replay snapshots also use row/column geometry.

## Verification

Fresh GitHub Actions evidence for the uniform-cell rebuild:

- Task 1 board geometry: run `35780923806` → **11/11 pass**.
- Task 2 matcher/controller/review: run `35781756441` → **16/16 pass**.
- Task 3 column gravity/top refill: run `35781460040` → **10/10 pass**.
- Task 4 relationship-aware generation/refill: run `35782238263` → **16/16 pass**.
- Task 5 equal-cell UI: run `35782473487` → **20/20 pass**.
- Task 6 full integration: run `35794985695` on exact runtime commit `34bc8585ca681e842d79256b8153f8c528c4f84b`:
  - `node --test Wordy/tests/*.test.mjs` → **90/90 pass**;
  - failures: **0**;
  - `node --check Wordy/app.mjs` → exit 0.

The final integration tests verify:

- Level A 7×7 load;
- a nonproductive adjacent swap rebounds without spending a move;
- WENT ↔ AFTER is accepted;
- LOOK AFTER becomes ready;
- POP resolves it;
- the stable board returns to 49 occupied cells;
- the round either finishes or remains playable;
- generated boards expose at least four productive swaps across at least three rows and three columns;
- `tile-size.mjs` is absent;
- runtime code contains no `startColumn`, `spanForWord`, or `partitionRun` geometry.

## Review status

Superpowers final review was performed as a self-review because this harness exposes no reviewer subagent and the installed skill package does not include the requested `code-reviewer.md` resource.

No Critical or Important findings remained after the full-suite gate.

## Publication state

The new uniform-cell runtime is **not yet on production**.

Current production still serves the earlier 12-microcolumn runtime at:

`https://classroom-online-games.pages.dev/Wordy/`

Do not use the current production page to judge the new 7×7 implementation until it is explicitly promoted.

Do not use:

- githack;
- Vercel;
- alternate preview mirrors;
- user-local downloads as the normal review path.

When publication is explicitly authorized, promote only the reviewed Wordy runtime needed for the new prototype, then verify the exact production SHA and canonical Cloudflare route.

## Exact next action

The implementation plan is complete on `feature/wordy-game`.

Next step is an integration decision:

- keep the branch for additional development/playtesting; or
- promote the new Wordy runtime to `main` and Cloudflare, followed by a live canonical-route check.

Do not rebuild Tasks 1–6.
