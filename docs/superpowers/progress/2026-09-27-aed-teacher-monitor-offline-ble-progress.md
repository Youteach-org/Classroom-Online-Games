# SDD ledger — plan: docs/superpowers/plans/2026-09-27-aed-teacher-monitor-offline-ble.md

Execution method: Native / inline via GitHub connector.

Ruling: this harness has no local git worktree; isolation is provided by branch `feature/aed-teacher-monitor-offline-ble` created from `medicine-aed`. All implementation commits stay on this feature branch until final review.

Pre-flight shared interfaces:
- Task 1 -> Task 2: scenario/twist/clinical/prompt exports are consumed by trainer-engine.
- Task 3 -> Task 4: BLE protocol constants/codec are consumed by ble-client.
- Tasks 1-5 -> Task 6: catalogs, engine, BLE client and offline support are consumed by app.js/UI.
- Task 6 -> Task 7: UI/runtime state and offline behavior are documented in acceptance procedure.
