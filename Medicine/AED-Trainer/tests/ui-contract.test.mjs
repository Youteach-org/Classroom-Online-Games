import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const app = readFileSync(join(root, "app.js"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const sw = readFileSync(join(root, "service-worker.js"), "utf8");

const requiredIds = [
  "connectTrainer","connectionStatus","browserBleStatus","bleDiagnostic",
  "braveHelp","braveFlag","copyBraveFlag",
  "baseScenario","sceneTwist","clinicalCondition","startCase",
  "giveHint","hintsUsed",
  "forceShock","forceNoShock","triggerRefib",
  "padFault","clearPadFault","movement","clearMovement",
  "standClearViolation","clearStandClearViolation",
  "pauseCase","resumeCase","restartCase","endCase",
  "trainerState","deviceId","batteryLevel","eventTimeline","lastCommand"
];

test("Teacher Monitor exposes every required instructor control", () => {
  for (const id of requiredIds) assert.match(html, new RegExp(`id=["']${id}["']`), id);
  assert.match(html, /DAR PISTA/);
  assert.match(html, /Teacher Monitor/i);
});

test("old student/browser AED simulator controls are gone", () => {
  assert.doesNotMatch(html, /id=["']padA["']|id=["']padB["']/);
  assert.doesNotMatch(html, /Browser voice prompts/i);
  assert.doesNotMatch(html, />\s*ANALYZE\s*</i);
  assert.doesNotMatch(app, /speechSynthesis|SpeechSynthesisUtterance/);
});

test("training safety boundary is visible", () => {
  assert.match(html, /TRAINING\s*\/\s*SIMULATION ONLY/i);
  assert.match(html, /sin descarga terapéutica/i);
});

test("runtime is local-only with no cloud/CDN dependencies", () => {
  const runtime = [html, app, css, sw].join("\n");
  assert.doesNotMatch(runtime, /https?:\/\//i);
  assert.doesNotMatch(runtime, /firebase|supabase|cdnjs|unpkg|jsdelivr/i);
  assert.doesNotMatch(html, /manifest\.webmanifest/);
  assert.doesNotMatch(app, /registerOfflineSupport/);
  assert.match(app, /clearLegacyOfflineSupport/);
  assert.match(app, /createBleClient/);
});

test("UI is touch-first and responsive", () => {
  assert.match(css, /@media/);
  assert.match(css, /min-height:\s*4[4-9]px|min-height:\s*[5-9]\dpx/);
  assert.match(css, /grid-template-columns/);
});

test("legacy offline shell remains self-contained while runtime no longer registers it", () => {
  assert.match(sw, /"\.\/app\.js"/);
  assert.match(sw, /"\.\/styles\.css"/);
});

test("authoritative trainer state can deactivate a stale local case after reconnect", () => {
  assert.match(app, /INACTIVE_TRAINER_STATES/);
  assert.match(app, /caseActive\s*=\s*!INACTIVE_TRAINER_STATES\.has\(event\.message\.state/);
  assert.match(app, /setBuilderLocked\(caseActive\)/);
});

test("Brave setup exposes the official Web Bluetooth flag and detection path", () => {
  assert.match(html, /brave:\/\/flags\/#brave-web-bluetooth-api/);
  assert.match(app, /navigator\?\.brave\?\.isBrave/);
  assert.match(app, /BRAVE_WEB_BLUETOOTH_DISABLED/);
  assert.match(app, /BRAVE BLE: LISTO/);
});
