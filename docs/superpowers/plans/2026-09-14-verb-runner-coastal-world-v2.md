# Verb Runner Coastal World V2 Implementation Plan

**Goal:** Upgrade the approved coastal-world blockout into a richer, game-ready visual preview while preserving the existing composition: sea/promenade on the left, road center, Mediterranean village on the right, and distant hillside town/mountains.

## Files

- `Verb-Runner/coastal-world.mjs`
  - Add organic mountain geometry instead of cone mountains.
  - Add animated water shader and shoreline glints.
  - Add richer Mediterranean façade details: arches, roof tile rows, chimneys, pergolas, balconies, vines and bougainvillea.
  - Improve tree/palm silhouettes with deterministic organic foliage.
  - Add distant landmark/town density and atmospheric layers.
  - Return an `update(time)` hook for animated environment materials.

- `Verb-Runner/coastal-preview.mjs`
  - Call the world `update(time)` hook every frame.
  - Keep existing evaluation camera controls unchanged.

- `Verb-Runner/tests/coastal-world-v2.test.mjs`
  - Static acceptance tests for the V2 source markers and preview integration.
  - Assert that cone-only mountain implementation is gone.
  - Assert that animated water, irregular mountain generation, roof/facade detail helpers, vegetation detail helpers, and environment update integration are present.

- `.github/workflows/verb-runner-3d-preview.yml`
  - Run the V2 acceptance test before deploying the isolated preview.

## TDD sequence

1. Add V2 acceptance tests and wire them into the preview workflow.
2. Confirm the preview workflow fails against the existing blockout for the expected missing features.
3. Implement V2 environment helpers in `coastal-world.mjs`.
4. Integrate animated world updates in `coastal-preview.mjs`.
5. Run syntax checks + V2 tests in GitHub Actions.
6. Confirm the isolated Cloudflare preview deploy succeeds and capture the alias URL.

## Visual acceptance criteria

- Mountain silhouette is irregular and layered; no obvious cone mountains.
- Water has subtle animated motion and specular/light variation.
- Right-side façades contain visibly richer architectural detail without changing the road layout.
- Vegetation reads less like primitive spheres and more like stylized organic foliage.
- Distant town has stronger depth cues and at least one recognizable landmark.
- Existing game-camera framing and left/right composition remain intact.
- Preview remains inspectable through the existing camera buttons and OrbitControls.
