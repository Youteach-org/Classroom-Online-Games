#include "audio-player.h"

#include <Arduino.h>
#include <ESP_I2S.h>
#include <LittleFS.h>

#include <algorithm>
#include <cstdint>
#include <cstring>

#include "hardware-config.h"
#include "ima-adpcm.h"
#include "prompt-map.h"

namespace {

I2SClass I2S;
bool i2sActive = false;

std::uint16_t readLe16(const std::uint8_t* p) {
  return static_cast<std::uint16_t>(p[0]) |
         (static_cast<std::uint16_t>(p[1]) << 8);
}

std::int16_t readLeS16(const std::uint8_t* p) {
  return static_cast<std::int16_t>(readLe16(p));
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
  std::uint16_t blockAlign{0};
  std::uint16_t bitsPerSample{0};
  std::uint16_t samplesPerBlock{0};
  std::uint32_t totalSamples{0};
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
      info->blockAlign = readLe16(fmt + 12);
      info->bitsPerSample = readLe16(fmt + 14);

      std::uint32_t rest = chunkSize - 16;
      if (rest >= 2) {
        std::uint8_t cb[2];
        if (!readExact(file, cb, sizeof(cb))) return false;
        const std::uint16_t cbSize = readLe16(cb);
        rest -= 2;

        if (info->audioFormat == 0x11 && cbSize >= 2 && rest >= 2) {
          std::uint8_t spb[2];
          if (!readExact(file, spb, sizeof(spb))) return false;
          info->samplesPerBlock = readLe16(spb);
          rest -= 2;
        }
      }

      if (rest && !skipBytes(file, rest)) return false;
      if ((chunkSize & 1U) && !skipBytes(file, 1)) return false;
      haveFmt = true;
      continue;
    }

    if (std::memcmp(header, "fact", 4) == 0) {
      if (chunkSize >= 4) {
        std::uint8_t fact[4];
        if (!readExact(file, fact, sizeof(fact))) return false;
        info->totalSamples = readLe32(fact);
        const std::uint32_t rest = chunkSize - 4;
        if (rest && !skipBytes(file, rest)) return false;
      } else if (chunkSize && !skipBytes(file, chunkSize)) {
        return false;
      }
      if ((chunkSize & 1U) && !skipBytes(file, 1)) return false;
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

bool writeMonoAsStereo(const std::int16_t* mono, std::size_t samples) {
  constexpr std::size_t kChunk = 256;
  std::int16_t stereo[kChunk * 2];

  std::size_t offset = 0;
  while (offset < samples) {
    const std::size_t count = std::min(kChunk, samples - offset);
    for (std::size_t i = 0; i < count; ++i) {
      const auto sample = mono[offset + i];
      stereo[i * 2] = sample;
      stereo[i * 2 + 1] = sample;
    }

    const std::size_t bytes = count * 2 * sizeof(std::int16_t);
    if (I2S.write(reinterpret_cast<std::uint8_t*>(stereo), bytes) != bytes) return false;
    offset += count;
  }
  return true;
}

bool playPcm16(File& file, const WavInfo& wav) {
  constexpr std::size_t kMonoSamples = 256;
  std::int16_t mono[kMonoSamples];
  std::uint32_t remaining = wav.dataBytes;

  while (remaining > 0) {
    const std::size_t requested =
        std::min<std::size_t>(remaining, sizeof(mono));
    const std::size_t bytesRead =
        file.read(reinterpret_cast<std::uint8_t*>(mono), requested);

    if (bytesRead == 0 || (bytesRead & 1U)) return false;

    const std::size_t samples = bytesRead / sizeof(std::int16_t);
    if (!writeMonoAsStereo(mono, samples)) return false;
    remaining -= static_cast<std::uint32_t>(bytesRead);
  }

  return true;
}

bool playImaAdpcm(File& file, const WavInfo& wav) {
  constexpr std::size_t kMaxBlockBytes = 1024;
  constexpr std::size_t kMonoBufferSamples = 256;

  if (wav.blockAlign < 4 || wav.blockAlign > kMaxBlockBytes) return false;
  if (wav.samplesPerBlock == 0) return false;

  std::uint8_t block[kMaxBlockBytes];
  std::int16_t mono[kMonoBufferSamples];
  std::uint32_t dataRemaining = wav.dataBytes;
  std::uint32_t samplesRemaining = wav.totalSamples;
  const bool boundedByFact = samplesRemaining > 0;

  while (dataRemaining > 0 && (!boundedByFact || samplesRemaining > 0)) {
    const std::size_t blockBytes =
        std::min<std::size_t>(wav.blockAlign, dataRemaining);

    if (blockBytes < 4 || !readExact(file, block, blockBytes)) return false;
    dataRemaining -= static_cast<std::uint32_t>(blockBytes);

    ImaAdpcmState state{
      static_cast<std::int32_t>(readLeS16(block)),
      static_cast<std::int32_t>(block[2])
    };
    if (state.stepIndex < 0 || state.stepIndex > 88) return false;

    std::size_t buffered = 0;
    std::uint32_t blockSamples = 0;

    auto emitSample = [&](std::int16_t sample) -> bool {
      if (boundedByFact && samplesRemaining == 0) return true;
      if (blockSamples >= wav.samplesPerBlock) return true;

      mono[buffered++] = sample;
      ++blockSamples;
      if (boundedByFact) --samplesRemaining;

      if (buffered == kMonoBufferSamples) {
        if (!writeMonoAsStereo(mono, buffered)) return false;
        buffered = 0;
      }
      return true;
    };

    if (!emitSample(static_cast<std::int16_t>(state.predictor))) return false;

    for (std::size_t i = 4;
         i < blockBytes &&
         blockSamples < wav.samplesPerBlock &&
         (!boundedByFact || samplesRemaining > 0);
         ++i) {
      const std::uint8_t packed = block[i];
      if (!emitSample(imaAdpcmDecodeNibble(packed & 0x0F, state))) return false;

      if (blockSamples < wav.samplesPerBlock &&
          (!boundedByFact || samplesRemaining > 0)) {
        if (!emitSample(imaAdpcmDecodeNibble((packed >> 4) & 0x0F, state))) return false;
      }
    }

    if (buffered && !writeMonoAsStereo(mono, buffered)) return false;
  }

  return !boundedByFact || samplesRemaining == 0;
}

bool wavSupported(const WavInfo& wav) {
  if (wav.channels != 1 || wav.sampleRate < 8000 || wav.sampleRate > 48000) return false;

  if (wav.audioFormat == 1) {
    return wav.bitsPerSample == 16;
  }

  if (wav.audioFormat == 0x11) {
    return wav.bitsPerSample == 4 &&
           wav.blockAlign >= 4 &&
           wav.blockAlign <= 1024 &&
           wav.samplesPerBlock > 0;
  }

  return false;
}

}  // namespace

bool AudioPlayer::begin() {
  I2S.setPins(
      HardwareConfig::I2S_BCLK,
      HardwareConfig::I2S_LRC,
      HardwareConfig::I2S_DOUT,
      -1,
      -1);

  fsReady_ = LittleFS.begin(false, "/littlefs", 10, "littlefs");
  return fsReady_;
}

bool AudioPlayer::playPrompt(const std::string& promptId) {
  const char* path = findPromptPath(promptId);
  if (!path) return false;

  if (!fsReady_ && !begin()) return false;

  File file = LittleFS.open(path, "r");
  if (!file) return false;

  WavInfo wav;
  if (!parseWavHeader(file, &wav) || !wavSupported(wav)) {
    file.close();
    return false;
  }

  if (!startI2s(wav.sampleRate)) {
    file.close();
    return false;
  }

  const bool ok = wav.audioFormat == 1
      ? playPcm16(file, wav)
      : playImaAdpcm(file, wav);

  file.close();
  stop();
  return ok;
}


bool AudioPlayer::playMetronomeClick() {
  constexpr std::uint32_t kRate = 16000;
  constexpr std::size_t kFrames = 480;  // 30 ms
  constexpr std::size_t kChunkFrames = 128;
  constexpr std::int16_t kAmplitude = 6000;

  if (!startI2s(kRate)) return false;

  std::int16_t stereo[kChunkFrames * 2];
  std::size_t produced = 0;

  while (produced < kFrames) {
    const std::size_t count = std::min(kChunkFrames, kFrames - produced);
    for (std::size_t i = 0; i < count; ++i) {
      const std::size_t phase = (produced + i) % 16;
      const std::int16_t sample = phase < 8 ? kAmplitude : -kAmplitude;
      stereo[i * 2] = sample;
      stereo[i * 2 + 1] = sample;
    }

    const std::size_t bytes = count * 2 * sizeof(std::int16_t);
    if (I2S.write(reinterpret_cast<std::uint8_t*>(stereo), bytes) != bytes) {
      stop();
      return false;
    }
    produced += count;
  }

  stop();
  return true;
}

void AudioPlayer::stop() {
  if (i2sActive) {
    I2S.end();
    i2sActive = false;
  }
}
