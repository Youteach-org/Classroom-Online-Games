#pragma once

#include <cstdint>

#include "trainer-core.h"

class DisplayAdapter {
 public:
  void begin();
  void showState(TrainerState state, const char* message);
  void showAnalyzing(AnalysisOutcome outcome, std::uint32_t phase);
  void showShockWarning();
  void showCprCountdown(std::uint32_t remainingMs, std::uint32_t bpm);
};
