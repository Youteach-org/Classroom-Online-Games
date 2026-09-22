import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const game=readFileSync(join(root,'prototype.js'),'utf8');

test('YouTeach launch token preserves assignment launch context',()=>{
  assert.match(sync,/launchContext:/);
  assert.match(sync,/purpose:String\(claimed\.purpose\|\|''\)/);
  assert.match(sync,/assignmentId:String\(claimed\.assignmentId\|\|''\)/);
  assert.match(sync,/cogActivity:/);
});

test('assigned mode maps to the correct Verb Runner race level',()=>{
  assert.match(game,/function assignmentModeLevel\(modeId\)/);
  assert.match(game,/sentence:2/);
  assert.match(game,/'time-clues':3/);
  assert.match(game,/'perfect-race':4/);
  assert.match(game,/'final-race':5/);
});

test('assignment launch locks race and difficulty to assigned values',()=>{
  assert.match(game,/function applyAssignmentLaunchConfig\(context\)/);
  assert.match(game,/document\.querySelectorAll\('\[data-race\]'\)/);
  assert.match(game,/btn\.disabled=true/);
  assert.match(game,/document\.querySelectorAll\('\[data-difficulty\]'\)/);
  assert.match(game,/assignmentLaunchContext=resolved\.launchContext\|\|null/);
  assert.match(game,/applyAssignmentLaunchConfig\(assignmentLaunchContext\)/);
});

test('assignment launch does not enable official submission in game client',()=>{
  assert.match(game,/officialSubmissionAllowed===true/);
  assert.match(game,/assignmentOfficialSubmissionAllowed=false/);
});
