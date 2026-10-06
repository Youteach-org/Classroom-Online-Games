#pragma once

#include <cstdint>

namespace HardwareConfig {
// TFT ST7735 1.8" 160x128 (landscape)
constexpr int TFT_RST  = 4;
constexpr int TFT_CS   = 5;
constexpr int TFT_DC   = 2;
constexpr int TFT_MOSI = 23;
constexpr int TFT_SCLK = 18;
constexpr int TFT_WIDTH = 160;
constexpr int TFT_HEIGHT = 128;

// All physical buttons are momentary switches wired GPIO -> GND.
// Internal pull-ups are enabled by InputAdapter.
constexpr int SHOCK_BUTTON = 32;
constexpr int START_BUTTON = 33;
constexpr int MODE_BUTTON = 14;
constexpr int PADS_BUTTON = 13;
constexpr int RESET_BUTTON = 17;

// MAX98357A
constexpr int I2S_DOUT = 25;
constexpr int I2S_LRC = 26;
constexpr int I2S_BCLK = 27;
}