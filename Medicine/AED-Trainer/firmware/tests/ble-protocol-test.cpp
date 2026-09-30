#include <cassert>
#include <iostream>
#include <string>

#include "../aed-trainer/ble-protocol.h"

int main() {
  static_assert(BleProtocol::kVersion == 1, "protocol version");
  assert(std::string(BleProtocol::kServiceUuid) == "7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert(std::string(BleProtocol::kDeviceStatusUuid) == "7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert(std::string(BleProtocol::kTrainerStateUuid) == "7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert(std::string(BleProtocol::kInstructorCommandUuid) == "7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert(std::string(BleProtocol::kEventStreamUuid) == "7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40");
  assert(std::string(BleProtocol::kEcgStreamUuid) == "7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40");

  {
    std::string error;
    const auto cmd = BleProtocol::parseCommand("v=1;type=cmd;seq=12;cmd=load;scenario=A1;twist=T2;clinical=C1", &error);
    assert(cmd.has_value());
    assert(cmd->seq == 12);
    assert(cmd->cmd == "load");
    assert(cmd->scenario == "A1");
    assert(cmd->twist == "T2");
    assert(cmd->clinical == "C1");
  }

  for (const auto& wire : {
           std::string("v=1;type=cmd;seq=13;cmd=event;event=MOVEMENT"),
           std::string("v=1;type=cmd;seq=14;cmd=hint"),
           std::string("v=1;type=cmd;seq=15;cmd=pause"),
           std::string("v=1;type=cmd;seq=16;cmd=resume"),
           std::string("v=1;type=cmd;seq=17;cmd=restart"),
           std::string("v=1;type=cmd;seq=18;cmd=end")}) {
    std::string error;
    assert(BleProtocol::parseCommand(wire, &error).has_value());
  }

  for (const auto& wire : {
           std::string("v=1;type=cmd;seq=1;seq=2;cmd=hint"),
           std::string("v=1;type=cmd;seq=1;cmd=event;event=MOVE MENT"),
           std::string("type=cmd;seq=1;cmd=hint"),
           std::string("v=2;type=cmd;seq=1;cmd=hint"),
           std::string("v=1;type=cmd;seq=x;cmd=hint"),
           std::string("v=1;type=cmd;seq=1;cmd=unknown")}) {
    std::string error;
    assert(!BleProtocol::parseCommand(wire, &error).has_value());
    assert(!error.empty());
  }

  const auto status = BleProtocol::encodeDeviceStatus(1, "AED_TRAINER_001", "0.1.0", 88);
  assert(status.find("v=1;type=status;seq=1") == 0);
  assert(status.find("device=AED_TRAINER_001") != std::string::npos);
  assert(status.find("battery=88") != std::string::npos);
  assert(status.size() < 180);

  const auto unknownBattery = BleProtocol::encodeDeviceStatus(
      2, "AED_TRAINER_001", "0.1.0", -1);
  assert(unknownBattery.find("battery=") == std::string::npos);

  const auto state = BleProtocol::encodeTrainerState(2, "AED_TRAINER_001", "CPR", "A8", "T4", "C12", 3, false, true, 2);
  assert(state.find("v=1;type=state;seq=2") == 0);
  assert(state.find("state=CPR") != std::string::npos);
  assert(state.find("scenario=A8") != std::string::npos);
  assert(state.find("hints=2") != std::string::npos);
  assert(state.size() < 180);

  const auto ok = BleProtocol::encodeCommandResult(3, 55, true, "ok");
  assert(ok.find("event=ACK") != std::string::npos);
  assert(ok.find("ack=55") != std::string::npos);
  assert(ok.find("result=OK") != std::string::npos);

  const auto rejected = BleProtocol::encodeCommandResult(4, 56, false, "invalid_state");
  assert(rejected.find("result=REJECT") != std::string::npos);
  assert(rejected.find("reason=invalid_state") != std::string::npos);

  const auto event = BleProtocol::encodeEvent(5, "SHOCK_PRESS", {{"hints", "2"}, {"state", "CPR"}});
  assert(event.find("event=SHOCK_PRESS") != std::string::npos);
  assert(event.find("hints=2") != std::string::npos);
  assert(event.size() < 180);

  std::cout << "ble-protocol tests passed\n";
  return 0;
}
