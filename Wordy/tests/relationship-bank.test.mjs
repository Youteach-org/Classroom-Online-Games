import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import {
  createRelationshipBank,
  normalizeToken,
  canonicalTileToken,
  tileTokenMatches,
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


test('indefinite article uses canonical A tile while preserving AN as relationship surface token',()=>{
  assert.equal(canonicalTileToken('A'),'A');
  assert.equal(canonicalTileToken('AN'),'A');
  assert.equal(tileTokenMatches('A','AN'),true);
  assert.equal(tileTokenMatches('A','A'),true);
  assert.equal(tileTokenMatches('AN','A'),true);
  assert.equal(tileTokenMatches('THE','AN'),false);

  const relation=RELATIONSHIPS.find(item=>item.id==='collocation:have-an-opinion');
  assert.ok(relation,'HAVE AN OPINION must exist in curated bank');
  assert.deepEqual(relation.tokens,['HAVE','AN','OPINION']);
});


test('KEEP UP and KEEP IN are curated phrasal verbs',()=>{
  const bank=createRelationshipBank(RELATIONSHIPS);
  const keepUp=bank.byId.get('phrasal-verb:keep-up');
  const keepIn=bank.byId.get('phrasal-verb:keep-in');
  assert.ok(keepUp,'KEEP UP must exist in curated bank');
  assert.ok(keepIn,'KEEP IN must exist in curated bank');
  assert.equal(keepUp.category,'phrasal-verb');
  assert.equal(keepIn.category,'phrasal-verb');
  assert.deepEqual(keepUp.tokens,['KEEP','UP']);
  assert.deepEqual(keepIn.tokens,['KEEP','IN']);
});
