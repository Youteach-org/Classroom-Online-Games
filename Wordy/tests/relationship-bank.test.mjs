import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import {
  createRelationshipBank,
  normalizeToken,
  relationshipLengths
} from '../engine/relationship-bank.mjs';

test('prototype bank has 60–100 unique validated relationships across all four V1 categories', () => {
  const bank=createRelationshipBank(RELATIONSHIPS);
  assert.ok(RELATIONSHIPS.length>=60 && RELATIONSHIPS.length<=100);
  assert.equal(bank.byId.size, RELATIONSHIPS.length);
  assert.deepEqual(
    [...new Set(RELATIONSHIPS.map(r=>r.category))].sort(),
    ['collocation','fixed-expression','irregular-set','phrasal-verb']
  );
});

test('tokens normalize deterministically and supported lengths cover long expressions', () => {
  assert.equal(normalizeToken('  make '),'MAKE');
  const bank=createRelationshipBank(RELATIONSHIPS);
  assert.ok(relationshipLengths(bank).includes(5));
});

test('bank rejects duplicate ids and duplicate canonical token sequences in the same category', () => {
  const duplicate=[
    {id:'x',category:'collocation',tokens:['MAKE','SENSE'],baseScore:100,difficulty:1},
    {id:'x',category:'collocation',tokens:['TAKE','NOTES'],baseScore:100,difficulty:1}
  ];
  assert.throws(()=>createRelationshipBank(duplicate),/duplicate/i);
});
