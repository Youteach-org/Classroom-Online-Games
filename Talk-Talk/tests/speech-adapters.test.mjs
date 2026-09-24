import test from "node:test";
import assert from "node:assert/strict";
import { createLocalSttAdapter } from "../speech/stt-adapter.mjs";
import { createLocalPhonemeAdapter } from "../speech/phoneme-adapter.mjs";
import { analyzeProsody } from "../speech/prosody.mjs";

test("STT adapter refuses a remote runtime", async () => {
  assert.throws(
    () => createLocalSttAdapter({ kind: "remote", transcribe: async () => ({ text: "hello" }) }),
    /local/i
  );
});

test("local STT adapter returns normalized evidence", async () => {
  const adapter = createLocalSttAdapter({
    kind: "local",
    transcribe: async () => ({ text: "  I worked yesterday.  ", confidence: 0.9, words: [] })
  });
  const out = await adapter.transcribe(new Float32Array([0, 0.1]));
  assert.equal(out.text, "I worked yesterday.");
  assert.equal(out.confidence, "high");
});

test("local phoneme adapter preserves error evidence", async () => {
  const adapter = createLocalPhonemeAdapter({
    kind: "local",
    analyze: async () => ({
      score: 72,
      confidence: 0.82,
      phonemes: ["w", "ɜː", "k", "t"],
      errors: [{ type: "substitution", expected: "t", heard: "d" }]
    })
  });
  const out = await adapter.analyze(new Float32Array([0, 0.1]), { expected: ["w","ɜː","k","t"] });
  assert.equal(out.confidence, "high");
  assert.equal(out.errors.length, 1);
});

test("prosody analysis returns pause and fluency evidence without network input", () => {
  const samples = new Float32Array(16000);
  samples.fill(0.1, 0, 4000);
  samples.fill(0, 4000, 8000);
  samples.fill(0.1, 8000);

  const out = analyzeProsody(samples, 16000);
  assert.ok(Array.isArray(out.evidence));
  assert.ok(out.evidence.some(item => item.type === "pause"));
  assert.ok(Number.isFinite(out.fluencyScore));
});
