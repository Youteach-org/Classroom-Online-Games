import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const vr = join(here, "..");
const source = readFileSync(join(vr, "prototype.js"), "utf8");

test("Verb Runner resolves signed YouTeach live student launches", () => {
  assert.match(source, /youteach-live-bridge\.mjs/);
  assert.match(source, /sessionParams\.get\('ytLiveStudent'\)/);
  assert.match(source, /sessionParams\.get\('issuer'\)/);
  assert.match(source, /resolveStudentLaunch/);
  assert.match(source, /saveStudentContext/);
});

test("live student launch binds runner to the teacher-created COG session", () => {
  assert.match(source, /sessionCode\s*=\s*String\(.*cogSessionId/s);
  assert.match(source, /gameId.*verb-runner|verb-runner.*gameId/s);
  assert.match(source, /integration.*source.*youteach-buzzer/s);
  assert.match(source, /integration.*groupName/s);
  assert.match(source, /integration.*youTeachSessionId/s);
});

test("verified YouTeach identity becomes the monitor identity", () => {
  assert.match(source, /youTeachIdentity\s*=.*identity/s);
  assert.match(source, /runnerSessionId='YT-'/);
  assert.match(source, /studentName:youTeachIdentity\?\.nickname/);
});

test("live launch credential is removed from the visible URL after resolution", () => {
  assert.match(source, /searchParams\.delete\('ytLiveStudent'\)/);
  assert.match(source, /searchParams\.delete\('issuer'\)/);
});
