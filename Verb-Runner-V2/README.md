# Verb Runner V2 prototype

Isolated proof-of-concept. It does not modify the current `Verb-Runner/` implementation.

## Current prototype

- 3-lane endless-runner movement
- keyboard and swipe controls
- obstacle spawning and collision checks
- increasing speed
- humanoid VRM character loaded with `@pixiv/three-vrm`
- continuous skeletal animation instead of sprite frames
- animation state machine: RUN, JUMP, SLIDE/CROUCH, STUMBLE, RECOVERY, SPRINT
- separate humanoid clips for all six states
- cross-fades between states
- collision flow: STUMBLE -> RECOVERY -> RUN/SPRINT
- sprint increases animation intensity, world speed, camera FOV and rim light
- VRM update loop enabled so the final character can use VRM spring-bone motion for hair/clothes/accessories
- stylized neon environment remains isolated from the original Verb Runner

## Temporary humanoid

The current character is the official VRM 1.0 sample model from the pixiv/three-vrm project. It is only used to validate human anatomy, VRM loading, normalized humanoid bones and animation transitions.

It is **not** the final red runner.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: slide
- Shift: sprint
- Mobile: swipe left/right/up/down

## Next step

Replace the temporary VRM with the custom red anime runner while keeping the same normalized humanoid skeleton and state machine. The final model should include:

- high ponytail with spring-bone motion
- red hoodie/jacket
- black full-length cargo/jogger pants
- black backpack with glowing cyan/blue V
- red/white sneakers
- VRM humanoid rig compatible with the existing RUN/JUMP/SLIDE/STUMBLE/RECOVERY/SPRINT clips
