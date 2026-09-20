import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const prototype=readFileSync(join(root,'prototype.js'),'utf8');

test('normal YouTeach launch remains on the existing one-time Firebase credential path',()=>{
  assert.match(sync,/async function resolveYouTeachLaunchToken\(rawToken\)/);
  assert.match(sync,/runTransaction\(tokenRef/);
  assert.match(prototype,/resolveYouTeachLaunchToken\(launchToken\)/);
});

test('assignment launch resolves through the allowlisted YouTeach server instead of public Firebase',()=>{
  assert.match(sync,/async function resolveYouTeachAssignmentLaunchToken\(rawToken,rawIssuer\)/);
  assert.match(sync,/host==='youteach\.pages\.dev'/);
  assert.match(sync,/host\.endsWith\('\.youteach\.pages\.dev'\)/);
  assert.match(sync,/\/api\/cog-launch-resolve/);
  assert.match(sync,/context\?\.purpose!=='assignment-practice'/);
  assert.match(sync,/typeof context\?\.officialSubmissionAllowed!=='boolean'/);
});

test('Verb Runner maps YouTeach modes to fixed race levels',()=>{
  assert.match(prototype,/'verb':1/);
  assert.match(prototype,/'sentence':2/);
  assert.match(prototype,/'time-clues':3/);
  assert.match(prototype,/'perfect-race':4/);
  assert.match(prototype,/'final-race':5/);
});

test('assignment launch locks race and difficulty for the launched task',()=>{
  assert.match(prototype,/function applyYouTeachAssignmentContext\(context=\{\}\)/);
  assert.match(prototype,/context\?\.purpose!=='assignment-practice'/);
  assert.match(prototype,/btn\.disabled=true/);
  assert.match(prototype,/assignmentContextLocked\|\|currentLevel>=5/);
});

test('assignment launch uses its own credential and leaves normal launch compatible',()=>{
  assert.match(prototype,/sessionParams\.get\('assignmentLaunch'\)/);
  assert.match(prototype,/sessionParams\.get\('issuer'\)/);
  assert.match(prototype,/resolveYouTeachAssignmentLaunchToken/);
  assert.match(prototype,/else if\(launchToken\)/);
  assert.match(prototype,/resolveYouTeachLaunchToken\(launchToken\)/);
});

test('assigned launch refresh cannot silently fall back to free mode',()=>{
  assert.match(prototype,/ytAssignment/);
  assert.match(prototype,/assignmentLaunchMarker&&!assignmentLaunchToken/);
  assert.match(prototype,/launchCredentialFailed/);
  assert.match(prototype,/REOPEN FROM YOUTEACH/);
});

test('assignment context is not persisted as remembered YouTeach identity',()=>{
  assert.match(prototype,/const stored=\{/);
  assert.doesNotMatch(prototype,/stored=.*assignmentContext/);
  assert.match(prototype,/resolved\.launchContext&&applyYouTeachAssignmentContext/);
});
