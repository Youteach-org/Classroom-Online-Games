import { createLocalStore } from "../storage/local-store.mjs";

const RAW_MEDIA_KEYS = new Set([
  "rawAudio",
  "audioBlob",
  "audioBuffer",
  "pcm",
  "samples",
  "recording"
]);

function containsRawMedia(value, seen = new Set()) {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  for (const [key, nested] of Object.entries(value)) {
    if (RAW_MEDIA_KEYS.has(key)) return true;
    if (containsRawMedia(nested, seen)) return true;
  }
  return false;
}

function normalizeResult(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("Derived result must be an object.");
  }
  const resultId = String(result.resultId || "").trim();
  if (!resultId) throw new Error("Derived result requires resultId.");
  if (containsRawMedia(result)) {
    throw new Error("Raw audio cannot be stored in the Talk Talk sync queue.");
  }
  return JSON.parse(JSON.stringify({ ...result, resultId }));
}

export function createSyncQueue({ store = createLocalStore() } = {}) {
  const prefix = "result:";

  return Object.freeze({
    async enqueueDerivedResult(result) {
      const clean = normalizeResult(result);
      await store.set(prefix + clean.resultId, clean);
      return clean;
    },

    async pending() {
      return (await store.entries())
        .filter(([key]) => String(key).startsWith(prefix))
        .map(([, value]) => value)
        .sort((a, b) => String(a.resultId).localeCompare(String(b.resultId)));
    },

    async flushSyncQueue(send) {
      if (typeof send !== "function") throw new Error("Sync queue requires a send function.");
      let sent = 0;
      let failed = 0;

      for (const result of await this.pending()) {
        try {
          const receipt = await send(result);
          if (receipt?.accepted === true && String(receipt?.resultId || "") === result.resultId) {
            await store.remove(prefix + result.resultId);
            sent += 1;
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        }
      }

      const pending = (await this.pending()).length;
      return { sent, failed, pending };
    }
  });
}

const defaultQueue = createSyncQueue();

export async function enqueueDerivedResult(result) {
  return defaultQueue.enqueueDerivedResult(result);
}

export async function flushSyncQueue(send) {
  return defaultQueue.flushSyncQueue(send);
}
