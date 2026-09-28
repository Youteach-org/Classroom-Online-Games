import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..");
const firmwareRoot=join(root,"firmware","aed-trainer");

const webProtocol=readFileSync(join(root,"ble-protocol.js"),"utf8");
const fwProtocol=readFileSync(join(firmwareRoot,"ble-protocol.h"),"utf8");
const serverH=readFileSync(join(firmwareRoot,"ble-server.h"),"utf8");
const serverCpp=readFileSync(join(firmwareRoot,"ble-server.cpp"),"utf8");

const uuids=[
  "7e57a000-6f73-4f67-9a2c-0b8d1f2e3a40",
  "7e57a001-6f73-4f67-9a2c-0b8d1f2e3a40",
  "7e57a002-6f73-4f67-9a2c-0b8d1f2e3a40",
  "7e57a003-6f73-4f67-9a2c-0b8d1f2e3a40",
  "7e57a004-6f73-4f67-9a2c-0b8d1f2e3a40",
  "7e57a005-6f73-4f67-9a2c-0b8d1f2e3a40"
];

test("web and firmware freeze the same protocol version and UUIDs",()=>{
  assert.match(webProtocol,/AED_PROTOCOL_VERSION\s*=\s*1/);
  assert.match(fwProtocol,/kVersion\s*=\s*1/);
  for(const uuid of uuids){
    assert.ok(webProtocol.includes(uuid), "web missing "+uuid);
    assert.ok(fwProtocol.includes(uuid), "firmware missing "+uuid);
  }
});

test("GATT server exposes status/state read-notify, command write, events notify and ECG notify",()=>{
  assert.match(serverCpp,/PROPERTY_READ\s*\|\s*BLECharacteristic::PROPERTY_NOTIFY/);
  assert.match(serverCpp,/kDeviceStatusUuid/);
  assert.match(serverCpp,/kTrainerStateUuid/);
  assert.match(serverCpp,/kInstructorCommandUuid/);
  assert.match(serverCpp,/PROPERTY_WRITE/);
  assert.match(serverCpp,/kEventStreamUuid/);
  assert.match(serverCpp,/kEcgStreamUuid/);
  assert.match(serverCpp,/PROPERTY_NOTIFY/);
});

test("commands are parsed, deduplicated, acknowledged and routed into TrainerCore",()=>{
  assert.match(serverCpp,/BleProtocol::parseCommand/);
  assert.match(serverH,/seenCommandSeqs_/);
  assert.match(serverCpp,/duplicate_seq/);
  assert.match(serverCpp,/encodeCommandResult/);
  assert.match(serverCpp,/core_\.loadCase/);
  assert.match(serverCpp,/core_\.startCase/);
  assert.match(serverCpp,/core_\.applyRemoteCommand/);
  assert.match(serverCpp,/core_\.requestHint|HINT/);
});

test("reconnect reads are authoritative and BLE connection alone never changes treatment decision",()=>{
  assert.match(serverCpp,/publishDeviceStatus/);
  assert.match(serverCpp,/publishTrainerState/);
  assert.match(serverCpp,/core_\.setBleConnected\(true\)/);
  assert.match(serverCpp,/core_\.setBleConnected\(false\)/);
  assert.doesNotMatch(serverCpp,/setBleConnected[^\n]*FORCE_SHOCK/);
  assert.match(serverCpp,/startAdvertising/);
});

test("BLE callbacks only enqueue work and main loop polls it into TrainerCore",()=>{
  assert.match(serverH,/void\s+poll\s*\(\s*\)/);
  assert.match(serverH,/commandQueue_/);
  assert.match(serverCpp,/xQueueSend/);
  assert.match(serverCpp,/xQueueReceive/);
  assert.match(serverCpp,/resetRemoteSequenceNamespace/);
  assert.match(readFileSync(join(root,"firmware","aed-trainer","aed-trainer.ino"),"utf8"),/ble\.poll\(\)/);

  const callbackBody = serverCpp.match(/class TrainerCommandCallbacks[\s\S]*?\n};/)?.[0] ?? "";
  assert.doesNotMatch(callbackBody,/core_|handleCommandWire/);
  assert.match(callbackBody,/queueCommandWire/);
});
