import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const game=readFileSync(join(root,'prototype.js'),'utf8');

test('students register in Firebase as soon as they join a classroom session',()=>{
  assert.match(sync,/async function registerRunnerPresence/);
  assert.match(sync,/status:'waiting'/);
  assert.match(sync,/online:true/);
  assert.match(sync,/onDisconnect\(studentRef\)/);
  assert.match(sync,/registerRunnerPresence/);
  assert.match(game,/await sessionApi\.registerRunnerPresence\(sessionCode,runnerSessionId/);
});

test('presence registration does not wipe race progress',()=>{
  const block=sync.match(/async function registerRunnerPresence[\s\S]*?\n}\n\nasync function connectRunner/)?.[0]||'';
  assert.match(block,/update\(studentRef/);
  assert.doesNotMatch(block,/await set\(studentRef/);
  assert.doesNotMatch(block,/progress:0/);
  assert.doesNotMatch(block,/correct:0/);
});

test('classroom heartbeat stays alive before the race starts',()=>{
  assert.match(game,/if\(sessionCode&&sessionData\)\{/);
  assert.match(game,/status:gameStarted\?\(gamePaused\?'paused':\(victoryMode\?'victory':'running'\)\):'waiting'/);
  assert.doesNotMatch(game,/if\(sessionCode&&sessionData&&gameStarted\)\{/);
});
