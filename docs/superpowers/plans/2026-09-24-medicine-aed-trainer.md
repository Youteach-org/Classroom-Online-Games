# Medicine / AED Educational Trainer — implementation plan

Date: 2026-09-24
Branch: `medicine-aed`
Repository: `Youteach-org/Classroom-Online-Games`

## Goal

Create the first Medicine area in Classroom Online Games and a physical ESP32-based AED educational trainer with audio prompts. The web experience and physical trainer must share the same training states.

## Non-negotiable safety architecture

The project is an educational simulator. There will be no high-voltage subsystem, no capacitor discharge path, no therapeutic output, no real ECG acquisition, and no automatic clinical diagnosis. The shock control is a GPIO-only simulation input.

## Workstreams

### A. Classroom Online Games
1. Add `/Medicine/` as a new subject section.
2. Add `/Medicine/AED-Trainer/` as the first medical training tool.
3. Add a Medicine card to the root page on the feature branch only.
4. Keep the simulator usable without physical hardware.
5. Later add a Web Serial bridge for state mirroring from ESP32.

### B. Physical trainer
1. Bench-test ESP32-S3, display and MAX98357A speaker.
2. Play prerecorded WAV prompts from microSD.
3. Implement front-panel buttons and simulated pad inputs.
4. Implement finite-state machine.
5. Add instructor scenario selector.
6. Add lights/display prompts.
7. Build safe enclosure.
8. Run classroom usability test.
9. Freeze the audio script only after protocol review.

## Milestones

### M0 — project skeleton
- Medicine branch
- Medicine landing page
- Web AED simulator
- BOM, safety boundary and handoff

### M1 — audio bench
- ESP32-S3 powered from USB
- MAX98357A connected over I2S
- One speaker
- microSD prompt playback
- volume verified in a classroom-sized room

### M2 — controls and state machine
- POWER
- Pad A detect
- Pad B detect
- ANALYZE logic
- scenario selector
- simulated SHOCK button
- CPR/reassess loop

### M3 — display and enclosure
- TFT state/instruction display
- status light
- large front-panel labels
- strain relief
- training-only markings
- no exposed conductive electrode-energy outputs

### M4 — web/ESP32 bridge
- define serial JSON event format
- connect/disconnect control in web UI
- mirror physical state in browser
- log session events
- no remote actuation of any hazardous output because no hazardous output exists

### M5 — classroom validation
- instructor walkthrough
- student usability test
- verify prompts are audible
- verify pads/buttons survive repeated use
- verify no ambiguous state transitions
- protocol wording review
- only after acceptance: prepare PR for main

## Suggested serial event model

ESP32 -> browser examples:
```json
{"type":"state","state":"APPLY_PADS"}
{"type":"pad","pad":"A","connected":true}
{"type":"pad","pad":"B","connected":true}
{"type":"scenario","value":"shockable"}
{"type":"state","state":"ANALYZING"}
{"type":"state","state":"SHOCK_ADVISED"}
{"type":"event","name":"SIMULATED_SHOCK"}
{"type":"state","state":"CPR"}
```

Browser -> ESP32 should initially be limited to safe trainer controls such as RESET or SET_SCENARIO when explicitly enabled by the instructor.

## First purchasing target

Buy only enough for one bench prototype:
- 1 ESP32-S3 DevKit
- 1 MAX98357A
- 1 4-ohm 3-W speaker
- 1 2.4–2.8 inch SPI TFT
- 1 3.3-V-compatible microSD module
- 1 microSD card
- 1 large illuminated yellow pushbutton
- 1 small power pushbutton
- 2 simple pad-detect switches/connectors
- 1 two-position scenario switch
- 1 perfboard
- wiring/connectors/resistors
- 5-V USB power source

Do not purchase any high-voltage or defibrillator discharge components.
