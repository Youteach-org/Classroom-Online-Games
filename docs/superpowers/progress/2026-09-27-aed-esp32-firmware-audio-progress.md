# SDD ledger — plan: docs/superpowers/plans/2026-09-27-aed-esp32-firmware-audio.md

Execution method: Native / inline.

Branch: `feature/aed-esp32-firmware-audio`, forked from `feature/aed-teacher-monitor-offline-ble` so the firmware uses the exact protocol/catalog work already implemented.

Ruling: GitHub Actions currently creates jobs with runner_id 0 and no steps. Host-independent firmware code is verified locally with g++ 14.2.0. Arduino CLI is not installed in this harness, so Arduino-specific compilation will use static/stub compilation where possible and remains a documented real-toolchain gate until a runner or local Arduino CLI is available.

Pre-flight shared interfaces:
- Task 1 -> Tasks 4/8: TrainerCore owns decisions/state and is consumed by BLE/server/runtime integration.
- Task 2 -> Task 4: firmware BLE protocol must mirror web protocol v1 exactly.
- Tasks 3/6 -> Task 8: hardware/display/input/audio adapters are consumed by the final sketch.
- Task 5 -> Tasks 6/7: prompt script/IDs define audio filenames and voice roles.

Task 1: complete — pure TrainerCore implemented; A1-A8 sequences, duplicate command rejection, hint consumption, BLE-loss invariance and invalid-command behavior covered by host tests.

Task 2: complete — dependency-free BLE protocol v1 mirrors Teacher Monitor UUIDs/version/fields. Static cross-contract verification passes.

Task 3: complete at source level — WROOM pin map, ST7789 adapter, GPIO32 debouncer and compile workflow committed. Arduino Actions remains blocked before step execution.

Task 4: complete at source level — BLE GATT server exposes status/state/command/events/ECG characteristics and authoritative reconnect state. Protocol contract verification passes.

Task 5: complete — 61 development prompts frozen with separate AED female and paramedic male roles; all remain releaseReviewRequired.

Task 6: complete at source level — LittleFS + ESP_I2S player implemented. Full pack required compression, so player now supports WAV IMA-ADPCM and PCM16 behind the same API. LittleFS mount never auto-formats on failure. IMA nibble decoder compiled and passed its host test with g++.

Task 7: source generation complete — all 61 HeyGen clips generated and recorded in audio/audio-sources.generated.json; total source duration 287.0857 s. The deterministic builder converts the entire set to mono 10 kHz WAV IMA-ADPCM with a 1,750,000-byte budget. GitHub Actions voice-pack job failed before executing any step, so binary assets/manifest are still an infrastructure gate, not claimed complete.

Task 8: complete at source level — prompt queue routes to display + audio, physical SHOCK remains local, stand-clear violation blocks SHOCK, pad fault blocks new analysis, movement holds analysis resolution, BLE state is published after local transitions, and audio failure leaves text/state logic running.

Task 9: complete — README aligned to WROOM/TFT/MAX98357A/SHOCK prototype, no Hall/magnets, touch/SD intentionally unused, planned bicolor 128x64 OLED migration documented, and firmware/BENCH-ACCEPTANCE.md added.

Verification evidence:
- IMA ADPCM decoder host compile/test: GREEN (g++ -std=c++17).
- Prompt/audio/runtime source contracts: 61/61 prompt mappings present; ESP_I2S pins 27/26/25; LittleFS safe mount; ADPCM decoder and integrated runtime paths found; 0 contract failures.
- Latest AED Firmware CI run 36374051656: job exists but has no steps/logs and concludes failure before compilation. Same infrastructure symptom as earlier runs.
- AED Build Voice Pack run 36373736259: job exists but has no executable steps/logs; binary pack therefore remains pending.
- Physical bench validation and Android/iOS real-device acceptance remain pending by design.
