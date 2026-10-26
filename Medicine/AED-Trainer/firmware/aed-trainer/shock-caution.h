#pragma once

#include <cstdint>

// Warning must be drawn after the background image so it is never hidden by
// JPEG pixels. Uses GFX primitives and consumes no extra flash-frame asset.
namespace ShockCaution {
template <typename Screen>
void draw(Screen& display, std::uint16_t yellow, std::uint16_t black) {
  display.fillTriangle(132, 6, 102, 55, 158, 55, black);
  display.fillTriangle(132, 11, 108, 51, 152, 51, yellow);
  display.drawTriangle(132, 11, 108, 51, 152, 51, black);
  display.fillRect(129, 27, 6, 14, black);
  display.fillCircle(132, 46, 3, black);
}
}  // namespace ShockCaution
