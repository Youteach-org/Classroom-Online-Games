# Wordy — Current Implementation Handoff

**Updated:** 2026-09-22  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Development branch:** `feature/wordy-game`  
**Final verification commit:** `3c6d594f476905dd8aefe5c204d6c057bff4e752`  
**Promotion source feature HEAD:** `2c81e95c34c8bd8e5e893e31b01cf4cf39b2146a`  
**Production commit (`main`):** `60d8d0df4b68b047dbf4e494c1542ef5f22652b3`  
**Plan:** `docs/superpowers/plans/2026-09-21-wordy-discrete-grid-candy-swap.md`  
**Spec:** `docs/superpowers/specs/2026-09-21-wordy-discrete-grid-swap-architecture.md`  
**Ledger:** `docs/superpowers/progress/2026-09-21-wordy-discrete-grid-rebuild.md`

## Authoritative continuation state

The discrete-grid rebuild is the only authoritative Wordy implementation state.

- Tasks 1–10 of the discrete-grid plan are implemented, verified, and Task 10 is deployed.
- Do **not** repeat Tasks 1–10.
- The discrete-grid runtime is live on the canonical Classroom Online Games route.
- Continue future development in `feature/wordy-game`; production currently points to the verified atomic runtime promotion on `main`.
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
- Task 10 fresh verification workflow `35768528716` on commit `3c6d594f`: **88/88 pass**, 0 fail.
- Task 10 `node --check Wordy/app.mjs` → exit 0.
- Production deploy workflow `35768686972` completed **success** for exact main SHA `60d8d0df`.
- Cloudflare deployment: `https://867f3ab8.classroom-online-games.pages.dev`.
- Canonical-route live check workflow `35768813699` completed **success** and verified `/Wordy/`, `engine/tile-size.mjs` with `spanForWord`, and 12-column CSS.

## Publication state

- PR #46, the earlier validation-prototype integration, was merged on 2026-09-21 with merge commit `41475ba7e9dd2c2e0f59b0f98658d2859ec20fef`.
- The discrete-grid runtime was promoted atomically to `main` on 2026-09-22 as commit `60d8d0df4b68b047dbf4e494c1542ef5f22652b3`.
- The promotion changed only Wordy runtime files; feature-branch docs, tests, devcontainer files, local-preview helpers, and unrelated history were not merged into `main`.
- Existing workflow **Deploy Classroom Online Games to Cloudflare Pages**, run `35768686972`, deployed exact SHA `60d8d0df` successfully to project `classroom-online-games`.
- Wrangler reported deployment complete at `https://867f3ab8.classroom-online-games.pages.dev`.
- Independent live check run `35768813699` verified the canonical route `https://classroom-online-games.pages.dev/Wordy/` serves the discrete-grid runtime.
- Temporary Task 10 verification workflows were removed from the feature branch after use.

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

Tasks 1–10 are complete. Do not repeat the rebuild or production promotion.

The canonical production review route is:
`https://classroom-online-games.pages.dev/Wordy/`

Next work should be driven by user playtesting or a new explicitly requested Wordy change. Use `feature/wordy-game` for new development and preserve the discrete-grid architecture unless a new approved spec supersedes it.
