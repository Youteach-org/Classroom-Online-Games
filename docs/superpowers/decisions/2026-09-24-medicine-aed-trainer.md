# Decision — Medicine AED trainer safety and architecture

Date: 2026-09-24
Status: CONFIRMED

## Decisions

1. Create a Medicine section in Classroom Online Games.
2. First Medicine project: AED Educational Trainer.
3. Development branch: `medicine-aed`; do not merge to `main` until the user declares it ready.
4. The physical trainer uses ESP32-S3.
5. Audio is local prerecorded audio from the trainer; MAX98357A I2S amplifier + speaker is the preferred prototype path.
6. The trainer must not contain a high-voltage shock circuit.
7. The SHOCK button simulates a shock using state, light and sound only.
8. The trainer does not analyze real ECG. Shockable/non-shockable outcome is supplied by an instructor-selected or scripted training scenario.
9. The web simulator and physical trainer should share the same conceptual state machine.
10. First physical-to-web integration target is Web Serial over USB; BLE is optional later.
11. The root Classroom Online Games page may show the Medicine access card on the feature branch, but not on production `main` until the project is ready.
