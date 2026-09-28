#pragma once

#include <cstdint>

namespace HardwareConfig {
constexpr int OLED_SDA = 21;
constexpr int OLED_SCL = 22;
constexpr std::uint8_t OLED_ADDRESS = 0x3C;
constexpr int OLED_WIDTH = 128;
constexpr int OLED_HEIGHT = 64;
constexpr int OLED_YELLOW_BAND_HEIGHT = 16;

// All physical buttons are momentary switches wired GPIO -> GND.
// Internal pull-ups are enabled by InputAdapter.
constexpr int SHOCK_BUTTON = 32;
constexpr int START_BUTTON = 33;
constexpr int MODE_BUTTON = 14;
constexpr int RESET_BUTTON = 13;

constexpr int I2S_DOUT = 25;
constexpr int I2S_LRC = 26;
constexpr int I2S_BCLK = 27;
}
