const test=require('node:test');
const assert=require('node:assert/strict');

const sentenceBank=require('./sentence-bank.js');

test('Sentence Run contains 60 challenges, 20 in each grammar group',()=>{
  assert.equal(sentenceBank.SENTENCES.length,60);
  for(const group of sentenceBank.GROUPS){
    assert.equal(sentenceBank.SENTENCES.filter(x=>x.group===group).length,20);
  }
});

test('all Sentence Run options are explicit real-form choices with no correct/distractor overlap',()=>{
  const banned=new Set([
    'beed','wased','beened','blowen','blowned','didone','feeld','fitten',
    'forbiden','forbiddened','cullen','culled','buey'
  ]);

  for(const item of sentenceBank.SENTENCES){
    const challenge=sentenceBank.createChallenge(item,{difficulty:'hard',distractorCount:4});
    assert.equal(challenge.level,2);
    assert.equal(challenge.mode,'sentence-run');
    assert.match(challenge.text,/___/);
    assert.ok(challenge.correctAnswers.length>=1);

    const correct=new Set(challenge.correctAnswers);
    for(const value of challenge.distractors){
      assert.ok(!correct.has(value),'distractor duplicates a correct answer: '+value);
      assert.ok(!banned.has(value),'old malformed Verb Hunt distractor leaked into Sentence Run: '+value);
    }
  }
});

test('a 20-question round is balanced across base, past and participle',()=>{
  const round=sentenceBank.buildRound(20,{difficulty:'medium',distractorCount:3,random:()=>0.37});
  assert.equal(round.length,20);
  const counts=sentenceBank.GROUPS.map(group=>round.filter(x=>x.group===group).length).sort((a,b)=>a-b);
  assert.deepEqual(counts,[6,7,7]);
  assert.equal(new Set(round.map(x=>x.id)).size,20);
});

test('valid alternative forms are all offered as correct choices',()=>{
  const samples=['p16','p17','p18','p19','p20','pp13','pp14','pp15','pp16','pp17','pp18'];
  for(const id of samples){
    const item=sentenceBank.SENTENCES.find(x=>x.id===id);
    assert.ok(item,'missing multi-answer item '+id);
    const challenge=sentenceBank.createChallenge(item,{difficulty:'hard',distractorCount:4});
    const sequence=sentenceBank.buildAnswerSequence(challenge,{distractorCount:4,random:()=>0.29});
    const correctValues=sequence.filter(x=>x.correct).map(x=>x.value).sort();
    assert.deepEqual(correctValues,[...challenge.correctAnswers].sort());
  }
});


test('every sentence keeps a four-option contextual distractor pool and difficulty samples it correctly',()=>{
  for(const item of sentenceBank.SENTENCES){
    assert.equal(item.distractors.length,4,'expected four distractors for '+item.id);
    assert.equal(new Set(item.distractors).size,4,'duplicate distractor in '+item.id);

    const easy=sentenceBank.createChallenge(item,{difficulty:'easy',distractorCount:2,random:()=>0.21});
    const medium=sentenceBank.createChallenge(item,{difficulty:'medium',distractorCount:3,random:()=>0.47});
    const hard=sentenceBank.createChallenge(item,{difficulty:'hard',distractorCount:4,random:()=>0.73});

    assert.equal(easy.distractors.length,2);
    assert.equal(medium.distractors.length,3);
    assert.equal(hard.distractors.length,4);
  }
});
