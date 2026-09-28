# Decision — Medicine AED trainer safety and architecture

Date: 2026-09-24
Status: CONFIRMED

## Decisions

1. Create a Medicine section in Classroom Online Games.
2. First Medicine project: AED Educational Trainer.
3. Development branch: `medicine-aed`; do not merge to `main` until the user declares it ready.
4. The physical trainer uses the classic ESP32 / ESP32-WROOM-32 target and will be programmed over UART. The ESP32-S3 is no longer the target controller for the physical DEA.
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

## OLED HMI decision — confirmed 2026-09-27

15. The selected 0.96-inch 128x64 I2C OLED has been bench-tested and is operational at address `0x3C`.
16. The installed panel is physically two-color: a yellow upper band and a blue lower area. The colors are fixed by the panel hardware; firmware does not choose yellow vs. blue per pixel.
17. The AED HMI must deliberately use that physical split:
   - **yellow upper band:** short title, current high-priority state, or critical warning such as `NO TOCAR`, `SHOCK`, `RCP`, `ANALIZANDO`, `PARCHES` or `ERROR`;
   - **blue lower area:** operational instructions, CPR countdown, pad status, battery/BLE status, shock count and secondary information.
18. Layouts must keep warning/title text inside the yellow band and operational information inside the blue area. The two-color split is a permanent UI constraint for the physical trainer.
19. Bench validation included full-on/full-off, checkerboard inversion, horizontal/vertical line tests, grid, sweeps and progressive pixel filling; no display-cell faults were observed.
20. The OLED validation was performed successfully on the same classic ESP32 target intended for the trainer, using SDA on GPIO 21 and SCL on GPIO 22. These pins are the current approved OLED I2C assignment unless a later whole-device pin-conflict review requires reassignment.

## Controller revision — confirmed 2026-09-27

21. The earlier ESP32-S3 controller choice is superseded.
22. The physical DEA will use the classic ESP32 / ESP32-WROOM-32 family and will be programmed over UART.
23. Firmware, pin maps, wiring diagrams, BOM notes and future implementation work must target this UART-programmed ESP32 unless the user explicitly changes the controller again.
24. Do not migrate the project back to ESP32-S3 implicitly just because older documentation or purchase notes mention it.
