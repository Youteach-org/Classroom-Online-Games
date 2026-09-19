import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const prototype=readFileSync(join(root,'prototype.js'),'utf8');

test('YouTeach launch token exposes assignment context without making it official',()=>{
  assert.match(sync,/launchContext:\{/);
  assert.match(sync,/purpose:String\(claimed\.purpose/);
  assert.match(sync,/officialSubmissionAllowed:claimed\.officialSubmissionAllowed===true/);
  assert.match(sync,/cogActivity:claimed\.cogActivity/);
});

test('Verb Runner maps YouTeach modes to fixed race levels',()=>{
  assert.match(prototype,/'verb':1/);
  assert.match(prototype,/'sentence':2/);
  assert.match(prototype,/'time-clues':3/);
  assert.match(prototype,/'perfect-race':4/);
  assert.match(prototype,/'final-race':5/);
});

test('assignment launch locks race and difficulty for the launched task',()=>{
  assert.match(prototype,/function applyAssignmentLaunchContext\(context\)/);
  assert.match(prototype,/context\?\.purpose!=='assignment-practice'/);
  assert.match(prototype,/btn\.disabled=true/);
  assert.match(prototype,/Boolean\(assignmentLaunchContext\)\|\|currentLevel>=5/);
  assert.match(prototype,/\(sessionCode&&sessionData\)\|\|assignmentLaunchContext/);
});

test('assignment context is not persisted as remembered YouTeach identity',()=>{
  assert.match(prototype,/const persistentIdentity=\{/);
  assert.doesNotMatch(prototype,/persistentIdentity=.*launchContext/);
  assert.match(prototype,/if\(resolved\.launchContext\)applyAssignmentLaunchContext/);
});
