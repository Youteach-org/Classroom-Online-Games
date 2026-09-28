#pragma once

#include <cstdint>

namespace HardwareConfig {
constexpr int OLED_SDA = 21;
constexpr int OLED_SCL = 22;
constexpr std::uint8_t OLED_ADDRESS = 0x3C;
constexpr int OLED_WIDTH = 128;
constexpr int OLED_HEIGHT = 64;
constexpr int OLED_YELLOW_BAND_HEIGHT = 16;

constexpr int SHOCK_BUTTON = 32;

constexpr int I2S_DOUT = 25;
constexpr int I2S_LRC = 26;
constexpr int I2S_BCLK = 27;
}
