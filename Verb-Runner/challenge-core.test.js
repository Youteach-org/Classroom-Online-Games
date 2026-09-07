const test = require('node:test');
const assert = require('node:assert/strict');

function sequence(values){let i=0; return () => values[Math.min(i++, values.length-1)];}

test('challenge keeps fixed principal-parts order and blanks exactly one slot', () => {
  const bank = require('./verb-bank.js');
  const core = require('./challenge-core.js');
  const fly = bank.findVerb('fly');
  for (const [randomValue, expectedIndex] of [[0.0,0],[0.4,1],[0.9,2]]) {
    const challenge = core.createChallenge(fly, { random: () => randomValue, distractorCount: 2, bank: bank.VERBS });
    assert.equal(challenge.blankIndex, expectedIndex);
    assert.equal(challenge.slots.length, 3);
    assert.equal(challenge.slots.filter(x => x === null).length, 1);
    assert.equal(challenge.correctAnswer, fly.forms[expectedIndex]);
    assert.equal(challenge.labels.join('|'), 'BASE FORM|SIMPLE PAST|PAST PARTICIPLE');
  }
});

test('distractors are unique and never duplicate the accepted answer', () => {
  const bank = require('./verb-bank.js');
  const core = require('./challenge-core.js');
  const challenge = core.createChallenge(bank.findVerb('forgive'), {
    random: sequence([0.8,0.1,0.2,0.3,0.4]), distractorCount: 3, bank: bank.VERBS
  });
  assert.equal(challenge.distractors.length, 3);
  assert.equal(new Set(challenge.distractors).size, 3);
  assert.ok(!challenge.distractors.includes(challenge.correctAnswer));
});

test('same-form verbs still yield one correct answer object and distinct distractors', () => {
  const bank = require('./verb-bank.js');
  const core = require('./challenge-core.js');
  const challenge = core.createChallenge(bank.findVerb('cost'), { random: () => 0.95, distractorCount: 2, bank: bank.VERBS });
  assert.equal(challenge.blankIndex, 2);
  assert.equal(challenge.correctAnswer, 'cost');
  assert.ok(challenge.distractors.every(x => x !== 'cost'));
});

test('answer sequence places distractors before a single correct object', () => {
  const core = require('./challenge-core.js');
  const challenge = { correctAnswer:'flown', distractors:['flew','flied','flowed'] };
  const sequenceResult = core.buildAnswerSequence(challenge, { random: () => 0.4, distractorsBeforeCorrect: 2 });
  assert.equal(sequenceResult.length, 3);
  assert.equal(sequenceResult.filter(item => item.correct).length, 1);
  assert.equal(sequenceResult.at(-1).value, 'flown');
  assert.ok(sequenceResult.slice(0,-1).every(item => !item.correct));
});
