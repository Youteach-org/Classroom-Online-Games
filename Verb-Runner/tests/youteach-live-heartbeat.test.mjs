import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const vr = join(here, "..");
const teacher = readFileSync(join(vr, "teacher.js"), "utf8");
const prototype = readFileSync(join(vr, "prototype.js"), "utf8");
const sync = readFileSync(join(vr, "session-sync.js"), "utf8");

test("Verb Runner teacher heartbeats only a matching YouTeach live session", () => {
  assert.match(teacher, /heartbeatTeacher/);
  assert.match(teacher, /assignmentId/);
  assert.match(teacher, /setInterval\([^;]*25000|25000/s);
  assert.match(teacher, /integration\.assignmentId|integration\?\.assignmentId/);
});

test("Verb Runner native session stores the COG assignment identity for re-entry", () => {
  assert.match(sync, /assignmentId:/);
  assert.match(sync, /liveTeacherContext\?\.liveContext\?\.assignmentId/);
});

test("Verb Runner student sends live heartbeats and verifies assignment binding", () => {
  assert.match(prototype, /heartbeatStudent/);
  assert.match(prototype, /youTeachLiveStudentContext/);
  assert.match(prototype, /assignmentId/);
  assert.match(prototype, /25000/);
});

test("browser close is not used as an END ACTIVITY signal", () => {
  assert.doesNotMatch(teacher, /beforeunload[\s\S]{0,300}endLiveGameSession/);
  assert.doesNotMatch(prototype, /beforeunload[\s\S]{0,300}cog-live-session-end/);
});
