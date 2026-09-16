import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const pronunciationPath=join(root,'pronunciation.js');
const manifestPath=join(root,'pronunciation-manifest.js');
const game=readFileSync(join(root,'prototype.js'),'utf8');
const index=readFileSync(join(root,'index.html'),'utf8');
const require=createRequire(import.meta.url);
const pronunciation=require(pronunciationPath);

test('Verb Runner ships a pronunciation player and generated manifest',()=>{
  assert.equal(existsSync(pronunciationPath),true);
  assert.equal(existsSync(manifestPath),true);
  const pronunciationSource=readFileSync(pronunciationPath,'utf8');
  assert.match(pronunciationSource,/function normalizePronunciationKey/);
  assert.match(pronunciationSource,/function playCorrectPronunciation/);
  assert.match(pronunciationSource,/currentAudio\.pause\(\)/);
  assert.match(pronunciationSource,/audio\.play\(\)\.catch/);
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

test('pronunciation is preloaded before selection and starts immediately on a correct hit',()=>{
  const pronunciationSource=readFileSync(join(root,'pronunciation.js'),'utf8');
  assert.match(pronunciationSource,/function preloadPronunciation/);
  assert.match(game,/preloadPronunciation\(sequence\[correctIndex\]\.value/);
  const start=game.indexOf('if(item.correct){');
  const animate=game.indexOf('await animateAnswerToBlank',start);
  const speak=game.indexOf('playCorrectPronunciation(item.value',start);
  assert.ok(speak>start&&speak<animate,'pronunciation should start before answer animation completes');
  const correctBlock=game.slice(start,game.indexOf('}else{',start));
  assert.doesNotMatch(correctBlock,/pronunciationDelay/);
});

test('START unlocks pronunciation inside the user gesture before any await',()=>{
  const pronunciationSource=readFileSync(join(root,'pronunciation.js'),'utf8');
  assert.match(pronunciationSource,/function unlockPronunciation/);

  const start=game.indexOf("startButton.addEventListener('click',async()=>{");
  const end=game.indexOf("runnerChip.addEventListener",start);
  const handler=game.slice(start,end);
  const unlock=handler.indexOf('unlockPronunciation');
  const firstAwait=handler.indexOf('await sessionLoadPromise');
  assert.ok(unlock>=0,'START must unlock pronunciation');
  assert.ok(firstAwait>=0,'START handler should still await session loading');
  assert.ok(unlock<firstAwait,'pronunciation unlock must happen before the first await');
});

test('read uses its grammatical form instead of spelling alone',()=>{
  assert.equal(typeof pronunciation.pronunciationKey,'function');
  assert.equal(pronunciation.pronunciationKey('read',{base:'read',blankIndex:0}),'read::base');
  assert.equal(pronunciation.pronunciationKey('read',{base:'read',blankIndex:1}),'read::past');
  assert.equal(pronunciation.pronunciationKey('read',{base:'read',blankIndex:2}),'read::past');
  assert.equal(pronunciation.pronunciationKey('read',{base:'read',group:'present-simple'}),'read::base');
  assert.equal(pronunciation.pronunciationKey('read',{base:'read',group:'past-simple'}),'read::past');
});

test('game passes the current challenge when preloading and playing pronunciation',()=>{
  assert.match(game,/preloadPronunciation\(sequence\[correctIndex\]\.value,currentChallenge\)/);
  assert.match(game,/playCorrectPronunciation\(item\.value,\{[\s\S]*context:currentChallenge/);
});
