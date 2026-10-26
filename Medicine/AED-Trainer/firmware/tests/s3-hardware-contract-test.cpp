#include "../aed-trainer/hardware-config.h"
#include <cassert>
#include <cstdio>

static_assert(HardwareConfig::TFT_RST == 8);
static_assert(HardwareConfig::TFT_DC == 9);
static_assert(HardwareConfig::TFT_CS == 10);
static_assert(HardwareConfig::TFT_MOSI == 11);
static_assert(HardwareConfig::TFT_SCLK == 12);
static_assert(HardwareConfig::I2S_BCLK == 15);
static_assert(HardwareConfig::I2S_LRC == 16);
static_assert(HardwareConfig::I2S_DOUT == 17);
static_assert(HardwareConfig::MENU_BUTTON == 4);
static_assert(HardwareConfig::OK_BUTTON == 5);
static_assert(HardwareConfig::SHOCK_BUTTON == 18);
static_assert(HardwareConfig::SHOCK_LED == 21);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::SHOCK_BUTTON);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::MENU_BUTTON);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::OK_BUTTON);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::TFT_RST);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::TFT_DC);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::TFT_CS);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::TFT_MOSI);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::TFT_SCLK);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::I2S_BCLK);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::I2S_LRC);
static_assert(HardwareConfig::SHOCK_LED != HardwareConfig::I2S_DOUT);

int main() { std::puts("ESP32-S3 wiring: OK"); }
