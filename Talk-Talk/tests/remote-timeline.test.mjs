import test from "node:test";
import assert from "node:assert/strict";

import {
  syncSessionClock,
  normalizeTurn,
  mergeRemoteTurns
} from "../group/remote-timeline.mjs";

test("remote timeline corrects two-minute client clock skew", () => {
  const a = normalizeTurn(
    { studentKey:"a", startedAtClient:120000, endedAtClient:125000 },
    -120000
  );
  const b = normalizeTurn(
    { studentKey:"b", startedAtClient:6000, endedAtClient:9000 },
    0
  );
  const timeline = mergeRemoteTurns([b,a]);
  assert.deepEqual(timeline.map(t => t.studentKey), ["a","b"]);
  assert.equal(a.startedAt,0);
  assert.equal(b.startedAt,6000);
});

test("clock offset is server time minus client time", () => {
  assert.equal(syncSessionClock(1_000_000, 880_000), 120_000);
  assert.equal(syncSessionClock(880_000, 1_000_000), -120_000);
});

test("normalized remote turn keeps derived evidence and drops raw media", () => {
  const turn=normalizeTurn({
    turnId:"t1",
    studentKey:"s1",
    startedAtClient:1000,
    endedAtClient:2500,
    transcript:"I worked yesterday.",
    evidence:[{ type:"past-ed-t", confidence:"high" }],
    rawAudio:"forbidden",
    samples:[1,2,3]
  },50);

  assert.equal(turn.startedAt,1050);
  assert.equal(turn.endedAt,2550);
  assert.equal(turn.transcript,"I worked yesterday.");
  assert.equal(turn.rawAudio,undefined);
  assert.equal(turn.samples,undefined);
  assert.equal(turn.evidence.length,1);
});

test("merge is deterministic when normalized start times tie", () => {
  const timeline=mergeRemoteTurns([
    { turnId:"z", studentKey:"b", startedAt:10, endedAt:20 },
    { turnId:"a", studentKey:"a", startedAt:10, endedAt:20 }
  ]);
  assert.deepEqual(timeline.map(t=>t.studentKey),["a","b"]);
});
