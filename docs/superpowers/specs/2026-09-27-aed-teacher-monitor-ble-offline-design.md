# AED Teacher Monitor + Physical Trainer — BLE/Offline Design

**Date:** 2026-09-27  
**Repository:** `Youteach-org/Classroom-Online-Games`  
**Branch:** `medicine-aed`  
**Area:** `Medicine/AED-Trainer/`

## 1. Goal

Build the instructor side of the educational AED system as a **Teacher Monitor only**. Students interact with the physical AED trainer and the manikin; they do not use a student web interface.

The Teacher Monitor configures and controls the physical AED trainer over **Bluetooth Low Energy (BLE)** and receives live trainer telemetry. During a class, the system must not depend on Wi-Fi, mobile data, Firebase, Cloudflare, or any other network service.

The physical trainer must remain able to execute its local training state machine even if the Teacher Monitor disconnects.

## 2. Approved platform strategy

The Teacher Monitor remains part of Classroom Online Games, but is built as an **offline-first web application** rather than a native iOS/Android application.

### Android

- Primary runtime: Chromium/Chrome with Web Bluetooth.
- The Teacher Monitor assets are cached locally for offline use.
- Once cached, a class session must run with Wi-Fi and mobile data disabled.
- BLE is the only communication path to the physical AED during the session.

### iPhone/iPad

- Primary runtime: **Bluefy**, used as the Web Bluetooth-capable browser.
- The Teacher Monitor is still our web application; Bluefy is only the iOS BLE bridge/browser.
- We do not publish a native application, use TestFlight, or require an Apple Developer Program membership.
- The Teacher Monitor assets must be locally available before class so the session can operate without Internet access.

### Mandatory compatibility gate

Before the iOS path is considered production-ready, test on a real iPhone/iPad with:

1. Teacher Monitor loaded/cached.
2. Wi-Fi disabled.
3. Mobile data disabled.
4. Bluefy reopened.
5. BLE scan/connect to the ESP32 trainer.
6. Scenario selection sent successfully.
7. Live state notifications received.
8. Disconnect/reconnect completed without Internet.

The Android path receives the same real-device offline test.

If either browser fails the offline requirement, that is a release blocker. The design must not silently fall back to Wi-Fi.

## 3. System boundary

### Teacher Monitor owns

- selecting the training scenario;
- selecting optional scene twists;
- selecting optional advanced clinical conditions;
- sending live instructor events;
- triggering an optional **DAR PISTA** paramedic-companion hint;
- tracking how many hints the team used during the case;
- starting, pausing, resetting, and ending a training case;
- choosing the next scripted shock/no-shock result where allowed;
- viewing state, event history, battery, pad/contact status, and other trainer telemetry;
- viewing educational ECG telemetry when that hardware phase is enabled.

### Physical AED trainer owns

- local AED training state machine;
- OLED/display state;
- prerecorded voice prompts;
- audible alerts;
- CPR metronome;
- physical SHOCK button handling;
- pad/contact sensor handling;
- simulated shock feedback;
- local safety interlocks;
- current scenario execution after it has been loaded;
- preserving safe behavior if BLE disconnects.

### The Teacher Monitor does not own

- therapeutic energy output;
- medical diagnosis;
- autonomous ECG interpretation for treatment;
- any real shock recommendation based on a real person.

## 4. Safety boundary

This is an educational trainer, not a medical device.

- No high-voltage therapeutic output exists.
- The SHOCK button is a low-voltage training input.
- Training pads are inert.
- Any ECG channel is educational/non-diagnostic.
- Real ECG data must never determine the simulated shock/no-shock branch.
- Shock/no-shock results come only from a scripted scenario or instructor command.
- Clinical conditions are scenario information, not conditions “detected” by the AED.
- The Teacher Monitor must visibly identify the connected unit as **TRAINING / SIMULATION ONLY**.
- Final Spanish prompt wording must be reviewed against the protocol used by the course before classroom release.

## 5. Training model

A case is composed from four independent layers:

```
AED base scenario
+ optional scene twist
+ optional advanced clinical condition
+ live instructor events
```

This prevents the software from requiring hundreds of separate hard-coded cases.

The student must never see the hidden scenario configuration.

## 6. Bank A — AED base scenarios

### A1 — Single-shock conversion
`SHOCK -> simulated shock -> NO SHOCK -> CPR`

### A2 — Persistent shockable rhythm
`SHOCK -> simulated shock -> SHOCK -> simulated shock -> NO SHOCK`

### A3 — Pad/contact problem before analysis
`contact fault -> correction -> SHOCK -> simulated shock -> NO SHOCK`

### A4 — Refibrillation
`SHOCK -> simulated shock -> NO SHOCK -> CPR -> SHOCK -> simulated shock -> NO SHOCK`

### A5 — Non-shockable rhythm
`NO SHOCK -> CPR -> reassessment`

### A6 — Two shocks required
`SHOCK -> simulated shock -> SHOCK -> simulated shock -> NO SHOCK`

### A7 — Recurrent complex arrest
`SHOCK -> SHOCK -> NO SHOCK -> CPR -> SHOCK -> NO SHOCK`

### A8 — Contact problem plus persistent shockable rhythm
`contact fault -> correction -> SHOCK -> SHOCK -> NO SHOCK`

The engine must represent analysis outcomes as data, not as hard-coded UI branches.

## 7. Bank B — scene twists

- **T0:** none.
- **T1:** patient removed from water / wet chest.
- **T2:** medication patch at intended pad site.
- **T3:** implanted cardiac device at/near pad site.
- **T4:** excessive chest hair / poor pad adhesion.
- **T5:** pediatric patient.
- **T6:** another person touches the patient during analysis or stand-clear.
- **T7:** patient movement / analysis artifact.
- **T8:** electrical source remains a scene hazard.

These are instructor-provided scene conditions. The AED must not present them as if it had clinically detected them.

## 8. Bank C — advanced clinical conditions

- **C0:** none.
- **C1:** pregnancy.
- **C2:** suspected opioid overdose with cardiac arrest.
- **C3:** opioid respiratory emergency with pulse.
- **C4:** drowning-related emergency.
- **C5:** severe hypothermia.
- **C6:** severe hyperthermia/heat illness.
- **C7:** electrical injury/electrocution.
- **C8:** anaphylaxis.
- **C9:** severe asthma.
- **C10:** poisoning/toxic exposure.
- **C11:** suspected pulmonary embolism.
- **C12:** patient with LVAD or other ventricular assist device.
- **C13:** suspected severe potassium/electrolyte disturbance.
- **C14:** airway obstruction progressing to cardiac arrest.
- **C15:** return of signs of life during CPR.
- **C16:** recurrent arrest after initial return of signs of life.

Clinical conditions provide context and learning objectives. They do not alter the fundamental safety boundary: the trainer never diagnoses a real person.

Exact clinical teaching actions and spoken wording for C1–C16 must be reviewed by the course physician/protocol owner before release.

## 9. Live instructor events

The Teacher Monitor must be able to inject events while a case is running without exposing the hidden configuration to students.

Initial live controls:

- force next analysis = SHOCK;
- force next analysis = NO SHOCK;
- trigger refibrillation at the next reassessment;
- pad/contact fault;
- restore pad/contact;
- movement/artifact;
- clear movement/artifact;
- person touching patient / stand-clear violation;
- clear stand-clear violation;
- pause scenario;
- resume scenario;
- restart current case;
- stop/end case;
- **DAR PISTA**: play the next available paramedic-companion hint for the active twist/clinical condition.

Each use of **DAR PISTA** must be logged with the case event stream and increment the case hint counter. A hint must guide attention without stating the complete required action or solving the scenario for the students.

Commands that would create an impossible or unsafe state must be rejected by the trainer state machine and reported back to the monitor.

## 10. Voice and audio model

The physical unit stores and plays its own prerecorded audio. The Teacher Monitor sends semantic commands/events, never streams required voice audio over BLE.

There are two clearly separated human-perception roles:

### AED voice

The AED voice is the device itself. It uses the approved **female Latin American Spanish** medical-device voice and only says things a real AED could reasonably say in the selected simulated workflow, such as:

- preparation/pad prompts;
- check pads/contact;
- do not touch / analyzing;
- shock advised;
- stand clear;
- press SHOCK;
- simulated shock delivered;
- no shock advised;
- begin/continue CPR;
- reassessment prompts.

### Paramedic companion voice

The second voice is **not an instructor and not part of the AED**. It represents a paramedic partner physically beside the trainees. It supplies scene observations or clinical information that the AED could not detect.

The planned voice is a clearly different **male Latin American Spanish** voice: natural, professional, conversational, alert/urgent without sounding panicked.

Its standard dialogue style starts naturally with **“Compañero…”** or an equivalent teammate address. It describes what the partner observes rather than announcing a diagnosis as a machine.

Examples:

- Context: “Compañero, acabamos de sacar al paciente del agua. Tiene el tórax mojado.”
- Context: “Compañero, observo que la paciente parece estar embarazada.”
- Context: “Compañero, veo un parche adherido justo donde iría uno de los electrodos.”
- Context: “Compañero, noto un dispositivo implantado debajo de la piel del pecho.”

The paramedic companion has two prompt levels:

1. **Situation/context prompt** — automatically supplies the information required to understand the selected twist or clinical situation.
2. **Optional hint prompt** — played only when the instructor presses **DAR PISTA**.

A hint must point the learner toward what to reassess without directly giving the complete answer. Example:

- Situation: “Compañero, acabamos de sacar al paciente del agua. Tiene el tórax mojado.”
- Hint: “Compañero, revisa si las condiciones permiten colocar correctamente los electrodos.”

The AED voice and paramedic-companion voice must never be interchangeable. The learner should always be able to tell whether an instruction came from the device or from the human teammate.

### Prompt catalog

Every prompt receives a stable ID shared by Teacher Monitor and firmware. Prefixes distinguish the source:

- `AED_...` — device voice.
- `PARAMEDIC_CONTEXT_...` — teammate situation/context.
- `PARAMEDIC_HINT_...` — optional teammate hint.

Examples: `AED_ANALYZING`, `AED_SHOCK_ADVISED`, `AED_CHECK_PADS`, `PARAMEDIC_CONTEXT_WET_CHEST`, `PARAMEDIC_HINT_WET_CHEST`.

Audio assets are stored locally in the trainer flash and do not require Internet or microSD during operation.

## 11. BLE architecture

The physical ESP32 acts as the **BLE Peripheral / GATT Server**.

The Teacher Monitor acts as the **BLE Central / GATT Client**.

Use a custom training service with stable UUIDs. The exact UUID values are assigned during implementation and then frozen.

### Required characteristics

**Device Status — READ + NOTIFY**
- protocol version;
- trainer/device ID;
- firmware version;
- battery level;
- connection/session status.

**Trainer State — READ + NOTIFY**
- current state;
- current base scenario;
- current twist;
- current clinical condition;
- analysis cycle/index;
- shock-enabled flag;
- pads/contact status;
- CPR/reassessment status;
- hints-used counter.

**Instructor Command — WRITE**
- load case;
- start/pause/resume/reset/end;
- inject live event;
- set next analysis result.

**Event Stream — NOTIFY**
- timestamp/sequence number;
- state transition;
- physical SHOCK press;
- pad/contact change;
- analysis start/result;
- simulated shock;
- CPR start/reassessment;
- accepted/rejected instructor command;
- disconnect/reconnect recovery event;
- paramedic context/hint prompt event and updated hints-used count.

**ECG Stream — NOTIFY, optional until ECG hardware phase**
- educational waveform packets;
- R-peak/event marker where implemented;
- heart-rate/R-R telemetry where implemented.

### Protocol rules

- Commands use versioned compact messages.
- Every command has a unique sequence ID.
- Commands that change state receive an ACK or explicit rejection.
- Duplicate command sequence IDs must not execute twice.
- On reconnect, the monitor reads the full current trainer state before enabling instructor controls.
- BLE disconnect must never enable SHOCK or change the current shock/no-shock decision by itself.

## 12. Offline architecture

The Teacher Monitor must be **offline-first**.

Local package/cache includes:

- HTML;
- CSS;
- JavaScript;
- scenario definitions;
- clinical/twist catalog;
- icons;
- manifest;
- local help/reference text required during a class.

No case-start path may require:
- authentication server access;
- Firebase;
- Cloudflare API calls;
- remote audio;
- remote fonts;
- analytics;
- external CDN assets.

Internet may be used before class to install Bluefy, initially load the Teacher Monitor, or download a newer Teacher Monitor version. It is not part of the runtime path for a training session.

The UI must show:

- **OFFLINE READY** when all required local assets are present;
- BLE connection state separately;
- the selected device ID;
- a clear warning if the local package is incomplete.

## 13. Teacher Monitor UI

There is no student-facing Classroom Games view for this trainer.

The Teacher Monitor contains:

### Connection
- scan/connect button;
- discovered compatible trainer list;
- selected trainer/device ID;
- BLE signal/connection status;
- battery status;
- firmware/protocol compatibility indicator.

### Case builder
- Base AED scenario A1–A8;
- scene twist T0–T8;
- clinical condition C0–C16;
- concise instructor-only case summary;
- Start Case.

### Live control
Large touch-friendly controls for live events, grouped by:
- rhythm/analysis;
- pads/contact;
- movement/safety;
- scenario lifecycle.

A prominent **DAR PISTA** button is available when the active twist/clinical case has an unused paramedic hint. The button shows/updates the case hint count and is disabled when no further hint exists.

### Live monitor
- current AED state;
- current analysis cycle;
- pads/contact;
- shock enabled/disabled;
- last command + ACK;
- event timeline;
- hints used;
- ECG panel when enabled.

The layout must work in portrait and landscape on phones and tablets. Instructor controls must remain usable without hover interactions.

## 14. Connection loss behavior

If BLE disconnects:

1. Physical trainer keeps the already-loaded case and safe local state.
2. It does not infer a new rhythm or change the treatment branch.
3. Teacher Monitor disables remote command buttons.
4. Teacher Monitor retains the visible last-known state but marks it stale/disconnected.
5. On reconnect, Teacher Monitor requests the authoritative current state from the trainer.
6. The event sequence number is used to identify missed/duplicate events where practical.
7. Instructor can resume control only after state resynchronization.

## 15. Code structure

The current monolithic browser prototype in `Medicine/AED-Trainer/index.html` should be split so the training logic is independently testable.

Target web structure:

```
Medicine/AED-Trainer/
  index.html
  styles.css
  app.js
  trainer-engine.js
  aed-scenarios.js
  scene-twists.js
  clinical-cases.js
  prompt-catalog.js
  ble-client.js
  offline.js
  manifest.webmanifest
  service-worker.js
  tests/
```

Responsibilities:

- `trainer-engine.js`: pure scenario/state rules used by the monitor simulation/test harness.
- `aed-scenarios.js`: A1–A8 data.
- `scene-twists.js`: T0–T8 data.
- `clinical-cases.js`: C0–C16 data.
- `prompt-catalog.js`: shared semantic prompt IDs and Spanish development copy.
- `ble-client.js`: all Web Bluetooth/GATT operations.
- `offline.js` + `service-worker.js`: offline readiness/cache lifecycle.
- `app.js`: UI orchestration only.

Firmware will mirror the protocol/state concepts but is not stored inside the web UI files.

## 16. Version 1 device scope

Version 1 supports **one actively controlled physical AED per Teacher Monitor session**.

The BLE protocol includes a stable device ID from the start so multi-trainer supervision can be added later without changing the core state/event model.

## 17. Testing and acceptance

### Pure logic tests
- every A1–A8 sequence;
- all valid/invalid state transitions;
- twist/clinical selection serialization;
- next-analysis override;
- refibrillation event;
- duplicate command rejection;
- command rejection in invalid states;
- paramedic context prompt selection;
- **DAR PISTA** selects the correct hint, increments the hint counter once, logs the event, and refuses duplicate/exhausted hints.

### BLE integration tests
- scan/filter compatible trainer;
- connect/disconnect/reconnect;
- command ACK/rejection;
- state notifications;
- missed connection recovery;
- protocol-version mismatch.

### Offline tests
On real Android and real iPhone/iPad:

- load/cache once;
- disable Wi-Fi and mobile data;
- close and reopen the runtime;
- open Teacher Monitor;
- connect by BLE;
- load a case;
- inject a live event;
- receive telemetry;
- finish/reset a case.

### Physical trainer safety tests
- SHOCK button ignored outside enabled state;
- BLE disconnect cannot enable SHOCK;
- invalid remote command cannot enable SHOCK;
- repeated command cannot apply two simulated shocks;
- no therapeutic/high-voltage output exists.

## 18. Definition of done

This architecture is complete when:

- Teacher Monitor is the only Classroom Games interface for the AED trainer;
- Android can run it offline and control the physical trainer via BLE;
- iPhone/iPad can run it offline through Bluefy and control the trainer via BLE;
- a training session requires no Wi-Fi/mobile data;
- A1–A8, T0–T8, and C0–C16 are selectable;
- live instructor events work;
- the paramedic companion supplies context separately from the AED voice;
- **DAR PISTA** plays optional non-answering hints and records hint usage;
- physical trainer continues safely through BLE disconnects;
- prompt IDs and scenario semantics are shared between monitor and firmware;
- required audio is stored on the physical trainer;
- all safety and offline acceptance tests pass on real hardware.

## 19. Explicit non-goals for this phase

- App Store publication.
- TestFlight.
- Native iOS application.
- Native Android application.
- Wi-Fi control of the trainer.
- Cloud-required training sessions.
- Student-facing web interface.
- Real therapeutic shock.
- Autonomous diagnosis from ECG.
- Remote Internet control of the physical trainer.
