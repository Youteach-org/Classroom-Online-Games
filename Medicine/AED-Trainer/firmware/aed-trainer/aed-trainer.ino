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
constexpr std::uint32_t kAnalysisSettleMs = 3000;
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
std::uint32_t cprCycleStartedAt = 0;
std::uint32_t lastMetronomeAt = 0;
std::uint32_t pauseStartedAt = 0;
std::uint32_t lastDynamicDisplayAt = 0;
std::uint32_t analysisPhase = 0;
bool lastPaused = false;
std::size_t localScenarioIndex = 0;

const char* stateFallback(TrainerState state) {
  switch (state) {
    case TrainerState::OFF:
      return "DEA listo. START inicia. MODE cambia caso. BLE opcional.";
    case TrainerState::STARTUP:
      return "Iniciando caso de entrenamiento.";
    case TrainerState::APPLY_PADS:
      return "Coloque electrodos. Pulse PADS/OK al terminar.";
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

void renderOperationalView() {
  const auto snapshot = trainer.snapshot();

  if (snapshot.state == TrainerState::ANALYZING &&
      snapshot.pendingOutcome.has_value()) {
    display.showAnalyzing(snapshot.pendingOutcome.value(), analysisPhase);
    return;
  }

  if (snapshot.state == TrainerState::SHOCK_ADVISED ||
      snapshot.state == TrainerState::WAITING_SHOCK) {
    display.showShockWarning();
    return;
  }

  if (snapshot.state == TrainerState::CPR) {
    const std::uint32_t elapsedMs =
        static_cast<std::uint32_t>(millis() - cprCycleStartedAt);
    const std::uint32_t remainingMs =
        elapsedMs >= kCprCycleMs ? 0 : kCprCycleMs - elapsedMs;
    display.showCprCountdown(remainingMs, kMetronomeBpm);
    return;
  }

  display.showState(snapshot.state, stateFallback(snapshot.state));
}

void syncStateView(bool force = false) {
  const TrainerState current = trainer.state();
  const bool stateChanged = current != lastRenderedState;
  if (!force && !stateChanged) return;

  if (stateChanged) {
    stateEnteredAt = millis();
    lastDynamicDisplayAt = 0;

    if (current == TrainerState::ANALYZING) {
      analysisPhase = 0;
    }

    if (current == TrainerState::CPR) {
      cprCycleStartedAt = stateEnteredAt;
      lastMetronomeAt = stateEnteredAt;
    }
  }

  lastRenderedState = current;
  renderOperationalView();
  ble.publishTrainerState();
}

void showLocalReady() {
  display.showReadyCase(kLocalScenarios[localScenarioIndex]);
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

  if (trainer.state() == TrainerState::APPLY_PADS &&
      (prompt.value() == "AED_ATTACH_PADS" ||
       prompt.value() == "AED_CHECK_PADS")) {
    display.showState(
        TrainerState::APPLY_PADS,
        "Coloque electrodos. Pulse PADS/OK al terminar.");
    return;
  }

  const auto state = trainer.state();
  if (state == TrainerState::ANALYZING ||
      state == TrainerState::SHOCK_ADVISED ||
      state == TrainerState::WAITING_SHOCK ||
      state == TrainerState::CPR) {
    renderOperationalView();
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
      // Intentionally wait here. The trainer must not analyze until the
      // learner confirms that the training pads have been placed.
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
      // Never reassess before a complete two-minute CPR cycle.
      if (!trainer.hasPrompt() &&
          static_cast<std::uint32_t>(millis() - cprCycleStartedAt) >= kCprCycleMs) {
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

void serviceDynamicDisplay() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.paused) return;

  const std::uint32_t now = millis();

  if (snapshot.state == TrainerState::ANALYZING) {
    if (static_cast<std::uint32_t>(now - lastDynamicDisplayAt) < 60) return;
    lastDynamicDisplayAt = now;
    analysisPhase += 2;
    renderOperationalView();
    return;
  }

  if (snapshot.state == TrainerState::CPR) {
    if (static_cast<std::uint32_t>(now - lastDynamicDisplayAt) < 200) return;
    lastDynamicDisplayAt = now;
    renderOperationalView();
  }
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

void servicePadsButton() {
  if (!inputs.padsPressed()) return;

  const auto snapshot = trainer.snapshot();
  if (snapshot.state != TrainerState::APPLY_PADS) {
    Serial.println("PADS_IGNORED");
    return;
  }

  if (snapshot.padFault) {
    Serial.println("PADS_BLOCKED_CONTACT_FAULT");
    display.showState(
        TrainerState::APPLY_PADS,
        "Revise electrodos. Corrija contacto antes de continuar.");
    return;
  }

  if (trainer.beginAnalysis()) {
    Serial.println("LOCAL_PADS_CONFIRMED");
    ble.notifyEvent("LOCAL_PADS_CONFIRMED");
    syncStateView(true);
  }
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

  if (trainer.state() != TrainerState::OFF) {
    Serial.println("START_IGNORED_ACTIVE_CASE");
    return;
  }

  if (trainer.startCase()) {
    Serial.println("LOCAL_START");
    ble.notifyEvent("LOCAL_START");
    syncStateView(true);
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
  cprCycleStartedAt = stateEnteredAt;
  lastMetronomeAt = stateEnteredAt;
  lastPaused = false;

  showLocalReady();
}

void loop() {
  // Teacher Monitor is optional. BLE never owns the local life cycle.
  ble.poll();

  // Physical controls always remain available.
  serviceLocalControls();
  servicePadsButton();
  syncPauseClock();
  syncStateView();

  serviceShockButton();

  if (trainer.hasPrompt()) {
    serviceOnePrompt();
    syncStateView();
  }

  advanceRuntime();
  syncStateView();
  serviceDynamicDisplay();
  serviceMetronome();

  delay(5);
}
