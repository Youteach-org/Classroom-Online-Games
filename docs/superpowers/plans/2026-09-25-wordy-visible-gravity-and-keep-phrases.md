# Wordy Visible Gravity and KEEP Phrases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make POP visibly animate destruction, vertical gravity and top refill instead of teleporting directly to the final board, and add KEEP UP / KEEP IN to the curated phrasal-verb bank.

**Architecture:** Keep the existing synchronous resolution engine as the authority, but preserve board snapshots for every resolution generation: before removal, after removal, after gravity, and after refill. The browser timeline will play those snapshots with Web Animations API transitions while the controller's final state is temporarily withheld from normal rendering. No gameplay rules, move costs, board geometry, or refill logic change.

**Tech Stack:** Vanilla ES modules, CSS Grid, Web Animations API, Node test runner, GitHub Actions, Cloudflare Pages.

**Spec:** Existing Wordy handoff plus user feedback on 2026-09-25.

## Global Constraints

- Manual global POP remains unchanged.
- POP still costs no move and does not end a round while moves remain.
- Gravity remains strictly vertical; survivors never move laterally.
- Refill still enters from top-of-column holes.
- Automatic cascades remain automatic.
- Animation must visualize actual engine states rather than inventing alternate board positions.
- KEEP UP and KEEP IN are curated phrasal verbs, not open-ended grammar expansion.
- Existing 7×7 equal-cell and vocabulary-diversity rules remain unchanged.

## Review Focus

- Surviving tile IDs must visibly move from their pre-gravity row to their post-gravity row.
- New refill IDs must visibly enter from above the board, not fade in at their destination.
- Cascades must replay removal/fall/refill for each generation in order.
- Normal controller subscription must not overwrite the board with final state before the timeline finishes.
- Browser without Element.animate must still reach the correct final board.

---

### Task 1: Curate KEEP UP and KEEP IN

**Files:**
- Modify: `Wordy/data/relationships.mjs`
- Test: `Wordy/tests/relationship-bank.test.mjs`

- [ ] Add RED assertions that both `phrasal-verb:keep-up` and `phrasal-verb:keep-in` exist with exact token pairs.
- [ ] Run Wordy tests and confirm those assertions fail.
- [ ] Add both relationships to `PHRASAL`.
- [ ] Run focused/full suite and require green.

### Task 2: Preserve visual board stages in resolution generations

**Files:**
- Modify: `Wordy/engine/resolution.mjs`
- Modify: `Wordy/engine/resolution-events.mjs`
- Test: `Wordy/tests/resolution.test.mjs`
- Test: `Wordy/tests/timeline.test.mjs`

**Interfaces:**
- Each generation produces `boardBefore`, `boardAfterRemoval`, `boardAfterGravity`, `boardAfterRefill`.
- `buildResolutionEvents()` forwards cloned board snapshots plus `removedTileIds`.

- [ ] Add RED resolution test proving a surviving tile changes row only between removal and gravity snapshots and refill IDs appear only in refill snapshot.
- [ ] Add RED event test proving the four snapshots survive into timeline events.
- [ ] Implement snapshots from real engine boards.
- [ ] Run resolution/timeline tests and require green.

### Task 3: Animate POP, fall and refill

**Files:**
- Modify: `Wordy/ui/render.mjs`
- Modify: `Wordy/ui/timeline.mjs`
- Modify: `Wordy/app.mjs`
- Modify: `Wordy/styles.css`
- Test: `Wordy/tests/timeline.test.mjs`
- Test: `Wordy/tests/entrypoint.test.mjs`
- Test: `Wordy/tests/ui-contract.test.mjs`

**Interfaces:**
- Export `renderBoardSnapshot(root, board, {matches,disabled})` from render.
- Timeline defaults:
  - removal animation: scale/fade;
  - gravity animation: FLIP by stable tile ID;
  - refill animation: translate new tiles from above the board to their top-hole cells.
- App subscription skips ordinary `renderGame` while `timelinePlaying === true`; final normal render happens after timeline.

- [ ] Add RED timeline test asserting stage order `remove → gravity → refill` for every generation.
- [ ] Add RED entrypoint assertion that subscription does not render final board while timeline is playing.
- [ ] Extract reusable board-only render helper.
- [ ] Implement WAAPI removal/gravity/refill transitions with graceful no-animation fallback.
- [ ] Integrate timeline locking in app.
- [ ] Run full suite and require green.

### Task 4: Verify, publish, and live-browser test

**Files:**
- Modify handoff/ledger after verification.

- [ ] Run `node --test Wordy/tests/*.test.mjs`.
- [ ] Run `node --test tests/wordy-production-deploy.test.mjs`.
- [ ] Run `node --check Wordy/app.mjs`.
- [ ] Selectively integrate runtime/tests onto current `main`.
- [ ] Deploy through both Cloudflare workflows.
- [ ] Chromium live verification must instrument tile animations and prove at least one survivor receives a downward gravity animation and at least one refill tile enters from above.
- [ ] Verify KEEP UP and KEEP IN are served in the live relationship bank.
