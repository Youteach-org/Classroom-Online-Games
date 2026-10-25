#include "input-adapter.h"
#include "hardware-config.h"

#ifdef ARDUINO
#include <Arduino.h>
#endif

ShockButtonDebouncer::ShockButtonDebouncer(std::uint32_t debounceMs)
    : debounceMs_(debounceMs) {}

bool ShockButtonDebouncer::update(bool pressed, std::uint32_t nowMs) {
  if (!initialized_) {
    initialized_ = true;
    rawPressed_ = pressed;
    stablePressed_ = pressed;
    rawChangedAt_ = nowMs;
    return false;
  }

  if (pressed != rawPressed_) {
    rawPressed_ = pressed;
    rawChangedAt_ = nowMs;
  }

  if (rawPressed_ != stablePressed_ &&
      (nowMs - rawChangedAt_) >= debounceMs_) {
    stablePressed_ = rawPressed_;
    if (stablePressed_) pressPending_ = true;
  }

  return consumePress();
}

bool ShockButtonDebouncer::consumePress() {
  const bool pending = pressPending_;
  pressPending_ = false;
  return pending;
}


void ThreeButtonController::settle(
    Button& button, bool pressed, std::uint32_t nowMs) {
  if (!button.initialized) {
    button.initialized = true;
    button.raw = pressed;
    button.stable = pressed;
    button.changedAt = nowMs;
    return;
  }
  if (button.raw != pressed) {
    button.raw = pressed;
    button.changedAt = nowMs;
  }
  if (button.stable != button.raw &&
      (nowMs - button.changedAt) >= 35U) {
    button.stable = button.raw;
  }
}

void ThreeButtonController::update(
    bool menuPressed, bool okPressed, bool shockPressed,
    std::uint32_t nowMs) {
  const bool wasMenu = menu_.stable;
  const bool wasOk = ok_.stable;
  const bool wasShock = shock_.stable;
  settle(menu_, menuPressed, nowMs);
  settle(ok_, okPressed, nowMs);
  settle(shock_, shockPressed, nowMs);

  if (!wasShock && shock_.stable) pendingShock_ = true;

  if (menu_.stable && ok_.stable) {
    suppressMenu_ = true;
    suppressOk_ = true;
    if (!comboActive_) {
      comboActive_ = true;
      comboConsumed_ = false;
      comboStartedAt_ = nowMs;
    } else if (!comboConsumed_ &&
               (nowMs - comboStartedAt_) >= 3000U) {
      pendingReset_ = true;
      comboConsumed_ = true;
    }
  } else {
    comboActive_ = false;
  }

  if (wasMenu && !menu_.stable) {
    if (!suppressMenu_) pendingMenu_ = true;
    suppressMenu_ = false;
  }
  if (wasOk && !ok_.stable) {
    if (!suppressOk_) pendingOk_ = true;
    suppressOk_ = false;
  }
}

bool ThreeButtonController::takeMenu() {
  const bool yes = pendingMenu_;
  pendingMenu_ = false;
  return yes;
}
bool ThreeButtonController::takeOk() {
  const bool yes = pendingOk_;
  pendingOk_ = false;
  return yes;
}
bool ThreeButtonController::takeShock() {
  const bool yes = pendingShock_;
  pendingShock_ = false;
  return yes;
}
bool ThreeButtonController::takeReset() {
  const bool yes = pendingReset_;
  pendingReset_ = false;
  return yes;
}

void InputAdapter::begin() {
#ifdef ARDUINO
  pinMode(HardwareConfig::MENU_BUTTON, INPUT_PULLUP);
  pinMode(HardwareConfig::OK_BUTTON, INPUT_PULLUP);
  pinMode(HardwareConfig::SHOCK_BUTTON, INPUT_PULLUP);
#endif
}

void InputAdapter::poll() {
#ifdef ARDUINO
  buttons_.update(
      digitalRead(HardwareConfig::MENU_BUTTON) == LOW,
      digitalRead(HardwareConfig::OK_BUTTON) == LOW,
      digitalRead(HardwareConfig::SHOCK_BUTTON) == LOW,
      millis());
#endif
}

bool InputAdapter::shockPressed() { return buttons_.takeShock(); }
bool InputAdapter::startPressed() { return buttons_.takeOk(); }
bool InputAdapter::modePressed() { return buttons_.takeMenu(); }
bool InputAdapter::padsPressed() { return buttons_.takeOk(); }
bool InputAdapter::resetPressed() { return buttons_.takeReset(); }
