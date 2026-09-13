# Verb Runner V2 prototype

This is an isolated proof-of-concept. It does not modify the original `Verb-Runner/`.

## Native action test

The prototype now uses a single rigged Quaternius character with its own native animation set so the movement test does not depend on hand-authored procedural poses.

Mapped states:

- RUN -> `Run`
- SPRINT -> `Run` at higher playback speed
- JUMP launch -> `Jump`
- airborne pose -> `Jump_Idle`
- landing -> `Jump_Land`
- DUCK -> `Duck`
- STUMBLE -> `HitReact`
- RECOVERY -> `Jump_Land` as a short recovery transition

The gameplay still supplies the vertical jump arc and lane movement. The character body motion itself comes from native skeletal animation clips.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: duck
- Shift: sprint
- Mobile: swipe left/right/up/down

## Temporary asset

The current action-test character comes from the Quaternius Ultimate Space Kit and is used only to validate native character animation flow before the final red anime runner is created.

Source mirror used at runtime:
`danvanderboom/Aetherium/samples/unity/Aphelion/Assets/ThirdParty/Quaternius/Animated/reclaimer-rae.gltf`

License: CC0 1.0, as recorded alongside the asset and on the Quaternius pack page.
