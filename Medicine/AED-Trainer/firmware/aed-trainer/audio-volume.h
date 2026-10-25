#pragma once
#include <cstdint>

// The physical trainer starts at maximum digital volume on EVERY restart.
// The instructor may reduce volume temporarily over BLE (0..100).
constexpr int kDefaultVolumePercent = 100;

constexpr int clampVolumePercent(int percent) {
  return percent < 0 ? 0 : (percent > 100 ? 100 : percent);
}

constexpr std::int16_t scaleAudioSample(std::int16_t sample, int percent) {
  return static_cast<std::int16_t>(
      static_cast<std::int32_t>(sample) *
      clampVolumePercent(percent) / 100);
}
