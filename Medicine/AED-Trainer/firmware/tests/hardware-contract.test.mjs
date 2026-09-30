import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,"..","aed-trainer");
const cfg=readFileSync(join(root,"hardware-config.h"),"utf8");
const display=readFileSync(join(root,"display-adapter.cpp"),"utf8");
const input=readFileSync(join(root,"input-adapter.cpp"),"utf8");
const sketch=readFileSync(join(root,"aed-trainer.ino"),"utf8");

test("bench pin map matches the proven hardware wiring",()=>{
  assert.match(cfg,/TFT_CS\s*=\s*5/);
  assert.match(cfg,/TFT_DC\s*=\s*2/);
  assert.match(cfg,/TFT_RST\s*=\s*4/);
  assert.match(cfg,/TFT_SCK\s*=\s*18/);
  assert.match(cfg,/TFT_MOSI\s*=\s*23/);
  assert.match(cfg,/SHOCK_BUTTON\s*=\s*32/);
  assert.match(cfg,/I2S_DOUT\s*=\s*25/);
  assert.match(cfg,/I2S_LRC\s*=\s*26/);
  assert.match(cfg,/I2S_BCLK\s*=\s*27/);
});

test("provisional display uses ST7789 240x320 rotation 0 and known complementary colors",()=>{
  assert.match(display,/Adafruit_ST7789/);
  assert.match(display,/init\(240,\s*320\)/);
  assert.match(display,/setRotation\(0\)/);
  assert.match(cfg,/DEA_BLACK\s*=\s*0xFFFF/);
  assert.match(cfg,/DEA_WHITE\s*=\s*0x0000/);
  assert.match(cfg,/DEA_YELLOW\s*=\s*0x001F/);
});

test("touch and SD stay intentionally unused",()=>{
  const all=[cfg,display,input,sketch].join("\n");
  assert.doesNotMatch(all,/TouchScreen|XPT2046|SD\.begin|SD_MMC|T_CS|T_IRQ|SD_CS/);
});

test("SHOCK input is pullup and routed as a debounced edge",()=>{
  assert.match(input,/INPUT_PULLUP/);
  assert.match(input,/ShockButtonDebouncer/);
  assert.match(input,/consumePress/);
  assert.match(sketch,/shockPressed\(\)/);
});

test("main sketch depends on adapters instead of direct TFT/button operations",()=>{
  assert.match(sketch,/DisplayAdapter/);
  assert.match(sketch,/InputAdapter/);
  assert.doesNotMatch(sketch,/digitalRead\s*\(\s*HardwareConfig::SHOCK_BUTTON/);
  assert.doesNotMatch(sketch,/Adafruit_ST7789/);
});

test("firmware contains no Hall/magnet pad-placement implementation",()=>{
  const all=[cfg,display,input,sketch].join("\n");
  assert.doesNotMatch(all,/A3144|HallSensor|hallRead|MAGNET_PIN|magnetDetect/i);
});

test("CPR metronome is local and paramedic hints do not reset AED timing",()=>{
  assert.match(sketch,/kMetronomeBpm\s*=\s*110/);
  assert.match(sketch,/playMetronomeClick/);
  assert.match(sketch,/rfind\("AED_",\s*0\)\s*==\s*0/);
});
