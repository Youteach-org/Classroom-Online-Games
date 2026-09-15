import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const read=(name)=>readFileSync(join(root,name),'utf8');

test('Verb Runner uses a real Three.js coastal world instead of a raster or SVG backdrop', () => {
  const worldPath=join(root,'coastal-world.mjs');
  assert.equal(existsSync(worldPath),true,'coastal-world.mjs must exist');

  const index=read('index.html');
  const styles=read('styles.css');
  const prototype=read('prototype.js');
  const world=readFileSync(worldPath,'utf8');

  assert.doesNotMatch(index,/coastalBackdrop/i);
  assert.doesNotMatch(styles,/data:image\/(?:webp|png|jpe?g)/i);
  assert.doesNotMatch(prototype,/makeAnimeCoastBackdrop|animeBackdrop|coastalSceneTexture/i);
  assert.doesNotMatch(prototype,/coastal-scene\.svg/i);

  for(const marker of [
    'buildCoastalWorld',
    'createMediterraneanBuilding',
    'createBroadleafTree',
    'createPalm',
    'createPromenadeSegment',
    'createMountainBackdrop',
    'createHillsideTown',
    'createFruitShop',
    'createCafe'
  ]){
    assert.match(world,new RegExp(marker));
  }
});

test('current gameplay regression rules remain present', () => {
  const index=read('index.html');
  const prototype=read('prototype.js');
  const all=index+'\n'+prototype;

  assert.match(prototype,/sequence\.length===3/);
  assert.match(prototype,/lane!==lastCorrectLane/);
  assert.match(prototype,/recordMistake\(\{type:'wrong'/);
  assert.match(prototype,/function missedCorrectAnswer\(\)[\s\S]*?showNotice/);
  assert.doesNotMatch(
    prototype.match(/function missedCorrectAnswer\(\)[\s\S]*?showNotice/)?.[0]||'',
    /recordMistake\(/
  );

  assert.match(index,/BASE FORM/);
  assert.match(index,/SIMPLE PAST/);
  assert.match(index,/PAST PARTICIPLE/);
  assert.match(prototype,/Final Race changes only the verb\/question, not the exercise format/);
  assert.doesNotMatch(all,/Connectivity 5/i);
});
