import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const pronunciationPath=join(root,'pronunciation.js');
const manifestPath=join(root,'pronunciation-manifest.js');
const game=readFileSync(join(root,'prototype.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');

test('Verb Runner ships a pronunciation player and generated manifest',()=>{
  assert.equal(existsSync(pronunciationPath),true);
  assert.equal(existsSync(manifestPath),true);
  const pronunciation=readFileSync(pronunciationPath,'utf8');
  assert.match(pronunciation,/function normalizePronunciationKey/);
  assert.match(pronunciation,/function playCorrectPronunciation/);
  assert.match(pronunciation,/currentAudio\.pause\(\)/);
  assert.match(pronunciation,/audio\.play\(\)\.catch/);
});

test('pronunciation assets load before the game module',()=>{
  const manifest=index.indexOf('pronunciation-manifest.js');
  const player=index.indexOf('pronunciation.js');
  const prototype=index.indexOf('prototype.js');
  assert.ok(manifest>=0);
  assert.ok(player>manifest);
  assert.ok(prototype>player);
});

test('a correct selection plays its exact answer through the SFX controls',()=>{
  const start=game.indexOf('if(item.correct){');
  const end=game.indexOf('}else{',start);
  const correctBlock=game.slice(start,end);
  assert.match(correctBlock,/VerbRunnerPronunciation/);
  assert.match(correctBlock,/item\.value/);
  assert.match(correctBlock,/enabled:sfxEnabled/);
  assert.match(correctBlock,/volume:sfxVolume/);
});
