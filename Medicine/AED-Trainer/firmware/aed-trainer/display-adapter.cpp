#include "display-adapter.h"
#include "hardware-config.h"

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

#include <cmath>
#include <cstdio>

namespace {

Adafruit_SSD1306 display(
    HardwareConfig::OLED_WIDTH,
    HardwareConfig::OLED_HEIGHT,
    &Wire,
    -1);

bool displayReady = false;

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
  // Yellow physical band: keep the current small header exactly here.
  display.setTextSize(1);
  display.setTextWrap(false);
  display.setCursor(0, 3);
  display.print(text);
  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);
}

void printCenteredLarge(const char* text, int y, int size = 2) {
  if (!text) return;
  const int charWidth = 6 * size;
  int width = 0;
  for (const char* p = text; *p; ++p) ++width;
  width *= charWidth;
  const int x = width < HardwareConfig::OLED_WIDTH
      ? (HardwareConfig::OLED_WIDTH - width) / 2
      : 0;
  display.setTextSize(size);
  display.setCursor(x, y);
  display.print(text);
}

void drawLargeBlueState(TrainerState state) {
  display.setTextWrap(false);

  switch (state) {
    case TrainerState::OFF:
      printCenteredLarge("LISTO", 20, 2);
      printCenteredLarge("PULSE START", 44, 1);
      break;

    case TrainerState::STARTUP:
      printCenteredLarge("SIGA", 18, 2);
      printCenteredLarge("LA VOZ", 42, 2);
      break;

    case TrainerState::APPLY_PADS:
      printCenteredLarge("COLOQUE", 16, 2);
      printCenteredLarge("ELECTRODOS", 32, 2);
      printCenteredLarge("PADS/OK", 48, 2);
      break;

    case TrainerState::NO_SHOCK_ADVISED:
      printCenteredLarge("NO SE INDICA", 18, 1);
      printCenteredLarge("DESCARGA", 31, 2);
      printCenteredLarge("INICIE RCP", 52, 1);
      break;

    case TrainerState::REASSESS:
      printCenteredLarge("DETENGA RCP", 18, 1);
      printCenteredLarge("NUEVO", 32, 2);
      printCenteredLarge("ANALISIS", 49, 2);
      break;

    case TrainerState::ANALYZING:
      printCenteredLarge("NO TOQUE", 18, 2);
      printCenteredLarge("AL PACIENTE", 38, 1);
      break;

    case TrainerState::SHOCK_ADVISED:
    case TrainerState::WAITING_SHOCK:
      printCenteredLarge("TODOS", 18, 2);
      printCenteredLarge("DESPEJADOS", 35, 2);
      printCenteredLarge("PRESIONE SHOCK", 56, 1);
      break;

    case TrainerState::CPR:
      printCenteredLarge("CONTINUE RCP", 20, 1);
      break;
  }
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
  drawHeader("DEA EDUCATIVO");
  printCenteredLarge("INICIANDO", 28, 2);
  display.display();
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  (void)message;
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  drawHeader(stateLabel(state));
  drawLargeBlueState(state);
  display.display();
}

void DisplayAdapter::showStartupStep(StartupStep step) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);
  drawHeader("INICIO");

  switch (step) {
    case StartupStep::CHECK_RESPONSE:
      printCenteredLarge("COMPRUEBE", 17, 2);
      printCenteredLarge("RESPUESTA", 35, 2);
      printCenteredLarge("PADS/OK", 56, 1);
      break;

    case StartupStep::CALL_HELP:
      printCenteredLarge("SOLICITE", 16, 2);
      printCenteredLarge("AYUDA MEDICA", 36, 1);
      printCenteredLarge("PADS/OK", 53, 1);
      break;

    case StartupStep::CHECK_BREATHING:
      printCenteredLarge("COMPRUEBE", 17, 2);
      printCenteredLarge("RESPIRACION", 39, 1);
      printCenteredLarge("PADS/OK", 55, 1);
      break;

    case StartupStep::EXPOSE_CHEST:
      printCenteredLarge("DESCUBRA", 16, 2);
      printCenteredLarge("EL PECHO", 36, 2);
      printCenteredLarge("PADS/OK", 56, 1);
      break;
  }

  display.display();
}

void DisplayAdapter::showReadyCase(const char* scenarioId) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  drawHeader("LISTO");

  char line[12];
  std::snprintf(line, sizeof(line), "CASO %s", scenarioId ? scenarioId : "A1");
  printCenteredLarge(line, 20, 2);
  printCenteredLarge("START", 44, 2);

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

  // Full instruction, fitted to the blue area without truncating words.
  printCenteredLarge("NO TOQUE", 16, 2);
  printCenteredLarge("AL PACIENTE", 34, 1);

  // ECG remains visible in the lower part of the blue area.
  constexpr int kMiddle = 53;
  constexpr int kTop = 43;
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

void DisplayAdapter::showShockWarning(bool trianglesVisible) {
  if (!displayReady) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextWrap(false);

  // Yellow band remains compact, as requested.
  if (trianglesVisible) {
    drawWarningTriangle(0, 2);
    drawWarningTriangle(115, 2);
  }
  display.setTextSize(1);
  display.setCursor(29, 3);
  display.print("DESCARGA");
  display.drawFastHLine(
      0,
      HardwareConfig::OLED_YELLOW_BAND_HEIGHT - 1,
      HardwareConfig::OLED_WIDTH,
      SSD1306_WHITE);

  // Blue area: complete instruction, mixed sizes only where needed to fit.
  printCenteredLarge("TODOS", 17, 2);
  printCenteredLarge("DESPEJADOS", 33, 2);
  printCenteredLarge("PRESIONE SHOCK", 55, 1);

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

  // Yellow band unchanged in scale.
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

  // Blue area uses the space without clipping: full instruction plus timer.
  printCenteredLarge("CONTINUE RCP", 17, 1);

  char timeText[6];
  std::snprintf(
      timeText,
      sizeof(timeText),
      "%02lu:%02lu",
      static_cast<unsigned long>(minutes),
      static_cast<unsigned long>(seconds));

  printCenteredLarge(timeText, 37, 3);

  display.display();
}
