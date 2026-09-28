export const AED_CACHE_NAME = "aed-teacher-monitor-v1";

export const OFFLINE_REQUIRED_ASSETS = Object.freeze([
  "./",
  "./index.html",
  "./aed-scenarios.js",
  "./scene-twists.js",
  "./clinical-cases.js",
  "./prompt-catalog.js",
  "./trainer-engine.js",
  "./ble-protocol.js",
  "./ble-client.js",
  "./offline.js",
  "./manifest.webmanifest"
]);

export async function getOfflineReadiness({ cachesRef = globalThis.caches ?? null } = {}) {
  if (!cachesRef) return "unsupported";
  const names = await cachesRef.keys();
  if (!names.includes(AED_CACHE_NAME)) return "incomplete";

  const cache = await cachesRef.open(AED_CACHE_NAME);
  for (const asset of OFFLINE_REQUIRED_ASSETS) {
    if (!(await cache.match(asset))) return "incomplete";
  }
  return "ready";
}

export async function registerOfflineSupport({
  navigatorRef = globalThis.navigator ?? null,
  cachesRef = globalThis.caches ?? null
} = {}) {
  if (!navigatorRef?.serviceWorker || !cachesRef) return "unsupported";

  const registration = await navigatorRef.serviceWorker.register("./service-worker.js");
  if (registration.installing) return "installing";

  if (navigatorRef.serviceWorker.ready) {
    await navigatorRef.serviceWorker.ready;
  }
  return getOfflineReadiness({ cachesRef });
}
