# SDD ledger — plan: docs/superpowers/plans/2026-09-27-aed-teacher-monitor-offline-ble.md

Execution method: Native / inline via GitHub connector.

Ruling: this harness has no local git worktree; isolation is provided by branch `feature/aed-teacher-monitor-offline-ble` created from `medicine-aed`. All implementation commits stay on this feature branch until final review.

Pre-flight shared interfaces:
- Task 1 -> Task 2: scenario/twist/clinical/prompt exports are consumed by trainer-engine.
- Task 3 -> Task 4: BLE protocol constants/codec are consumed by ble-client.
- Tasks 1-5 -> Task 6: catalogs, engine, BLE client and offline support are consumed by app.js/UI.
- Task 6 -> Task 7: UI/runtime state and offline behavior are documented in acceptance procedure.

Ruling: GitHub Actions creates checks but assigns no runner (runner_id 0, zero steps), so CI cannot currently execute. TDD verification is performed against the exact committed source through executable contract probes in this session; CI remains configured for when runner capacity is available.

Task 1: complete — 4 catalog contract groups pass; A1-A8, T0-T8, C0-C16 and prompt-role mappings verified.
Task 2: complete — 7 trainer-engine contract groups pass; sequences, overrides, refibrillation, duplicate seq rejection, hints, invalid events and serialization verified.

Task 3: complete — BLE protocol v1 UUIDs frozen; 6 codec/validation contracts pass; representative full command is 89 bytes (<180).
Task 4: complete — 6 Web Bluetooth contracts pass: service filtering, command write gating, disconnect, authoritative reconnect sync, incompatible protocol block, duplicate-event suppression.
Task 5: complete — 5 offline-shell contracts pass; all required assets local, cache completeness and obsolete-cache cleanup verified.
Task 6: complete — Teacher Monitor replaces student simulator; 7 UI contracts pass including authoritative trainer-state resync.
Task 6 review fix: stale local case state after a trainer reboot could have re-enabled live controls. Added RED regression and fixed app.js so OFF/STARTUP/IDLE/ENDED/COMPLETE from the trainer deactivate the local case.
Task 7: complete — real-device Android/iOS Bluefy acceptance checklist added and README aligned to BLE/offline Teacher Monitor architecture.

Physical release gate remains pending: real Android + Chrome/Chromium, real iPhone/iPad + Bluefy, and physical ESP32 must execute REAL-DEVICE-ACCEPTANCE.md.
