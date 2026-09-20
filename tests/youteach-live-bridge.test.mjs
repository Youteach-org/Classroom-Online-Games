import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  normalizeYouTeachIssuer,
  resolveTeacherLaunch,
  saveTeacherContext,
  loadTeacherContext
} from "../shared/youteach-live-bridge.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test("YouTeach issuer allowlist accepts production and preview Pages only", () => {
  assert.equal(normalizeYouTeachIssuer("https://youteach.pages.dev"), "https://youteach.pages.dev");
  assert.equal(normalizeYouTeachIssuer("https://live-preview.youteach.pages.dev"), "https://live-preview.youteach.pages.dev");
  assert.equal(normalizeYouTeachIssuer("https://evil.example"), "");
  assert.equal(normalizeYouTeachIssuer("http://youteach.pages.dev"), "");
});

test("teacher launch resolves verified group context and bridge credential", async () => {
  const calls = [];
  const result = await resolveTeacherLaunch({
    token: "signed-launch-token-value-long-enough",
    issuer: "https://youteach.pages.dev",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({
        ok: true,
        teacher: { username: "teacher", role: "teacher", displayName: "Teacher" },
        liveContext: {
          youTeachSessionId: "yt-1",
          groupName: "533-2",
          assignmentId: "assignment-1",
          assignmentCode: "COG-VERB-533-200926",
          assignmentTitle: "Verb Runner practice"
        },
        bridgeToken: "signed-bridge-token-value-long-enough",
        bridgeExpiresAt: Date.now() + 60_000
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://youteach.pages.dev/api/cog-live-teacher-resolve");
  assert.equal(result.liveContext.groupName, "533-2");
  assert.equal(result.liveContext.youTeachSessionId, "yt-1");
  assert.equal(result.liveContext.assignmentId, "assignment-1");
  assert.equal(result.liveContext.assignmentTitle, "Verb Runner practice");
  assert.equal(result.issuer, "https://youteach.pages.dev");
});

test("teacher context can be retained for navigation within COG", () => {
  const storage = memoryStorage();
  const context = {
    teacher: { username: "teacher", role: "teacher", displayName: "Teacher" },
    liveContext: {
      youTeachSessionId: "yt-1",
      groupName: "533-2",
      assignmentId: "assignment-1",
      assignmentCode: "COG-VERB-533-200926",
      assignmentTitle: "Verb Runner practice"
    },
    bridgeToken: "bridge-token",
    bridgeExpiresAt: Date.now() + 60_000,
    issuer: "https://youteach.pages.dev"
  };
  saveTeacherContext(context, storage);
  assert.deepEqual(loadTeacherContext(storage), context);
});

test("teacher menu does not activate a game merely by opening its monitor", () => {
  const source = readFileSync(join(root, "teacher", "teacher-menu.js"), "utf8");
  assert.doesNotMatch(source, /session\/current\/connectedGame/);
  assert.doesNotMatch(source, /hundredStudentsSaid\/current\/integration/);
});
