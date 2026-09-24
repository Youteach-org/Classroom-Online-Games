import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const studentHtml = readFileSync(join(here, "index.html"), "utf8");
const teacherHtml = readFileSync(join(here, "teacher", "index.html"), "utf8");
const studentJs = readFileSync(join(here, "student.js"), "utf8");
const teacherJs = readFileSync(join(here, "teacher", "monitor.js"), "utf8");
const liveJs = readFileSync(join(here, "live-session.js"), "utf8");

test("OSASCOMP behavior scripts are externalized before live integration", () => {
  assert.match(studentHtml, /student\.js/);
  assert.match(teacherHtml, /monitor\.js/);
  assert.doesNotMatch(studentHtml, /const client\s*=\s*supabase\.createClient/);
  assert.doesNotMatch(teacherHtml, /let channel=null,students=/);
});

test("teacher has explicit live end control and deterministic YouTeach room", () => {
  assert.match(teacherHtml, /id="endLiveActivity"/);
  assert.match(teacherJs, /roomForTeacherContext/);
  assert.match(liveJs, /function roomForTeacherContext|export function roomForTeacherContext/);
  assert.match(liveJs, /assignmentId/);
  assert.match(liveJs, /youTeachSessionId/);
});

test("opening OSASCOMP monitor does not register a new live activity", () => {
  assert.match(teacherJs, /initializeYouTeachLive/);
  const start = teacherJs.indexOf("async function initializeYouTeachLive");
  assert.ok(start >= 0);
  const end = teacherJs.indexOf("async function startLiveActivity", start);
  assert.ok(end > start);
  assert.doesNotMatch(teacherJs.slice(start, end), /registerOsascompSession\s*\(/);
});

test("teacher start registers only after native Supabase room connection and end requires confirmation", () => {
  const start = teacherJs.indexOf("async function startLiveActivity");
  assert.ok(start >= 0);
  const startBlock = teacherJs.slice(start, start + 4200);
  const connectIndex = startBlock.indexOf("await connectRoom");
  const registerIndex = startBlock.indexOf("await registerOsascompSession");
  assert.ok(connectIndex >= 0);
  assert.ok(registerIndex > connectIndex);

  const end = teacherJs.indexOf("async function endLiveActivity");
  assert.ok(end >= 0);
  const endBlock = teacherJs.slice(end, end + 2600);
  assert.match(endBlock, /confirm\(/);
  assert.match(endBlock, /endOsascompSession/);
});

test("student live launch uses verified YouTeach identity and room", () => {
  assert.match(studentJs, /ytLiveStudent/);
  assert.match(studentJs, /resolveOsascompStudentLaunch/);
  assert.match(studentJs, /youTeachLiveStudentContext/);
  assert.match(studentJs, /canonical\.nickname/);
  assert.match(studentJs, /canonical\.studentKey/);
  assert.match(studentJs, /cogSessionId/);
  assert.match(studentJs, /heartbeatOsascompStudent/);
});

test("OSASCOMP finish returns an idempotent structured result to YouTeach", () => {
  assert.match(studentJs, /submitOsascompLiveResult/);
  assert.match(liveJs, /submitLiveResult/);
  assert.match(liveJs, /resultType:\s*["']individual["']/);
  assert.match(liveJs, /score/);
  assert.match(liveJs, /correct/);
  assert.match(liveJs, /attempts/);
  assert.match(liveJs, /bestCombo/);
  assert.match(liveJs, /mode/);
});

test("browser close never ends a YouTeach OSASCOMP activity", () => {
  assert.doesNotMatch(teacherJs, /beforeunload[\s\S]{0,260}endOsascompSession/);
  assert.doesNotMatch(studentJs, /beforeunload[\s\S]{0,260}endLiveGameSession/);
});
