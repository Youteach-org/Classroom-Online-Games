#pragma once

#include <string>

class AudioPlayer {
 public:
  bool begin();
  bool playPrompt(const std::string& promptId);
  bool playMetronomeClick();
  void stop();
  bool ready() const { return fsReady_; }

 private:
  bool fsReady_{false};
};
