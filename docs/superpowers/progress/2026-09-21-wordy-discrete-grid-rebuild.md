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
