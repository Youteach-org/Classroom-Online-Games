import test from "node:test";
import assert from "node:assert/strict";
import { detectCapabilityProfile } from "../core/capability-profile.mjs";

test("no WebGPU falls back to basic without blocking speaking", () => {
  const profile = detectCapabilityProfile({
    gpu: null,
    deviceMemory: 2,
    Worker: function Worker() {}
  });

  assert.equal(profile.tier, "basic");
  assert.equal(profile.canCompleteCoreLesson, true);
  assert.equal(profile.webgpu, false);
});

test("capable device can opt into enhanced local processing", () => {
  const profile = detectCapabilityProfile({
    gpu: {},
    deviceMemory: 8,
    Worker: function Worker() {}
  });

  assert.equal(profile.tier, "enhanced");
  assert.equal(profile.canUseLocalAI, true);
});
