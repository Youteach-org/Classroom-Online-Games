#pragma once

#include <string>

class AudioPlayer {
 public:
  bool begin();
  static void setVolume(int percent);
  static int volume();
  bool playPrompt(const std::string& promptId);
  bool playStartupTone();
  bool playShockBuzz();

  bool beginCprMusic();
  void endCprMusic();
  bool cprMusicPlaying() const;

  // Fallback only if the music file cannot start.
  bool beginCprMetronome();
  bool playMetronomeClick();
  void endCprMetronome();

  void stop();
  bool ready() const { return fsReady_; }

 private:
  bool fsReady_{false};
  bool cprMetronomeActive_{false};
};