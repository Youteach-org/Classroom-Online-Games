import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAudioWorkerMessage } from "../speech/audio-worker.mjs";

test("audio worker accepts only known local-processing commands", () => {
  assert.deepEqual(
    normalizeAudioWorkerMessage({ type: "analyze-level", samples: [0, 0.1] }),
    { type: "analyze-level", samples: [0, 0.1] }
  );
  assert.equal(normalizeAudioWorkerMessage({ type: "upload-audio" }), null);
});
