import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("student shell exposes dominant microphone and lesson status surfaces", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="recordButton"/);
  assert.match(html, /id="recordingState"/);
  assert.match(html, /id="lessonPhase"/);
  assert.match(html, /id="replayList"/);
});
