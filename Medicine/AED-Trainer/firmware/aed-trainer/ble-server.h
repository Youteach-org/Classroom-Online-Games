#pragma once

#include <cstdint>
#include <string>
#include <unordered_set>

#include "trainer-core.h"

class BLECharacteristic;
class BLEServer;

class BleServer {
 public:
  explicit BleServer(TrainerCore& core);

  void begin();
  void publishDeviceStatus();
  void publishTrainerState();
  void notifyEvent(const std::string& event);
  void handleCommandWire(const std::string& wire);
  void handleConnect();
  void handleDisconnect();
  void setBatteryPercent(int value);

 private:
  TrainerCore& core_;
  BLEServer* server_{nullptr};
  BLECharacteristic* statusCharacteristic_{nullptr};
  BLECharacteristic* stateCharacteristic_{nullptr};
  BLECharacteristic* commandCharacteristic_{nullptr};
  BLECharacteristic* eventCharacteristic_{nullptr};
  BLECharacteristic* ecgCharacteristic_{nullptr};
  std::unordered_set<std::uint32_t> seenCommandSeqs_;
  std::uint32_t statusSeq_{1};
  std::uint32_t stateSeq_{1};
  std::uint32_t eventSeq_{1};
  int batteryPercent_{100};
  bool connected_{false};

  void notifyCommandResult(std::uint32_t commandSeq, bool accepted, const std::string& reason);
};
