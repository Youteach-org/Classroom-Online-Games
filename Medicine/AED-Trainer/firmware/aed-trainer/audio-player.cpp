#include "audio-player.h"

#include <Arduino.h>
#include <ESP_I2S.h>
#include <LittleFS.h>

#include <cstdint>
#include <cstring>

#include "hardware-config.h"
#include "prompt-map.h"

namespace {

I2SClass I2S;
bool i2sActive = false;

std::uint16_t readLe16(const std::uint8_t* p) {
  return static_cast<std::uint16_t>(p[0]) |
         (static_cast<std::uint16_t>(p[1]) << 8);
}

std::uint32_t readLe32(const std::uint8_t* p) {
  return static_cast<std::uint32_t>(p[0]) |
         (static_cast<std::uint32_t>(p[1]) << 8) |
         (static_cast<std::uint32_t>(p[2]) << 16) |
         (static_cast<std::uint32_t>(p[3]) << 24);
}

bool readExact(File& file, std::uint8_t* buffer, std::size_t count) {
  return file.read(buffer, count) == count;
}

bool skipBytes(File& file, std::uint32_t count) {
  return file.seek(file.position() + count);
}

struct WavInfo {
  std::uint16_t audioFormat{0};
  std::uint16_t channels{0};
  std::uint32_t sampleRate{0};
  std::uint16_t bitsPerSample{0};
  std::uint32_t dataBytes{0};
};

bool parseWavHeader(File& file, WavInfo* info) {
  std::uint8_t riff[12];
  if (!readExact(file, riff, sizeof(riff))) return false;
  if (std::memcmp(riff, "RIFF", 4) != 0 || std::memcmp(riff + 8, "WAVE", 4) != 0) return false;

  bool haveFmt = false;
  while (file.available()) {
    std::uint8_t header[8];
    if (!readExact(file, header, sizeof(header))) return false;
    const std::uint32_t chunkSize = readLe32(header + 4);

    if (std::memcmp(header, "fmt ", 4) == 0) {
      if (chunkSize < 16) return false;
      std::uint8_t fmt[16];
      if (!readExact(file, fmt, sizeof(fmt))) return false;
      info->audioFormat = readLe16(fmt);
      info->channels = readLe16(fmt + 2);
      info->sampleRate = readLe32(fmt + 4);
      info->bitsPerSample = readLe16(fmt + 14);
      const std::uint32_t rest = chunkSize - 16;
      if (rest && !skipBytes(file, rest)) return false;
      if ((chunkSize & 1U) && !skipBytes(file, 1)) return false;
      haveFmt = true;
      continue;
    }

    if (std::memcmp(header, "data", 4) == 0) {
      if (!haveFmt) return false;
      info->dataBytes = chunkSize;
      return true;
    }

    if (!skipBytes(file, chunkSize + (chunkSize & 1U))) return false;
  }

  return false;
}

bool startI2s(std::uint32_t sampleRate) {
  if (i2sActive) {
    I2S.end();
    i2sActive = false;
  }

  const bool ok = I2S.begin(
      I2S_MODE_STD,
      sampleRate,
      I2S_DATA_BIT_WIDTH_16BIT,
      I2S_SLOT_MODE_STEREO);
  i2sActive = ok;
  return ok;
}

}  // namespace

bool AudioPlayer::begin() {
  fsReady_ = LittleFS.begin(true);
  if (!fsReady_) return false;

  I2S.setPins(
      HardwareConfig::I2S_BCLK,
      HardwareConfig::I2S_LRC,
      HardwareConfig::I2S_DOUT,
      -1,
      -1);
  return true;
}

bool AudioPlayer::playPrompt(const std::string& promptId) {
  const char* path = findPromptPath(promptId);
  if (!path) return false;

  if (!fsReady_ && !begin()) return false;

  File file = LittleFS.open(path, "r");
  if (!file) return false;

  WavInfo wav;
  if (!parseWavHeader(file, &wav)) {
    file.close();
    return false;
  }

  if (wav.audioFormat != 1 ||
      wav.channels != 1 ||
      wav.bitsPerSample != 16 ||
      wav.sampleRate < 8000 ||
      wav.sampleRate > 48000) {
    file.close();
    return false;
  }

  if (!startI2s(wav.sampleRate)) {
    file.close();
    return false;
  }

  constexpr std::size_t kMonoSamples = 256;
  std::int16_t mono[kMonoSamples];
  std::int16_t stereo[kMonoSamples * 2];

  std::uint32_t remaining = wav.dataBytes;
  bool ok = true;

  while (remaining > 0) {
    const std::size_t requested =
        remaining < sizeof(mono) ? static_cast<std::size_t>(remaining) : sizeof(mono);
    const std::size_t bytesRead =
        file.read(reinterpret_cast<std::uint8_t*>(mono), requested);

    if (bytesRead == 0 || (bytesRead & 1U)) {
      ok = false;
      break;
    }

    const std::size_t samples = bytesRead / sizeof(std::int16_t);
    for (std::size_t i = 0; i < samples; ++i) {
      stereo[i * 2] = mono[i];
      stereo[i * 2 + 1] = mono[i];
    }

    const std::size_t stereoBytes = samples * 2 * sizeof(std::int16_t);
    if (I2S.write(reinterpret_cast<std::uint8_t*>(stereo), stereoBytes) != stereoBytes) {
      ok = false;
      break;
    }

    remaining -= static_cast<std::uint32_t>(bytesRead);
  }

  file.close();
  stop();
  return ok && remaining == 0;
}

void AudioPlayer::stop() {
  if (i2sActive) {
    I2S.end();
    i2sActive = false;
  }
}
