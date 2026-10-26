#include "../aed-trainer/shock-led.h"
#include "../aed-trainer/trainer-core.h"

#include <cassert>
#include <cstdio>

static void advanceToAnalysis(TrainerCore& trainer, const char* scenario) {
  assert(trainer.loadCase({scenario, "T0", "C0"}));
  assert(trainer.startCase());
  assert(trainer.advanceStartupStep());
  assert(trainer.advanceStartupStep());
  assert(trainer.advanceStartupStep());
  assert(trainer.advanceStartupStep());
  assert(trainer.beginAnalysis());
  assert(!shouldLightShockLed(trainer.state()));
  assert(trainer.resolveAnalysis());
}

int main() {
  TrainerCore shockable;
  advanceToAnalysis(shockable, "A1");
  assert(shockable.state() == TrainerState::SHOCK_ADVISED);
  assert(shouldLightShockLed(shockable.state()));
  assert(shockable.armShock());
  assert(shockable.state() == TrainerState::WAITING_SHOCK);
  assert(shouldLightShockLed(shockable.state()));
  assert(shockable.handleShockPress());
  assert(shockable.state() == TrainerState::CPR);
  assert(!shouldLightShockLed(shockable.state()));
  assert(shockable.endCase());
  assert(!shouldLightShockLed(shockable.state()));

  TrainerCore nonshockable;
  advanceToAnalysis(nonshockable, "A5");
  assert(nonshockable.state() == TrainerState::NO_SHOCK_ADVISED);
  assert(!shouldLightShockLed(nonshockable.state()));
  assert(nonshockable.beginCprAfterNoShock());
  assert(!shouldLightShockLed(nonshockable.state()));
  std::puts("Shock LED follows AED recommendation: OK");
}
