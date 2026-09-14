import test from 'node:test';
import assert from 'node:assert/strict';
import { COASTAL_SCENE } from '../coastal-scene-config.mjs';

test('uses the approved coastal target as the environment', () => {
  assert.equal(COASTAL_SCENE.assetPath, './assets/verb-runner-coastal-target.webp');
  assert.equal(COASTAL_SCENE.hideProceduralScenery, true);
  assert.equal(COASTAL_SCENE.roadColor, 0x6a798b);
  assert.ok(COASTAL_SCENE.backdrop.width >= 160);
  assert.ok(COASTAL_SCENE.backdrop.height >= 58);
});
