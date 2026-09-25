# Wordy — Current Implementation Handoff

**Updated:** 2026-09-24  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Development branch:** `feature/wordy-game`  
**Uniform-cell verification commit:** `34bc8585ca681e842d79256b8153f8c528c4f84b`  
**Current production commit (`main`):** `9c3677b595dd7d082cfa29b19cad408738f982bc`  
**New spec:** `docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md`  
**New plan:** `docs/superpowers/plans/2026-09-22-wordy-uniform-cell-candy-rebuild.md`  
**Uniform-cell ledger:** `docs/superpowers/progress/2026-09-22-wordy-uniform-cell-candy-rebuild.md`  
**Gameplay-density plan:** `docs/superpowers/plans/2026-09-24-wordy-gameplay-density-repair.md`  
**Gameplay-density ledger:** `docs/superpowers/progress/2026-09-24-wordy-gameplay-density-repair.md`

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

The uniform-cell implementation is now both the authoritative development architecture and the production Wordy runtime.

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

Current development-branch refill weights:

```js
{
  cascadeWeight: 0.15,
  opportunityWeight: 0.70,
  distractorWeight: 0.15
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

On the current development branch, normal levels A–G are generated from connected active relationship neighborhoods; the old filler-heavy authored A–G boards are superseded.

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

The uniform-cell 7×7 runtime is now **live on production**.

- Integration was reconciled against current `main` on temporary branch `integration/wordy-uniform-cell-20260924`.
- Reconciled integration verification run `36007289820`: **90/90 pass**, syntax check pass, production packaging contract pass.
- Runtime/content merge commit on `main`: `1a0840da6942e55d4483392e95dbb83c3c420edf`.
- Both production workflows for that exact SHA succeeded:
  - `36007480279` (`.github/workflows/deploy-cloudflare-pages.yml`) → success.
  - `36007480106` (`.github/workflows/cloudflare-pages-main.yml`) → success.
- Cloudflare preview deployments included `https://859b7213.classroom-online-games.pages.dev` and `https://f57ffd62.classroom-online-games.pages.dev`.
- Canonical-route live verification run `36007849032` → **success**.
- The live check confirmed:
  - `/Wordy/` loads the Wordy module entrypoint;
  - live `engine/board.mjs` contains the row/column uniform-cell runtime;
  - live CSS uses `repeat(7`;
  - the legacy `spanForWord` engine is not being served (Cloudflare's missing-file fallback can return HTTP 200, so validation is content-based rather than status-code-based).

Canonical production route:

`https://classroom-online-games.pages.dev/Wordy/`

Do not use:

- githack;
- Vercel;
- alternate preview mirrors;
- user-local downloads as the normal review path.

## Production load incident and fix — 2026-09-24

A real-browser check after publication revealed that the canonical `/Wordy/` route could disappear even though both Cloudflare workflows reported success.

Root cause:

- two workflows deploy the same Cloudflare Pages project/production branch on every push to `main`;
- `.github/workflows/cloudflare-pages-main.yml` included `Wordy` in its `dist/` bundle;
- `.github/workflows/deploy-cloudflare-pages.yml` omitted `Wordy`;
- on production commit `8ee661778fda769dd0f0300870952b870b81aa5f`, the workflow that omitted Wordy finished **5 seconds later** and overwrote the production deployment;
- Chromium reproduction then loaded the Classroom Online Games landing page at `/Wordy/`, with title `Classroom Online Games`, 0 Wordy tiles, and no `window.WordyPrototype`.

Fix:

- added `Wordy` to the game-bundle copy command in `.github/workflows/deploy-cloudflare-pages.yml`;
- added `tests/wordy-production-deploy.test.mjs` so every production workflow that deploys the `classroom-online-games` Pages project must include Wordy in its main game-bundle copy command;
- RED verification run `36014788447` failed on the missing Wordy deployment entry;
- GREEN verification run `36014983439` passed after the workflow fix;
- production fix commit: `9c3677b595dd7d082cfa29b19cad408738f982bc`;
- both production deploy workflows for that exact SHA completed successfully: `36015084363` and `36015084423`;
- real Chromium verification run `36015218041` confirmed HTTP 200, title `Wordy Prototype`, **49 tiles**, level `A · First Move`, `window.WordyPrototype === true`, and **0 browser errors**.

The canonical route is therefore currently verified as loading the actual Wordy game:

`https://classroom-online-games.pages.dev/Wordy/`

## Gameplay-density repair — development branch, 2026-09-24

User playtesting showed that the first published 7×7 version was technically functional but did not implement the already-approved content-generation experience: boards exposed too few productive swaps, filler vocabulary made validity feel arbitrary, and early rounds ended too quickly.

The repair is implemented and verified on `feature/wordy-game`, but is **not yet on production**.

### Current branch behavior

- all normal A–G levels are generated;
- Level A: 18 moves, score target 900, 12 active relationships, minimum 8 productive swaps;
- Level B: 20 moves, score target 1100, 14 active relationships, minimum 8 productive swaps;
- Level C: 22 moves, score target 1400, 16 active relationships, minimum 10 productive swaps;
- Level D: 22 moves, score target 1500, 16 active relationships, minimum 10 productive swaps;
- Level E: 24 moves, score target 1700, 18 active relationships, minimum 10 productive swaps;
- Level F: 24 moves, score target 1900, 18 active relationships, minimum 10 productive swaps;
- Level G: 26 moves, score target 2300, 20 active relationships, minimum 12 productive swaps;
- every generated level requires at least 4 productive rows, 4 productive columns, and relationship coverage >= 0.85;
- relationship pools are graph-connected; the selector may not pad a small component with unrelated relations;
- the controller rejects an unproductive candidate neighborhood before display and retries another one;
- refill is restricted to the same active relationship neighborhood for the entire round;
- runtime validity is also restricted to the same active round bank; relations that exist globally but are not active in the round do not score or become ready;
- after POP, a sparse board is regenerated at no extra move cost using the same active neighborhood;
- nonproductive swaps rebound with `NO MATCH`.

This directly supersedes the filler-heavy A–F board behavior from the first 7×7 publication.

### Validity rule

V1 still uses the curated relationship bank, not unrestricted grammar.

For example, `BAD HABIT` is an approved collocation in the bank. A grammatically possible or compositional phrase is not automatically a Wordy relationship merely because two English words can occur together. The repair addresses the UX problem by preventing arbitrary filler and keeping each board inside a coherent connected relationship neighborhood rather than by turning runtime validity into an open-ended grammar judge.

### Verification

Final fresh branch verification:

- run `36064806265`;
- `node --test Wordy/tests/*.test.mjs` → **97/97 pass**;
- root production-deploy regression → **1/1 pass**;
- `node --check Wordy/app.mjs` → pass.

Review-specific RED/GREEN regressions also prove:

- global-bank relationships cannot leak into round validity;
- 12–20 relation pools remain graph-connected;
- Level A starts with >=8 productive swaps;
- Level G starts with >=12;
- POP/recovery keeps the same active neighborhood, restores 49 cells, scores, and spends no extra move.

Verified implementation/test HEAD before documentation-only commits: `dd5aaecbb039b87cb2115e9b3b3cc76aa980bb54`.
Latest runtime change in that verified stack: `526a2ee75a87d38e8298e232da8eec732aee4c01`.

### Production promotion — 2026-09-24

The gameplay-density repair is now published.

- Current production `main` commit: `852774b163c61e72b3210a35f985a757f0152bc7`.
- Integration branch used for selective reconciliation: `integration/wordy-density-20260924`.
- The integration started from the then-current `main` commit `4e6b9831d9ffc7a7510e0e1512b98018f284987a`.
- Only the four Wordy runtime files and five Wordy test files from this repair were promoted; unrelated changes from the diverged feature branch were not merged.
- Reconciled integration verification run `36075979198`:
  - `node --test Wordy/tests/*.test.mjs` → **97/97 pass**;
  - production deploy guard → pass;
  - `node --check Wordy/app.mjs` → pass.
- Production deployment runs for exact SHA `852774b163c61e72b3210a35f985a757f0152bc7`:
  - `36076082167` → success;
  - `36076082190` → success.
- Canonical live verification run `36076204533` → success with marker `LIVE_WORDY_DENSITY_OK`.
- The live check fetched the canonical `/Wordy/` route plus `data/levels.mjs`, `engine/controller.mjs`, and `engine/generator.mjs`, and confirmed:
  - `Wordy Prototype` is served;
  - Level A is live with 18 moves / 900 target / pool 12 / minimum 8 productive swaps;
  - Level G is live with 26 moves / 2300 target / pool 20 / minimum 12 productive swaps;
  - `activeRelationshipIds` and `roundBank` are live;
  - `selectRelationshipNeighborhood` and `buildRelationGraph` are live.

Canonical production route:

`https://classroom-online-games.pages.dev/Wordy/`

## Exact next action

The uniform-cell architecture and gameplay-density repair are both live in production.

Do not rebuild or re-promote this repair.

The next action is user playtesting of the canonical Wordy route. Any new gameplay findings should be treated as a new change set on `feature/wordy-game`, documented in GitHub, verified on the branch, then selectively promoted against current `main`.
