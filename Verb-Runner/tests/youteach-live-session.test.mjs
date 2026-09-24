import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const vr = join(here, "..");
const teacher = readFileSync(join(vr, "teacher.js"), "utf8");
const sync = readFileSync(join(vr, "session-sync.js"), "utf8");
const html = readFileSync(join(vr, "teacher", "index.html"), "utf8");

test("Verb Runner teacher uses shared YouTeach live bridge", () => {
  assert.match(teacher, /youteach-live-bridge\.mjs/);
  assert.match(teacher, /loadTeacherContext/);
  assert.match(teacher, /registerLiveGameSession/);
  assert.match(teacher, /endLiveGameSession/);
});

test("creating a native session carries verified YouTeach integration metadata", () => {
  assert.match(sync, /async function createSession\(settings,liveTeacherContext=null\)/);
  assert.match(sync, /source:'youteach-buzzer'/);
  assert.match(sync, /groupName:/);
  assert.match(sync, /youTeachSessionId:/);
});

test("Create Session registers live activity only after native session creation", () => {
  const nativeCreate = teacher.indexOf("await createSession(");
  const bridgeRegister = teacher.indexOf("await registerLiveGameSession(");
  assert.ok(nativeCreate >= 0);
  assert.ok(bridgeRegister > nativeCreate);
});

test("ending a YouTeach live Verb Runner activity requires confirmation", () => {
  assert.match(teacher, /confirm\(/);
  assert.match(teacher, /Students will no longer be able to enter/);
  assert.match(html, /END ACTIVITY/);
});
