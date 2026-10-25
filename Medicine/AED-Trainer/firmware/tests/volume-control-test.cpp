#include "../aed-trainer/audio-volume.h"
#include <cassert>
#include <cstdio>

int main() {
  static_assert(kDefaultVolumePercent == 100);
  assert(clampVolumePercent(-11) == 0);
  assert(clampVolumePercent(0) == 0);
  assert(clampVolumePercent(50) == 50);
  assert(clampVolumePercent(100) == 100);
  assert(clampVolumePercent(150) == 100);

  assert(scaleAudioSample(30000, 100) == 30000);
  assert(scaleAudioSample(30000, 50) == 15000);
  assert(scaleAudioSample(-20000, 50) == -10000);
  assert(scaleAudioSample(30000, 0) == 0);
  assert(scaleAudioSample(30000, 200) == 30000);
  std::puts("volume 0-100, default 100: OK");
}
