#pragma once

#include <cstdint>

struct ImaAdpcmState {
  std::int32_t predictor{0};
  std::int32_t stepIndex{0};
};

std::int16_t imaAdpcmDecodeNibble(std::uint8_t nibble, ImaAdpcmState& state);
