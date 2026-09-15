import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const game=readFileSync(join(root,'prototype.js'),'utf8');
const teacher=readFileSync(join(root,'teacher.js'),'utf8');

test('Verb Runner atomically claims YouTeach launch tokens and resolves canonical student identity',()=>{
  assert.match(sync,/runTransaction/);
  assert.match(sync,/async function resolveYouTeachLaunchToken/);
  assert.match(sync,/launchTokens/);
  assert.match(sync,/expiresAt/);
  assert.match(sync,/used/);
  assert.match(sync,/students\/\$\{studentKey\}/);
  assert.match(sync,/nickname/);
  assert.match(sync,/groupName/);
  assert.match(sync,/studentNumber/);
});

test('game consumes opaque launch token and uses stable YouTeach identity for presence',()=>{
  assert.match(game,/sessionParams\.get\('launch'\)/);
  assert.match(game,/resolveYouTeachLaunchToken/);
  assert.match(game,/verbRunnerYouTeachIdentity/);
  assert.match(game,/runnerSessionId=.*studentKey/);
  assert.match(game,/studentKey:/);
  assert.match(game,/nickname:/);
  assert.match(game,/groupName:/);
  assert.match(game,/studentNumber:/);
});

test('Teacher Monitor prefers YouTeach nickname and labels credential source',()=>{
  assert.match(teacher,/student\.nickname\|\|student\.studentName/);
  assert.match(teacher,/student\.identitySource/);
  assert.match(teacher,/YOUTEACH/);
});
