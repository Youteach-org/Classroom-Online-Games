# AED ESP32 Firmware + Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the physical educational AED firmware that executes the loaded training case locally, communicates with the Teacher Monitor over BLE, plays separate AED/paramedic voices, and remains safe/usable through Bluetooth disconnects.

**Architecture:** Keep the training core, BLE protocol, display adapter, audio player, and hardware inputs separated. The current bench target is the working ESP32-WROOM-32 + ST7789 + MAX98357A + physical SHOCK button; adapters must keep migration to the final ESP32-S3 + small non-touch display localized.

**Tech Stack:** Arduino ESP32 core 3.3.12, C++17/Arduino, `ESP_I2S.h`, built-in ESP32 BLE APIs, Adafruit GFX + ST7789, LittleFS/internal flash, host-side C++ tests with `g++`, Arduino CLI compile CI.

**Spec:** `docs/superpowers/specs/2026-09-27-aed-teacher-monitor-ble-offline-design.md`

## Global Constraints

- No therapeutic/high-voltage circuitry.
- Real ECG must never determine the simulated shock/no-shock path.
- Current bench board is ESP32-WROOM-32; final board may be ESP32-S3.
- Current TFT is provisional; state logic must not depend on ST7789 APIs.
- Touch and SD are intentionally unused.
- Do not use magnetic/Hall-based pad placement detection.
- SHOCK is a low-voltage GPIO input only and acts only while the state machine explicitly enables it.
- Audio is essential and stored in internal flash; no Internet and no SD are required during operation.
- Use `ESP_I2S.h`, not legacy `driver/i2s.h`.
- AED voice = approved female Latin American Spanish device voice.
- Paramedic companion = clearly different male Latin American Spanish voice; context and hints begin naturally with “Compañero…” or equivalent teammate address.
- `DAR PISTA` consumes at most one unused hint per command and increments the hints-used counter.
- BLE disconnect must not change rhythm outcome or enable SHOCK.

## Current Bench Pin Map

- TFT CS: GPIO 5
- TFT DC: GPIO 2
- TFT RST: GPIO 4
- TFT SCK: GPIO 18
- TFT MOSI: GPIO 23
- SHOCK button: GPIO 32 to GND using `INPUT_PULLUP`
- I2S DOUT/DIN-to-amplifier: GPIO 25
- I2S LRCLK/LRC: GPIO 26
- I2S BCLK: GPIO 27
- MAX98357A SD: tied to 3V3
- MAX98357A GAIN: unconnected
- TFT touch/SD/MISO: unused

## Review Focus

1. **BLE loss during SHOCK-ready:** physical state must stay authoritative and no remote reconnect can duplicate the simulated shock. Covered in Tasks 2, 4, and 8.
2. **Audio unavailable/corrupt:** firmware must continue state logic and show the prompt on-screen rather than hang. Covered in Task 6.
3. **Button bounce/repeated press:** one physical press may produce at most one simulated shock event. Covered in Tasks 3 and 8.
4. **Full audio pack exceeds flash:** asset build must fail/report size clearly rather than silently omit clips. Covered in Task 7.
5. **Protocol drift:** firmware UUIDs/version/field names must match the Teacher Monitor protocol constants exactly. Covered in Task 2 and CI.

---

### Task 1: Create pure physical-trainer core

**Files:**
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/trainer-core.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/trainer-core.cpp`
- Create: `Medicine/AED-Trainer/firmware/tests/trainer-core-test.cpp`

**Interfaces:**
- Produces `TrainerCore` independent of Arduino/display/audio/BLE.
- Core state enum includes `OFF`, `STARTUP`, `APPLY_PADS`, `ANALYZING`, `SHOCK_ADVISED`, `NO_SHOCK_ADVISED`, `WAITING_SHOCK`, `CPR`, `REASSESS`.
- Core exposes case config A1–A8/T0–T8/C0–C16, analysis index, hint counter, prompt-event queue, and safe command application.

- [ ] **Step 1: Write failing host tests**
  - A1–A8 analysis sequences;
  - SHOCK input ignored unless `WAITING_SHOCK`;
  - one accepted SHOCK input advances exactly once;
  - duplicate remote command sequence ID does not execute twice;
  - BLE connect/disconnect event does not alter shock/no-shock result;
  - hint request selects next unused hint and increments once;
  - invalid command leaves core state unchanged.

- [ ] **Step 2: Run RED**
  - Run: `g++ -std=c++17 Medicine/AED-Trainer/firmware/tests/trainer-core-test.cpp Medicine/AED-Trainer/firmware/aed-trainer/trainer-core.cpp -o /tmp/aed-core-test && /tmp/aed-core-test`
  - Expected: FAIL because core does not exist.

- [ ] **Step 3: Implement minimal `TrainerCore`**

- [ ] **Step 4: Run GREEN**
  - Run the same command.
  - Expected: exit 0 with all assertions passing.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add hardware-independent trainer core`

### Task 2: Mirror BLE protocol v1 in firmware

**Files:**
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/ble-protocol.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/ble-protocol.cpp`
- Create: `Medicine/AED-Trainer/firmware/tests/ble-protocol-test.cpp`

**Interfaces:**
- Must exactly match Teacher Monitor plan:
  - Protocol version: `1`
  - Service: `7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Device Status: `7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Trainer State: `7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Instructor Command: `7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40`
  - Event Stream: `7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40`
  - ECG Stream: `7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40`
- V1 messages are compact UTF-8 JSON with `v` and `seq` where applicable.

- [ ] **Step 1: Write failing codec tests**
  - parse load-case/lifecycle/live-event/hint commands;
  - reject malformed version/sequence;
  - serialize device status, trainer state, ACK/rejection and event messages;
  - representative payloads stay below 180 bytes.

- [ ] **Step 2: Run RED**
  - Run host compile/test command for protocol files.
  - Expected: FAIL.

- [ ] **Step 3: Implement protocol codec without Arduino-only dependencies**

- [ ] **Step 4: Run GREEN**
  - Expected: exit 0.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): mirror BLE protocol v1 in firmware`

### Task 3: Add hardware adapters for current bench prototype

**Files:**
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/hardware-config.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/display-adapter.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/display-adapter.cpp`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/input-adapter.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/input-adapter.cpp`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/aed-trainer.ino`
- Create: `.github/workflows/aed-firmware-ci.yml`

**Interfaces:**
- `DisplayAdapter::showState(state, message)` is the only display-facing API used by main firmware.
- `InputAdapter::shockPressed()` returns a debounced edge, not a held level.
- No touch/SD code.

- [ ] **Step 1: Add CI compile workflow first**
  - Install Arduino CLI.
  - Install ESP32 core version 3.3.12.
  - Install Adafruit GFX and Adafruit ST7735/ST7789 libraries.
  - Compile `Medicine/AED-Trainer/firmware/aed-trainer` for generic ESP32 WROOM target.
  - Expected initial CI failure because sketch/adapters are absent.

- [ ] **Step 2: Implement hardware config and adapters**
  - ST7789 init: `tft.init(240, 320)`, rotation 0.
  - Use the known complementary color constants for this provisional display.
  - SHOCK input GPIO32 with `INPUT_PULLUP`.
  - Debounce/edge logic prevents repeated press events.

- [ ] **Step 3: Wire minimal sketch around `TrainerCore`**
  - Core owns decisions; sketch only polls hardware, advances timers, renders, and forwards events.

- [ ] **Step 4: Verify Arduino CI compile**
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add bench hardware adapters`

### Task 4: Implement BLE GATT server and authoritative resync

**Files:**
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/ble-server.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/ble-server.cpp`
- Modify: `Medicine/AED-Trainer/firmware/aed-trainer/aed-trainer.ino`

**Interfaces:**
- Consumes `TrainerCore` + Task 2 protocol.
- Implements all five characteristics; ECG characteristic may advertise/notify no samples until ECG phase.
- Commands route into `TrainerCore`.
- State/event notifications include sequence IDs.
- On BLE reconnect, current device status and full trainer state are readable immediately.

- [ ] **Step 1: Add failing source-contract test**
  - Create `Medicine/AED-Trainer/tests/firmware-contract.test.mjs`.
  - Assert exact UUIDs/version are present in both web and firmware protocol files.
  - Assert BLE server exposes command write + state/event notify paths.

- [ ] **Step 2: Run RED**
  - Run: `node --test Medicine/AED-Trainer/tests/firmware-contract.test.mjs`
  - Expected: FAIL before server exists.

- [ ] **Step 3: Implement GATT server**
  - Use built-in ESP32 BLE APIs.
  - Connection/disconnection only updates connectivity telemetry; never treatment state.

- [ ] **Step 4: Run contract test + Arduino CI compile**
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add BLE GATT trainer server`

### Task 5: Freeze Spanish dialogue script and prompt routing

**Files:**
- Create: `Medicine/AED-Trainer/audio/prompt-script.json`
- Create: `Medicine/AED-Trainer/tests/prompt-script.test.mjs`
- Modify: `Medicine/AED-Trainer/prompt-catalog.js`

**Interfaces:**
- Each prompt entry contains `id`, `role`, `text`, `voiceProfile`, `filename`, and `releaseReviewRequired`.
- Voice profiles:
  - `aed-female-latam`
  - `paramedic-male-latam`
- Parametric context/hints use `PARAMEDIC_CONTEXT_...` and `PARAMEDIC_HINT_...`.

- [ ] **Step 1: Write failing script tests**
  - every prompt catalog ID has exactly one script row;
  - all AED prompts use female profile;
  - all paramedic prompts use male profile;
  - all hints start naturally as teammate dialogue and differ from context;
  - every twist/clinical case that supports hints has at least one hint;
  - no release-review-required medical prompt is silently marked final.

- [ ] **Step 2: Run RED**
  - Expected: FAIL because script file does not exist.

- [ ] **Step 3: Write the complete development dialogue set**
  - AED wording follows the approved manufacturer-inspired LATAM flow already established in the project.
  - Paramedic companion describes observations rather than pretending the device detected them.
  - Hints direct attention without giving the complete required action.

- [ ] **Step 4: Run GREEN**
  - Run: `node --test Medicine/AED-Trainer/tests/prompt-script.test.mjs`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add bilingual-role prompt script catalog`

### Task 6: Add resilient local audio player

**Files:**
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/audio-player.h`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/audio-player.cpp`
- Create: `Medicine/AED-Trainer/firmware/aed-trainer/prompt-map.h`
- Modify: `Medicine/AED-Trainer/firmware/aed-trainer/aed-trainer.ino`

**Interfaces:**
- `AudioPlayer::begin()`
- `AudioPlayer::playPrompt(promptId)`
- `AudioPlayer::stop()`
- Playback uses `ESP_I2S.h` with BCLK 27, LRC 26, DOUT 25.
- Prompt lookup uses local internal-flash asset names.
- Missing/corrupt clip returns failure but never blocks state transitions.

- [ ] **Step 1: Add failing firmware contract tests**
  - assert `ESP_I2S.h` is used and legacy `driver/i2s.h` is absent;
  - assert audio pins match bench wiring;
  - assert missing audio has an explicit nonblocking error path.

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Implement local audio player**
  - Use internal LittleFS.
  - Initial decoded output is mono PCM16 written to stereo I2S slots for the MAX98357A, matching the already-proven hardware path.
  - Audio asset encoding is decided in Task 7 based on measured pack size; player API remains unchanged.

- [ ] **Step 4: Run contract tests + Arduino compile**
  - Expected: PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add resilient I2S prompt player`

### Task 7: Generate and package the two voice sets

**Files:**
- Create: `Medicine/AED-Trainer/audio/README.md`
- Create: `Medicine/AED-Trainer/audio/manifest.json`
- Create: `Medicine/AED-Trainer/audio/tools/verify-audio-pack.py`
- Create binary assets under: `Medicine/AED-Trainer/audio/assets/`

**Interfaces:**
- AED voice uses approved HeyGen voice ID `fWZozqyB99JyQDYA98eg` (`LatAm Med Instructor`) as the base, adjusted to sound slightly more animated/urgent without panic.
- Paramedic companion uses a newly designed/selected male `es-MX` voice.
- Asset filenames exactly match Task 5.
- All assets are mono, normalized consistently, and converted to the selected internal-flash format.

- [ ] **Step 1: Generate one AED and one paramedic audition clip**
  - AED audition: an analysis/shock prompt.
  - Paramedic audition: one “Compañero…” context line.
  - Verify the voices are unmistakably different.

- [ ] **Step 2: Generate all development clips after audition acceptance**
  - No Creative Claw.
  - Store generation metadata in `manifest.json`.

- [ ] **Step 3: Measure the full pack**
  - Prefer 16 kHz mono PCM if it fits the chosen flash partition.
  - If it does not fit, convert the full set consistently to IMA ADPCM and add decoder support behind the same `AudioPlayer` interface.
  - Do not silently mix formats or omit prompts.
  - `verify-audio-pack.py` fails if files are missing, format differs, or pack exceeds the documented partition budget.

- [ ] **Step 4: Verify**
  - Run the audio-pack verifier.
  - Expected: 0 missing prompts; all formats valid; size within budget.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): add local AED and paramedic audio pack`

### Task 8: Integrate local state, audio, display, SHOCK, and BLE

**Files:**
- Modify: `Medicine/AED-Trainer/firmware/aed-trainer/aed-trainer.ino`
- Modify supporting firmware modules from Tasks 1–7.
- Extend: `Medicine/AED-Trainer/firmware/tests/trainer-core-test.cpp`
- Extend: `Medicine/AED-Trainer/tests/firmware-contract.test.mjs`

**Interfaces:**
- Startup loads a case from BLE or safe default idle.
- Core prompt events route to display + audio.
- Parametric context/hints route to paramedic audio IDs.
- SHOCK physical press routes only to core; BLE never directly fakes a button press.
- Event/state telemetry reflects the resulting core transition.

- [ ] **Step 1: Add failing integration tests**
  - shock-ready + one button edge = one simulated shock;
  - second bounce/press after transition is ignored;
  - BLE disconnect during active case preserves decision/state;
  - reconnect state serialization matches current core;
  - hint command plays the correct paramedic prompt and increments telemetry once;
  - missing audio does not stop state transition.

- [ ] **Step 2: Run RED**

- [ ] **Step 3: Wire complete loop**

- [ ] **Step 4: Run host tests, Node contract tests, and Arduino compile**
  - Expected: all PASS.

- [ ] **Step 5: Commit**
  - Commit: `feat(aed): integrate physical trainer runtime`

### Task 9: Clean outdated hardware docs and add bench acceptance procedure

**Files:**
- Modify: `Medicine/AED-Trainer/README.md`
- Create: `Medicine/AED-Trainer/firmware/BENCH-ACCEPTANCE.md`

**Interfaces:**
- Documentation must match actual current prototype.
- Remove contradictory Hall/magnet pad-placement guidance.
- State that touch and SD are intentionally unused.
- Record current WROOM/TFT/MAX/SHOCK wiring and future display/S3 migration boundary.

- [ ] **Step 1: Update README and remove obsolete magnetic-pad references**

- [ ] **Step 2: Write bench checklist**
  - TFT boot/state display;
  - voice playback;
  - SHOCK lockout outside allowed state;
  - A1 and A5 full runs;
  - paramedic context + `DAR PISTA`;
  - BLE command/ACK/state notifications;
  - disconnect/reconnect;
  - no Wi-Fi dependency.

- [ ] **Step 3: Run all automated verification**
  - Host C++ tests.
  - `node --test Medicine/AED-Trainer/tests/*.test.mjs`.
  - Arduino CLI compile.
  - Audio pack verifier.

- [ ] **Step 4: Commit**
  - Commit: `docs(aed): align hardware docs with physical prototype`

## Completion Gate

Before this plan is complete:

- host core/protocol tests pass;
- Teacher Monitor protocol and firmware protocol match exactly;
- Arduino ESP32 core 3.3.12 compile succeeds;
- physical SHOCK safety rules are exercised by tests;
- two distinct local voice roles are packaged;
- every prompt ID resolves to a local asset or explicit safe fallback;
- Bluetooth disconnect/reconnect does not alter clinical simulation decisions;
- outdated magnetic-pad guidance is removed;
- real bench acceptance remains explicitly pending until the physical device is flashed and exercised.
