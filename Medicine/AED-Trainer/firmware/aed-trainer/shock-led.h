#pragma once

#include "trainer-core.h"

// The lamp indicates a simulated shock recommendation, not a real output.
inline bool shouldLightShockLed(TrainerState state) {
  return state == TrainerState::SHOCK_ADVISED ||
         state == TrainerState::WAITING_SHOCK;
}
