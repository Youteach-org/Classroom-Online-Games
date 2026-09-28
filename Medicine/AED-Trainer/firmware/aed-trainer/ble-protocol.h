#pragma once

#include <cstdint>
#include <optional>
#include <string>
#include <utility>
#include <vector>

namespace BleProtocol {

constexpr int kVersion = 1;
constexpr const char* kServiceUuid = "7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40";
constexpr const char* kDeviceStatusUuid = "7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40";
constexpr const char* kTrainerStateUuid = "7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40";
constexpr const char* kInstructorCommandUuid = "7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40";
constexpr const char* kEventStreamUuid = "7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40";
constexpr const char* kEcgStreamUuid = "7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40";

struct ParsedCommand {
  std::uint32_t seq{0};
  std::string cmd;
  std::string scenario;
  std::string twist;
  std::string clinical;
  std::string event;
};

bool isToken(const std::string& value);
std::optional<ParsedCommand> parseCommand(const std::string& wire, std::string* error = nullptr);

std::string encodeDeviceStatus(std::uint32_t seq,
                               const std::string& device,
                               const std::string& firmware,
                               int batteryPercent);

std::string encodeTrainerState(std::uint32_t seq,
                               const std::string& device,
                               const std::string& state,
                               const std::string& scenario,
                               const std::string& twist,
                               const std::string& clinical,
                               std::size_t analysisIndex,
                               bool shockEnabled,
                               bool padsReady,
                               std::size_t hintsUsed);

std::string encodeCommandResult(std::uint32_t seq,
                                std::uint32_t ackSeq,
                                bool accepted,
                                const std::string& reason);

std::string encodeEvent(std::uint32_t seq,
                        const std::string& event,
                        const std::vector<std::pair<std::string, std::string>>& extras = {});

}  // namespace BleProtocol
