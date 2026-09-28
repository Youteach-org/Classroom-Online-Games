#include "display-adapter.h"
#include "hardware-config.h"

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

#include <cmath>

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

void drawHeader(const char* text) {
  display.setTextSize(1);
  display.setCursor(0, 3);
  display.print(text);
  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);
}

void drawWarningTriangle(int x, int y) {
  display.drawTriangle(
      x, y + 10,
      x + 6, y,
      x + 12, y + 10,
      SSD1306_WHITE);
  display.drawFastVLine(x + 6, y + 3, 4, SSD1306_WHITE);
  display.drawPixel(x + 6, y + 8, SSD1306_WHITE);
}

int organizedWave(std::uint32_t n) {
  const int phase = static_cast<int>(n % 72U);
  if (phase < 7) return 0;
  if (phase < 11) return -2;
  if (phase < 14) return 4;
  if (phase < 16) return -14;
  if (phase < 19) return 15;
  if (phase < 22) return -4;
  if (phase < 36) return 0;
  if (phase < 45) return 3;
  return 0;
}

int shockableWave(std::uint32_t n) {
  const float x = static_cast<float>(n);
  return static_cast<int>(
      std::sin(x * 0.31f) * 8.0f +
      std::sin(x * 0.73f) * 6.0f +
      std::sin(x * 1.17f) * 4.0f);
}

int contactFaultWave(std::uint32_t n) {
  const int block = static_cast<int>((n / 10U) % 3U);
  if (block == 0) return 0;
  if (block == 1) return static_cast<int>((n % 10U) - 5U);
  return static_cast<int>(5 - static_cast<int>(n % 10U));
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

  drawHeader("DEA EDUCATIVO");

  display.setCursor(0, 22);
  display.print("Inicializando...");
  display.display();
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(true);

  drawHeader(stateLabel(state));

  display.setTextSize(1);
  display.setCursor(0, 20);
  printSpanishAscii(message ? message : "");

  display.display();
}

void DisplayAdapter::showAnalyzing(
    AnalysisOutcome outcome,
    std::uint32_t phase) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);

  drawHeader("ANALIZANDO");

  display.setTextSize(1);
  display.setCursor(0, 18);
  display.print("NO TOQUE AL PACIENTE");

  constexpr int kMiddle = 47;
  constexpr int kTop = 29;
  constexpr int kBottom = 63;

  for (int x = 0; x < HardwareConfig::OLED_WIDTH - 1; ++x) {
    const std::uint32_t n1 = phase + static_cast<std::uint32_t>(x);
    const std::uint32_t n2 = n1 + 1;

    int a = 0;
    int b = 0;

    if (outcome == AnalysisOutcome::SHOCK) {
      a = shockableWave(n1);
      b = shockableWave(n2);
    } else if (outcome == AnalysisOutcome::CONTACT_FAULT) {
      a = contactFaultWave(n1);
      b = contactFaultWave(n2);
    } else {
      a = organizedWave(n1);
      b = organizedWave(n2);
    }

    const int y1 = constrain(kMiddle - a, kTop, kBottom);
    const int y2 = constrain(kMiddle - b, kTop, kBottom);
    display.drawLine(x, y1, x + 1, y2, SSD1306_WHITE);
  }

  display.display();
}

void DisplayAdapter::showShockWarning() {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);

  drawWarningTriangle(0, 2);
  drawWarningTriangle(115, 2);

  display.setTextSize(1);
  display.setCursor(29, 3);
  display.print("DESCARGA");

  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);

  display.setCursor(0, 22);
  display.print("NO TOQUE AL PACIENTE");

  display.setCursor(0, 36);
  display.print("Todos despejados");

  display.setTextSize(2);
  display.setCursor(14, 49);
  display.print("SHOCK");

  display.display();
}

void DisplayAdapter::showCprCountdown(
    std::uint32_t remainingMs,
    std::uint32_t bpm) {
  if (!displayReady) return;

  const std::uint32_t totalSeconds = (remainingMs + 999U) / 1000U;
  const std::uint32_t minutes = totalSeconds / 60U;
  const std::uint32_t seconds = totalSeconds % 60U;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);

  display.setTextSize(1);
  display.setCursor(0, 3);
  display.print("RCP ");
  display.print(bpm);
  display.print("/min");

  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 20);
  display.print("Continue compresiones");

  char timeText[6];
  snprintf(
      timeText,
      sizeof(timeText),
      "%02lu:%02lu",
      static_cast<unsigned long>(minutes),
      static_cast<unsigned long>(seconds));

  display.setTextSize(3);
  display.setCursor(18, 36);
  display.print(timeText);

  display.display();
}
