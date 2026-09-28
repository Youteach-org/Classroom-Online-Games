import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  AED_CACHE_NAME,
  OFFLINE_REQUIRED_ASSETS,
  getOfflineReadiness
} from "../offline.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const sw = readFileSync(join(root, "service-worker.js"), "utf8");

test("service worker precaches every required local runtime asset", () => {
  for (const asset of OFFLINE_REQUIRED_ASSETS) {
    assert.ok(sw.includes(JSON.stringify(asset)), asset);
  }
});

test("offline shell has no remote runtime dependency", () => {
  assert.doesNotMatch(sw, /https?:\/\//i);
  for (const asset of OFFLINE_REQUIRED_ASSETS) {
    assert.ok(asset.startsWith("./"), asset);
    assert.doesNotMatch(asset, /https?:\/\//i);
  }
});

function makeCaches({ names = [AED_CACHE_NAME], present = OFFLINE_REQUIRED_ASSETS } = {}) {
  const set = new Set(present);
  return {
    async keys() { return names; },
    async open(name) {
      assert.equal(name, AED_CACHE_NAME);
      return {
        async match(asset) { return set.has(asset) ? { ok: true } : undefined; }
      };
    }
  };
}

test("readiness is ready only when the complete shell is cached", async () => {
  assert.equal(await getOfflineReadiness({ cachesRef: makeCaches() }), "ready");
  const missing = OFFLINE_REQUIRED_ASSETS.slice(0, -1);
  assert.equal(await getOfflineReadiness({ cachesRef: makeCaches({ present: missing }) }), "incomplete");
  assert.equal(await getOfflineReadiness({ cachesRef: makeCaches({ names: [] }) }), "incomplete");
});

test("readiness reports unsupported when Cache Storage is unavailable", async () => {
  assert.equal(await getOfflineReadiness({ cachesRef: null }), "unsupported");
});

test("service worker removes obsolete AED cache versions during activate", () => {
  assert.match(sw, /CACHE_PREFIX/);
  assert.match(sw, /caches\.keys\(\)/);
  assert.match(sw, /caches\.delete/);
  assert.match(sw, /name\.startsWith\(CACHE_PREFIX\)/);
});
