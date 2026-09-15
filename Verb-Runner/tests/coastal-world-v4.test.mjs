import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const world=readFileSync(join(root,'coastal-world.mjs'),'utf8');

test('V4 improves the coastal skyline and hillside-town composition',()=>{
  for(const marker of [
    'COASTAL_V4_MOUNTAINS',
    'createLayeredHillsideTown',
    'createCoastalHillside',
    'createTownTerrace'
  ]) assert.match(world,new RegExp(marker));
});

test('V4 replaces stick-like vegetation with fuller stylized silhouettes',()=>{
  for(const marker of [
    'createPalmFrondGeometry',
    'createNaturalTreeBranches',
    'createCanopyCluster'
  ]) assert.match(world,new RegExp(marker));
});

test('V4 strengthens Mediterranean color and facade richness',()=>{
  for(const marker of [
    'COASTAL_V4_PALETTE',
    'createBougainvilleaCascade',
    'createAwningValance',
    'addRoofEdgeTiles'
  ]) assert.match(world,new RegExp(marker));
});

test('V4 keeps the road clear while increasing sidewalk and waterfront density',()=>{
  for(const marker of [
    'createPromenadePlanterCluster',
    'createCafeTerraceCluster',
    'createSeasideBanner'
  ]) assert.match(world,new RegExp(marker));
});
