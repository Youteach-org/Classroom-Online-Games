# AED Teacher Monitor — Real-device Acceptance

This checklist is a **release gate** for the offline Bluetooth Teacher Monitor. It must be run on real hardware; browser emulators are not sufficient.

## Required hardware

- One physical ESP32 AED educational trainer advertising BLE protocol v1.
- One Android phone/tablet with Chrome or Chromium Web Bluetooth.
- One iPhone/iPad with Bluefy installed.
- Bluetooth enabled on each phone/tablet.
- Wi-Fi and mobile data can be disabled independently.

## Before the offline test

Internet is allowed only for preparation:

1. Open the Teacher Monitor once.
2. Wait until the monitor shows **OFFLINE READY**.
3. On iOS, open the Teacher Monitor inside **Bluefy** and confirm Bluetooth permission can be requested.
4. Confirm the physical trainer is powered, advertising, and running BLE protocol v1.
5. Close the Teacher Monitor completely.

Do not continue if **OFFLINE READY** was never reached.

---

## Android — Chrome/Chromium

### Offline launch

- [ ] Turn Wi-Fi off.
- [ ] Turn mobile data off.
- [ ] Keep Bluetooth on.
- [ ] Reopen the Teacher Monitor.
- [ ] Teacher Monitor opens without a network error.
- [ ] **OFFLINE READY** remains visible.
- [ ] No Firebase, cloud login, CDN, or other network service is requested.

### BLE connection

- [ ] Tap **CONECTAR DEA**.
- [ ] The Web Bluetooth selector shows the compatible AED trainer.
- [ ] Select the trainer.
- [ ] UI transitions through **CONECTANDO…** and **SINCRONIZANDO…**.
- [ ] UI reaches **BLE LISTO** only after device status and trainer state are read.
- [ ] Device ID is displayed.
- [ ] Battery is displayed.
- [ ] Remote controls become enabled only after synchronization.

### Case flow

Use:
- Base scenario: **A1**
- Twist: **T1**
- Clinical condition: **C1**

- [ ] Start the case.
- [ ] Physical trainer receives the loaded A/T/C configuration.
- [ ] Physical trainer plays the expected paramedic context locally.
- [ ] Press **DAR PISTA**.
- [ ] The physical trainer plays the next paramedic hint.
- [ ] Hint count increases exactly once.
- [ ] Trigger **Movimiento / artefacto**.
- [ ] Event appears in Teacher Monitor telemetry.
- [ ] Trigger **Próximo análisis: SHOCK**.
- [ ] The next simulated analysis result follows the instructor override.
- [ ] No remote action can create a therapeutic electrical output.

### Disconnect/resync

- [ ] Force Bluetooth disconnect while the case is active.
- [ ] Teacher Monitor immediately disables remote controls.
- [ ] Physical trainer keeps its already-loaded case and safe local state.
- [ ] Disconnect does not enable SHOCK or alter the scripted rhythm result.
- [ ] Reconnect the same trainer.
- [ ] UI remains blocked while state is **SINCRONIZANDO…**.
- [ ] UI reaches **BLE LISTO** only after authoritative state is reread.
- [ ] Hint count and current trainer state match the physical device.
- [ ] Duplicate timeline events are not created from an already-seen sequence ID.

### End/reset

- [ ] Finish the case from Teacher Monitor.
- [ ] Start controls return to the expected idle state.
- [ ] Restarting a fresh case resets hint usage for the new run.

---

## iPhone/iPad — Bluefy

Repeat the complete Android procedure with these iOS-specific conditions:

- [ ] Teacher Monitor is opened **inside Bluefy**, not ordinary Safari.
- [ ] Wi-Fi is off.
- [ ] Mobile data is off.
- [ ] Bluetooth remains on.
- [ ] Bluefy is fully closed and reopened before the test.
- [ ] The already-cached Teacher Monitor opens with no Internet connection.
- [ ] BLE scan and connection work with no Internet connection.
- [ ] A1 + T1 + C1 loads successfully.
- [ ] **DAR PISTA** works.
- [ ] Live instructor events work.
- [ ] State notifications work.
- [ ] Disconnect/reconnect and authoritative resync work.
- [ ] The full case can be finished and reset while offline.

**Release blocker:** if Bluefy cannot reopen the cached Teacher Monitor offline and still use BLE, iOS support is not considered complete. Do not silently fall back to Wi-Fi.

---

## Record the run

For each platform record:

| Field | Value |
|---|---|
| Date | |
| Phone/tablet model | |
| OS version | |
| Browser / Bluefy version | |
| ESP32 trainer firmware commit | |
| Teacher Monitor commit | |
| Offline launch | PASS / FAIL |
| BLE connect | PASS / FAIL |
| A1+T1+C1 | PASS / FAIL |
| DAR PISTA | PASS / FAIL |
| Live events | PASS / FAIL |
| Disconnect/resync | PASS / FAIL |
| End/reset | PASS / FAIL |
| Notes | |

A platform is accepted only if every required row passes.
