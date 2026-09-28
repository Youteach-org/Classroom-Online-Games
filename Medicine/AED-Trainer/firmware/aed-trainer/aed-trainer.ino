#include <Arduino.h>

#include <array>
#include <string>

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
constexpr std::uint32_t kMetronomeBpm = 110;
constexpr std::uint32_t kMetronomeIntervalMs = 60000 / kMetronomeBpm;

constexpr std::array<const char*, 8> kLocalScenarios{
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"};

DisplayAdapter display;
InputAdapter inputs;
AudioPlayer audio;
TrainerCore trainer;
BleServer ble(trainer);

TrainerState lastRenderedState = TrainerState::OFF;
std::uint32_t stateEnteredAt = 0;
std::uint32_t lastMetronomeAt = 0;
std::uint32_t pauseStartedAt = 0;
bool lastPaused = false;
std::size_t localScenarioIndex = 0;

const char* stateFallback(TrainerState state) {
  switch (state) {
    case TrainerState::OFF:
      return "DEA listo. START inicia. MODE cambia caso. BLE opcional.";
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
  if (current == TrainerState::CPR) {
    lastMetronomeAt = stateEnteredAt;
  }
  display.showState(current, stateFallback(current));
  ble.publishTrainerState();
}

void showLocalReady() {
  std::string message =
      "Caso " + std::string(kLocalScenarios[localScenarioIndex]) +
      ". START inicia. MODE cambia. BLE opcional.";
  display.showState(TrainerState::OFF, message.c_str());
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

  if (prompt.value().rfind("AED_", 0) == 0) {
    stateEnteredAt = millis();
  }
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

void syncPauseClock() {
  const bool paused = trainer.snapshot().paused;
  if (paused == lastPaused) return;

  const std::uint32_t now = millis();
  if (paused) {
    pauseStartedAt = now;
  } else {
    const std::uint32_t pausedFor = now - pauseStartedAt;
    stateEnteredAt += pausedFor;
    lastMetronomeAt += pausedFor;
  }
  lastPaused = paused;
}

void serviceMetronome() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.state != TrainerState::CPR ||
      snapshot.paused ||
      trainer.hasPrompt()) {
    return;
  }

  const std::uint32_t now = millis();
  if (static_cast<std::uint32_t>(now - lastMetronomeAt) <
      kMetronomeIntervalMs) {
    return;
  }

  audio.playMetronomeClick();
  lastMetronomeAt = millis();
}

void serviceShockButton() {
  if (!inputs.shockPressed()) return;

  if (!trainer.handleShockPress()) {
    Serial.println("SHOCK_IGNORED");
    return;
  }

  Serial.println("SIMULATED_SHOCK");
  ble.notifyEvent("SHOCK_PRESS");
  syncStateView(true);
}

void serviceLocalControls() {
  if (inputs.resetPressed()) {
    if (trainer.endCase()) {
      Serial.println("LOCAL_RESET");
      ble.notifyEvent("LOCAL_RESET");
      syncStateView(true);
    }
    showLocalReady();
    return;
  }

  if (inputs.modePressed()) {
    if (trainer.state() != TrainerState::OFF) {
      Serial.println("MODE_IGNORED_ACTIVE_CASE");
      return;
    }

    localScenarioIndex = (localScenarioIndex + 1) % kLocalScenarios.size();
    trainer.loadCase({kLocalScenarios[localScenarioIndex], "T0", "C0"});
    Serial.print("LOCAL_MODE: ");
    Serial.println(kLocalScenarios[localScenarioIndex]);
    ble.publishTrainerState();
    showLocalReady();
    return;
  }

  if (!inputs.startPressed()) return;

  const auto snapshot = trainer.snapshot();

  if (snapshot.state == TrainerState::OFF) {
    if (trainer.startCase()) {
      Serial.println("LOCAL_START");
      ble.notifyEvent("LOCAL_START");
      syncStateView(true);
    }
    return;
  }

  if (snapshot.paused) {
    if (trainer.resumeCase()) {
      Serial.println("LOCAL_RESUME");
      ble.notifyEvent("LOCAL_RESUME");
      display.showState(trainer.state(), stateFallback(trainer.state()));
      ble.publishTrainerState();
    }
    return;
  }

  if (trainer.pauseCase()) {
    Serial.println("LOCAL_PAUSE");
    ble.notifyEvent("LOCAL_PAUSE");
    display.showState(
        trainer.state(),
        "PAUSA. START reanuda. RESET vuelve a espera.");
    ble.publishTrainerState();
  }
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(250);

  display.begin();
  inputs.begin();

  const bool audioReady = audio.begin();
  Serial.println(audioReady ? "AUDIO_FS_READY" : "AUDIO_FS_UNAVAILABLE");

  const bool speakerOk = audio.playStartupTone();
  Serial.println(speakerOk ? "SPEAKER_SELF_TEST_OK" : "SPEAKER_SELF_TEST_FAIL");

  // Standalone default. Teacher Monitor may optionally load a richer case later.
  trainer.loadCase({"A1", "T0", "C0"});

  ble.begin();

  lastRenderedState = trainer.state();
  stateEnteredAt = millis();
  lastMetronomeAt = stateEnteredAt;
  lastPaused = false;

  showLocalReady();
}

void loop() {
  // Teacher Monitor is optional. BLE never owns the local life cycle.
  ble.poll();

  // Physical controls always remain available.
  serviceLocalControls();
  syncPauseClock();
  syncStateView();

  serviceShockButton();

  if (trainer.hasPrompt()) {
    serviceOnePrompt();
    syncStateView();
  }

  advanceRuntime();
  syncStateView();
  serviceMetronome();

  delay(5);
}
