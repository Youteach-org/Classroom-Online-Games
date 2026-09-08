const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const challenge=require('./challenge-core.js');

function sampleChallenge(){
  return {
    correctAnswer:'flown',
    distractors:['flied','flyed','flewn','flowed','flowned']
  };
}

test('medium chains put three or four distractors before the correct form',()=>{
  const three=challenge.buildMediumSequence(sampleChallenge(),{random:()=>0});
  const four=challenge.buildMediumSequence(sampleChallenge(),{random:()=>0.999});
  assert.equal(three.filter(item=>!item.correct).length,3);
  assert.equal(four.filter(item=>!item.correct).length,4);
  assert.equal(three.at(-1).value,'flown');
  assert.equal(four.at(-1).value,'flown');
});

test('gameplay launches an answer chain with sub-second spacing instead of waiting for each word to finish',()=>{
  const app=read('app.js');
  assert.match(app,/ANSWER_SPACING_MS\s*=\s*(?:7\d\d|8\d\d|9\d\d)/);
  assert.match(app,/launchAnswerChain\s*\(/);
  assert.match(app,/buildMediumSequence\s*\(/);
});

test('runner scene supports several sequential answer panels on the road at once',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/this\.answers\s*=\s*\[\]/);
  assert.match(phaser,/clearAnswers\s*\(\)/);
  assert.match(phaser,/for\s*\(const\s+answer\s+of\s+\[\.\.\.this\.answers\]\)/);
});

test('enhanced desktop world includes dedicated depth-detail layers',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/drawCoastalDetails\s*\(/);
  assert.match(phaser,/drawRoadDetails\s*\(/);
  assert.match(phaser,/drawStreetLights\s*\(/);
});
