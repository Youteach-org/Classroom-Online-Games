#include "display-adapter.h"
#include "hardware-config.h"

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <LittleFS.h>
#include <SPI.h>

#include <cstdio>
#include <cstring>

namespace {

Adafruit_ST7735 display(
    HardwareConfig::TFT_CS,
    HardwareConfig::TFT_DC,
    HardwareConfig::TFT_RST);

constexpr int kAssetWidth = 120;
constexpr int kAssetHeight = 96;
constexpr int kAssetX = (HardwareConfig::TFT_WIDTH - kAssetWidth) / 2;
constexpr int kAssetY = (HardwareConfig::TFT_HEIGHT - kAssetHeight) / 2;

constexpr std::uint32_t kFileHeaderBytes = 14;
constexpr std::uint32_t kPaletteBytes = 32;
constexpr std::uint32_t kPackedPixelBytes = (kAssetWidth * kAssetHeight) / 2;
constexpr std::uint32_t kRecordBytes = kPaletteBytes + kPackedPixelBytes;
constexpr const char* kAssetsPath = "/display-assets.dat";

enum Asset : std::uint16_t {
  ASSET_INICIO = 0,
  ASSET_SELECCION_CASO = 1,
  ASSET_SELECCION_VARIANTE = 2,
  ASSET_PARCHES_ADULTO = 3,
  ASSET_PARCHES_NINO = 4,
  ASSET_PARCHES_LACTANTE = 5,
  ASSET_PARCHES_OK = 6,
  ASSET_ANALIZANDO = 7,
  ASSET_SHOCK_RECOMENDADO = 8,
  ASSET_DESPEJADOS = 9,
  ASSET_APLICANDO_SHOCK = 10,
  ASSET_SHOCK_APLICADO = 11,
  ASSET_INICIA_RCP = 12,
  ASSET_RCP_ARRIBA = 13,
  ASSET_RCP_COMPRESION = 14,
  ASSET_VENTILACIONES = 15,
  ASSET_CONTINUA_RCP = 16,
  ASSET_REEVALUANDO = 17,
  ASSET_NO_SHOCK = 18,
  ASSET_ERROR_PARCHES = 19,
  ASSET_START_BREATHING = 20,
  ASSET_START_CHEST = 21,
  ASSET_START_HELP = 22,
  ASSET_START_RESPONSE = 23,
  ASSET_DROWNING = 24
};

bool displayReady = false;
bool fsReady = false;

void textCentered(const char* text, int y, int size, std::uint16_t color) {
  if (!text) return;

  int16_t x1 = 0;
  int16_t y1 = 0;
  uint16_t width = 0;
  uint16_t height = 0;

  display.setTextSize(size);
  display.setTextColor(color);
  display.setTextWrap(false);
  display.getTextBounds(text, 0, 0, &x1, &y1, &width, &height);

  const int x = width < HardwareConfig::TFT_WIDTH
      ? (HardwareConfig::TFT_WIDTH - static_cast<int>(width)) / 2
      : 0;

  display.setCursor(x, y);
  display.print(text);
}

void fallback(const char* title, const char* line = nullptr) {
  display.fillScreen(ST77XX_BLACK);
  textCentered(title ? title : "DEA", 39, 2, ST77XX_WHITE);
  if (line) textCentered(line, 73, 1, ST77XX_YELLOW);
}

bool ensureFs() {
  if (fsReady) return true;
  fsReady = LittleFS.begin(false, "/littlefs", 10, "littlefs");
  return fsReady;
}

bool renderAsset(std::uint16_t index) {
  if (!displayReady || !ensureFs()) return false;

  File file = LittleFS.open(kAssetsPath, "r");
  if (!file) return false;

  std::uint8_t header[kFileHeaderBytes]{};
  if (file.read(header, sizeof(header)) != sizeof(header)) {
    file.close();
    return false;
  }

  if (std::memcmp(header, "DEAV15A1", 8) != 0) {
    file.close();
    return false;
  }

  const std::uint16_t width =
      static_cast<std::uint16_t>(header[8]) |
      (static_cast<std::uint16_t>(header[9]) << 8);
  const std::uint16_t height =
      static_cast<std::uint16_t>(header[10]) |
      (static_cast<std::uint16_t>(header[11]) << 8);
  const std::uint16_t count =
      static_cast<std::uint16_t>(header[12]) |
      (static_cast<std::uint16_t>(header[13]) << 8);

  if (width != kAssetWidth || height != kAssetHeight || index >= count) {
    file.close();
    return false;
  }

  const std::uint32_t offset =
      kFileHeaderBytes + static_cast<std::uint32_t>(index) * kRecordBytes;

  if (!file.seek(offset)) {
    file.close();
    return false;
  }

  std::uint16_t palette[16]{};
  for (int i = 0; i < 16; ++i) {
    const int lo = file.read();
    const int hi = file.read();
    if (lo < 0 || hi < 0) {
      file.close();
      return false;
    }
    palette[i] =
        static_cast<std::uint16_t>(lo) |
        (static_cast<std::uint16_t>(hi) << 8);
  }

  display.fillScreen(ST77XX_BLACK);

  std::uint8_t packed[kAssetWidth / 2];
  std::uint16_t line[kAssetWidth];

  display.startWrite();
  display.setAddrWindow(kAssetX, kAssetY, kAssetWidth, kAssetHeight);

  for (int y = 0; y < kAssetHeight; ++y) {
    if (file.read(packed, sizeof(packed)) != sizeof(packed)) {
      display.endWrite();
      file.close();
      return false;
    }

    int x = 0;
    for (std::uint8_t value : packed) {
      line[x++] = palette[(value >> 4) & 0x0F];
      line[x++] = palette[value & 0x0F];
    }

    display.writePixels(line, kAssetWidth, true);
  }

  display.endWrite();
  file.close();
  return true;
}

void drawBottomStatus(const char* left, const char* right, std::uint16_t color) {
  display.fillRect(0, 112, 160, 16, ST77XX_BLACK);
  display.drawFastHLine(0, 112, 160, color);
  display.setTextSize(1);
  display.setTextWrap(false);
  display.setTextColor(color);

  if (left) {
    display.setCursor(4, 117);
    display.print(left);
  }

  if (right) {
    int16_t x1 = 0;
    int16_t y1 = 0;
    uint16_t w = 0;
    uint16_t h = 0;
    display.getTextBounds(right, 0, 0, &x1, &y1, &w, &h);
    display.setCursor(156 - static_cast<int>(w), 117);
    display.print(right);
  }
}

}  // namespace

void DisplayAdapter::begin() {
  SPI.begin(
      HardwareConfig::TFT_SCLK,
      -1,
      HardwareConfig::TFT_MOSI,
      HardwareConfig::TFT_CS);

  display.initR(INITR_BLACKTAB);
  display.setRotation(1);
  display.setTextWrap(false);
  display.fillScreen(ST77XX_BLACK);

  displayReady = true;

  // Mount LittleFS here so display assets are available even before audio.
  fsReady = LittleFS.begin(false, "/littlefs", 10, "littlefs");

  if (!renderAsset(ASSET_INICIO)) {
    fallback("DEA EDUCATIVO", "INICIANDO");
  }
}

void DisplayAdapter::showAsset(std::uint16_t index) {
  if (!renderAsset(index)) {
    fallback("DEA", "IMAGEN NO DISPONIBLE");
  }
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  (void)message;
  if (!displayReady) return;

  switch (state) {
    case TrainerState::OFF:
      showAsset(ASSET_INICIO);
      break;

    case TrainerState::STARTUP:
      showAsset(ASSET_START_RESPONSE);
      break;

    case TrainerState::APPLY_PADS:
      showAsset(ASSET_PARCHES_ADULTO);
      break;

    case TrainerState::ANALYZING:
      showAsset(ASSET_ANALIZANDO);
      break;

    case TrainerState::SHOCK_ADVISED:
      showAsset(ASSET_SHOCK_RECOMENDADO);
      break;

    case TrainerState::NO_SHOCK_ADVISED:
      showAsset(ASSET_NO_SHOCK);
      break;

    case TrainerState::WAITING_SHOCK:
      showAsset(ASSET_DESPEJADOS);
      break;

    case TrainerState::CPR:
      showAsset(ASSET_INICIA_RCP);
      break;

    case TrainerState::REASSESS:
      showAsset(ASSET_REEVALUANDO);
      break;
  }
}

void DisplayAdapter::showStartupStep(StartupStep step) {
  switch (step) {
    case StartupStep::CHECK_RESPONSE:
      showAsset(ASSET_START_RESPONSE);
      break;
    case StartupStep::CALL_HELP:
      showAsset(ASSET_START_HELP);
      break;
    case StartupStep::CHECK_BREATHING:
      showAsset(ASSET_START_BREATHING);
      break;
    case StartupStep::EXPOSE_CHEST:
      showAsset(ASSET_START_CHEST);
      break;
  }
}

void DisplayAdapter::showReadyCase(const char* scenarioId) {
  showAsset(ASSET_SELECCION_CASO);

  char status[24];
  std::snprintf(
      status,
      sizeof(status),
      "MODE: CASO %s",
      scenarioId ? scenarioId : "A1");

  drawBottomStatus(status, "START", ST77XX_YELLOW);
}

void DisplayAdapter::showAnalyzing(
    AnalysisOutcome outcome,
    std::uint32_t phase) {
  (void)outcome;

  showAsset(ASSET_ANALIZANDO);

  // Animated scan marker: visible movement without redrawing crude graphics.
  const int x = 22 + static_cast<int>(phase % 116U);
  display.drawFastVLine(x, 24, 73, ST77XX_CYAN);
}

void DisplayAdapter::showMovementWarning() {
  showAsset(ASSET_ANALIZANDO);
  display.fillRect(0, 105, 160, 23, ST77XX_RED);
  textCentered("DETENGA MOVIMIENTO", 112, 1, ST77XX_WHITE);
}

void DisplayAdapter::showShockWarning(bool trianglesVisible) {
  showAsset(trianglesVisible ? ASSET_DESPEJADOS : ASSET_SHOCK_RECOMENDADO);
}

void DisplayAdapter::showCprCountdown(
    std::uint32_t remainingMs,
    std::uint32_t bpm,
    bool compression) {
  showAsset(compression ? ASSET_RCP_COMPRESION : ASSET_RCP_ARRIBA);

  const std::uint32_t totalSeconds = (remainingMs + 999U) / 1000U;
  const std::uint32_t minutes = totalSeconds / 60U;
  const std::uint32_t seconds = totalSeconds % 60U;

  char timeText[8];
  std::snprintf(
      timeText,
      sizeof(timeText),
      "%02lu:%02lu",
      static_cast<unsigned long>(minutes),
      static_cast<unsigned long>(seconds));

  char bpmText[16];
  std::snprintf(
      bpmText,
      sizeof(bpmText),
      "%lu/min",
      static_cast<unsigned long>(bpm));

  drawBottomStatus(timeText, bpmText, ST77XX_GREEN);
}

void DisplayAdapter::showPadError() {
  showAsset(ASSET_ERROR_PARCHES);
}

void DisplayAdapter::showPromptVisual(const std::string& promptId) {
  if (promptId == "AED_CHECK_RESPONSE") {
    showAsset(ASSET_START_RESPONSE);
  } else if (promptId == "AED_CALL_HELP") {
    showAsset(ASSET_START_HELP);
  } else if (promptId == "AED_CHECK_BREATHING") {
    showAsset(ASSET_START_BREATHING);
  } else if (promptId == "AED_EXPOSE_CHEST") {
    showAsset(ASSET_START_CHEST);
  } else if (promptId == "AED_ATTACH_PADS") {
    showAsset(ASSET_PARCHES_ADULTO);
  } else if (promptId == "AED_CHECK_PADS") {
    showAsset(ASSET_ERROR_PARCHES);
  } else if (promptId == "AED_ANALYZING") {
    showAsset(ASSET_ANALIZANDO);
  } else if (promptId == "AED_SHOCK_ADVISED") {
    showAsset(ASSET_SHOCK_RECOMENDADO);
  } else if (promptId == "AED_PRESS_SHOCK") {
    showAsset(ASSET_DESPEJADOS);
  } else if (promptId == "AED_SHOCK_DELIVERED") {
    showAsset(ASSET_SHOCK_APLICADO);
  } else if (promptId == "AED_NO_SHOCK") {
    showAsset(ASSET_NO_SHOCK);
  } else if (promptId == "AED_BEGIN_CPR") {
    showAsset(ASSET_INICIA_RCP);
  } else if (promptId == "AED_CONTINUE_CPR") {
    showAsset(ASSET_CONTINUA_RCP);
  } else if (promptId == "AED_REASSESS") {
    showAsset(ASSET_REEVALUANDO);
  }
}