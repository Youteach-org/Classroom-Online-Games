# Verb Runner V2 prototype

This isolated V2 keeps the movement system on the Quaternius Ultimate Animated Character Pack, but the six runners are now **different rigged meshes**, not one body recolored six times.

## Six adapted character bases

All six use the same compatible Quaternius humanoid skeleton and the same native movement set, so switching characters does not require fake procedural animation.

1. **Red** — `Casual_Female.gltf`: the approved female base and proportions.
2. **Blue** — `Casual2_Female.gltf`: a different female mesh/hair/clothing silhouette.
3. **Green** — `Ninja_Female.gltf`: a distinct fitted runner silhouette with its own modeled details.
4. **Pink** — `Casual3_Female.gltf`: another separate female mesh/hair/clothing shape.
5. **White** — `Worker_Female.gltf`: separate modeled clothing plus a real modeled hat.
6. **Purple** — `BlueSoldier_Female.gltf`: separate tactical-style modeled body/details.

Each model keeps its own geometry. Character colors are applied only after choosing the distinct mesh, to align the six bases with the existing Verb Runner identities.

## Movement

Every model contains the same native clips:

- `Run`
- `Jump`
- `Roll`
- `RecieveHit`
- `Idle`

The game keeps the approved 2.35 world-unit height. No primitive geometry is attached to fake hair, backpacks, hats or body parts.

## Controls

- Left / A: lane left
- Right / D: lane right
- Up / W / Space: jump
- Down / S: roll
- Shift: sprint
- Mobile: swipe left/right/up/down

## Asset source

Quaternius Ultimate Animated Character Pack, CC0 1.0. The test loads the compatible glTF models from a public mirror of that pack.