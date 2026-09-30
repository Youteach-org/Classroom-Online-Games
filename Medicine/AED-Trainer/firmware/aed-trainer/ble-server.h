#pragma once

#include <atomic>
#include <cstdint>
#include <string>
#include <unordered_set>

#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

#include "trainer-core.h"

class BLECharacteristic;
class BLEServer;

class BleServer {
 public:
  explicit BleServer(TrainerCore& core);

  void begin();
  void poll();
  void publishDeviceStatus();
  void publishTrainerState();
  void notifyEvent(const std::string& event);

  // Called from BLE stack callbacks. These methods only enqueue/set atomic
  // transport state; they never mutate TrainerCore.
  void queueCommandWire(const char* wire);
  void handleConnect();
  void handleDisconnect();

  void setBatteryPercent(int value);

 private:
  static constexpr std::size_t kMaxCommandBytes = 180;
  static constexpr std::size_t kCommandQueueDepth = 8;

  struct PendingCommand {
    bool tooLong{false};
    char wire[kMaxCommandBytes]{};
  };

  TrainerCore& core_;
  BLEServer* server_{nullptr};
  BLECharacteristic* statusCharacteristic_{nullptr};
  BLECharacteristic* stateCharacteristic_{nullptr};
  BLECharacteristic* commandCharacteristic_{nullptr};
  BLECharacteristic* eventCharacteristic_{nullptr};
  BLECharacteristic* ecgCharacteristic_{nullptr};

  QueueHandle_t commandQueue_{nullptr};
  std::atomic<bool> transportConnected_{false};
  std::atomic<bool> connectionChangePending_{false};
  std::atomic<bool> queueOverflowed_{false};

  std::unordered_set<std::uint32_t> seenCommandSeqs_;
  std::uint32_t statusSeq_{1};
  std::uint32_t stateSeq_{1};
  std::uint32_t eventSeq_{1};
  int batteryPercent_{-1};

  void handleCommandWire(const std::string& wire);
  void applyConnectionState();
  void notifyCommandResult(std::uint32_t commandSeq, bool accepted, const std::string& reason);
};
