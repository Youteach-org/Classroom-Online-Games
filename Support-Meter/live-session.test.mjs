import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const teacherHtml = readFileSync(join(here, "teacher.html"), "utf8");
const teacherJs = readFileSync(join(here, "teacher.js"), "utf8");
const gameJs = readFileSync(join(here, "game.js"), "utf8");
const liveJs = readFileSync(join(here, "live-session.js"), "utf8");

test("Support Meter teacher exposes an explicit END ACTIVITY control", () => {
  assert.match(teacherHtml, /id="endLiveActivity"/);
  assert.match(teacherHtml, /END ACTIVITY/);
});

test("teacher native session is created before YouTeach live registration", () => {
  const start = teacherJs.indexOf("async function createSession");
  assert.ok(start >= 0);
  const block = teacherJs.slice(start, start + 4200);
  const nativeCreate = block.indexOf("await createAssignedSession");
  const liveRegister = block.indexOf("await registerSupportMeterSession");
  assert.ok(nativeCreate >= 0);
  assert.ok(liveRegister > nativeCreate);
});

test("teacher END ACTIVITY uses confirmation and the shared live bridge", () => {
  assert.match(teacherJs, /confirm\(/);
  assert.match(teacherJs, /endSupportMeterSession/);
  assert.match(teacherJs, /heartbeatSupportMeterTeacher/);
  assert.match(liveJs, /endLiveGameSession/);
  assert.match(liveJs, /registerLiveGameSession/);
});

test("Support Meter detects a YouTeach live student launch before manual join flow", () => {
  assert.match(gameJs, /ytLiveStudent/);
  assert.match(gameJs, /resolveSupportMeterStudentLaunch/);
  assert.match(gameJs, /youTeachLiveStudentContext/);
  assert.match(gameJs, /identity\.nickname|identity\?\.nickname/);
  assert.match(gameJs, /cogSessionId/);
});

test("Support Meter completion automatically submits a normalized live result", () => {
  const start = gameJs.indexOf("async function nextStory");
  assert.ok(start >= 0);
  const block = gameJs.slice(start, start + 4200);
  assert.match(block, /submitSupportMeterLiveResult/);
  assert.match(liveJs, /submitLiveResult/);
  assert.match(liveJs, /resultType:\s*['"]individual['"]/);
  assert.match(liveJs, /supportMeter/);
  assert.match(liveJs, /storiesCompleted/);
  assert.match(liveJs, /translationAttempts/);
});

test("live student heartbeats use the shared bridge and do not end on browser close", () => {
  assert.match(liveJs, /heartbeatStudent/);
  assert.doesNotMatch(gameJs, /beforeunload[\s\S]{0,240}endLiveGameSession/);
});
