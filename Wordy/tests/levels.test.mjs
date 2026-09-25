import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS, getLevel, isObjectiveComplete } from '../data/levels.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);

const EXPECTED={
  A:{moves:18,target:900,pool:12,minMoves:8},
  B:{moves:20,target:1100,pool:14,minMoves:8},
  C:{moves:22,target:1400,pool:16,minMoves:10},
  D:{moves:22,target:1500,pool:16,minMoves:10},
  E:{moves:24,target:1700,pool:18,minMoves:10},
  F:{moves:24,target:1900,pool:18,minMoves:10},
  G:{moves:26,target:2300,pool:20,minMoves:12}
};

test('A-G use generated 7x7 neighborhood profiles with long casual-puzzle rounds',()=>{
  assert.deepEqual(LEVELS.map(level=>level.id),['A','B','C','D','E','F','G']);
  for(const level of LEVELS){
    const expected=EXPECTED[level.id];
    assert.equal(level.generated,true,`level ${level.id} must be generated`);
    assert.equal(level.rows,7);
    assert.equal(level.columns,7);
    assert.equal(level.moves,expected.moves);
    assert.deepEqual(level.goal,{type:'score',target:expected.target});
    assert.equal(level.relationshipPoolSize,expected.pool);
    assert.equal(level.minScoringMoves,expected.minMoves);
    assert.ok(level.minProductiveRows>=4);
    assert.ok(level.minProductiveColumns>=4);
    assert.ok(level.minRelationshipCoverage>=0.85);
  }
});

test('required tutorial relationships exist in the validated relationship bank',()=>{
  for(const level of LEVELS){
    for(const id of level.requiredRelationshipIds??[]){
      assert.ok(bank.byId.has(id),`unknown required relation ${id} in level ${level.id}`);
    }
  }
});

test('early levels cannot end after one or two small relationship scores',()=>{
  assert.equal(isObjectiveComplete(getLevel('A'),{score:500}),false);
  assert.equal(isObjectiveComplete(getLevel('B'),{score:700}),false);
  assert.equal(isObjectiveComplete(getLevel('C'),{score:900}),false);
  assert.equal(isObjectiveComplete(getLevel('A'),{score:900}),true);
});

test('mixed play has the highest opportunity floor and round budget',()=>{
  const g=getLevel('G');
  assert.equal(g.minScoringMoves,12);
  assert.equal(g.moves,26);
  assert.equal(g.goal.target,2300);
  assert.equal(g.relationshipPoolSize,20);
});
