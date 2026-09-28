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

  if (rawPressed_ != stablePressed_ && (nowMs - rawChangedAt_) >= debounceMs_) {
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
#endif
}

bool InputAdapter::shockPressed() {
#ifdef ARDUINO
  const bool pressed = digitalRead(HardwareConfig::SHOCK_BUTTON) == LOW;
  return shockDebouncer_.update(pressed, millis());
#else
  return false;
#endif
}
