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
8. The trainer may acquire a real single-lead ECG for educational monitoring using a dedicated ECG front end. Real ECG acquisition is non-diagnostic and must never automatically enable the simulated SHOCK control or issue a treatment recommendation.
9. Shockable/non-shockable AED training outcomes remain supplied by an instructor-selected or scripted training scenario.
10. The web simulator and physical trainer should share the same conceptual state machine.
11. BLE is required in the first near-final prototype so the physical trainer can stream live state and educational ECG telemetry to the Classroom Online Games Teacher Monitor.
12. The Teacher Monitor is the canonical live supervisory surface for the instructor: current AED step, pad/electrode state, educational ECG waveform, heart rate/R-R metrics, simulated-shock events, CPR state and event log.
13. When electrodes are attached to a real person, the trainer must run from battery power and use BLE for live monitoring; do not keep it tethered by USB to a mains-powered computer.
14. The root Classroom Online Games page may show the Medicine access card on the feature branch, but not on production `main` until the project is ready.
