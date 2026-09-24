import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = path => readFileSync(join(root, path), "utf8");

const teacherMenu = read("teacher/index.html");
const verbTeacher = read("Verb-Runner/teacher.js");
const supportLive = read("Support-Meter/live-session.js");
const hundredMonitor = read("100-Students-Said/monitor.js");
const osascompLive = read("OSASCOMP/live-session.js");

test("COG teacher menu exposes the four approved live-capable games", () => {
  assert.match(teacherMenu, /href="\/Verb-Runner\/teacher\/"/);
  assert.match(teacherMenu, /href="\/Support-Meter\/teacher\/"/);
  assert.match(teacherMenu, /href="\/100-Students-Said\/monitor\.html"/);
  assert.match(teacherMenu, /href="\/OSASCOMP\/teacher\/"/);
});

test("every game registers the exact canonical game id expected by YouTeach", () => {
  assert.match(verbTeacher, /gameId:\s*['"]verb-runner['"]/);
  assert.match(supportLive, /SUPPORT_METER_GAME_ID\s*=\s*['"]support-meter['"]/);
  assert.match(hundredMonitor, /gameId:\s*['"]100-students-said['"]/);
  assert.match(osascompLive, /OSASCOMP_GAME_ID\s*=\s*['"]osascomp['"]/);
});

test("games with external student surfaces use their canonical public directories", () => {
  assert.match(read("Verb-Runner/index.html"), /prototype\.js/);
  assert.match(read("Support-Meter/index.html"), /game\.js/);
  assert.match(read("OSASCOMP/index.html"), /student\.js/);
});

test("100 Students Said remains Buzzer-native and has no external student launcher contract", () => {
  const studentBuzzerContract = read("100-Students-Said/live-session.test.mjs");
  assert.match(studentBuzzerContract, /monitor uses the shared YouTeach bridge/);
  assert.doesNotMatch(hundredMonitor, /resolveStudentLaunch|ytLiveStudent/);
});
