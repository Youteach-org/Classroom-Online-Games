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
const index=readFileSync(join(root,'index.html'),'utf8');

test('free-mode players have their own Firebase presence collection',()=>{
  assert.match(sync,/FREE_ROOT/);
  assert.match(sync,/async function registerFreeRunnerPresence/);
  assert.match(sync,/function subscribeFreeRunners/);
  assert.match(sync,/async function updateFreeRunner/);
  assert.match(sync,/async function connectFreeRunner/);
  assert.match(sync,/async function finishFreeRunner/);
  assert.match(sync,/onDisconnect\(studentRef\)/);
});

test('Verb Runner registers players in free mode when no session code exists',()=>{
  assert.match(game,/registerFreeRunnerPresence\(runnerSessionId/);
  assert.match(game,/updateFreeRunner\(runnerSessionId/);
  assert.match(game,/connectFreeRunner\(runnerSessionId/);
  assert.match(game,/finishFreeRunner\(runnerSessionId/);
  assert.match(game,/status:gameStarted\?\(gamePaused\?'paused':\(victoryMode\?'victory':'running'\)\):'waiting'/);
});

test('Teacher Monitor merges free-mode runners with session runners',()=>{
  assert.match(teacher,/subscribeFreeRunners/);
  assert.match(teacher,/let freeRunners=\{\}/);
  assert.match(teacher,/data-session-id="free"/);
  assert.match(teacher,/FREE MODE/);
  assert.match(teacher,/studentsForFree\(\)/);
  assert.match(teacher,/allSessionStudents\.concat\(studentsForFree\(\)\)/);
});

test('players without a classroom session are reported to free mode even without YouTeach identity',()=>{
  const updateBlock=game.match(/function sessionUpdate[\s\S]*?function sessionConnect/)?.[0]||'';
  const connectBlock=game.match(/function sessionConnect[\s\S]*?function sessionFinish/)?.[0]||'';
  const finishBlock=game.match(/function sessionFinish[\s\S]*?const renderer/)?.[0]||'';

  assert.match(updateBlock,/if\(sessionCode\)return sessionApi\.updateRunner\(sessionCode,runnerSessionId,patch\);\s*return sessionApi\.updateFreeRunner\(runnerSessionId,patch\);/);
  assert.match(connectBlock,/if\(sessionCode\)return sessionApi\.connectRunner\(sessionCode,runnerSessionId,payload\);\s*return sessionApi\.connectFreeRunner\(runnerSessionId,payload\);/);
  assert.match(finishBlock,/if\(sessionCode\)return sessionApi\.finishRunner\(sessionCode,runnerSessionId,payload\);\s*return sessionApi\.finishFreeRunner\(runnerSessionId,payload\);/);

  assert.match(game,/if\(sessionCode\)\{[\s\S]*?return data;\s*}\s*sessionData=\{status:'free',identitySource:youTeachIdentity\?'youteach':'local'\};\s*await sessionApi\.registerFreeRunnerPresence\(runnerSessionId,presenceData\);/);
});

test('Verb Runner entry point cache-busts the free-mode presence fix',()=>{
  assert.match(index,/prototype\.js\?v=free-mode-presence-20260915-1/);
});

