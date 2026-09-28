#include <Arduino.h>

#include "audio-player.h"
#include "ble-server.h"
#include "display-adapter.h"
#include "input-adapter.h"
#include "prompt-map.h"
#include "trainer-core.h"

namespace {
constexpr std::uint32_t kStartupSettleMs = 500;
constexpr std::uint32_t kApplyPadsDelayMs = 1500;
constexpr std::uint32_t kAnalysisSettleMs = 500;
constexpr std::uint32_t kShockArmDelayMs = 500;
constexpr std::uint32_t kNoShockToCprMs = 500;
constexpr std::uint32_t kCprCycleMs = 120000;
constexpr std::uint32_t kReassessDelayMs = 500;

DisplayAdapter display;
InputAdapter inputs;
AudioPlayer audio;
TrainerCore trainer;
BleServer ble(trainer);

TrainerState lastRenderedState = TrainerState::OFF;
std::uint32_t stateEnteredAt = 0;

const char* stateFallback(TrainerState state) {
  switch (state) {
    case TrainerState::OFF:
      return "Listo. Conecte Teacher Monitor por Bluetooth.";
    case TrainerState::STARTUP:
      return "Iniciando caso de entrenamiento.";
    case TrainerState::APPLY_PADS:
      return "Prepare y coloque los electrodos de entrenamiento.";
    case TrainerState::ANALYZING:
      return "Analizando ritmo simulado. No toque al paciente.";
    case TrainerState::SHOCK_ADVISED:
      return "Descarga simulada recomendada.";
    case TrainerState::NO_SHOCK_ADVISED:
      return "No se recomienda descarga simulada.";
    case TrainerState::WAITING_SHOCK:
      return "Todos despejados. Presione SHOCK.";
    case TrainerState::CPR:
      return "RCP en curso.";
    case TrainerState::REASSESS:
      return "Preparando nuevo analisis.";
  }
  return "DEA educativo";
}

void syncStateView(bool force = false) {
  const TrainerState current = trainer.state();
  if (!force && current == lastRenderedState) return;

  lastRenderedState = current;
  stateEnteredAt = millis();
  display.showState(current, stateFallback(current));
  ble.publishTrainerState();
}

void serviceOnePrompt() {
  const auto prompt = trainer.popPrompt();
  if (!prompt.has_value()) return;

  const char* text = findPromptText(prompt.value());
  display.showState(
      trainer.state(),
      text ? text : prompt.value().c_str());

  const bool played = audio.playPrompt(prompt.value());
  if (!played) {
    Serial.print("AUDIO_MISSING: ");
    Serial.println(prompt.value().c_str());
    ble.notifyEvent("AUDIO_MISSING");
  }

  // Start post-prompt timing only after the spoken/text prompt completes.
  stateEnteredAt = millis();
}

bool elapsed(std::uint32_t intervalMs) {
  return static_cast<std::uint32_t>(millis() - stateEnteredAt) >= intervalMs;
}

void advanceRuntime() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.paused) return;

  bool changed = false;

  switch (snapshot.state) {
    case TrainerState::OFF:
      break;

    case TrainerState::STARTUP:
      if (!trainer.hasPrompt() && elapsed(kStartupSettleMs)) {
        changed = trainer.enterApplyPads();
      }
      break;

    case TrainerState::APPLY_PADS:
      if (!snapshot.padFault &&
          !trainer.hasPrompt() &&
          elapsed(kApplyPadsDelayMs)) {
        changed = trainer.beginAnalysis();
      }
      break;

    case TrainerState::ANALYZING:
      if (!snapshot.padFault &&
          !snapshot.movement &&
          !trainer.hasPrompt() &&
          elapsed(kAnalysisSettleMs)) {
        changed = trainer.resolveAnalysis();
      }
      break;

    case TrainerState::SHOCK_ADVISED:
      if (!trainer.hasPrompt() && elapsed(kShockArmDelayMs)) {
        changed = trainer.armShock();
      }
      break;

    case TrainerState::NO_SHOCK_ADVISED:
      if (!trainer.hasPrompt() && elapsed(kNoShockToCprMs)) {
        changed = trainer.beginCprAfterNoShock();
      }
      break;

    case TrainerState::WAITING_SHOCK:
      break;

    case TrainerState::CPR:
      if (!trainer.hasPrompt() && elapsed(kCprCycleMs)) {
        changed = trainer.requestReassess();
      }
      break;

    case TrainerState::REASSESS:
      if (!snapshot.padFault &&
          !trainer.hasPrompt() &&
          elapsed(kReassessDelayMs)) {
        changed = trainer.beginAnalysis();
      }
      break;
  }

  if (changed) {
    syncStateView();
    ble.notifyEvent("STATE_CHANGE");
  }
}

void serviceShockButton() {
  if (!inputs.shockPressed()) return;

  if (!trainer.handleShockPress()) {
    Serial.println("SHOCK_IGNORED");
    return;
  }

  Serial.println("SIMULATED_SHOCK");
  ble.notifyEvent("SHOCK_PRESS");
  syncStateView();
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(250);

  display.begin();
  inputs.begin();

  const bool audioReady = audio.begin();
  Serial.println(audioReady ? "AUDIO_FS_READY" : "AUDIO_FS_UNAVAILABLE");

  // Safe local default. Teacher Monitor may replace it before START.
  trainer.loadCase({"A1", "T0", "C0"});

  ble.begin();
  lastRenderedState = trainer.state();
  stateEnteredAt = millis();

  display.showState(
      trainer.state(),
      audioReady
          ? "Conecte Teacher Monitor por Bluetooth"
          : "Audio no disponible. El texto seguira funcionando.");
}

void loop() {
  // BLE callbacks may have changed the authoritative core since the last loop.
  syncStateView();

  // Keep the physical button path local. BLE can change scenario state but never
  // generates a fake physical button edge.
  serviceShockButton();

  // Context, AED instructions and DAR PISTA all leave the core through one queue.
  if (trainer.hasPrompt()) {
    serviceOnePrompt();
    syncStateView();
  }

  advanceRuntime();
  syncStateView();

  delay(5);
}
