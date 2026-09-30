#include <cassert>
#include <cstdint>
#include <iostream>
#include <vector>

#include "../aed-trainer/ima-adpcm.h"

int main() {
  ImaAdpcmState state{0, 0};
  const std::vector<std::uint8_t> nibbles{0,1,2,3,4,5,6,7,8,15};
  const std::vector<std::int16_t> expected{0,1,4,8,15,27,47,88,82,-1};

  for (std::size_t i = 0; i < nibbles.size(); ++i) {
    const auto sample = imaAdpcmDecodeNibble(nibbles[i], state);
    assert(sample == expected[i]);
  }

  ImaAdpcmState clampHigh{32760, 88};
  assert(imaAdpcmDecodeNibble(7, clampHigh) == 32767);

  ImaAdpcmState clampLow{-32760, 88};
  assert(imaAdpcmDecodeNibble(15, clampLow) == -32768);

  ImaAdpcmState invalidIndex{0, 200};
  const auto sample = imaAdpcmDecodeNibble(0, invalidIndex);
  (void)sample;
  assert(invalidIndex.stepIndex <= 88);

  std::cout << "ima-adpcm tests passed\n";
  return 0;
}
