const test=require('node:test');
const assert=require('node:assert/strict');
const bank=require('./verb-bank.js');
const core=require('./challenge-core.js');

function seq(values){let i=0;return()=>values[Math.min(i++,values.length-1)];}

test('challenge blanks one principal part and keeps same-verb distractors',()=>{
  const fly=bank.findVerb('fly');
  const ch=core.createChallenge(fly,{random:()=>0.9,difficulty:'hard'});
  assert.equal(ch.blankIndex,2);
  assert.equal(ch.correctAnswer,'flown');
  assert.equal(ch.slots.filter(v=>v===null).length,1);
  assert.ok(ch.distractors.includes('flyed')||ch.distractors.includes('flied')||ch.distractors.includes('flowed'));
  assert.ok(!ch.distractors.includes('went'));
});

test('irregular verbs include regularized -ed traps',()=>{
  const bring=bank.findVerb('bring');
  const ch=core.createChallenge(bring,{random:()=>0.4,difficulty:'medium'});
  assert.equal(ch.blankIndex,1);
  assert.ok(ch.distractors.includes('bringed'));
});

test('regular verbs include fake-irregular and spelling traps',()=>{
  const study=bank.findVerb('study');
  const ch=core.createChallenge(study,{random:()=>0.4,difficulty:'hard'});
  assert.equal(ch.blankIndex,1);
  assert.ok(ch.distractors.some(v=>['stode','studen','stud','studyed','studid'].includes(v)));
});

test('difficulty changes option quality/count, not answer order timing',()=>{
  const work=bank.findVerb('work');
  const easy=core.createChallenge(work,{random:()=>0.4,difficulty:'easy'});
  const hard=core.createChallenge(work,{random:()=>0.4,difficulty:'hard'});
  assert.equal(easy.distractors.length,2);
  assert.equal(hard.distractors.length,4);
});

test('correct answer is shuffled and is not forced to the end',()=>{
  const ch={correctAnswer:'flown',distractors:['flyed','flied','flowed']};
  const first=core.buildAnswerSequence(ch,{random:seq([0,0,0]),distractorCount:3});
  assert.equal(first.filter(x=>x.correct).length,1);
  assert.notEqual(first.at(-1).correct,true);
});
