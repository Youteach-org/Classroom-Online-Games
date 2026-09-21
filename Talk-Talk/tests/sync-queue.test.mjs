import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryLocalStore } from "../storage/local-store.mjs";
import { createSyncQueue } from "../live/sync-queue.mjs";

test("queued result survives failed send and only clears on matching accepted receipt", async () => {
  const store = createMemoryLocalStore();
  const queue = createSyncQueue({ store });

  await queue.enqueueDerivedResult({
    resultId:"r1",
    studentKey:"s1",
    dimensions:{ pronunciation:72 }
  });
  await queue.enqueueDerivedResult({
    resultId:"r1",
    studentKey:"s1",
    dimensions:{ pronunciation:72 }
  });

  assert.equal((await queue.pending()).length, 1);

  const failed = await queue.flushSyncQueue(async () => {
    throw new Error("offline");
  });
  assert.equal(failed.sent, 0);
  assert.equal((await queue.pending()).length, 1);

  const wrongReceipt = await queue.flushSyncQueue(async () => ({
    accepted:true,
    resultId:"some-other-id"
  }));
  assert.equal(wrongReceipt.sent, 0);
  assert.equal((await queue.pending()).length, 1);

  const accepted = await queue.flushSyncQueue(async result => ({
    accepted:true,
    resultId:result.resultId
  }));
  assert.equal(accepted.sent, 1);
  assert.equal((await queue.pending()).length, 0);
});

test("raw audio is rejected from the derived-result queue", async () => {
  const queue = createSyncQueue({ store:createMemoryLocalStore() });
  await assert.rejects(
    queue.enqueueDerivedResult({
      resultId:"r2",
      rawAudio:"forbidden"
    }),
    /raw audio/i
  );
});
