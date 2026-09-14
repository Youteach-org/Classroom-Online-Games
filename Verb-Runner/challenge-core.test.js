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

test('vowel-focused spelling traps mutate vowels without relying on doubled consonants',()=>{
  const muts=core.vowelMutations('brought');
  assert.ok(muts.some(v=>/braught|broug.ht|broight|brought/.test(v)||v!== 'brought'));
  assert.ok(muts.every(v=>!/(.)\1\1/.test(v)));
});

test('hard irregular distractors include plausible vowel changes',()=>{
  const fly=bank.findVerb('fly');
  const ch=core.createChallenge(fly,{random:()=>0.9,difficulty:'hard'});
  assert.ok(ch.distractors.some(v=>/[aeiou]/.test(v)));
});

test('base-form challenges use only base-shaped vowel distractors',()=>{
  const drink=bank.findVerb('drink');
  const ch=core.createChallenge(drink,{random:()=>0.05,difficulty:'hard'});
  assert.equal(ch.blankIndex,0);
  assert.equal(ch.correctAnswer,'drink');
  assert.equal(ch.distractors.length,4);
  assert.ok(ch.distractors.every(v=>!['drank','drunk','drinked'].includes(v)));
  assert.ok(ch.distractors.every(v=>core.consonantSkeleton(v)===core.consonantSkeleton('drink')));
});

test('base-form challenges for y verbs still have enough present-shaped distractors',()=>{
  const fly=bank.findVerb('fly');
  const ch=core.createChallenge(fly,{random:()=>0.05,difficulty:'hard'});
  assert.equal(ch.blankIndex,0);
  assert.equal(ch.distractors.length,4);
  assert.ok(ch.distractors.every(v=>!['flew','flown','flyed','flied'].includes(v)));
});

test('past participle challenges include the distinct simple-past form as a distractor',()=>{
  const freeze=bank.findVerb('freeze');
  const distractors=core.chooseDistractors(freeze,2,'medium',()=>0.42,3);
  assert.ok(distractors.includes('froze'));
  assert.ok(!distractors.includes('frozen'));
});

test('simple past challenges include the distinct participle form as a distractor',()=>{
  const begin=bank.findVerb('begin');
  const distractors=core.chooseDistractors(begin,1,'hard',()=>0.42,4);
  assert.ok(distractors.includes('begun'));
  assert.ok(!distractors.includes('began'));
});


test('non-base challenges prioritize all distinct real principal forms before artificial traps',()=>{
  const freeze=bank.findVerb('freeze');
  const distractors=core.chooseDistractors(freeze,2,'hard',()=>0.42,4);
  assert.equal(distractors[0],'froze');
  assert.equal(distractors[1],'freeze');
  assert.ok(!distractors.includes('frozen'));
});

test('requested distractor cleanup is preserved',()=>{
  assert.ok(bank.findVerb('blow').decoys.includes('blowen'));
  assert.ok(!bank.findVerb('blow').decoys.includes('blewen'));

  const doVerb=bank.findVerb('do');
  assert.ok(doVerb.decoys.includes('does'));
  assert.ok(!doVerb.decoys.includes('didone'));

  const feel=bank.findVerb('feel');
  assert.ok(feel.decoys.includes('fell'));
  assert.ok(feel.decoys.includes('fallen'));
  assert.ok(!feel.decoys.includes('feeld'));

  assert.ok(bank.findVerb('fall').decoys.includes('felt'));

  const fit=bank.findVerb('fit');
  assert.deepEqual(fit.decoys,['fitted','fitten','fet']);

  const forbid=bank.findVerb('forbid');
  assert.ok(forbid.decoys.includes('forbiden'));
  assert.ok(!forbid.decoys.includes('forbiddened'));

  assert.ok(!bank.findVerb('ask').irregularDecoys.includes('osk'));
  assert.ok(!bank.findVerb('call').irregularDecoys.includes('coll'));
  assert.ok(!bank.findVerb('call').irregularDecoys.includes('culled'));
  assert.ok(!bank.findVerb('clean').irregularDecoys.includes('clan'));
});

test('blocked Spanish distractor buey can never be returned',()=>{
  const buy=bank.findVerb('buy');
  for(let blankIndex=0;blankIndex<3;blankIndex++){
    const distractors=core.chooseDistractors(buy,blankIndex,'hard',()=>0.42,6);
    assert.ok(!distractors.includes('buey'));
  }
});
