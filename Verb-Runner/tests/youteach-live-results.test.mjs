import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const vr = join(here, "..");
const prototype = readFileSync(join(vr, "prototype.js"), "utf8");
const bridge = readFileSync(join(vr, "..", "shared", "youteach-live-bridge.mjs"), "utf8");

test("student live context retains canonical assignment id", () => {
  assert.match(bridge, /assignmentId:\s*String\(payload\?\.liveContext\?\.assignmentId/);
});

test("Verb Runner submits a structured result after a YouTeach live run finishes", () => {
  assert.match(prototype, /submitLiveResult/);
  assert.match(prototype, /schemaVersion:\s*1/);
  assert.match(prototype, /resultType:\s*'individual'/);
  assert.match(prototype, /percentage:\s*summary\.accuracy/);
  assert.match(prototype, /metrics:\s*\{/);
  assert.match(prototype, /finishRun\(\)[\s\S]*submitYouTeachLiveResult/s);
});

test("Verb Runner result has a stable attempt id generated before finish", () => {
  assert.match(prototype, /youTeachAttemptId/);
  assert.match(prototype, /function newYouTeachAttemptId/);
  assert.match(prototype, /resultId:/);
  assert.match(prototype, /attemptId:/);
});

test("network retries reuse the same result object instead of creating duplicate ids", () => {
  const start = prototype.indexOf("async function submitYouTeachLiveResult");
  assert.ok(start >= 0);
  const fn = prototype.slice(start, start + 4200);
  assert.match(fn, /const result=/);
  assert.match(fn, /submitLiveResult\(\{studentContext:youTeachLiveStudentContext,result\}\)/);
  assert.match(fn, /attempt<3|attempt < 3/);
});
