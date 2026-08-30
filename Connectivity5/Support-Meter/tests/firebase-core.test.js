const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeSessions,visibleRuns,resetForRedirect,retentionDecision}=require('../firebase-core.js');

test('catalog includes assigned sessions and one virtual Free Mode session',()=>{
  const now=Date.parse('2026-08-28T13:00:00Z');
  const sessions={a:{setNumber:2,status:'open',createdAt:now-60000}};
  const runs={one:{sessionId:'free',lastSeen:now-1000},two:{sessionId:'a',lastSeen:now-1000}};
  const result=normalizeSessions(sessions,runs,now);
  assert.equal(result[0].sessionId,'free');
  assert.equal(result[0].label,'Free Mode · 1 student');
  assert.equal(result[1].sessionId,'a');
  assert.equal(result[1].studentCount,1);
});

test('runs are hidden before session selection and after one hour',()=>{
  const now=Date.parse('2026-08-28T13:00:00Z');
  const runs={recent:{sessionId:'free',lastSeen:now-3599000},old:{sessionId:'free',lastSeen:now-3600000}};
  assert.deepEqual(visibleRuns(runs,null,now),[]);
  assert.deepEqual(visibleRuns(runs,'free',now).map(run=>run.id),['recent']);
});

test('all view includes recent students from every session',()=>{
  const now=2000000;
  const runs={a:{studentName:'Amy',sessionId:'free',lastSeen:now-1000},b:{studentName:'Leo',sessionId:'assigned-1',lastSeen:now-2000},old:{studentName:'Old',sessionId:'free',lastSeen:now-3600001}};
  assert.deepEqual(visibleRuns(runs,'all',now).map(run=>run.studentName),['Amy','Leo']);
});

test('session catalog always includes Free Mode and live counts',()=>{
  const now=2000000;
  const sessions={s1:{setNumber:1,status:'open',createdAt:now-5000}};
  const runs={a:{sessionId:'s1',status:'online',lastSeen:now-1000},b:{sessionId:'s1',status:'offline',lastSeen:now-2000}};
  const catalog=normalizeSessions(sessions,runs,now,40000);
  assert.equal(catalog[0].sessionId,'free');
  assert.equal(catalog[0].studentCount,0);
  assert.equal(catalog[1].studentCount,2);
  assert.equal(catalog[1].onlineCount,1);
});

test('redirect reset clears all progress and preserves student identity',()=>{
  const now=Date.parse('2026-08-28T13:00:00Z');
  const run={id:'r',studentName:'Amy',score:500,supportMeter:55,streak:3,storyProgress:5,attempt:2,liveFeeling:'Empathy',liveExpression:'I hear you.',redirectGeneration:1};
  const result=resetForRedirect(run,{sessionId:'target',setNumber:3},now);
  assert.equal(result.studentName,'Amy');
  assert.equal(result.sessionId,'target');
  assert.equal(result.setNumber,3);
  assert.equal('score' in result,false);assert.equal(result.supportMeter,0);assert.equal(result.streak,0);
  assert.equal(result.storyProgress,1);assert.equal(result.attempt,1);
  assert.equal(result.liveFeeling,null);assert.equal(result.liveExpression,null);
  assert.equal(result.redirectGeneration,2);
});

test('free retention deletes completed after five minutes and abandoned after 24 hours',()=>{
  const now=Date.parse('2026-08-28T13:00:00Z');
  assert.equal(retentionDecision({sessionId:'free',completedAt:now-300000,lastSeen:now-1000},now),'delete');
  assert.equal(retentionDecision({sessionId:'free',completedAt:null,lastSeen:now-86400000},now),'delete');
  assert.equal(retentionDecision({sessionId:'assigned',completedAt:now-999999,lastSeen:0},now),'keep');
});
