# AED Educational Trainer

Educational AED training system inside **Classroom Online Games**.

The project has two parts:

1. **Physical AED trainer (ESP32)** — the autonomous device students use.
2. **Teacher Monitor** — an optional instructor control panel that adds scenarios, twists, hints and live overrides over Bluetooth Low Energy (BLE).

There is **no student web interface** for this trainer.

## Safety

This is a training device, not a medical device.

- No therapeutic/high-voltage shock circuitry.
- The SHOCK button is a low-voltage training input only.
- Training pads are inert.
- Any ECG channel is educational/non-diagnostic.
- Real ECG must never decide the simulated shock/no-shock branch.
- Shock/no-shock decisions come only from the scripted case or an instructor command.
- Clinical conditions are scenario information, not diagnoses made by the AED.

## Teacher Monitor

Path:

- `/Medicine/AED-Trainer/`

The Teacher Monitor is an **offline-first web application**.

### Android

Use Chrome/Chromium with Web Bluetooth.

### iPhone/iPad

Use **Bluefy** as the Web Bluetooth-capable browser. We do not require a native iOS app, TestFlight, App Store publication, or an Apple Developer Program account.

### During class

The physical trainer does **not** depend on Teacher Monitor. It can run a basic AED case entirely by itself.

Standalone controls:

- **START** — GPIO33 to GND. Starts the selected local case.
- **MODE** — GPIO14 to GND. While idle, cycles through local base scenarios A1–A8.
- **PADS / OK** — GPIO13 to GND. Confirms that the learner has placed the inert training electrodes; analysis cannot begin before this confirmation.
- **RESET** — GPIO17 to GND. Ends the current case and returns the trainer to idle.
- **SHOCK** — GPIO32 to GND. Accepted only when the core is in WAITING_SHOCK and stand-clear safety permits it.

When Teacher Monitor is connected, the extended path is:

`Teacher Monitor <-> Bluetooth LE <-> autonomous physical ESP32 trainer`

Disconnecting BLE never stops the local case or changes the scripted shock/no-shock result.

A class session must not depend on:

- Wi-Fi;
- mobile data;
- Firebase;
- Cloudflare APIs;
- remote fonts;
- analytics;
- CDNs;
- streamed voice audio.

Internet is allowed before class only to initially load/update the Teacher Monitor or install Bluefy.

### Standalone training flow

The autonomous trainer is **learner-action driven**, not a timed recording. After START, **PADS / OK** confirms each learner step in order: check responsiveness, request emergency help, check breathing, expose the chest, and confirm placement of the training electrodes. The device does not advance those learner actions on a timer. Only after pad placement is confirmed does simulated analysis begin. SHOCK waits indefinitely for the physical SHOCK button when advised. The CPR display holds at **2:00** while the CPR instruction plays; the full two-minute cycle and 110/min metronome begin only after that audio finishes. At 0:00 the trainer moves to reassessment. A scripted contact fault returns the trainer to pad placement and requires PADS / OK again.

### OLED operating views

The bicolor 128x64 OLED now uses its physical color split as part of the trainer UI:

- during simulated analysis, the lower blue area displays an animated educational ECG trace;
- shock-advised/waiting-shock states draw warning triangles in the yellow band and a large SHOCK prompt below;
- during CPR, the screen shows a 2:00-to-0:00 countdown together with the 110/min target;
- pad placement remains a manual PADS/OK training event, so no AD8232 or real ECG electronics are required.

The ECG waveform is illustrative and follows the scripted scenario. It never makes a clinical shock/no-shock decision.

### Audio level

Firmware applies bounded digital gain to the local voice pack and louder local startup/metronome cues. The MAX98357A remains usable at its default hardware gain; if additional bench volume is required, the hardware GAIN pin can be evaluated separately rather than encoding device-specific analog gain into the firmware.

## Training model

A case is assembled from independent layers:

`AED base scenario + optional scene twist + optional advanced clinical condition + live instructor events`

Current banks:

- **A1–A8:** AED/rhythm behavior.
- **T0–T8:** scene twists.
- **C0–C16:** advanced clinical context.

The student never sees the hidden case configuration.

## Live instructor controls

The Teacher Monitor can:

- force the next analysis to SHOCK;
- force the next analysis to NO SHOCK;
- trigger refibrillation;
- create/clear pad-contact faults;
- create/clear movement artifact;
- create/clear a stand-clear violation;
- pause/resume/restart/end the case;
- use **DAR PISTA**.

## Two voice roles

### AED voice

Female Latin American Spanish. It represents the device itself and is limited to AED-like prompts. The V10 `AED_BEGIN_CPR` prompt uses the separately approved Lucía take so **ERRE CE PE** is intelligible; the rest of the AED prompt bank is not replaced by that voice.

### Paramedic companion

A separate male Latin American Spanish voice. It represents a human teammate beside the trainees.

Context lines are conversational, for example:

> Compañero, acabamos de sacar al paciente del agua. Tiene el tórax mojado.

**DAR PISTA** requests an additional teammate hint. The hint directs attention without stating the full answer. Hint usage is counted in the case telemetry.

Required audio is stored locally on the physical trainer; BLE does not stream required audio.

## BLE protocol

The ESP32 is the BLE Peripheral / GATT Server.

The Teacher Monitor is the BLE Central / GATT Client.

Protocol v1 uses compact semicolon-separated `key=value` records and stable UUIDs defined in:

- `ble-protocol.js`

The monitor will not enable remote controls after reconnect until it has reread the authoritative status and trainer state.

## Offline files

The local application shell includes:

- `index.html`
- `styles.css`
- `app.js`
- scenario catalogs
- prompt catalog
- trainer engine
- BLE protocol/client
- offline helper
- manifest
- service worker

The UI explicitly reports whether the required shell is cached.

## Current physical bench prototype

Confirmed working together:

- ESP32-WROOM-32 development board.
- Tested 0.96-inch bicolor SSD1306 128x64 I2C OLED.
- MAX98357A I2S mono amplifier.
- 3 ohm / 3 W speaker.
- Physical SHOCK button on GPIO32.
- Physical START button on GPIO33.
- Physical MODE button on GPIO14.
- Physical PADS/OK button on GPIO13.
- Physical RESET button on GPIO17.

Current working audio pins:

- BCLK: GPIO27
- LRC: GPIO26
- DOUT: GPIO25

At power-on, the ESP32 generates a short local two-tone speaker self-test over I2S. This does not depend on LittleFS or the voice files, so hearing it immediately confirms the MAX98357A/speaker path is alive.

The final bench display is the tested 128x64 bicolor OLED. It is wired VCC→3V3, GND→GND, SDA→GPIO21 and SCL→GPIO22 at I2C address 0x3C. Its physical yellow upper band is reserved for warning/status information and its blue lower area for operating information. The display is non-touch. **No Hall sensors or magnets are used for pad placement.** Training-pad placement is evaluated by the instructor.

Display access remains isolated behind the display adapter, so TrainerCore does not depend on SSD1306 APIs.

### Local voice pack

The development dialogue set contains **61 local prompts** with two distinct roles:

- female Latin-American Spanish AED voice;
- male paramedic-companion voice.

The source recordings total about **287 seconds**. PCM16 is too large for the current 4 MB WROOM, so the bench package is standardized as **WAV IMA-ADPCM, mono, 10 kHz**, stored in LittleFS. The firmware decoder converts it to PCM16 and duplicates the samples to stereo I2S slots for the MAX98357A.

A custom no-OTA WROOM partition reserves 2 MB for the firmware application and the remaining large region for LittleFS. The audio pack has a 1,750,000-byte build budget and fails verification rather than silently dropping clips.

See [audio/README.md](./audio/README.md) for the build and verification details.

## Development documents

Approved architecture:

- [BLE/offline design](../../docs/superpowers/specs/2026-09-27-aed-teacher-monitor-ble-offline-design.md)

Implementation plans:

- [Teacher Monitor offline BLE](../../docs/superpowers/plans/2026-09-27-aed-teacher-monitor-offline-ble.md)
- [ESP32 firmware and audio](../../docs/superpowers/plans/2026-09-27-aed-esp32-firmware-audio.md)

Hardware acceptance:

- [Physical trainer bench acceptance](./firmware/BENCH-ACCEPTANCE.md)
- [Real-device Teacher Monitor acceptance](./REAL-DEVICE-ACCEPTANCE.md)

## Current release gates

Teacher Monitor software can be verified automatically for its local logic and contracts, but release still requires physical acceptance on:

- real Android + Chrome/Chromium;
- real iPhone/iPad + Bluefy;
- the physical ESP32 trainer;
- all 61 generated audio files built and loaded into LittleFS;
- the physical SHOCK lockout, stand-clear lockout, A1/A5 flows and audio fallback exercised using the bench checklist.

The voice-source generation and compact binary audio pack are complete. GitHub Actions builds and verifies the flashable firmware/LittleFS package.

iOS support is not accepted until Bluefy is proven to reopen the cached monitor offline and communicate with the trainer over BLE with Wi-Fi and mobile data disabled.
