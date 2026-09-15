import test from 'node:test';
import assert from 'node:assert/strict';
import { COASTAL_SCENE } from '../coastal-scene-config.mjs';

test('coastal world config encodes the approved camera and composition', () => {
  assert.equal('hideProceduralScenery' in COASTAL_SCENE, false);
  assert.ok(COASTAL_SCENE.camera?.desktop);
  assert.ok(COASTAL_SCENE.camera?.mobile);
  assert.ok(COASTAL_SCENE.camera.desktop.fov >= 46 && COASTAL_SCENE.camera.desktop.fov <= 54);
  assert.ok(COASTAL_SCENE.camera.desktop.far >= 240);
  assert.ok(COASTAL_SCENE.layout.leftPromenadeWidth > COASTAL_SCENE.layout.rightSidewalkWidth);
  assert.ok(COASTAL_SCENE.layout.seaWallX < -9.5);
  assert.ok(COASTAL_SCENE.layout.villageX > 7.5);
  assert.ok(COASTAL_SCENE.loop.nearSpan >= 170);
  assert.ok(COASTAL_SCENE.loop.farSpan >= 210);
});

test('coastal palette stays warm, bright and Mediterranean', () => {
  assert.equal(COASTAL_SCENE.roadColor, 0x657486);
  assert.equal(COASTAL_SCENE.sidewalkColor, 0xeadfce);
  assert.equal(COASTAL_SCENE.seaColor, 0x159fc5);
  assert.equal(COASTAL_SCENE.skyColor, 0x8fd4ef);
});
