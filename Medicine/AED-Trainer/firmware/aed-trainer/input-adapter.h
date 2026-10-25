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


/**
 * Three physical buttons: MENU, OK and SHOCK.
 * MENU/OK fire only on release; holding both for 3 seconds fires RESET
 * without emitting either individual button action.
 * SHOCK fires once on debounced press for prompt shock delivery.
 */
class ThreeButtonController {
 public:
  void update(bool menuPressed, bool okPressed, bool shockPressed,
              std::uint32_t nowMs);
  bool takeMenu();
  bool takeOk();
  bool takeShock();
  bool takeReset();

 private:
  struct Button {
    bool initialized{false};
    bool raw{false};
    bool stable{false};
    std::uint32_t changedAt{0};
  };
  static void settle(Button& button, bool pressed, std::uint32_t nowMs);
  Button menu_;
  Button ok_;
  Button shock_;
  bool comboActive_{false};
  bool comboConsumed_{false};
  bool suppressMenu_{false};
  bool suppressOk_{false};
  std::uint32_t comboStartedAt_{0};
  bool pendingMenu_{false};
  bool pendingOk_{false};
  bool pendingShock_{false};
  bool pendingReset_{false};
};

class InputAdapter {
 public:
  void begin();
  void poll();
  bool shockPressed();
  bool startPressed();
  bool modePressed();
  bool padsPressed();
  bool resetPressed();

 private:
  ThreeButtonController buttons_;
};
