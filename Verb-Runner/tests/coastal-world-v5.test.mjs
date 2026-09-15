import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const world=readFileSync(join(root,'coastal-world.mjs'),'utf8');

test('V5 removes oversized hard canopy shadows from the road',()=>{
  assert.match(world,/COASTAL_V5_LIGHTING/);
  assert.match(world,/createCanopyCluster[\s\S]*?cast:false/);
});

test('V5 restores a visible natural mountain focal point at the horizon',()=>{
  assert.match(world,/MOUNTAIN_FOCUS_Z/);
  assert.match(world,/createMountainBackdrop[\s\S]*?MOUNTAIN_FOCUS_Z/);
});

test('V5 brightens the sea and terracotta roof palette',()=>{
  assert.match(world,/COASTAL_V5_SEA/);
  assert.match(world,/COASTAL_V5_TERRACOTTA/);
});

test('V5 gives the distant settlement a real hillside rise instead of a flat strip',()=>{
  assert.match(world,/TOWN_HILLSIDE_RISE/);
  assert.match(world,/createTownTerrace[\s\S]*?TOWN_HILLSIDE_RISE/);
});
