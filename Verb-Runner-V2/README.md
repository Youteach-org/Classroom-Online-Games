# Verb Runner V2 prototype

This is an isolated proof-of-concept. It does not modify the original `Verb-Runner/`.

## Current adapted runner test

The V2 test now uses Quaternius **Animated Woman** (`qJ2gsTUBHL`) as the visible runner instead of adding fake geometry on top of the previous body.

This model is useful because its clothing is split into separate skinned meshes/materials. The adaptation changes the actual model materials:

- upper clothing -> red;
- long-leg clothing -> black;
- shoes -> light/white;
- hair materials -> reddish brown;
- skin remains unchanged.

No backpack, ponytail, gloves or other fake primitive geometry is being attached in this pass.

## Movement

- RUN -> target model native `Run`
- SPRINT -> native `Run` at higher playback speed
- JUMP -> the previously approved Quaternius `Jump` clip bound to the compatible humanoid rig
- LOW OBSTACLE ACTION -> target model native `Roll`
- STUMBLE -> target model native `HitRecieve`

The character is fit to the same 2.35 world-unit height used by the approved previous female test.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: roll
- Shift: sprint
- Mobile: swipe left/right/up/down

## Asset provenance

Visible character: **Animated Woman** by Quaternius, Poly Pizza model `qJ2gsTUBHL`, CC0 1.0.

The runtime file is loaded from a public GitHub mirror of the exact Poly Pizza model. The model has separate body, feet, head and leg skinned meshes and its own animation set.
