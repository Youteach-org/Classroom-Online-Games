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

Task 2: Ruling: Task 3 resolution migration executed before Task 2 controller completion because controller statically imports resolution and Task 1 removed refillEmptyRuns; this preserves the spec/interfaces while restoring a loadable dependency. Cost if wrong: commit order differs from the plan, but Task 6 full-suite verification catches cross-module regressions.
Task 2: complete (RED fc1ffb8/35781189000 on span-era matcher and stale resolution dependency; matcher GREEN in 35781301374; controller/review GREEN on 5ec8062, GitHub Actions run 35781756441: 16/16 pass; node --check Wordy/app.mjs → exit 0).
Task 3: complete (RED d61da80/35781372286 on stale refillEmptyRuns import; GREEN on 12f3aa2, GitHub Actions run 35781460040: 10/10 pass; node --check Wordy/app.mjs → exit 0).


Task 4: complete (RED on d55708b / workflow run 35782001151 for relationship-aware generation/refill; GREEN on 647e167, workflow run 35782238263: 16/16 pass; node --check Wordy/app.mjs → exit 0).
Task 4: refill now uses a weighted approved-relationship bag, local placement scoring, cascade/opportunity/distractor buckets, and 7×7 generated-board productivity constraints across rows and columns.

Task 5: complete (RED on a8dc74b / run 35782380697 for equal-tile UI contract; intermediate render commit c6ae826 remained red in run 35782457264; GREEN on d259a01, workflow run 35782473487: 20/20 pass; node --check Wordy/app.mjs → exit 0).
Task 5: UI now renders a uniform 7×7 CSS Grid; word length changes typography class only, never tile geometry.

Task 6: complete.
- Full-suite migration RED at a7fb23d / run 35794832988: 87/89 pass; the only two failures were the legacy 12×7 integration tests.
- Rewritten 7×7 E2E + legacy-engine guard at 624216e / run 35794850820: 89/90 pass; only expected failure was retained tile-size.mjs.
- Removed tile-size.mjs at ac5bb4a; run 35794923328: 89/90 pass; only remaining failure was the stale local scanner variable name startColumn in matcher.mjs.
- Renamed that last legacy term at 34bc858; run 35794985695: node --test Wordy/tests/*.test.mjs → 90/90 pass, 0 fail; node --check Wordy/app.mjs → exit 0.
- Final runtime guard proves tile-size.mjs is absent and production runtime source contains no startColumn, spanForWord, or partitionRun geometry.

Final review: self-review (no subagent tool available; code-reviewer.md is not present in the installed skill package).
Final review focus:
- equal-cell geometry and four-direction adjacency: covered by board + integration tests;
- rebound preserves canonical board/moves/ready state: covered by controller tests;
- gravity is vertical-only and stable columns contain no holes: covered by board/resolution/E2E tests;
- refill prefers local linguistic usefulness but still permits distractors: covered by refill tests;
- generated boards are full, start match-free when required, and meet distributed productive-swap floors: covered by generator/E2E tests;
- long words use typography classes without changing tile dimensions: covered by UI contract tests.
Final review: no Critical or Important findings remained.
Publication: intentionally not performed by this plan; main/Cloudflare remain unchanged until an explicit integration/publish decision.

Production integration (2026-09-24): complete.
- Direct feature→main merge was deliberately not used because the feature branch had diverged substantially from current main (122 commits ahead / 100 behind at reconciliation time).
- Built temporary integration branch `integration/wordy-uniform-cell-20260924` from current main `d0a769ca2d27398eddb3f2d3f414bdf7b2e29ab7`.
- Overlaid only Wordy runtime/tests and the uniform-cell Wordy documentation; removed legacy `Wordy/engine/tile-size.mjs`; did not import unrelated feature-branch history.
- First reconciled full-suite run exposed three stale branch-only assumptions in entrypoint/local-preview tests; tests were corrected to current production semantics (canonical `/Wordy/` route, Wordy included in Cloudflare packaging, local preview optional).
- Reconciled integration verification run `36007289820` on `99ab84047721aec107d7bd906deaa87ef72e43aa`: 90/90 pass, syntax pass, packaging contract pass.
- Selective merge commit on current main: `1a0840da6942e55d4483392e95dbb83c3c420edf`.
- Main Wordy tree was byte-for-byte identical to the verified integration Wordy tree across all 41 Wordy files.
- Production workflows `36007480279` and `36007480106` both succeeded on exact main SHA `1a0840da...`.
- Canonical live check initially produced a false failure because Cloudflare Pages returned a fallback page with HTTP 200 for missing `tile-size.mjs`; the check was corrected to inspect content instead of status code.
- Corrected canonical live check run `36007849032`: success; live board module and CSS are the 7×7 runtime and legacy `spanForWord` is not served.
- Production route: `https://classroom-online-games.pages.dev/Wordy/`.

Publication status: complete. Further Wordy work is playtest-driven and must continue from the uniform-cell architecture.
