# SDD ledger — plan: docs/superpowers/plans/2026-09-22-wordy-uniform-cell-candy-rebuild.md

Spec: docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md

Execution method: inline/native with Superpowers executing-plans.

Pre-flight:
- Task 1 produces {row,column} board geometry consumed by Tasks 2–6: aligned with spec.
- Task 2 matcher/controller consumes Task 1 geometry and preserves accepted/rebound semantics: aligned.
- Task 3 resolution consumes column gravity from Task 1 and produces top-of-column refill requests consumed by Task 4: aligned.
- Task 4 refill/generator produces equal-cell boards consumed by Task 5 rendering and Task 6 E2E: aligned.
- Task 5 UI consumes row/column only; Task 6 removes all remaining span-era runtime identifiers: aligned.
- Ruling: staged migration means legacy full-suite tests will intentionally remain red until Task 6; Tasks 1–5 use their focused plan suites as completion gates, then Task 6 requires the full suite green. Cost if wrong: a cross-module regression could surface later than its originating task, so Task 6 must not be skipped.

Branch-only CI workflow is temporary and will be removed after final branch verification.

Task 1: complete (tests RED on 42f8cfc: missing equal-cell board API; GREEN on 589f409: node --test Wordy/tests/board.test.mjs → 11/11 pass; node --check Wordy/app.mjs → exit 0; GitHub Actions run 35780923806).
Task 1: Ruling: helpers.mjs required no Task 1 change because boardFromTiles already clones arbitrary tile records; uniform row/column fixtures work without geometry-specific logic. Cost if wrong: later focused tests expose the helper mismatch before production code is accepted.
