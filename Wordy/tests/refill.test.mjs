import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { boardFromTiles } from './helpers.mjs';
import {
  DEFAULT_REFILL_PROFILE,
  buildRelationshipBag,
  scoreRefillCandidate,
  chooseRefillWord
} from '../engine/refill.mjs';

const bank=createRelationshipBank([
  {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:120,difficulty:1},
  {id:'make-sense',category:'collocation',tokens:['MAKE','SENSE'],baseScore:120,difficulty:1},
  {id:'heavy-rain',category:'collocation',tokens:['HEAVY','RAIN'],baseScore:120,difficulty:1}
]);

const board=boardFromTiles({
  rows:3,columns:3,
  tiles:[
    {id:'a',word:'MAKE',row:0,column:0},
    {id:'b',word:'HEAVY',row:0,column:1},
    {id:'c',word:'RAIN',row:0,column:2},
    {id:'look',word:'LOOK',row:1,column:0},
    {id:'d',word:'MONEY',row:1,column:2},
    {id:'e',word:'SENSE',row:2,column:0},
    {id:'f',word:'TIME',row:2,column:1},
    {id:'g',word:'TRUTH',row:2,column:2}
  ]
});

test('relationship bag aggregates approved tokens and their connectivity weights',()=>{
  const bag=buildRelationshipBag(bank);
  const words=new Map(bag.map(entry=>[entry.word,entry.weight]));
  assert.ok(words.has('LOOK'));
  assert.ok(words.has('AFTER'));
  assert.ok(words.has('MAKE'));
  assert.ok([...words.values()].every(weight=>weight>0));
});

test('local refill score strongly prefers a word completing an approved relation',()=>{
  const after=scoreRefillCandidate({word:'AFTER',row:1,column:1,board,bank});
  const unrelated=scoreRefillCandidate({word:'MONEY',row:1,column:1,board,bank});
  assert.ok(after>unrelated,`expected AFTER ${after} > MONEY ${unrelated}`);
});

test('refill profile favors useful drops but still allows a distractor bucket',()=>{
  const bag=buildRelationshipBag(bank);
  const useful=chooseRefillWord({
    row:1,column:1,board,bank,bag,
    rng:()=>0.01,
    profile:DEFAULT_REFILL_PROFILE
  });
  const distractor=chooseRefillWord({
    row:1,column:1,board,bank,bag,
    rng:()=>0.99,
    profile:DEFAULT_REFILL_PROFILE
  });
  assert.equal(useful,'AFTER');
  assert.notEqual(distractor,'AFTER');
});

test('duplicate words receive a lower placement score',()=>{
  const duplicateBoard=boardFromTiles({
    rows:2,columns:3,
    tiles:[
      {id:'a',word:'LOOK',row:0,column:0},
      {id:'b',word:'LOOK',row:0,column:1},
      {id:'c',word:'LOOK',row:1,column:0}
    ]
  });
  const duplicate=scoreRefillCandidate({word:'LOOK',row:1,column:1,board:duplicateBoard,bank});
  const fresh=scoreRefillCandidate({word:'AFTER',row:1,column:1,board:duplicateBoard,bank});
  assert.ok(fresh>duplicate);
});
