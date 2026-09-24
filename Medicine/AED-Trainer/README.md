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


## Teacher Monitor BLE requirement — 2026-09-24

BLE is mandatory for the near-final prototype.

The physical trainer must publish live telemetry to the Classroom Online Games Teacher Monitor. The instructor should be able to supervise several teams/trainers from one monitor.

### Required live telemetry

- trainer/device ID
- team/session identity
- battery level
- current AED training state
- Pad A and Pad B state
- ECG lead-off/contact state
- educational single-lead ECG samples
- detected R peaks / heart rate / R-R interval trend
- instructor-selected training scenario
- analyze event
- shock-advised / no-shock-advised training state
- simulated shock-button event
- CPR/reassessment state
- timestamped event stream

### BLE transport

Initial target: custom BLE GATT service with separate characteristics for:
- device/status
- state/events
- ECG sample packets
- configuration/scenario

The Teacher Monitor is the canonical instructor-facing live view. A separate ECG-only page is not the target.

### Real-person connection rule

When ECG electrodes are attached to a person:
- power the trainer from battery;
- use BLE for telemetry;
- do not maintain a USB connection to a mains-powered computer.

Real ECG remains educational/non-diagnostic and is never allowed to autonomously trigger or recommend the simulated shock path.


## Fast-track near-final BOM — 2026-09-24

### Core HMI/controller
**Preferred:** Waveshare ESP32-S3-Touch-LCD-2.8, current V2 touch version.
This board replaces the separate ESP32-S3 + TFT + microSD + external display stack for the first near-final prototype. It provides ESP32-S3, 2.8-inch capacitive touch LCD, BLE 5, Wi-Fi, 16 MB Flash, 8 MB PSRAM, TF/microSD slot, onboard speaker/audio support and battery management.

Manufacturer:
https://www.waveshare.com/esp32-s3-touch-lcd-2.8.htm

### Educational real ECG channel
**Preferred:** AD8232 single-lead ECG front-end module supplied as a kit with:
- AD8232 board
- three-lead snap cable
- disposable snap ECG electrodes

The AD8232 is used only for educational waveform acquisition, R-peak/heart-rate/R-R visualization and lead-off monitoring. It must not control the simulated AED treatment recommendation.

### Training pads
Use **reusable AED training pads**, not operational defibrillation electrodes. The preferred ready-made reference is Laerdal AED Trainer Pads (198-80550), approximately 16 x 10.3 cm with 114 cm cable. These are training accessories and are appropriate as the visual/physical pad model for the simulator.

### Power
Use a rechargeable battery/power-bank or internal Li-ion/LiPo solution compatible with the selected Waveshare board. During real-person ECG acquisition the trainer must operate from battery and communicate to the Teacher Monitor over BLE.

### Physical controls
- large momentary illuminated yellow button for SIMULATED SHOCK;
- POWER control;
- optional ANALYZE control if not handled by the touchscreen;
- instructor scenario control may be physical or Teacher-Monitor controlled.

Do not use 120 VAC illuminated panel buttons. Prefer low-voltage LED buttons whose contacts are isolated from the lamp circuit.

### Teacher Monitor
BLE is mandatory. The physical unit streams live telemetry to the Classroom Online Games Teacher Monitor:
- device/team ID
- battery
- training state
- pad state
- ECG lead state
- educational ECG waveform
- heart rate / R-R trend
- scenario
- analysis events
- simulated shock events
- CPR/reassessment
- event timeline

### Purchase-first order
1. Waveshare ESP32-S3-Touch-LCD-2.8 V2 touch
2. AD8232 kit with lead cable/electrodes
3. reusable AED training pads
4. low-voltage yellow illuminated momentary button
5. battery/power-bank
6. project enclosure
7. wiring/connectors/perfboard/strain relief
8. spare ECG electrodes


## Purchasing rule — Mercado Libre México only

Confirmed 2026-09-24: source prototype purchases only from Mercado Libre México listings that show current stock. Do not recommend Amazon, manufacturer-direct, eBay, Walmart, Steren direct, or other marketplaces for this project.

Current preferred Mercado Libre shortlist:
- Freenove ESP32-S3 2.8-inch touch display FNK0104A listing: https://www.mercadolibre.com.mx/modulo-de-pantalla-tactil-freenove-esp32s3-de-28-pulgadas/up/MLMU4138490265
- Alternative integrated ESP32-S3 touch board listing: https://www.mercadolibre.com.mx/desarrollo-de-pantalla-redonda-tactil-capacitiva-esp32-s3-de/p/MLM2077739318
- AD8232 ECG kit: https://articulo.mercadolibre.com.mx/MLM-5255490390-aad8232-ecg-kit-modulo-sensor-de-pulso-ritmo-cardiaco-_JM
- Adult Ambiderm T716 ECG electrodes, 50 pcs: https://www.mercadolibre.com.mx/electrodo-ecg-desechable-para-monitoreo-cardiaco--43x45mm/up/MLMU460139698
- Yellow 22 mm momentary pushbutton: https://articulo.mercadolibre.com.mx/MLM-3334166542-push-boton-momentaneo-metalico-22mm-color-a-elegir-_JM
- 10,000 mAh UGREEN power bank: https://www.mercadolibre.com.mx/power-bank-10000-mah-ugreen/p/MLM63623139

Training AED pads: no standalone replacement-pad listing has yet been verified as both suitable and currently in stock on Mercado Libre México. Until one is verified, do not purchase an expensive complete commercial AED trainer solely to obtain its pads; fabricate inert reusable training pads for the prototype from locally available low-voltage materials.


## Display decision — revised 2026-09-24

The AED trainer does not need a large TFT. Audio is the primary student guidance channel and the Classroom Games Teacher Monitor is the detailed instructor interface.

**Preferred display:** 1.3-inch monochrome OLED, 128x64, I2C (SH1106/SSD1306-compatible class), non-touch.
- Purpose: show only short prompts and compact status indicators.
- Typical prompts: COLOQUE PARCHES, ANALIZANDO, NO TOQUE, PRESIONE SHOCK, INICIE RCP.
- Optional icons/status: BLE, battery, pad connection.
- Use only four electrical connections: VCC, GND, SDA, SCL.
- Mount behind a clear acrylic/polycarbonate window for physical protection.

Current Mercado Libre Mexico reference observed 2026-09-24: UNIT Electronics 1.3-inch 128x64 I2C OLED around MXN 95.50 and available through Mercado Libre search listings.

**Lower-cost fallback:** 0.96-inch SSD1306 128x64 I2C OLED, around MXN 88.62 in current Mercado Libre listings. Use only if the enclosure/front-panel layout strongly favors the smaller display.

Do not use a touch display. Do not use a 2.4/2.8-inch TFT unless later testing demonstrates a real readability need.
