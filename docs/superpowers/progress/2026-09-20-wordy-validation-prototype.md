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

Task 4: in progress.
