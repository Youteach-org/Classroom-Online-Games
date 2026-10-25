#include "../aed-trainer/input-adapter.h"
#include <cassert>
#include <cstdio>

int main() {
  ThreeButtonController buttons;

  buttons.update(false, false, false, 0);
  buttons.update(true, false, false, 10);
  buttons.update(true, false, false, 50);
  assert(!buttons.takeMenu());
  buttons.update(false, false, false, 100);
  buttons.update(false, false, false, 140);
  assert(buttons.takeMenu());
  assert(!buttons.takeMenu());

  buttons.update(false, true, false, 200);
  buttons.update(false, true, false, 240);
  buttons.update(false, false, false, 300);
  buttons.update(false, false, false, 340);
  assert(buttons.takeOk());
  assert(!buttons.takeOk());

  // Holding the combined reset must not issue individual MENU or OK events.
  buttons.update(true, true, false, 500);
  buttons.update(true, true, false, 540);
  buttons.update(true, true, false, 3500);
  assert(!buttons.takeReset());
  buttons.update(true, true, false, 3540);
  assert(buttons.takeReset());
  assert(!buttons.takeReset());
  buttons.update(false, false, false, 3600);
  buttons.update(false, false, false, 3640);
  assert(!buttons.takeMenu());
  assert(!buttons.takeOk());

  buttons.update(false, false, true, 4000);
  buttons.update(false, false, true, 4040);
  assert(buttons.takeShock());
  buttons.update(false, false, true, 4300);
  assert(!buttons.takeShock());
  buttons.update(false, false, false, 4400);
  buttons.update(false, false, false, 4440);
  assert(!buttons.takeShock());

  std::puts("three-button behavior: OK");
}
