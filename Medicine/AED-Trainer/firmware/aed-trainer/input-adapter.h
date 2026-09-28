#pragma once

#include <cstdint>

class ShockButtonDebouncer {
 public:
  explicit ShockButtonDebouncer(std::uint32_t debounceMs = 35);
  bool update(bool pressed, std::uint32_t nowMs);
  bool consumePress();

 private:
  std::uint32_t debounceMs_;
  bool initialized_{false};
  bool rawPressed_{false};
  bool stablePressed_{false};
  bool pressPending_{false};
  std::uint32_t rawChangedAt_{0};
};

class InputAdapter {
 public:
  void begin();
  bool shockPressed();

 private:
  ShockButtonDebouncer shockDebouncer_{35};
};
