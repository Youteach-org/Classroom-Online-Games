const test = require('node:test');
const assert = require('node:assert/strict');

const bankPath = './verb-bank.js';

test('verb bank exposes assessment principal parts', () => {
  const { VERBS, findVerb } = require(bankPath);
  assert.ok(Array.isArray(VERBS));
  assert.ok(VERBS.length >= 35);
  assert.deepEqual(findVerb('fly').forms, ['fly','flew','flown']);
  assert.deepEqual(findVerb('forgive').forms, ['forgive','forgave','forgiven']);
  assert.deepEqual(findVerb('cost').forms, ['cost','cost','cost']);
  assert.deepEqual(findVerb('get').forms, ['get','got','gotten']);
});

test('verb bank has unique base forms and exactly three principal parts', () => {
  const { VERBS } = require(bankPath);
  assert.equal(new Set(VERBS.map(v => v.forms[0])).size, VERBS.length);
  for (const verb of VERBS) {
    assert.equal(verb.forms.length, 3, verb.forms[0]);
    for (const form of verb.forms) assert.ok(form && typeof form === 'string', verb.forms[0]);
  }
});

test('standard English variants are never used as wrong-answer decoys', () => {
  const { VERBS } = require(bankPath);
  const forbiddenDecoys = new Set(['burnt','dreamt','fitted','forbad']);
  for (const verb of VERBS) {
    for (const decoy of verb.decoys || []) assert.ok(!forbiddenDecoys.has(decoy), `${decoy} must not be marked wrong`);
  }
});
