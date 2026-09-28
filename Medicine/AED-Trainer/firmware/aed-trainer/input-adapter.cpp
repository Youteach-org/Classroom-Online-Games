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

void InputAdapter::begin() {
#ifdef ARDUINO
  pinMode(HardwareConfig::SHOCK_BUTTON, INPUT_PULLUP);
  pinMode(HardwareConfig::START_BUTTON, INPUT_PULLUP);
  pinMode(HardwareConfig::MODE_BUTTON, INPUT_PULLUP);
  pinMode(HardwareConfig::RESET_BUTTON, INPUT_PULLUP);
#endif
}

bool InputAdapter::shockPressed() {
#ifdef ARDUINO
  return shockDebouncer_.update(
      digitalRead(HardwareConfig::SHOCK_BUTTON) == LOW, millis());
#else
  return false;
#endif
}

bool InputAdapter::startPressed() {
#ifdef ARDUINO
  return startDebouncer_.update(
      digitalRead(HardwareConfig::START_BUTTON) == LOW, millis());
#else
  return false;
#endif
}

bool InputAdapter::modePressed() {
#ifdef ARDUINO
  return modeDebouncer_.update(
      digitalRead(HardwareConfig::MODE_BUTTON) == LOW, millis());
#else
  return false;
#endif
}

bool InputAdapter::resetPressed() {
#ifdef ARDUINO
  return resetDebouncer_.update(
      digitalRead(HardwareConfig::RESET_BUTTON) == LOW, millis());
#else
  return false;
#endif
}
