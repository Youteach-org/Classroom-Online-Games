const test=require('node:test');
const assert=require('node:assert/strict');

const sentenceBank=require('./sentence-bank.js');

test('Sentence Run contains 150 challenges across 15 grammar categories',()=>{
  assert.equal(sentenceBank.SENTENCES.length,150);
  assert.equal(sentenceBank.GROUPS.length,15);
  for(const group of sentenceBank.GROUPS){
    assert.equal(
      sentenceBank.SENTENCES.filter(x=>x.group===group).length,
      10,
      'expected 10 items in '+group
    );
  }
});

test('the default 20-question round covers every grammar category',()=>{
  const round=sentenceBank.buildRound(20,{
    difficulty:'medium',
    distractorCount:3,
    random:()=>0.37
  });
  assert.equal(round.length,20);
  assert.equal(new Set(round.map(x=>x.id)).size,20);
  for(const group of sentenceBank.GROUPS){
    const count=round.filter(x=>x.group===group).length;
    assert.ok(count===1||count===2,group+' appears '+count+' times');
  }
});

test('every Sentence Run item has one blank and four real-form distractor choices',()=>{
  const banned=new Set([
    'beed','wased','beened','blowen','blowned','didone','feeld','fitten',
    'forbiden','forbiddened','cullen','culled','buey'
  ]);

  for(const item of sentenceBank.SENTENCES){
    assert.equal((item.text.match(/___/g)||[]).length,1,'blank count for '+item.id);
    assert.equal(item.distractors.length,4,'distractor pool for '+item.id);
    assert.equal(new Set(item.distractors).size,4,'duplicate distractor in '+item.id);

    const correct=new Set(item.correctAnswers.map(x=>x.toLowerCase()));
    for(const value of item.distractors){
      assert.ok(!correct.has(value.toLowerCase()),'distractor duplicates correct answer in '+item.id);
      assert.ok(!banned.has(value.toLowerCase()),'malformed Verb Hunt distractor leaked into '+item.id);
    }
  }
});

test('difficulty samples 2, 3 and 4 distractors without changing grammar coverage',()=>{
  for(const item of sentenceBank.SENTENCES){
    const easy=sentenceBank.createChallenge(item,{difficulty:'easy',distractorCount:2,random:()=>0.21});
    const medium=sentenceBank.createChallenge(item,{difficulty:'medium',distractorCount:3,random:()=>0.47});
    const hard=sentenceBank.createChallenge(item,{difficulty:'hard',distractorCount:4,random:()=>0.73});
    assert.equal(easy.distractors.length,2);
    assert.equal(medium.distractors.length,3);
    assert.equal(hard.distractors.length,4);
    assert.equal(easy.group,item.group);
    assert.equal(hard.grammarLabel,sentenceBank.GROUP_LABELS[item.group]);
  }
});

test('all accepted alternative answers are emitted as correct options',()=>{
  for(const item of sentenceBank.SENTENCES.filter(x=>x.correctAnswers.length>1)){
    const challenge=sentenceBank.createChallenge(item,{
      difficulty:'hard',
      distractorCount:4,
      random:()=>0.29
    });
    const sequence=sentenceBank.buildAnswerSequence(challenge,{
      distractorCount:4,
      random:()=>0.29
    });
    const correctValues=sequence.filter(x=>x.correct).map(x=>x.value).sort();
    assert.deepEqual(correctValues,[...challenge.correctAnswers].sort(),item.id);
  }
});

test('perfect and perfect-continuous groups test complete verb phrases',()=>{
  const groups=[
    'present-perfect','past-perfect','future-perfect',
    'present-perfect-continuous','past-perfect-continuous','future-perfect-continuous'
  ];
  for(const item of sentenceBank.SENTENCES.filter(x=>groups.includes(x.group))){
    const answer=item.correctAnswers[0].toLowerCase();
    if(item.group==='present-perfect')assert.match(answer,/^(have|has) /);
    if(item.group==='past-perfect')assert.match(answer,/^had /);
    if(item.group==='future-perfect')assert.match(answer,/^will have /);
    if(item.group==='present-perfect-continuous')assert.match(answer,/^(have|has) been /);
    if(item.group==='past-perfect-continuous')assert.match(answer,/^had been /);
    if(item.group==='future-perfect-continuous')assert.match(answer,/^will have been /);
  }
});
