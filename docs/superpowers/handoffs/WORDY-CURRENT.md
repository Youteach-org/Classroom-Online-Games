# Wordy — Current Implementation Handoff

**Updated:** 2026-09-22  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Development branch:** `feature/wordy-game`  
**Verified feature runtime/test HEAD:** `1a8e54ff87731953a35863f7f7d9798810134700`  
**Plan:** `docs/superpowers/plans/2026-09-21-wordy-discrete-grid-candy-swap.md`  
**Spec:** `docs/superpowers/specs/2026-09-21-wordy-discrete-grid-swap-architecture.md`  
**Ledger:** `docs/superpowers/progress/2026-09-21-wordy-discrete-grid-rebuild.md`

## Authoritative continuation state

The discrete-grid rebuild is the only authoritative Wordy implementation state.

- Tasks 1–9 of the discrete-grid plan are implemented and verified.
- Do **not** repeat Tasks 1–9.
- Task 10 — production promotion of the verified discrete-grid runtime — is pending explicit user instruction.
- Continue work in `feature/wordy-game` until production promotion is intentionally performed.
- The existing Classroom Online Games site remains the user-facing review destination after promotion:
  `https://classroom-online-games.pages.dev/Wordy/`
- **Never use githack for Wordy.**
- Do not introduce Vercel, alternate preview mirrors, or a user-local download workflow as the normal review path.

## Canonical board geometry

Wordy now uses one tile-centric geometry authority:

```js
{
  rows: 7,
  columns: 12,
  tiles: [
    { id, word, row, startColumn, span }
  ]
}
```

Rules:

- Board size is exactly **12 microcolumns × 7 rows**.
- Tile spans are exactly **1, 2, 3, or 4** microcolumns.
- Deterministic word-to-span mapping:
  - 1–2 characters → span 1
  - 3–5 → span 2
  - 6–8 → span 3
  - 9+ → span 4
- CSS rendering, input, matching, gravity, review replay, and generation all consume the same `row/startColumn/span` geometry.
- Free-flex rows and equal-cell 5-column assumptions are superseded.

## Swap rules

- A player may attempt any **geometrically valid orthogonal adjacent pair**.
- Horizontal partners may have different spans when their edges touch.
- Vertical partners require identical `startColumn` and identical `span` on adjacent rows.
- A productive attempt stays in the new position and consumes exactly one move.
- A valid nonproductive attempt animates forward and rebounds.
- A rebound changes no canonical board state, score, ready relationships, or move count.
- A rebound does not create missed-opportunity telemetry.
- A swap that merely preserves a previously ready relationship elsewhere is not productive.

## Matching rules

- Horizontal relationships are consecutive edge-touching physical tiles.
- Vertical relationships are consecutive rows whose tiles share at least one common microcolumn.
- Vertical matching may therefore use different tile spans.
- Wide vertical phrases found through more than one microcolumn lane are deduplicated.
- Crossings are defined by a shared physical tile ID between horizontal and vertical matches.
- Runtime relationship validity comes only from the curated relationship bank; there is no live LLM judging.

## POP, gravity, refill, and recovery

- Ready relationships persist until changed by an accepted productive move or resolved by POP.
- POP resolves all ready relationships globally without spending another move.
- Shared crossing tiles are physically removed once while all crossed relationships score.
- Gravity treats every tile as a rigid block.
- A tile falls only when every microcell below its entire footprint is empty.
- After rigid gravity, every remaining horizontal cavity is refilled exactly with span-compatible words.
- Stable boards occupy all 84 microcells without overlaps or out-of-bounds tiles.
- Automatic cascades use the same matcher and geometry authority.
- Dead-board recovery requires an immediately viable state; controlled boards use the current productivity floor of at least four productive swaps across at least three rows.

## UI and review state

- The main board renders as a 12×7 CSS Grid.
- Tile input and swipe direction resolve physical tile IDs through board geometry.
- Accepted swaps use FLIP animation.
- Rejected valid swaps animate forward and rebound.
- Missed-opportunity replay stores and renders the same tile-centric 12-column geometry.
- Suggested replay tiles are identified by tile ID.
- Resolution feedback uses the deterministic resolution result; no duplicate gameplay engine is used for animation.

## Verification state

Fresh verification was performed from an isolated workspace reconstructed from the GitHub feature branch.

- Task 8 full suite: `node --test Wordy/tests/*.test.mjs` → **86/86 pass**.
- Task 8 syntax: `node --check Wordy/app.mjs` → exit 0.
- Task 8 stale-geometry sweep found no remaining canonical `board[`, `.cells`, test `col:`, or `repeat(5` assumptions.
- Task 9 added `Wordy/tests/gameplay-integration.test.mjs`.
- Task 9 integration coverage verifies:
  - Level A load;
  - a valid unrelated swap rebounds;
  - WENT ↔ AFTER is accepted;
  - exactly one move is spent;
  - LOOK AFTER becomes ready;
  - POP resolves it;
  - gravity/refill returns a full valid 12×7 board;
  - the round either finishes by objective or remains immediately playable.
- Task 9 also programmatically verifies generated boards have valid spans/bounds/full occupancy and at least four productive swaps across at least three rows.
- Full suite with Task 9: **88/88 pass**.
- `node --check Wordy/app.mjs` → exit 0.

## Publication state

Historical publication and the new discrete-grid promotion are different things.

- PR #46, the earlier Wordy validation prototype integration, **was merged** on 2026-09-21 with merge commit `41475ba7e9dd2c2e0f59b0f98658d2859ec20fef`.
- `main` later received an earlier Wordy publication commit `a06cee78` and cache fix `339d5c53`.
- The **new discrete-grid runtime on `feature/wordy-game` has not yet been promoted to production**.
- Do not create another broad integration PR for the old prototype history.
- Task 10 must copy only the verified Wordy runtime blobs needed by the live site to `main`; do not merge the entire feature branch wholesale.
- After promotion, require the existing **Deploy Classroom Online Games to Cloudflare Pages** workflow to succeed for the exact production commit, then verify the canonical `/Wordy/` route.
- Production promotion is a deliberate side effect and requires explicit user instruction.

## Superseded guidance

The following older guidance must not drive continuation:

- “Only productive swaps are interactable.”
- “Wordy is local-only.”
- “Use githack / wordy-preview for browser review.”
- “PR #46 is open / not merged.”
- “No Wordy production publication has ever occurred.”
- Free-flex variable-width rows as a separate geometry system.
- 5×7 equal-cell board assumptions.

Any older handoff text or history that conflicts with this document is superseded.

## Exact next action

Do not reimplement the discrete-grid rebuild.

The next planned action is **Task 10: promote the verified discrete-grid Wordy runtime to `main` and verify the existing Cloudflare deployment**, but perform that only after explicit user instruction to publish/deploy.

Until then, `feature/wordy-game` is the source of truth for the rebuilt runtime.
