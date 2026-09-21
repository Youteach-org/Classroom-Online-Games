import test from "node:test";
import assert from "node:assert/strict";

import {
  attributeSegments,
  cleanupTeamCapture,
  createTemporaryVoiceReference,
  configureSpeakerEmbeddingRuntime
} from "../speech/speaker-id.mjs";
import { createMemoryLocalStore } from "../storage/local-store.mjs";

test("uncertain segment stays unassigned", () => {
  const out = attributeSegments({
    segments: [{ id:"a", embedding:[0,1], overlap:false }],
    references: { s1:[1,0], s2:[0.9,0.1] },
    threshold: 0.8
  });
  assert.equal(out[0].studentKey, null);
  assert.equal(out[0].eligibleForIndividualScore, false);
});

test("overlap never becomes individual pronunciation evidence", () => {
  const out = attributeSegments({
    segments: [{ id:"a", embedding:[1,0], overlap:true }],
    references: { s1:[1,0] },
    threshold: 0.8
  });
  assert.equal(out[0].studentKey, null);
  assert.equal(out[0].eligibleForIndividualScore, false);
});

test("high-confidence isolated segment can be attributed", () => {
  const out = attributeSegments({
    segments: [{ id:"a", embedding:[1,0], overlap:false }],
    references: { s1:[1,0], s2:[0,1] },
    threshold: 0.8
  });
  assert.equal(out[0].studentKey, "s1");
  assert.equal(out[0].eligibleForIndividualScore, true);
});

test("temporary voice reference uses only configured local runtime", async () => {
  configureSpeakerEmbeddingRuntime({
    kind:"local",
    async embed(samples) {
      assert.equal(samples.length, 3);
      return [0.1, 0.2, 0.3];
    }
  });
  assert.deepEqual(
    await createTemporaryVoiceReference(new Float32Array([0.1,0.2,0.3])),
    [0.1,0.2,0.3]
  );

  assert.throws(
    () => configureSpeakerEmbeddingRuntime({ kind:"remote", embed:async()=>[1,0] }),
    /local/i
  );
});

test("cleanup removes temporary embeddings and audio cache but leaves derived results", async () => {
  const store=createMemoryLocalStore({
    "voice-ref:TT123:team1:s1":[1,0],
    "voice-ref:TT123:team1:s2":[0,1],
    "audio-cache:TT123:team1:chunk1":{ durationMs:1000 },
    "result:r1":{ resultId:"r1", pronunciation:80 }
  });

  const out=await cleanupTeamCapture({ store, cogSessionId:"TT123", teamKey:"team1" });
  assert.equal(out.removed,3);
  const keys=(await store.entries()).map(([key])=>key);
  assert.deepEqual(keys,["result:r1"]);
});
