import test from "node:test";
import assert from "node:assert/strict";
import { analyzeInputLevel, classifyMicrophoneError } from "../speech/audio-capture.mjs";

test("silent microphone is technical failure, not learner failure", () => {
  const result = analyzeInputLevel(new Float32Array(16000));
  assert.equal(result.usable, false);
  assert.equal(result.reason, "input-too-low");
  assert.equal(result.academicFailure, false);
});

test("heavily clipped microphone asks for a technical retry", () => {
  const samples = new Float32Array(1000).fill(1);
  const result = analyzeInputLevel(samples);
  assert.equal(result.usable, false);
  assert.equal(result.reason, "input-clipping");
  assert.equal(result.academicFailure, false);
});

test("permission denial maps to microphone-denied", () => {
  assert.equal(classifyMicrophoneError({ name: "NotAllowedError" }), "microphone-denied");
});
