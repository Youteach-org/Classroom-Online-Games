#include "display-adapter.h"
#include "hardware-config.h"

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <SPI.h>

namespace {
Adafruit_ST7789 tft(HardwareConfig::TFT_CS, HardwareConfig::TFT_DC, HardwareConfig::TFT_RST);

const char* stateLabel(TrainerState state) {
  switch (state) {
    case TrainerState::OFF: return "APAGADO";
    case TrainerState::STARTUP: return "INICIO";
    case TrainerState::APPLY_PADS: return "ELECTRODOS";
    case TrainerState::ANALYZING: return "ANALIZANDO";
    case TrainerState::SHOCK_ADVISED: return "DESCARGA";
    case TrainerState::NO_SHOCK_ADVISED: return "NO DESCARGA";
    case TrainerState::WAITING_SHOCK: return "PRESIONE SHOCK";
    case TrainerState::CPR: return "RCP";
    case TrainerState::REASSESS: return "REANALISIS";
  }
  return "DEA";
}
}

void DisplayAdapter::begin() {
  SPI.begin(HardwareConfig::TFT_SCK, -1, HardwareConfig::TFT_MOSI, HardwareConfig::TFT_CS);
  tft.init(240, 320);
  tft.setRotation(0);
  tft.fillScreen(HardwareConfig::DEA_BLACK);
  tft.setTextWrap(true);
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  tft.fillScreen(HardwareConfig::DEA_BLACK);
  tft.fillRect(0, 0, 240, 42, HardwareConfig::DEA_YELLOW);
  tft.setTextColor(HardwareConfig::DEA_BLACK, HardwareConfig::DEA_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 12);
  tft.print(stateLabel(state));

  tft.setTextColor(HardwareConfig::DEA_WHITE, HardwareConfig::DEA_BLACK);
  tft.setTextSize(2);
  tft.setCursor(12, 70);
  tft.print(message ? message : "");
}
