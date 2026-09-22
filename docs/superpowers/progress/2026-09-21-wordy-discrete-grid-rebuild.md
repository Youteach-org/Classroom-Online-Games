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
