# SDD ledger — plan: docs/superpowers/plans/2026-09-20-wordy-validation-prototype.md

Execution method: inline/native.

Setup Ruling: This ChatGPT environment has GitHub connector access but no authenticated private-repository checkout/worktree. Use an ephemeral local sandbox to execute RED/GREEN Node tests, publish complete files to `feature/wordy-game` through GitHub, and keep this tracked GitHub ledger as the durable execution record. Cost if wrong: local test state could diverge from published files, so each task must fetch/check the published GitHub content before being marked complete.

Pre-flight interfaces:
- Task 1 -> Task 3/4/5/6/7/8/11: RelationshipBank signatures align with the plan.
- Task 2 -> Task 3/5/6/7/11: Board representation and immutable helpers align with consumers.
- Task 3 -> Task 4/5/7/10/11: Match shape and crossing detection align.
- Task 4 -> Task 5/8/11: Score breakdown interface aligns.
- Task 5 -> Task 7/11: ResolutionResult aligns.
- Task 6 -> Task 7/8/11: generation/move interfaces align.
- Task 7 -> Task 11: level/objective interfaces align.
- Task 8 -> Task 11: review/telemetry interfaces align.
- Task 9 -> Task 11: input emits complete swap cell pairs; controller owns validation.
- Task 10 -> Task 11: renderer consumes controller state and stable DOM hooks.
Pre-flight: no blocking interface conflicts found.

Task 1: complete.
- RED: `node --test Wordy/tests/relationship-bank.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/data/relationships.mjs`, as expected before implementation.
- GREEN: `node --test Wordy/tests/relationship-bank.test.mjs` -> 3 tests, 3 pass, 0 fail.
- Verification: relationship bank exports exactly 85 relationships.
- Commits: 5c40345 (test), 793cd1f (helpers), 2f94b55 (bank index), 265ca2f (curated data).
- Published files fetched from GitHub after write and matched the locally verified source.

Task 2: complete.
Ruling: Added direct tests for `collapseColumns` and `boardKey` because they are public Task 2 outputs but the original plan examples did not exercise them. Cost if wrong: slightly more test maintenance; behavior remains within the approved spec.
- RED: `node --test Wordy/tests/board.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/board.mjs`, as expected.
- GREEN/regression: `node --test Wordy/tests/board.test.mjs Wordy/tests/relationship-bank.test.mjs` -> 9 tests, 9 pass, 0 fail.
- Commits: 9558da8 (board tests), 5df2944 (immutable board model).

Task 3: complete.
- RED: `node --test Wordy/tests/matcher.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/matcher.mjs`, as expected.
- GREEN/regression: relationship-bank + board + matcher suites -> 14 tests, 14 pass, 0 fail.
- Commits: 8825b1c (matcher tests), ef39d00 (matcher/crossing engine).

Task 4: complete.
- RED: `node --test Wordy/tests/scoring.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/scoring.mjs`, as expected.
- GREEN/regression: `node --test Wordy/tests/*.test.mjs` -> 19 tests, 19 pass, 0 fail.
- Commits: 1942c7a (scoring tests), aef058c (scoring engine).

Task 5: complete.
- RED: `node --test Wordy/tests/resolution.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/resolution.mjs`, as expected.
- GREEN/regression: `node --test Wordy/tests/*.test.mjs` -> 25 tests, 25 pass, 0 fail.
- Commits: 1c78abc (resolution tests), e9bc2f3 (global pop/cascade engine).

Task 6: complete.
Ruling: Immediate scoring moves count only relationships newly created by the swap; preserving an already-ready relationship elsewhere does not make the swap a scoring move. This prevents false live-board signals. Cost if wrong: opportunity counts would be stricter than intended.
- RED: `node --test Wordy/tests/generator.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/generator.mjs`, as expected.
- GREEN/regression: `node --test Wordy/tests/*.test.mjs` -> 31 tests, 31 pass, 0 fail.
- Commits: cb37c32 (generator tests), 7f2b011 (generator/dead-board engine).

Task 7: complete.
- RED: `node --test Wordy/tests/levels.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/data/levels.mjs`, as expected.
- GREEN/regression: `node --test Wordy/tests/*.test.mjs` -> 39 tests, 39 pass, 0 fail.
- Verified fixtures: A creates LOOK AFTER, C creates 2 simultaneous relationships, D cascades LOOK AFTER -> TAKE A BREAK, E creates AS A MATTER OF FACT, F creates a crossword, G has at least 2 immediate scoring moves.
- Commits: 052d5e4 (level tests), 5cec71c (level fixtures/objectives).

Task 8: complete.
- RED: `node --test Wordy/tests/review-telemetry.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/engine/review.mjs`, as expected.
- GREEN/regression: review/telemetry tests 6/6; full local Wordy suite 45 tests, 45 pass, 0 fail.
- Commits: e3f0e1d, 8f12604, f72c716.

Task 9: complete.
- RED: `node --test Wordy/tests/input.test.mjs` failed with ERR_MODULE_NOT_FOUND for `Wordy/ui/input.mjs`, as expected.
- GREEN/regression: input tests 6/6; full local Wordy suite 51 tests, 51 pass, 0 fail.
- Commits: b1f7a4d (input tests), 26bed42 (input module).

Task 10: complete.
- RED: initial UI contract failed with ERR_MODULE_NOT_FOUND for `Wordy/ui/render.mjs`.
- Regression RED found before publish: realistic DOM `textContent` semantics proved review-card child markup was being erased; test failed 0 !== 2.
- GREEN: removed the destructive container `textContent` assignment; UI tests 4/4 and full local Wordy suite 55 tests, 55 pass, 0 fail.
- Commits: 936da1a, 9249cef, 08bc1d1, 8ebaa1e.

Task 11: in progress.
