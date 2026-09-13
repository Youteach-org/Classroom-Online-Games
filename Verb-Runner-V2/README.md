# Verb Runner V2 prototype

This is an isolated proof-of-concept. It does not modify the original `Verb-Runner/`.

## Current movement test

The current test uses a Quaternius **Casual Female** humanoid with all movement clips coming from the same native skeleton.

Mapped states:

- RUN -> `Run`
- SPRINT -> `Run` at higher playback speed
- JUMP -> `Jump`
- LOW OBSTACLE ACTION -> `Roll`
- STUMBLE -> `RecieveHit`
- RECOVERY -> brief `Idle` crossfade, then back to RUN

The endless-runner engine still controls lane changes, forward speed and the vertical jump arc. No body squashing or hand-built crouch pose is used for the low-obstacle action.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: roll
- Shift: sprint
- Mobile: swipe left/right/up/down

## Temporary asset

Character source: Quaternius Ultimate Animated Character Pack, mirrored in the public `psqd12137-sudo/dream-channel` repository as `Casual_Female.gltf`.

License: CC0 1.0 Universal, recorded alongside the asset in `LICENSE.txt`.

This character is only for motion validation before the final red anime runner.
