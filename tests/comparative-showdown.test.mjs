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

test('student homepage contains join UI but no room creation or monitor controls',()=>{
  const html=readFileSync(new URL('../Comparative-Showdown/index.html',import.meta.url),'utf8');
  assert.match(html,/id="join"/);
  assert.match(html,/id="playerName"/);
  assert.doesNotMatch(html,/id="create"/);
  assert.doesNotMatch(html,/id="host"/);
  assert.doesNotMatch(html,/id="start"/);
  assert.doesNotMatch(html,/id="copyHost"/);
  assert.doesNotMatch(html,/CREATE LIVE ROOM/);
});
test('teacher monitor is its own page, allowing room creation and teacher gameplay but never student join',()=>{
  const html=readFileSync(new URL('../Comparative-Showdown/teacher/index.html',import.meta.url),'utf8');
  assert.match(html,/id="create"/);
  assert.match(html,/id="host"/);
  assert.match(html,/id="start"/);
  assert.match(html,/id="reveal"/);
  assert.match(html,/id="activity"/);
  assert.match(html,/src="\.\.\/game\.js"/);
  assert.match(html,/href="\.\.\/styles\.css"/);
  assert.doesNotMatch(html,/id="join"/);
  assert.doesNotMatch(html,/id="playerName"/);
});
test('student and teacher access are listed in their respective COG menus',()=>{
  const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const monitors=readFileSync(new URL('../teacher/index.html',import.meta.url),'utf8');
  assert.match(home,/href="\/Comparative-Showdown\/"/);
  assert.match(monitors,/href="\/Comparative-Showdown\/teacher\/"/);
});
test('teacher link uses monitor path, student link does not expose the monitor token',()=>{
  assert.match(src,/new URL\("\/Comparative-Showdown\/teacher\/",location.origin\)/);
  assert.match(src,/const u=new URL\(location.origin\+"\/Comparative-Showdown\/"\)/);
  assert.match(src,/if\(!isTeacherPage\)return/);
  assert.match(src,/if\(isTeacherPage\)return/);
});

test('student onboarding shows single join action and clear instructions',()=>{
  const student=readFileSync(new URL('../Comparative-Showdown/index.html',import.meta.url),'utf8');
  assert.match(student,/Join your game/);
  assert.match(student,/ROOM CODE/);
  assert.match(student,/id="join"/);
  assert.match(student,/You only need the code and your name/);
  assert.match(student,/Your teacher controls when the correct answer appears/);
  assert.doesNotMatch(student,/id="create"/);
});
test('teacher setup explains session size and rounds in Spanish',()=>{
  const teacher=readFileSync(new URL('../Comparative-Showdown/teacher/index.html',import.meta.url),'utf8');
  assert.match(teacher,/PASO 1 DE 3/);
  assert.match(teacher,/PASO 2 DE 3/);
  assert.match(teacher,/PASO 3 DE 3/);
  assert.match(teacher,/Partida corta · 14 preguntas/);
  assert.match(teacher,/Partida completa · 35 preguntas/);
  assert.match(teacher,/id="monitorProgress"/);
  assert.match(teacher,/id="copyJoin"/);
  assert.match(teacher,/id="reveal"/);
  assert.match(teacher,/TU TURNO · PROFESOR/);
});
test('new visual system uses neutral panels and explicit high contrast',()=>{
  const styles=readFileSync(new URL('../Comparative-Showdown/styles.css',import.meta.url),'utf8');
  assert.match(styles,/--bg:#f3f5f8/);
  assert.match(styles,/--ink:#172136/);
  assert.match(styles,/--accent:#2054c7/);
  assert.doesNotMatch(styles,/radial-gradient/);
  assert.match(styles,/max-width:710px/);
});
test('word choices remain usable after a wrong attempt',()=>{
  assert.match(src,/btn\.disabled=locked\|\|state\.picked\.includes\(i\)/);
});
