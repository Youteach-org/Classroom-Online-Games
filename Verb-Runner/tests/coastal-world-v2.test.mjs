import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const world=readFileSync(join(root,'coastal-world.mjs'),'utf8');
const preview=readFileSync(join(root,'coastal-preview.mjs'),'utf8');

test('V2 coastal world replaces primitive mountain cones with irregular layered terrain',()=>{
  assert.match(world,/function createIrregularMountain/);
  assert.match(world,/function createMountainLayer/);
  assert.doesNotMatch(world,/new THREE\.ConeGeometry\(r,h,mobile\?18:28,1\)/);
});

test('V2 coastal water is animated and exposes an environment update hook',()=>{
  assert.match(world,/function createWaterMaterial/);
  assert.match(world,/uTime/);
  assert.match(world,/update\(time\)/);
  assert.match(preview,/coastalWorld\.update\(time/);
});

test('V2 Mediterranean façades add architectural detail beyond blockout boxes',()=>{
  for(const marker of [
    'addArchedOpening',
    'addRoofTileRows',
    'addChimney',
    'createPergola',
    'addBougainvillea'
  ]){
    assert.match(world,new RegExp(marker));
  }
});

test('V2 vegetation and distant town include organic silhouettes and landmark depth cues',()=>{
  for(const marker of [
    'createOrganicFoliageGeometry',
    'createCypress',
    'createBellTower',
    'createAtmosphericHaze'
  ]){
    assert.match(world,new RegExp(marker));
  }
});
