import test from "node:test";
import assert from "node:assert/strict";
import {
  MODEL_CANDIDATES,
  assertModelManifest
} from "../speech/model-manifest.mjs";

test("essential model candidates are local/open and license documented", () => {
  assert.ok(MODEL_CANDIDATES.some(asset => asset.purpose === "stt"));
  assert.ok(MODEL_CANDIDATES.some(asset => asset.purpose === "phoneme"));

  for (const asset of MODEL_CANDIDATES) {
    assert.match(asset.source, /^https:\/\//);
    assert.ok(asset.license);
    assert.notEqual(asset.runtime, "paid-api");
    assert.ok(Number.isFinite(asset.maxDownloadBytes));
  }

  assert.doesNotThrow(() => assertModelManifest(MODEL_CANDIDATES));
});

test("manifest rejects paid APIs and undocumented licenses", () => {
  assert.throws(
    () => assertModelManifest([
      {
        id: "bad",
        purpose: "stt",
        source: "https://example.com/model",
        license: "",
        runtime: "paid-api",
        browserRuntime: "remote",
        maxDownloadBytes: 1,
        requiredForCore: true
      }
    ]),
    /license|paid-api/i
  );
});
