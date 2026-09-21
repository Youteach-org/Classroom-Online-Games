import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { normalizeYouTeachIssuer } from "../shared/youteach-live-bridge.mjs";

const CONTRACT = Object.freeze({
  schemaVersion: 2,
  teacherTokenPurpose: "cog-live-teacher",
  studentTokenPurpose: "cog-live-student",
  launchMode: "live-buzzer",
  idleTtlMs: 60 * 60 * 1000,
  youTeachOrigin: "https://youteach.pages.dev",
  cogOrigin: "https://classroom-online-games.pages.dev",
  registrationFields: ["gameId", "gameName", "cogSessionId"],
  resultEnvelopeFields: [
    "schemaVersion",
    "resultId",
    "attemptId",
    "resultType",
    "completedAt",
    "percentage",
    "points",
    "metrics"
  ]
});

async function source(path) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("COG bridge pins YouTeach origins, launch mode, token purposes and inactivity contract", async () => {
  const [bridge, spec] = await Promise.all([
    source("shared/youteach-live-bridge.mjs"),
    source("docs/superpowers/specs/2026-09-20-live-cog-session-bridge.md")
  ]);

  assert.equal(normalizeYouTeachIssuer(CONTRACT.youTeachOrigin), CONTRACT.youTeachOrigin);
  const previewOrigin = "https://feature-live.youteach.pages.dev";
  assert.equal(normalizeYouTeachIssuer(previewOrigin), previewOrigin);
  assert.equal(normalizeYouTeachIssuer("http://youteach.pages.dev"), "");
  assert.equal(normalizeYouTeachIssuer("https://example.com"), "");

  assert.ok(spec.includes("purpose " + String.fromCharCode(96) + CONTRACT.teacherTokenPurpose + String.fromCharCode(96)));
  assert.ok(spec.includes("purpose " + String.fromCharCode(96) + CONTRACT.studentTokenPurpose + String.fromCharCode(96)));
  assert.match(spec, /60 continuous minutes/);
  assert.equal(CONTRACT.idleTtlMs, 3600000);
  assert.match(bridge, new RegExp('launchMode:\\s*"' + CONTRACT.launchMode + '"'));

  for (const field of CONTRACT.registrationFields) {
    assert.match(bridge, new RegExp("\\b" + field + "\\b"));
  }
});

test("COG result emitters use the exact canonical result-envelope fields and schema version", async () => {
  const emitters = await Promise.all([
    source("Verb-Runner/prototype.js"),
    source("Support-Meter/live-session.js"),
    source("OSASCOMP/live-session.js")
  ]);

  for (const emitter of emitters) {
    assert.match(
      emitter,
      new RegExp("schemaVersion\\s*:\\s*" + CONTRACT.schemaVersion)
    );
    for (const field of CONTRACT.resultEnvelopeFields) {
      assert.match(emitter, new RegExp("\\b" + field + "\\b"));
    }
  }
});
