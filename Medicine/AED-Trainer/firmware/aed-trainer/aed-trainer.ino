#include <Arduino.h>

#include "ble-server.h"
#include "display-adapter.h"
#include "input-adapter.h"
#include "trainer-core.h"

DisplayAdapter display;
InputAdapter inputs;
TrainerCore trainer;
BleServer ble(trainer);

void setup() {
  Serial.begin(115200);
  delay(250);

  display.begin();
  inputs.begin();

  trainer.loadCase({"A1", "T0", "C0"});
  ble.begin();
  display.showState(trainer.state(), "Conecte Teacher Monitor por Bluetooth");
}

void loop() {
  if (inputs.shockPressed()) {
    if (trainer.handleShockPress()) {
      display.showState(trainer.state(), "Descarga simulada aplicada. Inicie RCP.");
      Serial.println("SIMULATED_SHOCK");
      ble.notifyEvent("SHOCK_PRESS");
      ble.publishTrainerState();
    }
  }
  delay(5);
}
