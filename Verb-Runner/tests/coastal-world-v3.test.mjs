import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const world=readFileSync(join(root,'coastal-world.mjs'),'utf8');

test('V3 adds procedural surface character instead of flat blockout materials',()=>{
  for(const marker of [
    'createStuccoTexture',
    'createPaverTexture',
    'createRoofTileTexture',
    'applySurfaceTextures'
  ]) assert.match(world,new RegExp(marker));
});

test('V3 strengthens Mediterranean street life and foreground detail',()=>{
  for(const marker of [
    'createBunting',
    'createHangingSign',
    'createStreetUmbrella',
    'createCafeService',
    'createMarketDisplay'
  ]) assert.match(world,new RegExp(marker));
});

test('V3 enriches the waterfront with boats, shoreline detail and reflections',()=>{
  for(const marker of [
    'createSailboat',
    'createWaterfrontBoats',
    'createShoreFoamRibbon',
    'createSunGlitter'
  ]) assert.match(world,new RegExp(marker));
});

test('V3 reduces copy-paste repetition with deterministic facade variation',()=>{
  for(const marker of [
    'buildingVariant',
    'addFacadeTrim',
    'addWindowCluster',
    'addWallLantern'
  ]) assert.match(world,new RegExp(marker));
});
