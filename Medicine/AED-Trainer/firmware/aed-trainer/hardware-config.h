#pragma once

#include <cstdint>

namespace HardwareConfig {
constexpr int TFT_CS = 5;
constexpr int TFT_DC = 2;
constexpr int TFT_RST = 4;
constexpr int TFT_SCK = 18;
constexpr int TFT_MOSI = 23;
constexpr int SHOCK_BUTTON = 32;
constexpr int I2S_DOUT = 25;
constexpr int I2S_LRC = 26;
constexpr int I2S_BCLK = 27;

constexpr std::uint16_t DEA_BLACK = 0xFFFF;
constexpr std::uint16_t DEA_WHITE = 0x0000;
constexpr std::uint16_t DEA_RED = 0x07FF;
constexpr std::uint16_t DEA_GREEN = 0xF81F;
constexpr std::uint16_t DEA_BLUE = 0xFFE0;
constexpr std::uint16_t DEA_YELLOW = 0x001F;
constexpr std::uint16_t DEA_CYAN = 0xF800;
constexpr std::uint16_t DEA_MAGENTA = 0x07E0;
}
