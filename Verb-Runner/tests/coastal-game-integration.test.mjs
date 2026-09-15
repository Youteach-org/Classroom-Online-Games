import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const read=(name)=>readFileSync(join(root,name),'utf8');

test('production Verb Runner mounts the approved Three.js coastal world',()=>{
  const prototype=read('prototype.js');
  assert.match(prototype,/const coastalWorld=buildCoastalWorld\(\{/);
  assert.match(prototype,/registerMover:addMover/);
  assert.match(prototype,/registerFarMover:addFarMover/);
  assert.match(prototype,/const laneMarkers=coastalWorld\.laneMarkers/);
  assert.match(prototype,/coastalWorld\.update\(clock\.elapsedTime\)/);
});

test('production camera can see the restored distant mountains',()=>{
  const prototype=read('prototype.js');
  assert.match(prototype,/COASTAL_SCENE\.camera/);
  assert.match(prototype,/new THREE\.PerspectiveCamera\(cameraConfig\.fov,1,\.1,cameraConfig\.far\)/);
  assert.doesNotMatch(prototype,/new THREE\.PerspectiveCamera\(52,1,\.1,180\)/);
});

test('legacy raster and procedural coastal scene are absent from production',()=>{
  const prototype=read('prototype.js');
  const index=read('index.html');
  const styles=read('styles.css');
  assert.doesNotMatch(prototype,/makeAnimeCoastBackdrop|coastalSceneTexture|animeBackdrop/);
  assert.doesNotMatch(prototype,/const city=new THREE\.Group\(\)|const coast=new THREE\.Group\(\)|const streetProps=new THREE\.Group\(\)/);
  assert.doesNotMatch(index,/coastalBackdrop|coastal-backdrop/);
  assert.doesNotMatch(styles,/\.coastal-backdrop\s*\{/);
  assert.doesNotMatch(styles,/data:image\/(?:webp|png|jpe?g)/i);
});
