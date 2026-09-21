import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "monitor.html"), "utf8");
const js = readFileSync(join(here, "monitor.js"), "utf8");

test("100 Students Said exposes explicit live start and end controls", () => {
  assert.match(html, /id="startLiveActivity"/);
  assert.match(html, /START LIVE ACTIVITY/);
  assert.match(html, /id="endLiveActivity"/);
  assert.match(html, /END ACTIVITY/);
  assert.match(html, /id="liveActivityStatus"/);
});

test("monitor uses the shared YouTeach bridge but does not register on load", () => {
  assert.match(js, /loadTeacherContext/);
  assert.match(js, /registerLiveGameSession/);
  assert.match(js, /endLiveGameSession/);
  assert.match(js, /heartbeatTeacher/);
  const initializeIndex = js.indexOf("function initializeLiveActivity");
  const registerIndex = js.indexOf("registerLiveGameSession");
  assert.ok(initializeIndex >= 0);
  assert.ok(registerIndex >= 0);
  const initializeBody = js.slice(initializeIndex, initializeIndex + 2200);
  assert.doesNotMatch(initializeBody, /registerLiveGameSession\s*\(/);
});

test("START LIVE ACTIVITY creates native integration state before registering with YouTeach", () => {
  const start = js.indexOf("async function startLiveActivity");
  assert.ok(start >= 0);
  const block = js.slice(start, start + 5200);
  assert.match(block, /integration/);
  assert.match(block, /cogSessionId/);
  const nativeWrite = block.indexOf("await patch");
  const register = block.indexOf("await registerLiveGameSession");
  assert.ok(nativeWrite >= 0);
  assert.ok(register > nativeWrite);
  assert.match(block, /gameId:\s*['"]100-students-said['"]/);
});

test("END ACTIVITY requires confirmation before ending YouTeach bridge", () => {
  const start = js.indexOf("async function endLiveActivity");
  assert.ok(start >= 0);
  const block = js.slice(start, start + 3600);
  const confirmIndex = block.indexOf("confirm(");
  const endIndex = block.indexOf("endLiveGameSession");
  assert.ok(confirmIndex >= 0);
  assert.ok(endIndex > confirmIndex);
});

test("existing matching live activity resumes heartbeat without a second registration", () => {
  assert.match(js, /integrationMatchesTeacherContext/);
  assert.match(js, /sendTeacherHeartbeat/);
  assert.match(js, /25000/);
});
