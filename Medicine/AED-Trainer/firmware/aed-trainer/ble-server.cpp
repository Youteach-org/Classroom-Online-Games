#include "ble-server.h"

#include <algorithm>
#include <cstring>

#include <BLE2902.h>
#include <BLEDevice.h>
#include <BLEServer.h>

#include "ble-protocol.h"

namespace {
constexpr const char* kDeviceId = "AED_TRAINER_001";
constexpr const char* kFirmwareVersion = "0.1.0";

const char* stateToken(TrainerState state) {
  switch (state) {
    case TrainerState::OFF: return "OFF";
    case TrainerState::STARTUP: return "STARTUP";
    case TrainerState::APPLY_PADS: return "APPLY_PADS";
    case TrainerState::ANALYZING: return "ANALYZING";
    case TrainerState::SHOCK_ADVISED: return "SHOCK_ADVISED";
    case TrainerState::NO_SHOCK_ADVISED: return "NO_SHOCK_ADVISED";
    case TrainerState::WAITING_SHOCK: return "WAITING_SHOCK";
    case TrainerState::CPR: return "CPR";
    case TrainerState::REASSESS: return "REASSESS";
  }
  return "OFF";
}

class TrainerServerCallbacks final : public BLEServerCallbacks {
 public:
  explicit TrainerServerCallbacks(BleServer* owner) : owner_(owner) {}
  void onConnect(BLEServer*) override { owner_->handleConnect(); }
  void onDisconnect(BLEServer*) override { owner_->handleDisconnect(); }

 private:
  BleServer* owner_;
};

class TrainerCommandCallbacks final : public BLECharacteristicCallbacks {
 public:
  explicit TrainerCommandCallbacks(BleServer* owner) : owner_(owner) {}

  void onWrite(BLECharacteristic* characteristic) override {
    // Keep this BLE-stack callback short and non-blocking. TrainerCore is only
    // touched later from BleServer::poll() in the Arduino loop task.
    owner_->queueCommandWire(characteristic->getValue().c_str());
  }

 private:
  BleServer* owner_;
};
}  // namespace

BleServer::BleServer(TrainerCore& core) : core_(core) {}

void BleServer::begin() {
  commandQueue_ = xQueueCreate(kCommandQueueDepth, sizeof(PendingCommand));

  BLEDevice::init("AED Trainer");
  server_ = BLEDevice::createServer();
  server_->setCallbacks(new TrainerServerCallbacks(this));

  auto* service = server_->createService(BleProtocol::kServiceUuid);
  statusCharacteristic_ = service->createCharacteristic(
      BleProtocol::kDeviceStatusUuid,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  stateCharacteristic_ = service->createCharacteristic(
      BleProtocol::kTrainerStateUuid,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  commandCharacteristic_ = service->createCharacteristic(
      BleProtocol::kInstructorCommandUuid,
      BLECharacteristic::PROPERTY_WRITE);
  eventCharacteristic_ = service->createCharacteristic(
      BleProtocol::kEventStreamUuid,
      BLECharacteristic::PROPERTY_NOTIFY);
  ecgCharacteristic_ = service->createCharacteristic(
      BleProtocol::kEcgStreamUuid,
      BLECharacteristic::PROPERTY_NOTIFY);

  statusCharacteristic_->addDescriptor(new BLE2902());
  stateCharacteristic_->addDescriptor(new BLE2902());
  eventCharacteristic_->addDescriptor(new BLE2902());
  ecgCharacteristic_->addDescriptor(new BLE2902());
  commandCharacteristic_->setCallbacks(new TrainerCommandCallbacks(this));

  service->start();
  publishDeviceStatus();
  publishTrainerState();

  auto* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(BleProtocol::kServiceUuid);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
}

void BleServer::queueCommandWire(const char* wire) {
  if (!commandQueue_) {
    queueOverflowed_.store(true, std::memory_order_release);
    return;
  }

  PendingCommand pending;
  if (!wire) {
    pending.tooLong = false;
    pending.wire[0] = '\0';
  } else {
    const std::size_t length = std::strlen(wire);
    if (length >= kMaxCommandBytes) {
      pending.tooLong = true;
      pending.wire[0] = '\0';
    } else {
      std::memcpy(pending.wire, wire, length + 1);
    }
  }

  if (xQueueSend(commandQueue_, &pending, 0) != pdTRUE) {
    queueOverflowed_.store(true, std::memory_order_release);
  }
}

void BleServer::handleConnect() {
  transportConnected_.store(true, std::memory_order_release);
  connectionChangePending_.store(true, std::memory_order_release);
}

void BleServer::handleDisconnect() {
  transportConnected_.store(false, std::memory_order_release);
  connectionChangePending_.store(true, std::memory_order_release);
}

void BleServer::applyConnectionState() {
  if (!connectionChangePending_.exchange(false, std::memory_order_acq_rel)) return;

  const bool connected = transportConnected_.load(std::memory_order_acquire);
  core_.setBleConnected(connected);

  if (connected) {
    // Sequence IDs are idempotency keys only inside one BLE connection.
    // A browser/app reload starts a fresh namespace at seq=1.
    seenCommandSeqs_.clear();
    core_.resetRemoteSequenceNamespace();

    // Drop any writes that belonged to a previous connection.
    if (commandQueue_) xQueueReset(commandQueue_);

    publishDeviceStatus();
    publishTrainerState();
  } else {
    BLEDevice::startAdvertising();
  }
}

void BleServer::poll() {
  applyConnectionState();

  if (queueOverflowed_.exchange(false, std::memory_order_acq_rel)) {
    notifyEvent("COMMAND_QUEUE_FULL");
  }

  if (!commandQueue_) return;

  PendingCommand pending;
  while (xQueueReceive(commandQueue_, &pending, 0) == pdTRUE) {
    if (pending.tooLong) {
      notifyCommandResult(0, false, "payload_too_long");
      continue;
    }
    handleCommandWire(pending.wire);
  }
}

void BleServer::setBatteryPercent(int value) {
  batteryPercent_ = value < 0 ? -1 : std::max(0, std::min(100, value));
  publishDeviceStatus();
}

void BleServer::publishDeviceStatus() {
  if (!statusCharacteristic_) return;
  const auto wire = BleProtocol::encodeDeviceStatus(
      statusSeq_++, kDeviceId, kFirmwareVersion, batteryPercent_);
  statusCharacteristic_->setValue(wire.c_str());
  if (transportConnected_.load(std::memory_order_acquire)) {
    statusCharacteristic_->notify();
  }
}

void BleServer::publishTrainerState() {
  if (!stateCharacteristic_) return;

  const auto snapshot = core_.snapshot();
  const bool shockEnabled =
      snapshot.state == TrainerState::WAITING_SHOCK &&
      !snapshot.standClearViolation;
  const bool padsReady = !snapshot.padFault;

  const auto wire = BleProtocol::encodeTrainerState(
      stateSeq_++, kDeviceId, stateToken(snapshot.state),
      snapshot.config.scenarioId, snapshot.config.twistId, snapshot.config.clinicalId,
      snapshot.analysisIndex, shockEnabled, padsReady, snapshot.hintsUsed);

  stateCharacteristic_->setValue(wire.c_str());
  if (transportConnected_.load(std::memory_order_acquire)) {
    stateCharacteristic_->notify();
  }
}

void BleServer::notifyCommandResult(
    std::uint32_t commandSeq,
    bool accepted,
    const std::string& reason) {
  if (!eventCharacteristic_) return;

  const auto wire = BleProtocol::encodeCommandResult(
      eventSeq_++, commandSeq, accepted, reason);
  eventCharacteristic_->setValue(wire.c_str());

  if (transportConnected_.load(std::memory_order_acquire)) {
    eventCharacteristic_->notify();
  }
}

void BleServer::notifyEvent(const std::string& event) {
  if (!eventCharacteristic_) return;

  const auto wire = BleProtocol::encodeEvent(
      eventSeq_++, event,
      {{"hints", std::to_string(core_.hintsUsed())},
       {"state", stateToken(core_.state())}});
  eventCharacteristic_->setValue(wire.c_str());

  if (transportConnected_.load(std::memory_order_acquire)) {
    eventCharacteristic_->notify();
  }
}

void BleServer::handleCommandWire(const std::string& wire) {
  std::string parseError;
  const auto parsed = BleProtocol::parseCommand(wire, &parseError);
  if (!parsed.has_value()) {
    notifyCommandResult(
        0, false, parseError.empty() ? "parse_error" : parseError);
    return;
  }

  const auto& cmd = parsed.value();
  if (seenCommandSeqs_.count(cmd.seq)) {
    notifyCommandResult(cmd.seq, false, "duplicate_seq");
    return;
  }
  seenCommandSeqs_.insert(cmd.seq);

  bool accepted = false;
  std::string reason;

  if (cmd.cmd == "load") {
    accepted = core_.loadCase({cmd.scenario, cmd.twist, cmd.clinical});
    if (!accepted) reason = "invalid_case";
  } else if (cmd.cmd == "start") {
    accepted = core_.startCase();
    if (!accepted) reason = "invalid_state";
  } else if (cmd.cmd == "event") {
    const auto result = core_.applyRemoteCommand(cmd.seq, cmd.event);
    accepted = result.accepted;
    reason = result.reason;
  } else if (cmd.cmd == "hint") {
    const auto result = core_.applyRemoteCommand(cmd.seq, "HINT");
    accepted = result.accepted;
    reason = result.reason;
    if (accepted) notifyEvent("PARAMEDIC_HINT");
  } else {
    std::string coreCommand;
    if (cmd.cmd == "pause") coreCommand = "PAUSE";
    else if (cmd.cmd == "resume") coreCommand = "RESUME";
    else if (cmd.cmd == "restart") coreCommand = "RESTART";
    else if (cmd.cmd == "end") coreCommand = "END";

    if (!coreCommand.empty()) {
      const auto result = core_.applyRemoteCommand(cmd.seq, coreCommand);
      accepted = result.accepted;
      reason = result.reason;
    } else {
      reason = "invalid_command";
    }
  }

  notifyCommandResult(cmd.seq, accepted, reason);
  publishTrainerState();
}
