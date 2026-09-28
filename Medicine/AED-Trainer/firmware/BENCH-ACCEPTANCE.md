# AED physical trainer — Bench Acceptance

This checklist is the physical release gate for the current ESP32-WROOM-32 educational AED prototype.

The trainer is **simulation-only**. There is no therapeutic/high-voltage output.

## Bench hardware

- ESP32-WROOM-32 development board.
- Final tested 0.96-inch bicolor SSD1306 128x64 I2C OLED.
- MAX98357A I2S mono amplifier.
- 3 ohm / 3 W speaker.
- Physical momentary SHOCK button on GPIO32 to GND with `INPUT_PULLUP`.
- START/PAUSE button on GPIO33 to GND.
- MODE button on GPIO14 to GND.
- RESET button on GPIO13 to GND.
- BCLK GPIO27, LRC GPIO26, audio DOUT GPIO25.
- No Hall sensors or magnets.

## Firmware / flash preparation

- [ ] Build firmware with Arduino ESP32 core **3.3.12**.
- [ ] Confirm the custom `partitions.csv` is selected/applied for the 4 MB WROOM.
- [ ] Build the voice set with `audio/tools/build-audio-pack.py`.
- [ ] Run `audio/tools/verify-audio-pack.py`; it reports 61 clips, IMA-ADPCM mono 10 kHz, within the 1,750,000-byte budget.
- [ ] Load all `audio/assets/*.wav` files into LittleFS under `/audio/`.
- [ ] Flash the firmware.
- [ ] Disconnect any programming setup that is not required for the classroom test.

## Boot / display / audio

- [ ] Trainer boots without Wi-Fi and without Teacher Monitor.
- [ ] A short two-tone startup sound is heard immediately, confirming the local I2S amplifier/speaker path.
- [ ] OLED shows the idle/connection message.
- [ ] Teacher Monitor is not required for the trainer to remain safely idle.
- [ ] LittleFS mounts without formatting itself.
- [ ] AED female voice plays clearly through MAX98357A/speaker.
- [ ] Paramedic male voice is clearly distinguishable from the AED voice.
- [ ] If one test audio file is deliberately absent, the trainer continues the state transition and leaves the prompt text visible instead of hanging.

## Standalone controls

- [ ] With BLE disconnected, MODE cycles A1 through A8 while the trainer is idle.
- [ ] With BLE disconnected, START launches the selected local base case.
- [ ] During an active local case, START pauses and a second press resumes.
- [ ] RESET returns the trainer to idle without requiring BLE.
- [ ] Teacher Monitor may connect or disconnect without stopping the local case.
- [ ] The idle screen says START can begin locally and BLE is optional.

## SHOCK safety

- [ ] Pressing SHOCK in OFF does nothing.
- [ ] Pressing SHOCK in STARTUP does nothing.
- [ ] Pressing SHOCK in APPLY_PADS does nothing.
- [ ] Pressing SHOCK in ANALYZING does nothing.
- [ ] Pressing SHOCK in SHOCK_ADVISED before the core reaches WAITING_SHOCK does nothing.
- [ ] In WAITING_SHOCK, one deliberate button press creates exactly one simulated-shock event.
- [ ] Holding/bouncing the button does not create a second event after the state advances to CPR.
- [ ] Trigger **Persona tocando** from Teacher Monitor while WAITING_SHOCK; physical SHOCK is blocked.
- [ ] Clear the stand-clear violation; the next deliberate SHOCK press is accepted.
- [ ] No test produces any therapeutic electrical output.

## A1 full run

Load **A1 + T0 + C0**.

- [ ] STARTUP prompts play.
- [ ] APPLY_PADS prompt plays.
- [ ] ANALYZING occurs.
- [ ] First analysis becomes SHOCK.
- [ ] Device reaches WAITING_SHOCK.
- [ ] Physical SHOCK press advances once to CPR.
- [ ] Reassessment preserves the scripted sequence.
- [ ] Next analysis becomes NO_SHOCK.
- [ ] No BLE disconnect changes either scripted result.

## A5 no-shock run

Load **A5 + T0 + C0**.

- [ ] ANALYZING occurs.
- [ ] Result is NO_SHOCK.
- [ ] Physical SHOCK remains locked out.
- [ ] Device advances to CPR.
- [ ] Reassessment does not create a shockable result unless the instructor explicitly issues a next-analysis override.

## Context + DAR PISTA

Load **A1 + T1 + C1**.

- [ ] AED voice remains the device voice.
- [ ] Paramedic context describes the wet chest as a teammate observation.
- [ ] Paramedic context describes pregnancy as a teammate observation.
- [ ] Press **DAR PISTA** once: wet-chest hint plays and telemetry increments exactly once.
- [ ] Press **DAR PISTA** again: pregnancy hint plays and telemetry increments exactly once.
- [ ] A third hint request is rejected/no-op because no unused hint remains.
- [ ] No paramedic context is presented as something the AED itself detected.

## Live instructor events

- [ ] **Falla de contacto** prevents a new analysis and plays/checks the electrode prompt.
- [ ] **Restaurar contacto** allows analysis again.
- [ ] **Movimiento / artefacto** holds analysis resolution until cleared.
- [ ] **Próximo análisis: SHOCK** affects one next analysis only.
- [ ] **Próximo análisis: NO SHOCK** affects one next analysis only.
- [ ] **Refibrilación** affects the next reassessment only.
- [ ] Pause stops automatic state progression.
- [ ] Resume continues progression.
- [ ] Restart resets analysis/hint progress without changing the loaded case.
- [ ] End returns to safe OFF and clears pending prompts/progress.

## BLE / Teacher Monitor

Run once on Android Chrome/Chromium and once on iPhone/iPad Bluefy.

- [ ] Wi-Fi OFF.
- [ ] Mobile data OFF.
- [ ] Bluetooth ON.
- [ ] Teacher Monitor opens from its cached offline shell.
- [ ] It discovers only the AED BLE service.
- [ ] Connection reaches SYNCING before READY.
- [ ] Remote controls remain disabled until status and authoritative trainer state are read.
- [ ] Case A/T/C selection reaches the physical trainer.
- [ ] Command ACK/rejection appears in telemetry.
- [ ] State notifications reflect physical SHOCK and automatic transitions.
- [ ] Disconnect BLE during an active case: trainer keeps its local state and scripted decision.
- [ ] Reconnect: Teacher Monitor rereads authoritative state before re-enabling controls.
- [ ] Reconnect does not replay/duplicate a prior simulated shock.
- [ ] No class action depends on Wi-Fi, Firebase, cloud APIs, streamed audio, or SD storage.

## Final OLED display check

- [ ] OLED powers from 3.3 V and is detected at I2C address 0x3C.
- [ ] SDA is GPIO21 and SCL is GPIO22.
- [ ] Yellow upper physical band is used for warning/state information.
- [ ] Blue lower physical area is used for operating state/instructions.
- [ ] Display remains non-touch.
- [ ] No ST7789/TFT runtime dependency remains in the firmware.

## Record

| Field | Value |
|---|---|
| Date | |
| ESP32 board | |
| Flash size confirmed | |
| Firmware commit | |
| Audio manifest total bytes | |
| Android device / OS / Chrome | |
| iPhone/iPad / iOS / Bluefy | |
| A1 | PASS / FAIL |
| A5 | PASS / FAIL |
| DAR PISTA | PASS / FAIL |
| SHOCK lockout | PASS / FAIL |
| Stand-clear lockout | PASS / FAIL |
| Audio fallback | PASS / FAIL |
| BLE disconnect/resync | PASS / FAIL |
| Fully offline runtime | PASS / FAIL |
| Notes | |

The physical trainer is accepted only when every required row passes.
