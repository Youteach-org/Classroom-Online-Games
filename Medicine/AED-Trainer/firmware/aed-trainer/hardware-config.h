#pragma once

#include <cstdint>

namespace HardwareConfig {
// ESP32-S3 N8R2, TFT ST7735 1.8-inch 160x128 (landscape).
constexpr int TFT_RST = 8;
constexpr int TFT_DC = 9;
constexpr int TFT_CS = 10;
constexpr int TFT_MOSI = 11;
constexpr int TFT_SCLK = 12;
constexpr int TFT_WIDTH = 160;
constexpr int TFT_HEIGHT = 128;

// Exactly three momentary switches connected GPIO -> GND.
constexpr int MENU_BUTTON = 4;
constexpr int OK_BUTTON = 5;
constexpr int SHOCK_BUTTON = 18;

// MAX98357A I2S: three signals on right header P2; TFT and buttons remain P1.
// SD to 3V3, GAIN to GND, common GND; VIN 5V per existing hardware.
constexpr int I2S_BCLK = 42;
constexpr int I2S_LRC = 41;
constexpr int I2S_DOUT = 40;
}
