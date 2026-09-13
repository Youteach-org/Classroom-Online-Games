# Verb Runner V2 prototype

This isolated prototype now uses **six different rigged character meshes**, not one body recolored six times.

## Character bases

All six models come from the same Quaternius Ultimate Animated Character family, so each one carries the same native animation set and can use the exact same runner state machine.

- Red -> `Casual_Female.gltf`
- Blue -> `Casual_Male.gltf`
- Green -> `Casual2_Male.gltf`
- Pink -> `Casual2_Female.gltf`
- White -> `Casual3_Female.gltf`
- Purple -> `Casual3_Male.gltf`

These are different body/clothing/hair meshes. Color is only an additional identity layer; it is no longer the only difference.

## Movement

Every character uses its own native clips:

- RUN -> `Run`
- SPRINT -> `Run` faster
- JUMP -> `Jump`
- LOW OBSTACLE ACTION -> `Roll`
- STUMBLE -> `RecieveHit`
- RECOVERY -> `Idle`

The red runner preserves the previously approved 2.35 height and narrowed proportions. The other five keep the same vertical height while using body-specific width/head tuning.

## Goal

This is the structural six-character base. Each runner can now be refined toward its existing selection portrait without replacing the shared animation pipeline or attaching fake primitive geometry.