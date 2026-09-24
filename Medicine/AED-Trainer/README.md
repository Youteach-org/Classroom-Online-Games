# AED Educational Trainer (ESP32 + Classroom Online Games)

## Purpose

Build a classroom AED trainer for first-aid education using an ESP32-S3. It must reproduce AED-like prompts, lights, buttons and training states, but it must **never** generate a therapeutic electrical shock, acquire ECG for diagnosis, or claim to be a medical device.

The physical trainer and the web simulator must share the same conceptual state machine.

## Safety boundary

- No high-voltage transformer, capacitor bank, charging circuit or electrode-energy output.
- The SHOCK button is a low-voltage GPIO input only.
- Training pads are inert.
- Rhythm/decision is selected by the instructor or by a scripted scenario; the device does not diagnose a real person.
- All audio prompts are training prompts and must be reviewed against the protocol used in the course before classroom release.

## Recommended prototype hardware

### Core
1. ESP32-S3 DevKitC-1 or equivalent ESP32-S3 development board — 1
2. USB-C data/power cable — 1
3. 5 V / 2 A USB power supply or USB power bank — 1

### Audio
4. MAX98357A I2S class-D mono amplifier — 1
5. 4 ohm, 3 W speaker, approximately 40–50 mm — 1
6. microSD SPI module that is explicitly 3.3 V compatible — 1
7. microSD card, 4–16 GB — 1

Recommended audio format for the first prototype: prerecorded mono WAV files. Store prompts on microSD so wording can be replaced without recompiling firmware.

### Display and indicators
8. 2.4–2.8 inch SPI TFT display, preferably ILI9341 320x240 — 1
9. RGB status LED or small addressable RGB LED module — 1
10. Optional illuminated POWER button — 1
11. Large illuminated yellow SHOCK pushbutton — 1

### Inputs / simulated pads
12. Two low-voltage pad-detection inputs — 2 channels
13. Two simulated training pads with inert cable/connector — 1 pair
14. Two momentary switches or connector-detect contacts for the first prototype — 2
15. Instructor scenario selector: 2-position switch or rotary encoder — 1

### Build materials
16. Solderable perfboard or small prototype PCB — 1
17. Dupont/JST wiring, headers and connectors — as needed
18. 220–330 ohm resistors for indicator LEDs — as needed
19. 10 kohm pull-up/pull-down resistors if not using internal pulls — as needed
20. Heat-shrink tubing and cable strain relief — as needed
21. Enclosure: 3D printed shell, laser-cut box or foam/PVC prototype enclosure — 1
22. Printed labels: POWER, ANALYZE/STATUS, SHOCK, TRAINING ONLY — 1 set

## Optional phase-2 pad placement detection

For detecting whether the pads are placed on the correct zones of a manikin rather than merely plugged into the trainer:
- 2 Hall-effect sensors in the pad backs plus small magnets/targets in the manikin, or
- 4 low-voltage conductive contacts in the manikin with matching contacts on the pads.

This remains low-voltage sensing only.

## Proposed ESP32-S3 pin map

This is a starting map and must be verified against the exact development board purchased.

| Function | Proposed GPIO |
|---|---:|
| I2S audio DATA | 4 |
| I2S audio BCLK | 5 |
| I2S audio LRCLK | 6 |
| TFT CS | 10 |
| TFT MOSI | 11 |
| TFT SCK | 12 |
| TFT DC | 9 |
| TFT RESET | 8 |
| microSD CS | 13 |
| microSD MISO | 14 |
| POWER button | 1 |
| SHOCK button | 2 |
| Pad A detect | 16 |
| Pad B detect | 17 |
| Scenario selector | 18 |
| RGB status LED | 21 |

Avoid GPIO 0 and other boot/strapping pins for front-panel controls. Avoid pins reserved by the specific board's native USB interface.

## Training state machine

1. OFF
2. SELF_TEST / STARTUP
3. APPLY_PADS
4. READY_TO_ANALYZE
5. ANALYZING
6. SHOCK_ADVISED or NO_SHOCK_ADVISED
7. STAND_CLEAR
8. SIMULATED_SHOCK (no electrical output)
9. CPR
10. REASSESS

The instructor-selected scenario determines the result of ANALYZING.

## Audio prompt set — first pass

Suggested file naming:
- 001-power-on.wav
- 002-call-for-help.wav
- 003-attach-pads.wav
- 004-check-pads.wav
- 005-do-not-touch-analyzing.wav
- 006-shock-advised.wav
- 007-stand-clear.wav
- 008-press-shock.wav
- 009-simulated-shock-delivered.wav
- 010-no-shock-advised.wav
- 011-begin-cpr.wav
- 012-continue-cpr.wav
- 013-reassess.wav
- 014-low-battery-training.wav
- 015-training-complete.wav

The final Spanish wording is not frozen yet.

## Web simulator

Path:
- /Medicine/
- /Medicine/AED-Trainer/

The web version currently runs independently and simulates the physical state machine. Browser speech is temporary. The physical trainer will use prerecorded local audio.

## Physical-to-web integration options

Phase 1: independent web simulator and independent ESP32 trainer.

Phase 2 recommended: Web Serial over USB from a teacher laptop running Chromium. The page receives low-risk state/status events from the ESP32 and can mirror them on screen.

Later optional: BLE GATT for wireless state mirroring. Do not require BLE for the first working trainer.

## Definition of done for version 1

- Physical front panel powers on and plays clear audio.
- Both simulated pad inputs are detected.
- Instructor can choose shockable/non-shockable training scenario.
- Analyze sequence locks inputs briefly and plays the correct prompt.
- SHOCK button is enabled only in the simulated shock-advised state.
- Pressing SHOCK produces only sound/light/UI feedback.
- CPR state and reassessment loop work.
- Web simulator follows the same sequence.
- No high-voltage hardware exists in the unit.
- Final prompt wording has been reviewed for the course.
