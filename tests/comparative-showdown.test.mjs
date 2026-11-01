import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const src=readFileSync(new URL('../Comparative-Showdown/game.js',import.meta.url),'utf8');
const end=src.indexOf('const getDeck=');
if(end<0)throw new Error('Cannot find Comparative Showdown data boundary');
const context={location:{search:''},URLSearchParams};
vm.runInNewContext(src.slice(0,end)+'\nglobalThis.catalog={questions,QUICK};',context,{timeout:3000});
const {questions,QUICK}=context.catalog;

test('full journey has exactly 35 missions across required grammar skills',()=>{
  assert.equal(questions.length,35);
  assert.equal(questions.slice(0,8).filter(q=>q.kind==='form').length,8);
  assert.equal(questions.slice(8,13).filter(q=>q.mission==='COMPARISON ARENA').length,5);
  assert.equal(questions.slice(13,23).filter(q=>q.mission==='MIRROR CHALLENGE').length,10);
  assert.equal(questions.slice(23,27).filter(q=>q.mission==='ADVERB LAB').length,4);
  assert.equal(questions.slice(27).filter(q=>q.mission==='FASHION FINALS').length,8);
});
test('quick match has 14 valid non-repeating challenges',()=>{
  assert.equal(QUICK.length,14);
  assert.equal(new Set(QUICK).size,14);
  QUICK.forEach(i=>assert.ok(i>=0&&i<questions.length));
});
test('answers have correct irregular forms and equivalences',()=>{
  assert.equal(questions[0].answer,'friendlier');
  assert.equal(questions[1].answer,'bigger');
  assert.equal(questions[7].answer,'hotter');
  assert.equal(questions[25].answer,'well');
  assert.ok(questions.some(q=>q.answer.includes('isn\'t as exciting as')));
  assert.ok(questions.some(q=>q.answer.includes('less exciting than')));
  assert.ok(questions.some(q=>q.answer.includes('explained her designs the best')));
  assert.ok(questions.every(q=>!/(more well|most well)/.test(q.answer)));
});
test('game includes a one-seat conditional RTDB join and teacher monitor',()=>{
  assert.match(src,/if-match/i);
  assert.match(src,/room\.student\.id!==remembered/);
  assert.match(src,/function monitor\(/);
  assert.match(src,/function results\(/);
});
