#include "../aed-trainer/hardware-config.h"
#include <cassert>
#include <cstdio>

static_assert(HardwareConfig::TFT_RST == 8);
static_assert(HardwareConfig::TFT_DC == 9);
static_assert(HardwareConfig::TFT_CS == 10);
static_assert(HardwareConfig::TFT_MOSI == 11);
static_assert(HardwareConfig::TFT_SCLK == 12);
static_assert(HardwareConfig::I2S_BCLK == 42);
static_assert(HardwareConfig::I2S_LRC == 41);
static_assert(HardwareConfig::I2S_DOUT == 40);
static_assert(HardwareConfig::MENU_BUTTON == 4);
static_assert(HardwareConfig::OK_BUTTON == 5);
static_assert(HardwareConfig::SHOCK_BUTTON == 18);

int main() { std::puts("ESP32-S3 wiring: OK"); }
