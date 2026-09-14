const test=require('node:test');
const assert=require('node:assert/strict');

require('../Verb-Runner/verb-bank.js');
require('../Verb-Runner/challenge-core.js');
const sentenceBank=require('./sentence-bank.js');

test('Sentence Run contains 20 unique sentence challenges',()=>{
  assert.equal(sentenceBank.SENTENCES.length,20);
  assert.equal(new Set(sentenceBank.SENTENCES.map(x=>x.base)).size,20);
  assert.equal(sentenceBank.SENTENCES.filter(x=>x.targetIndex===0).length,6);
  assert.equal(sentenceBank.SENTENCES.filter(x=>x.targetIndex===1).length,8);
  assert.equal(sentenceBank.SENTENCES.filter(x=>x.targetIndex===2).length,6);
});

test('every Sentence Run challenge resolves to the requested principal part',()=>{
  for(const item of sentenceBank.SENTENCES){
    const verb=globalThis.VerbRunnerBank.findVerb(item.base);
    assert.ok(verb,'missing verb: '+item.base);
    const challenge=sentenceBank.createChallenge(item,{
      difficulty:'medium',
      distractorCount:3,
      random:()=>0.42
    });
    assert.equal(challenge.level,2);
    assert.equal(challenge.mode,'sentence-run');
    assert.equal(challenge.correctAnswer,String(verb.forms[item.targetIndex]).toLowerCase());
    assert.equal(challenge.distractors.length,3);
    assert.ok(!challenge.distractors.includes(challenge.correctAnswer));
    assert.ok(!challenge.distractors.includes('buey'));
    assert.match(challenge.text,/___/);
  }
});

test('base-form Sentence Run distractors stay out of past/participle forms',()=>{
  for(const item of sentenceBank.SENTENCES.filter(x=>x.targetIndex===0)){
    const verb=globalThis.VerbRunnerBank.findVerb(item.base);
    const challenge=sentenceBank.createChallenge(item,{
      difficulty:'hard',
      distractorCount:4,
      random:()=>0.31
    });
    for(const value of challenge.distractors){
      assert.notEqual(value,verb.forms[1]);
      assert.notEqual(value,verb.forms[2]);
    }
  }
});
