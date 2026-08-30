const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../game-core.js');

test('new runs are zeroed', () => {
  assert.deepEqual(core.INITIAL_STATE, {
    meter: 0,
    streak: 0,
    storyIndex: 0,
    attempt: 1
  });
});

test('eight first-attempt correct answers fill the Support Meter and produce streak 8', () => {
  let state = {...core.INITIAL_STATE};
  for (let story = 0; story < 8; story++) state = core.applyAnswerResult(state, {correct:true, attempt:1});
  assert.equal(state.meter, 100);
  assert.equal(state.streak, 8);
});

test('a second-attempt correct answer gives half meter progress and does not restore the streak', () => {
  const result = core.applyAnswerResult({meter:25, streak:0}, {correct:true, attempt:2});
  assert.deepEqual(result, {meter:31.25, streak:0});
});

test('incorrect answers and revealed answers add no meter progress and reset the streak', () => {
  assert.deepEqual(core.applyAnswerResult({meter:25, streak:4}, {correct:false, attempt:1}), {meter:25, streak:0});
  assert.deepEqual(core.applyAnswerResult({meter:25, streak:0}, {correct:false, attempt:2}), {meter:25, streak:0});
});

test('assigned runs preserve the canonical story order', () => {
  assert.deepEqual(
    core.buildRun({ setNumber: 2, assigned: true }).map(story => story.id),
    [1, 2, 3, 4, 5, 6, 7, 8]
  );
});

test('free runs contain every target expression exactly once', () => {
  const run = core.buildRun({ setNumber: 1, assigned: false, random: () => 0.25 });
  assert.equal(run.length, 8);
  assert.equal(new Set(run.map(story => story.expression)).size, 8);
});

test('all stories expose one correct and two reviewed distractors', () => {
  for (const set of core.storySets) {
    for (const story of set) {
      assert.equal(story.options.length, 3, story.name);
      assert.equal(new Set(story.options).size, 3, story.name);
      assert.equal(story.options.filter(option => option === story.expression).length, 1, story.name);
      const confusingGroup = ['That must be tough.', 'I hear you.', 'Hang in there.'];
      assert.ok(story.options.filter(option => confusingGroup.includes(option)).length < 3, story.name);
    }
  }
});

test('join token parser accepts only URL-safe high-entropy tokens', () => {
  assert.equal(core.parseJoinToken('?join=abc_DEF-12345678901234567890'), 'abc_DEF-12345678901234567890');
  assert.equal(core.parseJoinToken('?join=%3Cscript%3E'), null);
  assert.equal(core.parseJoinToken(''), null);
});

test('unfinished runs warn before exit and completed runs do not', () => {
  assert.equal(core.shouldWarnBeforeExit({ started: true, completed: false }), true);
  assert.equal(core.shouldWarnBeforeExit({ started: true, completed: true }), false);
  assert.equal(core.shouldWarnBeforeExit({ started: false, completed: false }), false);
});

test('translation signals are detected without flagging the normal English page', () => {
  assert.equal(core.isTranslationDetected({className:'notranslate',hasGoogleBanner:false}),false);
  assert.equal(core.isTranslationDetected({className:'notranslate translated-ltr',hasGoogleBanner:false}),true);
  assert.equal(core.isTranslationDetected({className:'notranslate',hasGoogleBanner:true}),true);
});
