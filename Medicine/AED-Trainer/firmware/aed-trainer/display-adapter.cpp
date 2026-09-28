#include "display-adapter.h"
#include "hardware-config.h"

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

namespace {

Adafruit_SSD1306 display(
    HardwareConfig::OLED_WIDTH,
    HardwareConfig::OLED_HEIGHT,
    &Wire,
    -1);

bool displayReady = false;

void printSpanishAscii(const char* text) {
  if (!text || !displayReady) return;

  const auto* p = reinterpret_cast<const unsigned char*>(text);
  while (*p) {
    if (*p == 0xC3 && p[1]) {
      const unsigned char code = p[1];
      char mapped = 0;
      switch (code) {
        case 0xA1: mapped = 'a'; break;
        case 0xA9: mapped = 'e'; break;
        case 0xAD: mapped = 'i'; break;
        case 0xB3: mapped = 'o'; break;
        case 0xBA: mapped = 'u'; break;
        case 0xB1: mapped = 'n'; break;
        case 0xBC: mapped = 'u'; break;
        case 0x81: mapped = 'A'; break;
        case 0x89: mapped = 'E'; break;
        case 0x8D: mapped = 'I'; break;
        case 0x93: mapped = 'O'; break;
        case 0x9A: mapped = 'U'; break;
        case 0x91: mapped = 'N'; break;
        case 0x9C: mapped = 'U'; break;
        default: break;
      }
      if (mapped) display.write(mapped);
      p += 2;
      continue;
    }

    if (*p == 0xC2 && p[1]) {
      if (p[1] == 0xBF) display.write('?');
      else if (p[1] == 0xA1) display.write('!');
      p += 2;
      continue;
    }

    if (*p < 0x80) display.write(*p);
    ++p;
  }
}

const char* stateLabel(TrainerState state) {
  switch (state) {
    case TrainerState::OFF: return "LISTO";
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

}  // namespace

void DisplayAdapter::begin() {
  Wire.begin(HardwareConfig::OLED_SDA, HardwareConfig::OLED_SCL);

  displayReady = display.begin(
      SSD1306_SWITCHCAPVCC,
      HardwareConfig::OLED_ADDRESS,
      true,
      false);

  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(true);

  display.setTextSize(1);
  display.setCursor(0, 3);
  display.print("DEA EDUCATIVO");

  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);

  display.setCursor(0, 22);
  display.print("Listo para");
  display.setCursor(0, 34);
  display.print("entrenamiento");
  display.display();
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(true);

  // The OLED is physically bicolor:
  // rows 0-15 appear yellow, rows 16-63 appear blue.
  display.setTextSize(1);
  display.setCursor(0, 3);
  display.print(stateLabel(state));
  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 20);
  printSpanishAscii(message ? message : "");

  display.display();
}
