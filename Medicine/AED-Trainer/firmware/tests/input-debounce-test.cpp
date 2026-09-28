#include <cassert>
#include <cstdint>
#include <iostream>
#include "../aed-trainer/input-adapter.h"

int main(){
  ShockButtonDebouncer d(35);
  assert(!d.update(false,0));
  assert(!d.update(true,5));
  assert(!d.update(true,25));
  assert(d.update(true,40));
  assert(!d.update(true,60));
  assert(!d.update(false,70));
  assert(!d.update(false,100));
  assert(!d.update(true,110));
  assert(d.update(true,150));
  std::cout<<"input-debounce tests passed\n";
  return 0;
}
