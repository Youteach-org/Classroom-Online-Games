#include <cassert>
#include <cstdint>
#include "../aed-trainer/shock-caution.h"

struct FakeScreen {
  bool largeYellowTriangle = false;
  bool blackExclamationBar = false;
  bool blackExclamationDot = false;

  void fillTriangle(int, int y1, int x2, int y2, int x3, int, std::uint16_t color) {
    if (color == 0xFFE0 && x3 - x2 >= 40 && y2 >= y1 + 35) largeYellowTriangle = true;
  }
  void drawTriangle(int, int, int, int, int, int, std::uint16_t) {}
  void fillRect(int, int, int w, int h, std::uint16_t color) {
    if (color == 0 && w >= 4 && h >= 12) blackExclamationBar = true;
  }
  void fillCircle(int, int, int r, std::uint16_t color) {
    if (color == 0 && r >= 2) blackExclamationDot = true;
  }
};

int main() {
  FakeScreen screen;
  ShockCaution::draw(screen, 0xFFE0, 0);
  assert(screen.largeYellowTriangle);
  assert(screen.blackExclamationBar);
  assert(screen.blackExclamationDot);
}
