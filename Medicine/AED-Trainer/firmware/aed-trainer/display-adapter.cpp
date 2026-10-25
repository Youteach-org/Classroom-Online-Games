#include "display-adapter.h"
#include "hardware-config.h"

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <LittleFS.h>
#include <SPI.h>

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace {

Adafruit_ST7735 display(
    HardwareConfig::TFT_CS,
    HardwareConfig::TFT_DC,
    HardwareConfig::TFT_RST);

constexpr int kAssetWidth = 160;
constexpr int kAssetHeight = 128;
constexpr std::uint32_t kFileHeaderBytes = 14;
constexpr std::uint32_t kPaletteBytes = 32;
constexpr std::uint32_t kPackedPixelBytes = (kAssetWidth * kAssetHeight) / 2;
constexpr std::uint32_t kRecordBytes = kPaletteBytes + kPackedPixelBytes;
constexpr const char* kAssetsPath = "/display-assets.dat";

enum Asset : std::uint16_t {
  ASSET_INICIO = 0,
  ASSET_SELECCION_VARIANTE = 1,
  ASSET_PARCHES_ADULTO = 2,
  ASSET_PARCHES_NINO = 3,
  ASSET_PARCHES_LACTANTE = 4,
  ASSET_PARCHES_OK = 5,
  ASSET_ANALIZANDO = 6,
  ASSET_SHOCK_RECOMENDADO = 7,
  ASSET_DESPEJADOS = 8,
  ASSET_APLICANDO_SHOCK = 9,
  ASSET_SHOCK_APLICADO = 10,
  ASSET_INICIA_RCP = 11,
  ASSET_RCP_ARRIBA = 12,
  ASSET_RCP_COMPRESION = 13,
  ASSET_VENTILACIONES = 14,
  ASSET_CONTINUA_RCP = 15,
  ASSET_REEVALUANDO = 16,
  ASSET_NO_SHOCK = 17,
  ASSET_ERROR_PARCHES = 18,
  ASSET_START_BREATHING = 19,
  ASSET_START_CHEST = 20,
  ASSET_START_HELP = 21,
  ASSET_START_RESPONSE = 22,
  ASSET_DROWNING = 23,
  ASSET_CASE_A1 = 24,
  ASSET_CASE_A2 = 25,
  ASSET_CASE_A3 = 26,
  ASSET_CASE_A4 = 27,
  ASSET_CASE_A5 = 28,
  ASSET_CASE_A6 = 29,
  ASSET_CASE_A7 = 30,
  ASSET_CASE_A8 = 31
};

bool displayReady = false;
bool fsReady = false;
std::int32_t currentAsset = -1;

// Full-frame buffer: decode first, then push in one burst.
// This removes the visible row-by-row "rayado" from the previous build.
std::uint16_t frameBuffer[kAssetWidth * kAssetHeight];

// CPR frames are cached before the music begins so animation never competes
// with the background song for LittleFS reads.
std::uint8_t* cprUpRecord = nullptr;
std::uint8_t* cprDownRecord = nullptr;

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

bool ensureFs() {
  if (fsReady) return true;
  fsReady = LittleFS.begin(false, "/littlefs", 10, "littlefs");
  return fsReady;
}

bool readPackHeader(File& file, std::uint16_t* count) {
  std::uint8_t header[kFileHeaderBytes]{};
  if (file.read(header, sizeof(header)) != sizeof(header)) return false;

  if (std::memcmp(header, "DEAV15F2", 8) != 0) return false;

  const std::uint16_t width =
      static_cast<std::uint16_t>(header[8]) |
      (static_cast<std::uint16_t>(header[9]) << 8);
  const std::uint16_t height =
      static_cast<std::uint16_t>(header[10]) |
      (static_cast<std::uint16_t>(header[11]) << 8);
  *count =
      static_cast<std::uint16_t>(header[12]) |
      (static_cast<std::uint16_t>(header[13]) << 8);

  return width == kAssetWidth && height == kAssetHeight;
}

bool seekAsset(File& file, std::uint16_t index) {
  std::uint16_t count = 0;
  if (!readPackHeader(file, &count) || index >= count) return false;

  const std::uint32_t offset =
      kFileHeaderBytes + static_cast<std::uint32_t>(index) * kRecordBytes;
  return file.seek(offset);
}

void decodeRecordMemory(const std::uint8_t* record) {
  std::uint16_t palette[16]{};
  for (int i = 0; i < 16; ++i) {
    palette[i] =
        static_cast<std::uint16_t>(record[i * 2]) |
        (static_cast<std::uint16_t>(record[i * 2 + 1]) << 8);
  }

  const std::uint8_t* packed = record + kPaletteBytes;
  std::size_t out = 0;
  for (std::uint32_t i = 0; i < kPackedPixelBytes; ++i) {
    const std::uint8_t value = packed[i];
    frameBuffer[out++] = palette[(value >> 4) & 0x0F];
    frameBuffer[out++] = palette[value & 0x0F];
  }
}

bool decodeAssetFromFile(std::uint16_t index) {
  if (!ensureFs()) return false;

  File file = LittleFS.open(kAssetsPath, "r");
  if (!file || !seekAsset(file, index)) {
    if (file) file.close();
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

  std::uint8_t packedRow[kAssetWidth / 2];
  std::size_t out = 0;

  for (int y = 0; y < kAssetHeight; ++y) {
    if (file.read(packedRow, sizeof(packedRow)) != sizeof(packedRow)) {
      file.close();
      return false;
    }

    for (std::uint8_t value : packedRow) {
      frameBuffer[out++] = palette[(value >> 4) & 0x0F];
      frameBuffer[out++] = palette[value & 0x0F];
    }
  }

  file.close();
  return true;
}

bool readAssetRecord(std::uint16_t index, std::uint8_t* destination) {
  if (!destination || !ensureFs()) return false;

  File file = LittleFS.open(kAssetsPath, "r");
  if (!file || !seekAsset(file, index)) {
    if (file) file.close();
    return false;
  }

  const bool ok = file.read(destination, kRecordBytes) == kRecordBytes;
  file.close();
  return ok;
}

void blitFrame() {
  display.startWrite();
  display.setAddrWindow(0, 0, kAssetWidth, kAssetHeight);
  display.writePixels(frameBuffer, kAssetWidth * kAssetHeight, true);
  display.endWrite();
}

bool renderAsset(std::uint16_t index, bool force = false) {
  if (!displayReady) return false;
  if (!force && currentAsset == static_cast<std::int32_t>(index)) return true;

  if (index == ASSET_RCP_ARRIBA && cprUpRecord) {
    decodeRecordMemory(cprUpRecord);
  } else if (index == ASSET_RCP_COMPRESION && cprDownRecord) {
    decodeRecordMemory(cprDownRecord);
  } else if (!decodeAssetFromFile(index)) {
    return false;
  }

  blitFrame();
  currentAsset = index;
  return true;
}

void fallback(const char* title, const char* line = nullptr) {
  currentAsset = -1;
  display.fillScreen(ST77XX_BLACK);
  textCentered(title ? title : "DEA", 39, 2, ST77XX_WHITE);
  if (line) textCentered(line, 73, 1, ST77XX_YELLOW);
}

std::uint16_t caseAsset(const char* scenarioId) {
  if (!scenarioId) return ASSET_CASE_A1;
  if (std::strcmp(scenarioId, "A2") == 0) return ASSET_CASE_A2;
  if (std::strcmp(scenarioId, "A3") == 0) return ASSET_CASE_A3;
  if (std::strcmp(scenarioId, "A4") == 0) return ASSET_CASE_A4;
  if (std::strcmp(scenarioId, "A5") == 0) return ASSET_CASE_A5;
  if (std::strcmp(scenarioId, "A6") == 0) return ASSET_CASE_A6;
  if (std::strcmp(scenarioId, "A7") == 0) return ASSET_CASE_A7;
  if (std::strcmp(scenarioId, "A8") == 0) return ASSET_CASE_A8;
  return ASSET_CASE_A1;
}

int organizedWave(std::uint32_t n) {
  const int phase = static_cast<int>(n % 72U);
  if (phase < 7) return 0;
  if (phase < 11) return -2;
  if (phase < 14) return 4;
  if (phase < 16) return -15;
  if (phase < 19) return 17;
  if (phase < 22) return -5;
  if (phase < 36) return 0;
  if (phase < 45) return 3;
  return 0;
}

int shockableWave(std::uint32_t n) {
  const float x = static_cast<float>(n);
  return static_cast<int>(
      std::sin(x * 0.31f) * 12.0f +
      std::sin(x * 0.73f) * 8.0f +
      std::sin(x * 1.17f) * 5.0f);
}

int contactFaultWave(std::uint32_t n) {
  const int block = static_cast<int>((n / 6U) % 4U);
  if (block == 0) return 0;
  if (block == 1) return static_cast<int>((n % 12U) - 6U) * 2;
  if (block == 2) return static_cast<int>(6 - static_cast<int>(n % 12U)) * 2;
  return (n % 2U) ? 12 : -12;
}

void drawAnalysisTrace(AnalysisOutcome outcome, std::uint32_t phase) {
  constexpr int top = 39;
  constexpr int bottom = 127;
  constexpr int mid = 82;

  display.fillRect(0, top, 160, bottom - top + 1, ST77XX_BLACK);

  const std::uint16_t grid = display.color565(0, 50, 30);
  for (int x = 0; x < 160; x += 20) {
    display.drawFastVLine(x, top, bottom - top + 1, grid);
  }
  for (int y = top; y <= bottom; y += 16) {
    display.drawFastHLine(0, y, 160, grid);
  }

  const std::uint16_t trace = display.color565(50, 255, 120);

  for (int x = 0; x < 159; ++x) {
    const std::uint32_t n1 = phase + static_cast<std::uint32_t>(x);
    const std::uint32_t n2 = n1 + 1U;
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

    const int y1 = constrain(mid - a, top + 4, bottom - 3);
    const int y2 = constrain(mid - b, top + 4, bottom - 3);
    display.drawLine(x, y1, x + 1, y2, trace);
  }

  const int sweep = static_cast<int>(phase % 160U);
  display.drawFastVLine(sweep, top, bottom - top + 1, display.color565(130, 255, 190));

  if (outcome == AnalysisOutcome::CONTACT_FAULT) {
    display.fillRoundRect(41, 102, 78, 19, 4, ST77XX_RED);
    textCentered("REVISE PARCHES", 108, 1, ST77XX_WHITE);
  } else {
    display.fillRoundRect(32, 103, 96, 18, 4, ST77XX_BLACK);
    textCentered("NO TOQUE", 108, 1, ST77XX_YELLOW);
  }
}

void drawCprOverlay(std::uint32_t remainingMs, std::uint32_t bpm) {
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

  char bpmText[18];
  std::snprintf(
      bpmText,
      sizeof(bpmText),
      "RCP %lu/min",
      static_cast<unsigned long>(bpm));

  // Timer sits ON TOP of the image, large enough to read at a glance.
  display.fillRoundRect(27, 2, 106, 43, 6, ST77XX_BLACK);
  display.drawRoundRect(27, 2, 106, 43, 6, ST77XX_YELLOW);
  textCentered(timeText, 6, 3, ST77XX_WHITE);
  textCentered(bpmText, 34, 1, ST77XX_YELLOW);
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
  fsReady = LittleFS.begin(false, "/littlefs", 10, "littlefs");

  if (!renderAsset(ASSET_INICIO, true)) {
    fallback("DEA EDUCATIVO", "INICIANDO");
  }
}

void DisplayAdapter::showAsset(std::uint16_t index, bool force) {
  if (!renderAsset(index, force)) {
    fallback("DEA", "IMAGEN NO DISPONIBLE");
  }
}

bool DisplayAdapter::prepareCprFrames() {
  if (cprUpRecord && cprDownRecord) return true;

  if (!cprUpRecord) {
    cprUpRecord = static_cast<std::uint8_t*>(std::malloc(kRecordBytes));
  }
  if (!cprDownRecord) {
    cprDownRecord = static_cast<std::uint8_t*>(std::malloc(kRecordBytes));
  }

  if (!cprUpRecord || !cprDownRecord) return false;

  const bool upOk = readAssetRecord(ASSET_RCP_ARRIBA, cprUpRecord);
  const bool downOk = readAssetRecord(ASSET_RCP_COMPRESION, cprDownRecord);
  return upOk && downOk;
}

void DisplayAdapter::showState(TrainerState state, const char* message) {
  (void)message;

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
  showAsset(caseAsset(scenarioId), true);

  display.fillRoundRect(3, 108, 42, 17, 4, ST77XX_BLACK);
  display.drawRoundRect(3, 108, 42, 17, 4, ST77XX_YELLOW);
  display.setTextSize(1);
  display.setTextColor(ST77XX_YELLOW);
  display.setCursor(9, 113);
  display.print("MENU");

  display.fillRoundRect(111, 108, 46, 17, 4, ST77XX_BLACK);
  display.drawRoundRect(111, 108, 46, 17, 4, ST77XX_GREEN);
  display.setTextColor(ST77XX_GREEN);
  display.setCursor(119, 113);
  display.print("OK");
}

void DisplayAdapter::showAnalyzing(
    AnalysisOutcome outcome,
    std::uint32_t phase) {
  if (currentAsset != ASSET_ANALIZANDO) {
    showAsset(ASSET_ANALIZANDO, true);
  }
  drawAnalysisTrace(outcome, phase);
}

void DisplayAdapter::showMovementWarning() {
  showAsset(ASSET_ANALIZANDO, true);
  display.fillRect(0, 91, 160, 37, ST77XX_RED);
  textCentered("DETENGA", 95, 2, ST77XX_WHITE);
  textCentered("MOVIMIENTO", 114, 1, ST77XX_WHITE);
  // Force a clean redraw when analysis resumes.
  currentAsset = -1;
}

void DisplayAdapter::showShockWarning(bool trianglesVisible) {
  showAsset(trianglesVisible ? ASSET_DESPEJADOS : ASSET_SHOCK_RECOMENDADO);
}

void DisplayAdapter::showCprCountdown(
    std::uint32_t remainingMs,
    std::uint32_t bpm,
    bool compression) {
  prepareCprFrames();

  const std::uint16_t asset =
      compression ? ASSET_RCP_COMPRESION : ASSET_RCP_ARRIBA;

  showAsset(asset);
  drawCprOverlay(remainingMs, bpm);
}

void DisplayAdapter::showPadError() {
  showAsset(ASSET_ERROR_PARCHES, true);
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

  // Case/twist/clinical prompts get a related illustration instead of a
  // generic repeated screen.
  } else if (promptId.find("DROWNING") != std::string::npos ||
             promptId.find("WET_CHEST") != std::string::npos) {
    showAsset(ASSET_DROWNING);
  } else if (promptId.find("PEDIATRIC") != std::string::npos) {
    showAsset(ASSET_PARCHES_NINO);
  } else if (promptId.find("PERSON_TOUCHING") != std::string::npos) {
    showAsset(ASSET_DESPEJADOS);
  } else if (promptId.find("MOVEMENT") != std::string::npos) {
    showMovementWarning();
  } else if (promptId.find("ELECTRICAL_HAZARD") != std::string::npos ||
             promptId.find("ELECTROCUTION") != std::string::npos) {
    showAsset(ASSET_APLICANDO_SHOCK);
  } else if (promptId.find("AIRWAY_OBSTRUCTION") != std::string::npos ||
             promptId.find("ASTHMA") != std::string::npos) {
    showAsset(ASSET_VENTILACIONES);
  } else if (promptId.find("OPIOID") != std::string::npos ||
             promptId.find("ANAPHYLAXIS") != std::string::npos ||
             promptId.find("POISONING") != std::string::npos) {
    showAsset(ASSET_NO_SHOCK);
  } else if (promptId.rfind("PARAMEDIC_", 0) == 0) {
    showAsset(ASSET_PARCHES_ADULTO);
  }
}