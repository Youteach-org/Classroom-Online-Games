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

test('water geometry stops before the seawall and never extends beneath the road',()=>{
  assert.match(world,/SEA_RIGHT_EDGE/);
  assert.match(world,/SEA_LEFT_EDGE/);
  assert.match(world,/const seaWidth=SEA_RIGHT_EDGE-SEA_LEFT_EDGE/);
  assert.match(world,/const seaCenterX=\(SEA_RIGHT_EDGE\+SEA_LEFT_EDGE\)\/2/);
  assert.doesNotMatch(world,/new THREE\.PlaneGeometry\(76,250/);
});

test('gable roofs render opaque from both sides',()=>{
  assert.match(world,/function createGableRoof[\s\S]*?THREE\.DoubleSide/);
  assert.match(world,/function createGableRoof[\s\S]*?transparent=false/);
  assert.match(world,/function createGableRoof[\s\S]*?depthWrite=true/);
});


test('rooftop business signs are mounted to the roof surface at the facade, not to the ridge height',()=>{
  assert.match(world,/const ROOFTOP_SIGN_CLEARANCE=\.08/);
  assert.match(world,/roofWidth=4\.8/);
  assert.match(world,/const roofHalfWidth=roofWidth\/2/);
  assert.match(world,/const roofSurfaceY=roofBase\+roofHeight\*clamp\(1-Math\.abs\(signX\)\/roofHalfWidth,0,1\)/);
  assert.match(world,/const signY=roofSurfaceY\+ROOFTOP_SIGN_CLEARANCE\+signHeight\/2/);
  assert.match(world,/const postBottom=roofSurfaceY\+.02/);
  assert.doesNotMatch(world,/const ridgeY=roofBase\+roofHeight/);
  assert.match(world,/mountRooftopSign\(detail,'Café Vida',[\s\S]*?roofWidth:width\+\.68/);
  assert.match(world,/mountRooftopSign\(detail,'La Tiendita',[\s\S]*?roofWidth:width\+\.68/);
  assert.match(world,/mountRooftopSign\(g,'Mercado',[\s\S]*?roofWidth:width\+\.68/);
});
