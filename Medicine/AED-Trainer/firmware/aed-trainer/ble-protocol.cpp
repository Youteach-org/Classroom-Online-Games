#include "ble-protocol.h"

#include <cctype>
#include <limits>
#include <unordered_map>

namespace BleProtocol {
namespace {

using Record = std::unordered_map<std::string, std::string>;

void setError(std::string* error, const std::string& message) {
  if (error) *error = message;
}

bool parseUnsigned(const std::string& text, std::uint32_t* value) {
  if (text.empty()) return false;
  std::uint64_t result = 0;
  for (const char c : text) {
    if (c < '0' || c > '9') return false;
    result = result * 10 + static_cast<unsigned>(c - '0');
    if (result > std::numeric_limits<std::uint32_t>::max()) return false;
  }
  *value = static_cast<std::uint32_t>(result);
  return true;
}

std::optional<Record> parseRecord(const std::string& wire, std::string* error) {
  if (wire.empty()) {
    setError(error, "empty_message");
    return std::nullopt;
  }

  Record record;
  std::size_t start = 0;
  while (start <= wire.size()) {
    const auto end = wire.find(';', start);
    const auto part = wire.substr(start, end == std::string::npos ? std::string::npos : end - start);
    const auto equals = part.find('=');
    if (equals == std::string::npos || equals == 0 || equals + 1 >= part.size()) {
      setError(error, "malformed_field");
      return std::nullopt;
    }

    const auto key = part.substr(0, equals);
    const auto value = part.substr(equals + 1);
    if (!isToken(key) || !isToken(value)) {
      setError(error, "invalid_token");
      return std::nullopt;
    }
    if (record.count(key)) {
      setError(error, "duplicate_key");
      return std::nullopt;
    }
    record.emplace(key, value);

    if (end == std::string::npos) break;
    start = end + 1;
  }
  return record;
}

bool required(const Record& record, const char* key, std::string* value = nullptr) {
  const auto it = record.find(key);
  if (it == record.end() || it->second.empty()) return false;
  if (value) *value = it->second;
  return true;
}

bool commandSupported(const std::string& cmd) {
  return cmd == "load" || cmd == "start" || cmd == "event" || cmd == "hint" ||
         cmd == "pause" || cmd == "resume" || cmd == "restart" || cmd == "end";
}

bool appendField(std::string* wire, const std::string& key, const std::string& value) {
  if (!isToken(key) || !isToken(value)) return false;
  if (!wire->empty()) wire->push_back(';');
  *wire += key;
  wire->push_back('=');
  *wire += value;
  return true;
}

std::string beginRecord(const std::string& type, std::uint32_t seq) {
  std::string wire;
  appendField(&wire, "v", std::to_string(kVersion));
  appendField(&wire, "type", type);
  appendField(&wire, "seq", std::to_string(seq));
  return wire;
}

}  // namespace

bool isToken(const std::string& value) {
  if (value.empty()) return false;
  for (const unsigned char c : value) {
    if (std::isalnum(c) || c == '_' || c == '.' || c == ':' || c == '-') continue;
    return false;
  }
  return true;
}

std::optional<ParsedCommand> parseCommand(const std::string& wire, std::string* error) {
  if (error) error->clear();
  const auto parsed = parseRecord(wire, error);
  if (!parsed.has_value()) return std::nullopt;
  const auto& record = parsed.value();

  std::string version;
  if (!required(record, "v", &version) || version != std::to_string(kVersion)) {
    setError(error, "unsupported_version");
    return std::nullopt;
  }

  std::string type;
  if (!required(record, "type", &type) || type != "cmd") {
    setError(error, "invalid_type");
    return std::nullopt;
  }

  std::string seqText;
  std::uint32_t seq = 0;
  if (!required(record, "seq", &seqText) || !parseUnsigned(seqText, &seq)) {
    setError(error, "invalid_seq");
    return std::nullopt;
  }

  ParsedCommand result;
  result.seq = seq;
  if (!required(record, "cmd", &result.cmd) || !commandSupported(result.cmd)) {
    setError(error, "invalid_command");
    return std::nullopt;
  }

  if (result.cmd == "load") {
    if (!required(record, "scenario", &result.scenario) ||
        !required(record, "twist", &result.twist) ||
        !required(record, "clinical", &result.clinical)) {
      setError(error, "missing_case_fields");
      return std::nullopt;
    }
  }

  if (result.cmd == "event") {
    if (!required(record, "event", &result.event)) {
      setError(error, "missing_event");
      return std::nullopt;
    }
  }

  return result;
}

std::string encodeDeviceStatus(std::uint32_t seq,
                               const std::string& device,
                               const std::string& firmware,
                               int batteryPercent) {
  std::string wire = beginRecord("status", seq);
  if (!appendField(&wire, "device", device) ||
      !appendField(&wire, "firmware", firmware)) return {};
  if (batteryPercent >= 0 &&
      !appendField(&wire, "battery", std::to_string(batteryPercent))) return {};
  return wire;
}

std::string encodeTrainerState(std::uint32_t seq,
                               const std::string& device,
                               const std::string& state,
                               const std::string& scenario,
                               const std::string& twist,
                               const std::string& clinical,
                               std::size_t analysisIndex,
                               bool shockEnabled,
                               bool padsReady,
                               std::size_t hintsUsed) {
  std::string wire = beginRecord("state", seq);
  if (!appendField(&wire, "device", device) ||
      !appendField(&wire, "state", state) ||
      !appendField(&wire, "scenario", scenario) ||
      !appendField(&wire, "twist", twist) ||
      !appendField(&wire, "clinical", clinical) ||
      !appendField(&wire, "analysis", std::to_string(analysisIndex)) ||
      !appendField(&wire, "shock", shockEnabled ? "1" : "0") ||
      !appendField(&wire, "pads", padsReady ? "1" : "0") ||
      !appendField(&wire, "hints", std::to_string(hintsUsed))) return {};
  return wire;
}

std::string encodeCommandResult(std::uint32_t seq,
                                std::uint32_t ackSeq,
                                bool accepted,
                                const std::string& reason) {
  std::string wire = beginRecord("event", seq);
  if (!appendField(&wire, "event", "ACK") ||
      !appendField(&wire, "ack", std::to_string(ackSeq)) ||
      !appendField(&wire, "result", accepted ? "OK" : "REJECT")) return {};
  if (!accepted && !reason.empty() && !appendField(&wire, "reason", reason)) return {};
  return wire;
}

std::string encodeEvent(std::uint32_t seq,
                        const std::string& event,
                        const std::vector<std::pair<std::string, std::string>>& extras) {
  std::string wire = beginRecord("event", seq);
  if (!appendField(&wire, "event", event)) return {};
  for (const auto& field : extras) {
    if (!appendField(&wire, field.first, field.second)) return {};
  }
  return wire;
}

}  // namespace BleProtocol
