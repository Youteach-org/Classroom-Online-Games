#pragma once

#include "trainer-core.h"

class DisplayAdapter {
 public:
  void begin();
  void showState(TrainerState state, const char* message);
};
