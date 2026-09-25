# Wordy — Current Implementation Handoff

**Updated:** 2026-09-24  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Development branch:** `feature/wordy-game`  
**Uniform-cell verification commit:** `34bc8585ca681e842d79256b8153f8c528c4f84b`  
**Current production commit (`main`):** `deec8182b1c8aa011de693125b0e51b0103d7d5b`  
**New spec:** `docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md`  
**New plan:** `docs/superpowers/plans/2026-09-22-wordy-uniform-cell-candy-rebuild.md`  
**Uniform-cell ledger:** `docs/superpowers/progress/2026-09-22-wordy-uniform-cell-candy-rebuild.md`  
**Gameplay-density plan:** `docs/superpowers/plans/2026-09-24-wordy-gameplay-density-repair.md`  
**Gameplay-density ledger:** `docs/superpowers/progress/2026-09-24-wordy-gameplay-density-repair.md`  
**POP/A-AN plan:** `docs/superpowers/plans/2026-09-24-wordy-pop-loop-and-indefinite-article.md`  
**POP/A-AN ledger:** `docs/superpowers/progress/2026-09-24-wordy-pop-loop-and-indefinite-article.md`  
**Visible-gravity plan:** `docs/superpowers/plans/2026-09-25-wordy-visible-gravity-and-keep-phrases.md`  
**Visible-gravity ledger:** `docs/superpowers/progress/2026-09-25-wordy-visible-gravity-and-keep-phrases.md`

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

## Vocabulary-diversity repair — development branch, 2026-09-24

User playtesting of the published density repair exposed a second generator defect: the board still repeated a small set of high-connectivity words (`A`, `TAKE`, `LOOK`, `MAKE`, `OF`, `IN`, `UP`, etc.) too often.

### Root cause

The round pool could contain 12–20 relationships, but board construction still filled 49 cells by repeatedly dealing complete relationship token bundles. Words that appear in many relationships were therefore overrepresented. The productive-move rescue step also overwrote cells with relation tokens, which could increase those repetitions further.

Measured pre-fix behavior:
- A: 18–21 unique words out of 49, average 19.6, maximum 4 copies;
- B: 19–22 unique, max 4;
- C: 21–25 unique, max 4;
- D: 19–24 unique, max 4;
- E: 23–28 unique, max 4;
- F: 21–28 unique, max 4;
- G: 25–32 unique, max 4.

Diagnostic run: `36076476886`.

### Development-branch fix

1. Unique words from the active relationship neighborhood are dealt before any word is duplicated.
2. Remaining duplicates are chosen from the least-used words rather than by replaying whole relationship bundles.
3. Normal levels cap every word at 2 copies.
4. Productive-move seeding rearranges existing words by swapping positions instead of overwriting cells with extra copies.
5. Refill rejects any candidate word that has already reached the copy cap.
6. Small test/demo banks keep adaptive copy limits only when the caller does not explicitly configure a cap.

Level diversity profiles:

| Level | Active relations | Minimum unique words | Max copies |
|---|---:|---:|---:|
| A | 24 | 34 | 2 |
| B | 24 | 34 | 2 |
| C | 26 | 36 | 2 |
| D | 26 | 36 | 2 |
| E | 28 | 38 | 2 |
| F | 28 | 38 | 2 |
| G | 32 | 40 | 2 |

### Measured post-fix boards

- A: 38–41 unique, max 2 copies, minimum 8 productive moves.
- B: 39–43 unique, max 2, minimum 8 productive moves.
- C: 41–42 unique, max 2, minimum 13 productive moves.
- D: 39–46 unique, max 2, minimum 11 productive moves.
- E: 44–48 unique, max 2, minimum 10 productive moves.
- F: 42–47 unique, max 2, minimum 12 productive moves.
- G: 49 unique words out of 49 in all three sampled boards, max 1, minimum 12 productive moves.

Measurement run: `36077378583`.

### Verification

- RED run `36076804987` failed on missing board diversity, old pool sizes, and refill copy-cap behavior.
- Final fresh verification run `36077230294`: Wordy **99/99 pass**, deployment guard pass, syntax pass.
- Verified implementation/test HEAD before diagnostic-only commits: `2411ff8bddde409c9aa06f216cd9a5f598788506`.
- Latest runtime change in that verified stack: `eb948e2ec2fa9594977fdc722af52224f6a882d0`.

### Production promotion — 2026-09-24

The vocabulary-diversity repair is now live in production.

- Production `main`: `c99b7c99a48d41a36a17d899173a02cfb78ff156`.
- Selective integration branch: `integration/wordy-vocabulary-diversity-20260924`.
- Only the four runtime files and five Wordy test files from this repair were promoted.
- Reconciled integration verification run `36079368486`: **99/99 Wordy tests pass**, deployment guard pass, syntax pass.
- Cloudflare production runs for exact SHA `c99b7c99a48d41a36a17d899173a02cfb78ff156`:
  - `36079434478` → success;
  - `36079434497` → success.
- Real Chromium canonical-route verification run `36079518269` → success with marker `LIVE_WORDY_VOCABULARY_DIVERSITY_OK`.
- Live Level A measurement: 49 tiles, 24 active relations, **36 unique words**, max **2 copies**.
- Live Level G measurement: 49 tiles, 32 active relations, **49 unique words**, max **1 copy**.

Canonical production route:

`https://classroom-online-games.pages.dev/Wordy/`

## Manual POP lifecycle + A/AN repair — development branch, 2026-09-24

This section supersedes any earlier wording that implied a POP could end a round because a score target was reached.

### Authoritative gameplay loop

`swap → READY relationship(s) → optional additional setup → POP → remove READY tiles → vertical gravity → top refill → automatic cascades → stable board → continue`

Rules:

- READY relationships remain on the board until the player presses POP.
- POP is global and resolves every READY relationship together.
- POP costs no movement.
- POP does **not** end a round while movements remain.
- Reaching a score target early does **not** end a round.
- The movement budget is the round clock.
- The final accepted move may leave READY relationships at `movesLeft = 0`.
- At zero moves, no further swaps are allowed, but POP remains enabled if READY exists.
- That final free POP resolves removal, gravity, refill and cascades.
- Only after the final POP is complete is the result evaluated against the objective.

### Indefinite article tile

There is one physical indefinite-article tile: `A`.

The board never needs a separate `AN` tile.

A validated relationship may retain grammatical surface token `AN`, for example:

`HAVE AN OPINION`

When the physical `A` tile forms that READY relationship:

- matcher accepts it as `AN`;
- board state remains `word: 'A'`;
- the READY tile renders as `AN`;
- review/relationship text remains `HAVE AN OPINION`;
- after the match is gone, the physical tile model remains the canonical `A` vocabulary rule.

Generator connectivity, coverage and board vocabulary plus refill all canonicalize `AN → A`.

The curated relationship bank now includes `collocation:have-an-opinion`.

### Verification

Final branch verification run: `36097367881`.

- Wordy test suite: **109/109 pass**.
- Production deploy guard: **1/1 pass**.
- Syntax check: pass.
- Verified runtime commit: `4e24d924f636709bf4b857fc7f7827a4058e1282`.

Key regressions prove:

- physical A matches grammatical AN;
- READY HAVE AN OPINION visually changes A to AN;
- refill never creates a physical AN tile;
- an early score target cannot finish the round while moves remain;
- zero moves disables swaps but preserves final POP;
- final POP finishes only after resolving gravity/refill/cascades;
- ordinary POP destroys READY tiles, introduces new tile IDs through refill and returns to the same round when moves remain.

### Production promotion — 2026-09-25

This repair is now live in production.

- Production `main`: `5540768cd4947c89fa382133856472c2b5d24f34`.
- Selective integration branch: `integration/wordy-pop-loop-20260925`.
- Reconciled integration verification run `36183857726`: **109/109 Wordy tests pass**, production deploy guard pass, syntax pass.
- Cloudflare production deploys for exact SHA `5540768cd4947c89fa382133856472c2b5d24f34`:
  - `36184008106` → success;
  - `36184007994` → success.
- Real Chromium production verification run `36184160428` → success with marker `LIVE_WORDY_POP_LOOP_OK`.
- Live early-POP result: 3 moves before, 3 after, score 515, phase `playing`, success `null`.
- Live final-POP result: zero-move swap rejected, final POP ends in `result`, success true.
- Live article result: canonical tile `A`, relationship surface `AN`, rendered text `AN`.

Canonical production route:

`https://classroom-online-games.pages.dev/Wordy/`

## Visible gravity + KEEP phrasals — production, 2026-09-25

User playtesting exposed that the engine performed removal, gravity and refill logically, but the browser rendered only the final board. The old `timeline.mjs` changed labels without showing intermediate board states, so tiles appeared to disappear and new words appeared in place.

### Root cause

`controller.pop()` resolves the complete synchronous engine result before the UI timeline starts. Resolution generations previously contained only matches, removed IDs and scores. Because the controller subscriber also rendered the final state immediately, there was no visual state available for actual falling animation.

### Runtime repair

Each resolution generation now preserves:

- `boardBefore`;
- `boardAfterRemoval`;
- `boardAfterGravity`;
- `boardAfterRefill`.

The browser timeline now visibly plays:

`POP shrink/fade → holes → vertical gravity → refill entering from above → next cascade generation`

Details:

- READY tiles scale/fade out over 170 ms;
- surviving tiles use FLIP animation to their true post-gravity cells over 300 ms;
- refill tiles enter from above the board over 340 ms;
- cascades replay the same sequence generation by generation;
- the normal controller subscriber does not overwrite the animation DOM while `timelinePlaying` is true;
- browsers without Web Animations support still render the correct final state.

The engine rules remain unchanged: gravity is vertical only, refill uses top-of-column holes, POP costs no movement, and rounds continue while moves remain.

### Relationship bank

The curated phrasal-verb bank now includes:

- `KEEP UP` — continue at the same pace or maintain a level;
- `KEEP IN` — make someone stay indoors or remain inside.

### Verification

Branch verification:

- full Wordy suite run `36186497856` → **115/115 pass**;
- production deploy guard → pass;
- syntax check → pass.
- Chromium branch run `36186826373` → `VISIBLE_GRAVITY_BROWSER_OK`;
  - controlled survivor fall: **447.9 px**;
  - refill entry from above: **100.6–542.4 px**.

Selective production integration:

- integration branch: `integration/wordy-visible-gravity-20260925`;
- reconciled runtime commit: `deec8182b1c8aa011de693125b0e51b0103d7d5b`;
- integration verification run `36187189690` → **115/115 pass**, deploy guard pass, syntax pass;
- Cloudflare runs `36187369363` and `36187369200` → success.

Real public-browser verification:

- run `36187570728` → `LIVE_VISIBLE_GRAVITY_OK`;
- deterministic live Level A move formed `TAKE A BREAK`;
- phase after POP: `playing`;
- live removal animation recorded;
- live survivor gravity: `translate(0px,-89.5625px)` → destination;
- live refill: `translateY(-100.5625px)` → destination;
- 24 animations recorded in that POP;
- public relationship bank contained both `phrasal-verb:keep-up` and `phrasal-verb:keep-in`.

Canonical production route:

`https://classroom-online-games.pages.dev/Wordy/`

## Exact next action

Visible gravity/refill animation and KEEP UP / KEEP IN are live in production.

Do not rebuild or re-promote this repair.

The next action is user playtesting of the canonical Wordy route. Any new gameplay finding should be handled as a new change set on `feature/wordy-game`, verified there, then selectively promoted against current `main`.
