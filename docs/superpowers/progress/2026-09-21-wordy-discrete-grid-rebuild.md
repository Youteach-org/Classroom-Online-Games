# Wordy discrete-grid rebuild progress

**Plan:** `docs/superpowers/plans/2026-09-21-wordy-discrete-grid-candy-swap.md`  
**Spec:** `docs/superpowers/specs/2026-09-21-wordy-discrete-grid-swap-architecture.md`  
**Branch:** `feature/wordy-game`

## Execution ledger

- Setup: no private-repo checkout is mounted in the harness. Implementation is tested in an isolated temporary Git repository reconstructed from the GitHub branch; GitHub remains the source of truth.
- Baseline before Task 1: `node --test Wordy/tests/board.test.mjs` → 6/6 pass.
- Pre-flight: Task 1 listed `settleGravity` as a produced interface while Task 5 owns its implementation and tests.
- **Task 1 ruling:** defer `settleGravity` to Task 5. Tasks 2–4 do not consume it, and implementing it in Task 1 would introduce untested behavior. Cost if wrong: Task 2–4 would need an earlier gravity interface; current plan does not.
- Task 1 RED: board tests failed with `ERR_MODULE_NOT_FOUND` for the new `tile-size.mjs`, confirming the new geometry did not exist.
- **Task 1 complete:** discrete 12-column board authority, deterministic spans 1–4, occupancy map, tile-ID lookup, horizontal/vertical swap-neighbor rules, directional lookup, immutable tile swaps, removal, empty-run detection, and geometry key. Final focused verification: **11/11 pass**.
- Task 1 GitHub commits: `e6defe6`, `34e4e61`, `efbc3df`, `69073b8`.

- Task 2 RED: matcher/scoring suite produced 6 expected failures because the old matcher still addressed matrix cells and crossing identity used cells.
- **Task 2 complete:** horizontal touching-sequence matching, mixed-span vertical matching through a shared microcolumn, vertical deduplication across wide lanes, containment suppression, crossing identity by shared tile ID, and scoring length by `tileIds`. Final focused verification: **12/12 pass**.
- Task 2 GitHub commits: `0d8ba7f`, `7406e89`, `978449e`, `6da3c4a`.

- Task 3 RED: after migrating matcher identity, the old generator failed to import removed `cellKey`; this correctly exposed its matrix-cell dependency.
- **Task 3 complete:** geometric tile-ID swap enumeration, productive move discovery, 12-column controlled generation, minimum 4 productive swaps across at least 3 rows, dead-board recovery, and all A–G authored fixtures packed to 12 microcolumns. Final focused verification: **13/13 pass**.
- Task 3 GitHub commits: `edb0af5`, `9e63daf`, `170caa9`, `4bc70a8`.

- **Task 4 ruling:** the old controller statically imported the matrix-based resolution engine, so controller tests could not load after Tasks 1–3. Task 4 temporarily decoupled POP while migrating swap/state/review to tile IDs; Task 5 immediately reconnected POP to the new resolver. No compatibility matrix API was reintroduced.
- Task 4 RED: new tests required `attemptSwap(fromTileId,toTileId)` with `invalid/rebound/accepted`; the old controller exposed only cell-based `swap(from,to)` and review snapshots used row matrices.
- **Task 4 complete:** Candy-style rebound semantics, accepted productive swaps, unchanged canonical state/moves on rebound, tile-centric missed-opportunity snapshots, and rebound telemetry. Focused verification: **10/10 pass**.
- Task 4 GitHub commits: `826aa9c`, `8b6b72d`, `7a14ba6`, `e321337`.
- **Task 5 test correction:** the original 3-row partial-support example allowed the support tile itself to fall, changing the condition being tested. The regression uses 2 rows so the support is immovable at the bottom and isolates the intended rigid-footprint rule.
- Task 5 RED: missing `settleGravity`, `partitionRun`, `refillEmptyRuns`; old resolver still imported removed matrix helpers; controller POP was intentionally disconnected after Task 4.
- **Task 5 complete:** rigid multi-cell gravity, exact empty-run partition/refill, tile-ID removal, crossing-safe POP, cascade detection, span-aware refill words, and controller POP/recovery reconnection. Focused verification: **25/25 pass**.
- Task 5 GitHub commits: `ba45044`, `1769705`, `c07bc80`, `e6ebcd4`, `b6f234c`, `89f7c94`.

- Task 6 RED: tile-ID tap/swipe requests were empty under the cell-based input, CSS still used flex rows, and renderer attempted `state.board.forEach` on the new board object.
- **Task 6 complete:** one 12×7 CSS Grid, direct tile placement from `row/startColumn/span`, ready/cross highlighting by `tileIds`, and tap/swipe input resolved through board geometry callbacks. Focused verification: **7/7 pass**.
- Task 6 GitHub commits: `2896008`, `ff9fd87`, `565ae01`, `e467006`, `bd63c53`.

- Task 7 RED: `swap-animation.mjs` did not exist and `app.mjs` still routed input through the old non-animated path.
- **Task 7 complete:** accepted swaps use FLIP from pre-swap to rendered geometry, rejected productive attempts animate forward and rebound, interaction is locked during swap motion, and Web Animations absence degrades safely. Focused verification: **13/13 pass** plus `node --check Wordy/app.mjs` exit 0.
- Task 7 GitHub commits: `32beeed`, `3fbab8d`, `b9f562b`.

- **Task 8 complete:** missed-opportunity replay now renders from saved `rows/columns/tiles` geometry, suggested replay tiles are identified by tile ID, the miniature board uses the same 12-column grid model, and stale cell/matrix test fixtures were removed.
- Task 8 stale-assumption sweep: no remaining `board[`, `.cells`, test `col:`, or `repeat(5` hits in Wordy engine/UI/tests.
- Task 8 final verification reconstructed from feature HEAD `ba29f1c9`: `node --test Wordy/tests/*.test.mjs` → **86/86 pass**; `node --check Wordy/app.mjs` → exit 0.
- Task 8 GitHub commits: `28fef34`, `4bbc3dd`, `19128c8d`, `ba29f1c9`.

- **Task 9 complete:** added an end-to-end Level A gameplay regression covering rebound, accepted WENT ↔ AFTER swap, one-move cost, LOOK AFTER ready state, POP, rigid gravity/refill, full 84-microcell occupancy, and post-resolution playability/objective completion.
- Task 9 generated-board gate additionally verifies spans 1–4, in-bounds geometry, no empty stable microcells, at least four immediate productive swaps, and productive swaps across at least three rows.
- Task 9 verification before documentation: `node --test Wordy/tests/*.test.mjs` → **88/88 pass**; `node --check Wordy/app.mjs` → exit 0.
- Task 9 handoff cleanup: `WORDY-CURRENT.md` now makes the discrete 12×7 architecture the sole continuation authority and removes/supersedes productive-only swap, local-only, githack-preview, and stale PR #46 guidance.
- Task 9 GitHub commits: `1a8e54f` (end-to-end gameplay regression), `ad85fd5` (authoritative handoff).
- **Task 10 complete:** user explicitly authorized production publication on 2026-09-22.
- Task 10 fresh pre-promotion verification used temporary workflow `Wordy Task 10 Verify`, run `35768528716`, commit `3c6d594f`: `node --test Wordy/tests/*.test.mjs` → **88/88 pass, 0 fail**; `node --check Wordy/app.mjs` → exit 0.
- Promotion was built as one atomic commit from `main` parent `339d5c53`, copying only verified `Wordy/index.html`, `Wordy/app.mjs`, `Wordy/styles.css`, `Wordy/data/**`, `Wordy/engine/**`, and `Wordy/ui/**` blobs from the feature tree.
- Pre-ref update compare showed exactly one commit ahead and only Wordy runtime changes; no docs/tests/devcontainer/unrelated feature history entered `main`.
- Production commit: `60d8d0df4b68b047dbf4e494c1542ef5f22652b3` — `feat(wordy): promote discrete-grid runtime`.
- Existing Cloudflare workflow run `35768686972` completed **success** for exact production SHA `60d8d0df`; Wrangler deployed project `classroom-online-games` and reported `https://867f3ab8.classroom-online-games.pages.dev`.
- Canonical-route verification used temporary workflow `Wordy Task 10 Live Check`, run `35768813699`, which completed **success** after fetching `https://classroom-online-games.pages.dev/Wordy/`, `engine/tile-size.mjs`, and `styles.css`, confirming `spanForWord` and 12-column grid markers.
- Temporary Task 10 workflows were removed from `feature/wordy-game` after verification.
- **Discrete-grid plan Tasks 1–10 complete.**

- Final review: self-review (no subagent tool available in this harness). Reviewed the production promotion against the plan's five Review Focus risks and the atomic main diff. No Critical or Important findings remained: rigid gravity requires the full footprint below to be clear; mixed-span vertical matching scans shared microcolumns and deduplicates by relationship/orientation/tile IDs; rebound exits before canonical state mutation; cavity refill partitions exact horizontal empty runs; production diff contains only Wordy runtime files.
- Final verification evidence: pre-promotion workflow `35768528716` → **88/88 pass** plus syntax exit 0; Cloudflare run `35768686972` → **success** for exact main SHA `60d8d0df`; live canonical-route run `35768813699` → **success**.
