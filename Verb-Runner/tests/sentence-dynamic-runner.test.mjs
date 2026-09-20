import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const game=readFileSync(join(root,'prototype.js'),'utf8');

test('Sentence Runner loads the learning-first run director before the 3D game module',()=>{
  const directorIndex=html.indexOf('run-director.js');
  const prototypeIndex=html.indexOf('prototype.js');
  assert.ok(directorIndex>=0,'run-director.js must be loaded');
  assert.ok(prototypeIndex>directorIndex,'run director must load before prototype.js');
});

test('runner exposes real roll controls on keyboard and touch',()=>{
  assert.match(game,/const rollClip=chooseClip\(gltf\.animations,\['roll'\]\)/);
  assert.match(game,/if\(rollClip\)actions\.roll=mixer\.clipAction\(rollClip\)/);
  assert.match(game,/function roll\(\)/);
  assert.match(game,/\['ArrowDown','KeyS'\]\.includes\(e\.code\)\)roll\(\)/);
  assert.match(game,/dy>=36[\s\S]*?roll\(\)/);
});

test('Sentence Runner can present three physical grammar gates and collect them without jump-height rules',()=>{
  assert.match(game,/function spawnGrammarGate\(item,laneIndex\)/);
  assert.match(game,/presentation==='grammar-gate'/);
  assert.match(game,/heightMode==='gate'\?true/);
  assert.match(game,/VerbRunnerRunDirector\.buildGrammarGateSequence/);
});

test('Sentence Runner gives roll a real obstacle to solve',()=>{
  assert.match(game,/function createSlideBarrier\(\)/);
  assert.match(game,/currentLevel===2&&roll<\.16/);
  assert.match(game,/o\.type==='slide'\?rollTime>0/);
});
