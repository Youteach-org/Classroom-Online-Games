const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
const config=fs.readFileSync(path.join(root,'config.js'),'utf8');
const student=fs.readFileSync(path.join(root,'index.html'),'utf8');
const teacher=fs.readFileSync(path.join(root,'teacher.html'),'utf8');

test('Support Meter production pages no longer load Supabase',()=>{
  assert.doesNotMatch(config+student+teacher,/supabase/i);
});

test('Firebase config targets the existing Realtime Database project',()=>{
  assert.match(config,/youteach-d9a79-default-rtdb\.firebaseio\.com/);
  assert.match(config,/heartbeatMs:\s*30000/);
});

test('Firebase adapter exports the complete student and teacher API',()=>{
  const adapter=fs.readFileSync(path.join(root,'firebase-client.js'),'utf8');
  for(const name of ['createAssignedSession','resolveJoinToken','createRun','updateRun','appendResponse','watchRun','watchSessions','watchRuns','redirectRun','deleteAssignedSession','cleanupExpiredFreeRuns'])assert.match(adapter,new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`));
});

test('database rules index session and presence fields',()=>{
  const rules=fs.readFileSync(path.join(root,'..','..','firebase.support-meter.rules.json'),'utf8');
  assert.match(rules,/"\.indexOn"\s*:\s*\[[^\]]*"sessionId"[^\]]*"lastSeen"/s);
});
