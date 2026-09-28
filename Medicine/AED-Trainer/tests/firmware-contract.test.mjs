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
  assert.match(serverCpp,/core_\.setBleConnected\(connected\)/);
  assert.match(serverCpp,/transportConnected_/);
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


test("final display is the tested 128x64 SSD1306 OLED on I2C 21/22, not the provisional TFT",()=>{
  const config=readFileSync(join(firmwareRoot,"hardware-config.h"),"utf8");
  const display=readFileSync(join(firmwareRoot,"display-adapter.cpp"),"utf8");
  assert.match(config,/OLED_SDA\s*=\s*21/);
  assert.match(config,/OLED_SCL\s*=\s*22/);
  assert.match(config,/OLED_ADDRESS\s*=\s*0x3C/);
  assert.match(display,/Adafruit_SSD1306/);
  assert.match(display,/Wire\.begin\(HardwareConfig::OLED_SDA,\s*HardwareConfig::OLED_SCL\)/);
  assert.doesNotMatch(config+display,/ST7789|TFT_|Adafruit_ST77|SPI\.begin/);
});


test("standalone physical controls remain available without BLE",()=>{
  const config=readFileSync(join(firmwareRoot,"hardware-config.h"),"utf8");
  const inputH=readFileSync(join(firmwareRoot,"input-adapter.h"),"utf8");
  const inputCpp=readFileSync(join(firmwareRoot,"input-adapter.cpp"),"utf8");
  const sketch=readFileSync(join(firmwareRoot,"aed-trainer.ino"),"utf8");

  assert.match(config,/SHOCK_BUTTON\s*=\s*32/);
  assert.match(config,/START_BUTTON\s*=\s*33/);
  assert.match(config,/MODE_BUTTON\s*=\s*14/);
  assert.match(config,/PADS_BUTTON\s*=\s*13/);
  assert.match(config,/RESET_BUTTON\s*=\s*17/);
  assert.match(inputH,/startPressed/);
  assert.match(inputH,/modePressed/);
  assert.match(inputH,/padsPressed/);
  assert.match(inputH,/resetPressed/);
  assert.match(inputCpp,/INPUT_PULLUP/);
  assert.match(sketch,/LOCAL_START/);
  assert.match(sketch,/LOCAL_PADS_CONFIRMED/);
  assert.match(sketch,/LOCAL_RESET/);
  assert.match(sketch,/BLE opcional/);
  assert.doesNotMatch(sketch,/Conecte Teacher Monitor por Bluetooth/);
});




test("standalone AED waits for learner pad placement before analysis",()=>{
  const sketch=readFileSync(join(firmwareRoot,"aed-trainer.ino"),"utf8");
  assert.match(sketch,/case TrainerState::APPLY_PADS:[\s\S]*?Intentionally wait here/);
  assert.match(sketch,/void\s+servicePadsButton\s*\(\)/);
  assert.match(sketch,/inputs\.padsPressed\(\)/);
  assert.match(sketch,/trainer\.beginAnalysis\(\)/);
  assert.match(sketch,/kAnalysisSettleMs\s*=\s*3000/);
  assert.doesNotMatch(sketch,/kApplyPadsDelayMs/);
  assert.doesNotMatch(sketch,/kInterPromptGapMs/);
  assert.doesNotMatch(sketch,/LOCAL_PAUSE|LOCAL_RESUME/);
});


test("OLED shows simulated ECG, graphic shock warning and CPR countdown",()=>{
  const header=readFileSync(join(firmwareRoot,"display-adapter.h"),"utf8");
  const display=readFileSync(join(firmwareRoot,"display-adapter.cpp"),"utf8");
  const sketch=readFileSync(join(firmwareRoot,"aed-trainer.ino"),"utf8");

  assert.match(header,/showAnalyzing/);
  assert.match(header,/showShockWarning/);
  assert.match(header,/showCprCountdown/);
  assert.match(display,/drawWarningTriangle/);
  assert.match(display,/shockableWave/);
  assert.match(display,/organizedWave/);
  assert.match(display,/NO TOQUE/);
  assert.match(display,/snprintf/);
  assert.match(display,/%02lu:%02lu/);
  assert.match(sketch,/kCprCycleMs\s*=\s*120000/);
  assert.match(sketch,/serviceDynamicDisplay/);
  assert.match(sketch,/analysisPhase/);
});


test("blue OLED content uses large text while yellow header stays compact",()=>{
  const display=readFileSync(join(firmwareRoot,"display-adapter.cpp"),"utf8");
  assert.match(display,/drawHeader\("DEA EDUCATIVO"\)/);
  assert.match(display,/display\.setTextSize\(1\)/);
  assert.match(display,/printCenteredLarge\("COLOQUE",\s*16,\s*2\)/);
  assert.match(display,/printCenteredLarge\("NO TOQUE",\s*16,\s*2\)/);
  assert.match(display,/printCenteredLarge\("COMPRIMA",\s*16,\s*2\)/);
  assert.match(display,/printCenteredLarge\(timeText,\s*37,\s*3\)/);
  assert.match(display,/showReadyCase/);
});

test("CPR lasts two full minutes before automatic rhythm reassessment",()=>{
  const sketch=readFileSync(join(firmwareRoot,"aed-trainer.ino"),"utf8");
  assert.match(sketch,/kCprCycleMs\s*=\s*120000/);
  assert.match(
    sketch,
    /case TrainerState::CPR:[\s\S]*elapsed\(kCprCycleMs\)[\s\S]*trainer\.requestReassess\(\)/
  );
});
