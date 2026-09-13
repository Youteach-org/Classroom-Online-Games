# Verb Runner V2 prototype

Isolated proof-of-concept. It does not modify the current `Verb-Runner/` implementation.

## Current prototype

- 3-lane endless-runner movement
- keyboard and swipe controls
- obstacle spawning and collision checks
- increasing speed
- rigged 3D runner using skeletal animation instead of sprite frames
- animation state machine: RUN, JUMP, SLIDE/CROUCH, STUMBLE, RECOVERY, SPRINT
- cross-fades between animation states
- sprint changes animation playback, world speed, camera FOV and rim light
- collision triggers STUMBLE -> RECOVERY -> RUN/SPRINT
- stylized neon rendering

The temporary rig is the Three.js RobotExpressive example model loaded remotely at runtime. It is **not** the final Verb Runner character.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: slide
- Shift: sprint test
- Mobile: swipe left/right/up/down

## Animation mapping in this prototype

The temporary model does not contain every final runner animation, so the state machine maps the closest available skeletal clips and uses small procedural body transforms where needed. When the final humanoid/VRM is connected, each state can be mapped to its dedicated run, jump, crouch/slide, stumble, recovery and sprint clip without changing the runner mechanics.

## Next art step

Replace the temporary robot with a humanoid anime/VRM test character, verify all six states on a human skeleton, then build the approved red runner.
