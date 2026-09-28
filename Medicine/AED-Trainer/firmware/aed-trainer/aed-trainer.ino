#include <Arduino.h>

#include "ble-server.h"\n#include "display-adapter.h"
#include "input-adapter.h"
#include "trainer-core.h"

DisplayAdapter display;
InputAdapter inputs;
TrainerCore trainer;\nBleServer ble(trainer);

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
      Serial.println("SIMULATED_SHOCK");\n      ble.notifyEvent("SHOCK_PRESS");\n      ble.publishTrainerState();
    }
  }
  delay(5);
}
