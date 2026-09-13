# Verb Runner V2 prototype

Isolated proof-of-concept. It does not modify the current `Verb-Runner/` implementation.

## What this prototype proves

- 3-lane endless-runner movement
- keyboard and swipe controls
- jump and slide actions
- obstacle spawning and collision checks
- increasing speed
- a rigged 3D character using a skeletal RUN animation instead of sprite frames
- stylized neon rendering intended as a stepping stone toward the final anime/VRoid art direction

The temporary rig is the Three.js RobotExpressive example model loaded remotely at runtime. It is **not** the final Verb Runner character.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: slide
- Mobile: swipe left/right/up/down

## Next art step

Replace the temporary model with the approved custom VRM character and map final run/jump/slide/stumble/sprint animations without changing the endless-runner mechanics.
