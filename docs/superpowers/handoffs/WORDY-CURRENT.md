# Wordy — Current Implementation Handoff

**Repository:** `youteachtk/Classroom-Online-Games`  
**Branch:** `feature/wordy-game`  
**Execution method:** Inline / Native via `superpowers:executing-plans`  
**Plan:** `docs/superpowers/plans/2026-09-20-wordy-validation-prototype.md`  
**Prototype spec:** `docs/superpowers/specs/2026-09-20-wordy-game-prototype-design.md`  
**Architecture spec:** `docs/superpowers/specs/2026-09-20-wordy-game-architecture-design.md`  
**Execution ledger:** `docs/superpowers/progress/2026-09-20-wordy-validation-prototype.md`

## Current status

- Design/specification: approved.
- Validation prototype implementation plan: **all 11 tasks complete**.
- Implementation location: `feature/wordy-game` only.
- Product merge/deployment: **not performed**.
- Final integration PR: **#46 `feature/wordy-game` → `main` is open**. Do not create a duplicate PR.
- Wordy route in branch: `/Wordy/`.
- Cloudflare production workflow on this branch now copies `Wordy/`, but it has not been run because the branch has not been merged to `main`.
- Branch reconciliation: **complete**. PR #45 merged current `main` into `feature/wordy-game` with merge commit `9c7800adbad71c921084bd8d4d3183683950418e`. After reconciliation the branch was 109 commits ahead and **0 behind** `main`.

## Verification state

Fresh verification was performed from a sandbox reconstructed from the current GitHub branch files:

- Post-reconciliation `node --test Wordy/tests/*.test.mjs` -> **81 tests, 81 pass, 0 fail**.
- Post-reconciliation `node --check Wordy/app.mjs` -> **exit 0**.
- Review-focus subset -> **17 pass, 0 fail**.
- Prototype-exclusion scan -> no Teacher Monitor, Firebase/session/login, currency/lives, loot-box, booster, obstacle, adaptive-mastery, or full-map implementation in production `Wordy/` files.
- Final code review was a **self-review because no subagent tool is available**; no Critical or Important findings remained after fixes.

A temporary branch-only GitHub Actions test workflow was attempted but GitHub failed jobs before runner assignment (`runner_id: 0`, no steps). It was removed to avoid a permanent false-red branch check. This is an infrastructure limitation, not a Wordy test failure.

## Completed implementation capabilities

- 85 curated V1 relationships across phrasal verbs, collocations, fixed expressions, and irregular verb sets.
- 5×7 phone-first board.
- Orthogonal adjacent swaps and legal non-scoring setup moves.
- Straight contiguous horizontal/vertical matching.
- Same-line nested suppression and true crossword intersections.
- Persistent ready-to-pop relationships.
- One global POP resolving all ready relationships without charging a move.
- Shared crossing tiles removed once while both relationships score.
- Vertical gravity/refill and automatic cascade generations.
- Cascade runaway guard and dead-board recovery.
- Provisional base/length/batch/cross/discovery/cascade scoring.
- Validation levels A–G.
- Controlled-random productive board generation and depth-2 viability check.
- New Learning + verified missed-opportunity round review.
- Logical mini-replay of the top missed opportunity.
- Local prototype telemetry including formed/broken relations, crosses, misses, cascades, replay, and abandonment.
- Swipe plus tap/tap mobile input.
- Responsive long-word typography.
- Readable cascade timeline, e.g. `LOOK AFTER` then `COMBO ×2 · TAKE A BREAK`.
- COG landing-page card at `/Wordy/`.
- Cloudflare build definition includes the `Wordy` static folder.

## Key late-stage commits

- `34e8049` — timeline tests.
- `7df0844` — resolution-event labels.
- `140ba34` — timeline playback helper.
- `01feec9` / `ce62261` — integration tests requiring timeline wiring.
- `b74ded6` / `a02c0f8` — controller/app timeline integration.
- `6d2ea3b` — deployment test requiring Wordy in Cloudflare build.
- `acf4ee9` — Cloudflare build includes Wordy.
- `e82ba15` — remove unavailable temporary branch CI workflow.
- `59c59fe` — close durable execution ledger.

Earlier task commits are listed in the execution ledger.

## Rulings / deviations that must survive chat changes

1. **Inline/native only:** do not switch routine work to subagent-driven development.
2. The environment lacked an authenticated local private-repository worktree, so verification used a sandbox reconstructed from GitHub content.
3. Immediate scoring moves count only relationships newly created by the swap; merely preserving an existing ready relation does not make a swap scoring.
4. On `CascadeLimitError`, use a fresh controlled productive fallback rather than ordinary dead-board detection on the pre-pop board.
5. Cascade feedback uses a UI timeline over the single deterministic resolution result. Do not duplicate the rules engine to animate cascades. If playtesting shows intermediate board motion is needed, add presentation snapshots/animation without creating a second gameplay authority.
6. The temporary Wordy branch CI workflow was removed because GitHub provided no runner. Do not interpret those workflow failures as product-code failures.

## Known limitations / deferred work

These are intentional prototype boundaries, not unfinished Task 1–11 work:

- final commercial name;
- final art direction;
- full progression/map and production stars;
- developed Wordbook;
- adaptive learning UI/model;
- category preference UI;
- boosters/obstacles;
- Teacher Monitor / classroom-session integration;
- large-scale content ingestion;
- production scoring calibration;
- richer per-generation board animation if user playtesting shows the text timeline is insufficient.

## Exact next action

Do **not** repeat implementation Tasks 1–11.

The branch is reconciled with current `main` and final PR #46 is open. The next product step is PR review and, only with explicit user instruction, merge/deploy. Do not create another integration PR.

## Continuation prompt

> Continue Wordy in `youteachtk/Classroom-Online-Games`, branch `feature/wordy-game`. Use Superpowers inline/native, not subagent-driven. First read `docs/superpowers/handoffs/WORDY-CURRENT.md` and the execution ledger. Tasks 1–11 of `docs/superpowers/plans/2026-09-20-wordy-validation-prototype.md` are complete; do not repeat them. The fresh reconstructed-branch suite passed 81/81 and `node --check Wordy/app.mjs` passed. No merge or deployment has happened. PR #45 already reconciled current `main` into the feature branch; post-reconciliation verification passed 81/81 and the branch was 0 behind `main`. Do not repeat reconciliation unless `main` moves again. Resume with user-requested playtesting, revision, PR, merge, or deployment only as explicitly requested.


## Reconciliation record

- PR #45: `main` -> `feature/wordy-game`.
- Merge commit: `9c7800adbad71c921084bd8d4d3183683950418e`.
- Post-merge divergence check: 109 ahead / 0 behind `main`.
- Post-merge verification: 81/81 Wordy tests pass; `node --check Wordy/app.mjs` exit 0.
- No production deployment occurred.


## Final integration PR

- PR #46: `feature/wordy-game` -> `main`.
- URL: https://github.com/youteachtk/Classroom-Online-Games/pull/46
- State at creation: open, not merged.
- GitHub REST initially reported `mergeable_state: unknown`; this is calculation pending, not evidence of a conflict.
- No production deployment has occurred.


## Branch-only local development mode — 2026-09-21

User decision: continue Wordy development without publishing it online.

Current workflow:
- Work only in `feature/wordy-game`.
- `main` must not contain or expose the Wordy prototype.
- The COG landing page in the Wordy branch also does not expose a Wordy card.
- The Cloudflare production build in the Wordy branch explicitly excludes `Wordy`; future merges cannot publish it accidentally without an intentional production-enablement change.
- No GitHub Actions or Cloudflare deployment is required for Wordy development.
- Local preview launcher: `Wordy/preview-local.bat`.
- Local server: `node Wordy/preview-local.mjs --open`.
- Preview URL: `http://127.0.0.1:4173/Wordy/`.
- Direct level URLs: `?level=A` through `?level=G`.
- On `localhost` / `127.0.0.1`, a DEV bar appears inside the game with level A–G selection and Restart.
- DEV controls are not mounted on non-local hosts.

Verification for this change:
- Local-development controls RED: 3/4 tests initially failed because query-level selection, localhost guard and DEV controls did not exist.
- GREEN: `Wordy/tests/local-preview.test.mjs` 4/4.
- Branch-only safety RED: entrypoint tests failed because the COG card and Cloudflare copy commands still exposed Wordy.
- GREEN: entrypoint + local-preview + UI contract targeted suite -> 17/17 pass.
- `node --check Wordy/app.mjs` -> exit 0.

Key commits:
- `5d8bfc9` local-preview tests.
- `8e55a15`, `ac93cab` initial localhost controls/styles.
- `54553e9` branch-only safety tests.
- `ed17871` removes Wordy card from branch root landing page.
- `2f0759a` excludes Wordy from branch Cloudflare build.
- `f7a5769`, `b6d87e3` keep DEV controls in normal page flow.
- `c75cc8b` documents local level controls.

Do not re-enable Wordy in `main`, the COG production landing page, or Cloudflare until the user explicitly requests production publication.


## Core correction — productive swaps and variable-width word blocks (2026-09-21)

User rejected two earlier prototype assumptions after hands-on review.

### Movement rule — authoritative
- A player may attempt a swap only between two orthogonally adjacent tiles.
- The swap is **accepted only if that single exchange creates at least one new validated linguistic relationship**.
- If it creates no new relationship, the swap is rejected/reverted immediately.
- Rejected swaps consume **no move** and do not create missed-opportunity telemetry.
- A player must not be able to walk/transport a word across the board through repeated useless swaps.
- A swap that only preserves an already-ready relationship elsewhere is not productive.
- A successful swap consumes one move and any newly created relationship becomes ready to pop.
- Existing ready relationships stay ready when unrelated rejected swaps are attempted.
- Global POP, crossword intersections, shared-tile scoring, gravity, and cascades remain.

### Dead-board rule — authoritative
- A live board must have at least one relationship already ready **or one productive relationship-forming adjacent swap available immediately**.
- Do not search through two or more useless setup swaps when deciding whether a board is viable.
- If no immediate productive swap exists and no relationship is already ready, the board is dead and should reset using the normal recovery behavior.

### Visual geometry — authoritative
- The rules engine retains logical row/column coordinates for adjacency, matching, gravity, and crossings.
- The rendered board must **not** force five equal-width square tiles per row.
- Each rendered logical row is a flex/block row.
- Very short words such as `A`, `OF`, `TO` receive compact blocks.
- Medium words receive normal width.
- Long words such as `HOMEWORK`, `ATTENTION`, and `DIFFERENCE` receive progressively wider blocks.
- Readability takes priority over shrinking long words into equal squares.
- Current width classes: `size-xs`, `size-sm`, `size-md`, `size-lg`, `size-xl`.

### Verification performed for this correction
- TDD RED reproduced the original bug: an adjacent useless swap was accepted and retained; a two-useless-swap path was considered viable; equal-square UI assertions represented the wrong design.
- Targeted GREEN verification: 8/8 tests pass for rejected useless swaps, accepted productive swaps, existing ready POP, crossing-producing swaps, immediate-only viability, dead-board detection, row-block rendering, and variable-width CSS.
- Published GitHub blobs were then inspected: controller contains `chosenMove` lookup + `if(!chosenMove)return false`; generator uses immediate scoring moves only; renderer creates `wordy-row` wrappers and word-length size classes; main-board CSS is flex-based with proportional widths.
- Automated Chromium screenshot generation is currently blocked by sandbox browser policy, so do not claim a browser screenshot was visually verified from the sandbox.

Key commits:
- `82c115e` controller regression tests.
- `bdfcfb0` immediate-only generator tests.
- `6068fad` variable-width UI contract tests.
- `1f5a161` reject nonproductive swaps.
- `1709ef8` immediate-only board viability.
- `e37451d` render variable-width word blocks.
- `a24b24d` size word blocks by word length.
- `70fcf19`, `c49a8b9`, `5f7b25b`, `f4c5d49` update decisions/spec/architecture/plan.

### Workflow preference
The user does **not** want to download or work on Wordy locally. Continue editing `feature/wordy-game` through GitHub. Local/sandbox rendering may be used internally for verification, but do not ask the user to download ZIPs or run a local server as the normal workflow.
