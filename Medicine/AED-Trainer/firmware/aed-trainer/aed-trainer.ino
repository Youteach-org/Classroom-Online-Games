#include <Arduino.h>

#include <array>
#include <atomic>
#include <string>

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

#include "audio-player.h"
#include "ble-server.h"
#include "display-adapter.h"
#include "hardware-config.h"
#include "input-adapter.h"
#include "prompt-map.h"
#include "shock-led.h"
#include "trainer-core.h"

namespace {
constexpr std::uint32_t kAnalysisSettleMs = 3000;
constexpr std::uint32_t kShockArmDelayMs = 500;
constexpr std::uint32_t kNoShockToCprMs = 500;
constexpr std::uint32_t kCprCycleMs = 120000;
constexpr std::uint32_t kReassessDelayMs = 500;
// The uploaded CPR song was measured after the requested 6.5 s trim.
// Beat grid: 107.666 BPM, first grid beat about 46 ms after the trim.
constexpr std::uint32_t kCprDisplayBpm = 108;
constexpr std::uint32_t kCprBeatIntervalUs = 557279;
constexpr std::uint32_t kCprBeatPhaseUs = 46440;
constexpr std::uint32_t kCprCompressionWindowUs = 185000;
constexpr std::uint32_t kFallbackMetronomeIntervalMs = 557;

constexpr std::array<const char*, 8> kLocalScenarios{
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"};

DisplayAdapter display;
InputAdapter inputs;
AudioPlayer audio;
TrainerCore trainer;
BleServer ble(trainer);
std::atomic<bool> bleInitReady{false};
std::atomic<bool> bleInitStarted{false};

TrainerState lastRenderedState = TrainerState::OFF;
std::uint32_t stateEnteredAt = 0;
std::uint32_t cprCycleStartedAt = 0;
std::uint32_t lastMetronomeAt = 0;
std::uint32_t pauseStartedAt = 0;
std::uint32_t lastDynamicDisplayAt = 0;
std::uint32_t analysisPhase = 0;
bool lastPaused = false;
bool lastMovement = false;
bool cprCycleTimingActive = false;
bool cprMusicActive = false;
std::size_t localScenarioIndex = 0;
std::string lastSpokenPromptId;

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

bool cprCompressionAt(std::uint32_t elapsedMs) {
  const std::uint64_t elapsedUs =
      static_cast<std::uint64_t>(elapsedMs) * 1000ULL;

  if (elapsedUs < kCprBeatPhaseUs) return false;

  const std::uint64_t beatPhase =
      (elapsedUs - kCprBeatPhaseUs) % kCprBeatIntervalUs;

  return beatPhase < kCprCompressionWindowUs;
}

void renderOperationalView() {
  const auto snapshot = trainer.snapshot();

  if (snapshot.state == TrainerState::ANALYZING) {
    if (snapshot.movement) {
      display.showMovementWarning();
      return;
    }
    if (snapshot.pendingOutcome.has_value()) {
      display.showAnalyzing(snapshot.pendingOutcome.value(), analysisPhase);
      return;
    }
  }

  if (snapshot.state == TrainerState::STARTUP) {
    display.showStartupStep(trainer.startupStep());
    return;
  }

  if (snapshot.state == TrainerState::SHOCK_ADVISED ||
      snapshot.state == TrainerState::WAITING_SHOCK) {
    const bool trianglesVisible = ((millis() / 500U) % 2U) == 0U;
    display.showShockWarning(trianglesVisible);
    return;
  }

  if (snapshot.state == TrainerState::CPR) {
    std::uint32_t elapsedMs = 0;
    std::uint32_t remainingMs = kCprCycleMs;

    if (cprCycleTimingActive) {
      elapsedMs =
          static_cast<std::uint32_t>(millis() - cprCycleStartedAt);
      remainingMs = elapsedMs >= kCprCycleMs ? 0 : kCprCycleMs - elapsedMs;
    }

    const bool compression =
        cprCycleTimingActive && cprCompressionAt(elapsedMs);

    display.showCprCountdown(
        remainingMs,
        kCprDisplayBpm,
        compression);
    return;
  }

  display.showState(snapshot.state, stateFallback(snapshot.state));
}

void syncShockLed() {
  digitalWrite(
      HardwareConfig::SHOCK_LED,
      shouldLightShockLed(trainer.state()) ? HIGH : LOW);
}

void syncStateView(bool force = false) {
  // A recommendation can change through local controls or BLE.
  syncShockLed();
  const TrainerState current = trainer.state();
  const bool stateChanged = current != lastRenderedState;
  if (!force && !stateChanged) return;

  if (stateChanged) {
    if (lastRenderedState == TrainerState::CPR &&
        current != TrainerState::CPR) {
      audio.endCprMusic();
      audio.endCprMetronome();
      cprMusicActive = false;
      Serial.println("RCP_AUDIO_STOP");
    }

    stateEnteredAt = millis();
    lastDynamicDisplayAt = 0;

    if (current == TrainerState::ANALYZING) {
      analysisPhase = 0;
    }

    if (current == TrainerState::CPR) {
      cprCycleTimingActive = false;
      cprCycleStartedAt = stateEnteredAt;
      lastMetronomeAt = stateEnteredAt;
    } else {
      cprCycleTimingActive = false;
    }
  }

  lastRenderedState = current;
  renderOperationalView();
  ble.publishTrainerState();
}

void showLocalReady() {
  display.showReadyCase(kLocalScenarios[localScenarioIndex]);
}

void bleInitTask(void*) {
  Serial.println("BLE_ASYNC_BEGIN");
  ble.begin();
  bleInitReady.store(true, std::memory_order_release);
  Serial.println("BLE_ASYNC_READY");
  vTaskDelete(nullptr);
}

void startBleAsync() {
  if (bleInitStarted.exchange(true, std::memory_order_acq_rel)) return;

  BaseType_t created = xTaskCreatePinnedToCore(
      bleInitTask,
      "aed-ble-init",
      8192,
      nullptr,
      1,
      nullptr,
      0);

  if (created != pdPASS) {
    Serial.println("BLE_ASYNC_TASK_FAIL");
  }
}

void serviceOnePrompt() {
  const auto prompt = trainer.popPrompt();
  if (!prompt.has_value()) return;

  const char* text = findPromptText(prompt.value());
  if (prompt.value().rfind("AED_", 0) == 0) lastSpokenPromptId = prompt.value();
  display.showPromptVisual(prompt.value());

  const bool played = audio.playPrompt(prompt.value());
  if (!played) {
    Serial.print("AUDIO_MISSING: ");
    Serial.println(prompt.value().c_str());
    ble.notifyEvent("AUDIO_MISSING");
  }

  if (prompt.value().rfind("AED_", 0) == 0) {
    stateEnteredAt = millis();
  }

  if (trainer.state() == TrainerState::CPR &&
      (prompt.value() == "AED_BEGIN_CPR" ||
       prompt.value() == "AED_CONTINUE_CPR")) {
    // Cache both full-screen CPR frames before the song starts. During the
    // two-minute cycle the TFT no longer reads those frames from LittleFS,
    // preventing display I/O from interrupting the music stream.
    const bool framesReady = display.prepareCprFrames();
    Serial.println(framesReady ? "RCP_FRAMES_READY" : "RCP_FRAMES_CACHE_FAIL");

    const bool musicReady = audio.beginCprMusic();
    cprMusicActive = musicReady;
    Serial.println(musicReady ? "RCP_MUSIC_READY" : "RCP_MUSIC_FAIL");

    // Fallback only if the two-minute music file cannot start.
    if (!musicReady) {
      const bool metronomeReady = audio.beginCprMetronome();
      Serial.println(
          metronomeReady
              ? "RCP_FALLBACK_METRONOME_READY"
              : "RCP_FALLBACK_METRONOME_FAIL");
    }

    cprCycleStartedAt = millis();
    cprCycleTimingActive = true;
    lastMetronomeAt = cprCycleStartedAt;

    renderOperationalView();
  }

  if (trainer.state() == TrainerState::APPLY_PADS &&
      (prompt.value() == "AED_ATTACH_PADS" ||
       prompt.value() == "AED_CHECK_PADS")) {
    if (prompt.value() == "AED_CHECK_PADS") {
      display.showPadError();
    } else {
      display.showState(
          TrainerState::APPLY_PADS,
          "Coloque electrodos. Pulse PADS/OK al terminar.");
    }
    return;
  }

  const auto state = trainer.state();
  if (state == TrainerState::STARTUP ||
      state == TrainerState::ANALYZING ||
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
      // Learner-driven: wait for PADS/OK between each startup instruction.
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
      // The full two-minute cycle starts only after the CPR instruction audio ends.
      if (cprCycleTimingActive &&
          !trainer.hasPrompt() &&
          static_cast<std::uint32_t>(millis() - cprCycleStartedAt) >= kCprCycleMs) {
        cprCycleTimingActive = false;
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

void syncMovementState() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.movement == lastMovement) return;

  lastMovement = snapshot.movement;

  if (snapshot.state == TrainerState::ANALYZING) {
    // Motion artifact pauses the decision. Once cleared, restart the full
    // analysis settle interval instead of immediately returning a result.
    stateEnteredAt = millis();
    analysisPhase = 0;
    renderOperationalView();
  }

  ble.notifyEvent(snapshot.movement ? "MOVEMENT_ACTIVE" : "MOVEMENT_CLEARED");
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
    if (cprCycleTimingActive) {
      cprCycleStartedAt += pausedFor;
    }
  }
  lastPaused = paused;
}

void serviceDynamicDisplay() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.paused) return;

  const std::uint32_t now = millis();

  if (snapshot.state == TrainerState::ANALYZING) {
    if (static_cast<std::uint32_t>(now - lastDynamicDisplayAt) < 40) return;
    lastDynamicDisplayAt = now;
    analysisPhase += 2;
    renderOperationalView();
    return;
  }

  if (snapshot.state == TrainerState::SHOCK_ADVISED ||
      snapshot.state == TrainerState::WAITING_SHOCK) {
    if (static_cast<std::uint32_t>(now - lastDynamicDisplayAt) < 500) return;
    lastDynamicDisplayAt = now;
    renderOperationalView();
    return;
  }

  if (snapshot.state == TrainerState::CPR) {
    if (static_cast<std::uint32_t>(now - lastDynamicDisplayAt) < 40) return;
    lastDynamicDisplayAt = now;
    renderOperationalView();
  }
}

void serviceMetronome() {
  const auto snapshot = trainer.snapshot();
  if (snapshot.state != TrainerState::CPR ||
      snapshot.paused ||
      !cprCycleTimingActive ||
      trainer.hasPrompt() ||
      cprMusicActive) {
    return;
  }

  const std::uint32_t now = millis();
  if (static_cast<std::uint32_t>(now - lastMetronomeAt) <
      kFallbackMetronomeIntervalMs) {
    return;
  }

  const bool beatOk = audio.playMetronomeClick();
  Serial.println(beatOk ? "RCP_BEAT_OK" : "RCP_BEAT_FAIL");
  if (!beatOk) {
    ble.notifyEvent("RCP_BEAT_FAIL");
  }

  lastMetronomeAt += kFallbackMetronomeIntervalMs;
}

void serviceShockButton() {
  if (!inputs.shockPressed()) return;

  if (!trainer.handleShockPress()) {
    Serial.println("SHOCK_IGNORED");
    return;
  }

  // Extinguish immediately, before playing the blocking discharge sound.
  syncShockLed();
  Serial.println("SIMULATED_SHOCK");
  const bool shockAudioOk = audio.playShockBuzz();
  Serial.println(shockAudioOk ? "SHOCK_AUDIO_OK" : "SHOCK_AUDIO_FAIL");
  if (!shockAudioOk) {
    ble.notifyEvent("SHOCK_AUDIO_FAIL");
  }
  ble.notifyEvent("SHOCK_PRESS");
  syncStateView(true);
}

void servicePadsButton() {
  if (!inputs.padsPressed()) return;

  const auto snapshot = trainer.snapshot();

  if (snapshot.state == TrainerState::STARTUP) {
    if (trainer.advanceStartupStep()) {
      Serial.println("LOCAL_STEP_CONFIRMED");
      ble.notifyEvent("LOCAL_STEP_CONFIRMED");
      syncStateView(true);
    }
    return;
  }

  if (snapshot.state != TrainerState::APPLY_PADS) {
    Serial.println("PADS_IGNORED");
    return;
  }

  if (snapshot.padFault) {
    Serial.println("PADS_BLOCKED_CONTACT_FAULT");
    display.showPadError();
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
      if (!lastSpokenPromptId.empty() &&
          trainer.state() != TrainerState::CPR) {
        audio.playPrompt(lastSpokenPromptId);
        Serial.println("LOCAL_REPEAT_PROMPT");
      }
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

  // OK is also the PADS/step-confirm button while a case is active.
  // Do not consume its event here; servicePadsButton() owns that event.
  if (trainer.state() != TrainerState::OFF) return;
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

  pinMode(HardwareConfig::SHOCK_LED, OUTPUT);
  digitalWrite(HardwareConfig::SHOCK_LED, LOW);
  display.begin();
  inputs.begin();

  const bool audioReady = audio.begin();
  Serial.println(audioReady ? "AUDIO_FS_READY" : "AUDIO_FS_UNAVAILABLE");

  const bool speakerOk = audio.playStartupTone();
  Serial.println(speakerOk ? "SPEAKER_SELF_TEST_OK" : "SPEAKER_SELF_TEST_FAIL");

  // Standalone default. Teacher Monitor may optionally load a richer case later.
  trainer.loadCase({"A1", "T0", "C0"});

  lastRenderedState = trainer.state();
  stateEnteredAt = millis();
  cprCycleStartedAt = stateEnteredAt;
  lastMetronomeAt = stateEnteredAt;
  cprCycleTimingActive = false;
  lastPaused = false;

  // Local operation must never depend on Bluetooth initialization.
  showLocalReady();
  startBleAsync();
}

void loop() {
  // Teacher Monitor is optional. BLE initialization runs on its own task so
  // a stalled Bluetooth stack can never freeze the local AED trainer.
  if (bleInitReady.load(std::memory_order_acquire)) {
    ble.poll();
  }

  // Sample GPIOs only once each cycle so MENU/OK share one event.
  inputs.poll();
  // Physical controls always remain available.
  serviceLocalControls();
  servicePadsButton();
  syncPauseClock();
  syncMovementState();
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
