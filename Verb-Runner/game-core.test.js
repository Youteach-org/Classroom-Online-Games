const test = require('node:test');
const assert = require('node:assert/strict');

test('new Level 1 run starts with approved Medium prototype values', () => {
  const core = require('./game-core.js');
  assert.deepEqual(core.createRunState(12), {
    total:12, completed:0, correct:0, grammarErrors:0, obstacleHits:0,
    streak:0, bestStreak:0, momentum:75
  });
});

test('correct collection increases streak and momentum without exceeding 100', () => {
  const core = require('./game-core.js');
  const next = core.applyEvent({...core.createRunState(12), momentum:96}, 'correct');
  assert.equal(next.completed, 1);
  assert.equal(next.correct, 1);
  assert.equal(next.streak, 1);
  assert.equal(next.bestStreak, 1);
  assert.equal(next.momentum, 100);
});

test('grammar errors hurt momentum more than obstacle hits and reset streak', () => {
  const core = require('./game-core.js');
  const start = {...core.createRunState(12), momentum:80, streak:4, bestStreak:4};
  const grammar = core.applyEvent(start, 'grammar-error');
  const obstacle = core.applyEvent(start, 'obstacle-hit');
  assert.equal(grammar.momentum, 65);
  assert.equal(obstacle.momentum, 75);
  assert.equal(grammar.streak, 0);
  assert.equal(obstacle.streak, 4);
  assert.equal(grammar.grammarErrors, 1);
  assert.equal(obstacle.obstacleHits, 1);
});

test('result accuracy is based on grammar attempts, not physical obstacles', () => {
  const core = require('./game-core.js');
  const state = { ...core.createRunState(12), completed:12, correct:12, grammarErrors:3, obstacleHits:8, bestStreak:6, momentum:72 };
  const result = core.summarize(state, 65432);
  assert.equal(result.accuracy, 80);
  assert.equal(result.correctLabel, '12 / 15');
  assert.equal(result.obstacleHits, 8);
  assert.equal(result.timeMs, 65432);
});
