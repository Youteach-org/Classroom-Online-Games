# SDD ledger — plan: docs/superpowers/plans/2026-09-27-aed-esp32-firmware-audio.md

Execution method: Native / inline.

Branch: `feature/aed-esp32-firmware-audio`, forked from `feature/aed-teacher-monitor-offline-ble` so the firmware uses the exact protocol/catalog work already implemented.

Ruling: GitHub Actions currently creates jobs with runner_id 0 and no steps. Host-independent firmware code is verified locally with g++ 14.2.0. Arduino CLI is not installed in this harness, so Arduino-specific compilation will use static/stub compilation where possible and remains a documented real-toolchain gate until a runner or local Arduino CLI is available.

Pre-flight shared interfaces:
- Task 1 -> Tasks 4/8: TrainerCore owns decisions/state and is consumed by BLE/server/runtime integration.
- Task 2 -> Task 4: firmware BLE protocol must mirror web protocol v1 exactly.
- Tasks 3/6 -> Task 8: hardware/display/input/audio adapters are consumed by the final sketch.
- Task 5 -> Tasks 6/7: prompt script/IDs define audio filenames and voice roles.
