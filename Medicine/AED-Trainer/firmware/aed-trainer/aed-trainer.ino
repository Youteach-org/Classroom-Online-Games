#include <Arduino.h>

#include "display-adapter.h"
#include "input-adapter.h"
#include "trainer-core.h"

DisplayAdapter display;
InputAdapter inputs;
TrainerCore trainer;

void setup() {
  Serial.begin(115200);
  delay(250);

  display.begin();
  inputs.begin();

  trainer.loadCase({"A1", "T0", "C0"});
  trainer.startCase();
  display.showState(trainer.state(), "DEA educativo listo");
}

void loop() {
  if (inputs.shockPressed()) {
    if (trainer.handleShockPress()) {
      display.showState(trainer.state(), "Descarga simulada aplicada. Inicie RCP.");
      Serial.println("SIMULATED_SHOCK");
    }
  }
  delay(5);
}
