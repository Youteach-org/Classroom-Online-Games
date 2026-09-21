import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { resolvePlayerActivation, CascadeLimitError } from '../engine/resolution.mjs';
import { relation } from './helpers.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('take-a-break',['TAKE','A','BREAK'],'collocation',180,2),
  relation('make-a-decision',['MAKE','A','DECISION'],'collocation',180,2)
]);

let refillId=0;
const fillerRefill=()=>({id:'refill-'+(++refillId),word:'ZZZ'});

const crossBoard=createBoard([
  ['X','TAKE','X'],
  ['MAKE','A','DECISION'],
  ['X','BREAK','X']
]);

const cascadeBoard=createBoard([
  ['WENT','TAKE','GONE'],
  ['LOOK','AFTER','ZZZ'],
  ['BROKE','A','CHOSEN'],
  ['WROTE','BREAK','SEEN']
]);

test('global activation resolves every currently ready relationship in generation zero',()=>{
  const result=resolvePlayerActivation({
    board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill
  });
  assert.equal(result.generations[0].matches.length,2);
  assert.deepEqual(
    new Set(result.generations[0].matches.map(m=>m.relationshipId)),
    new Set(['make-a-decision','take-a-break'])
  );
});

test('a tile shared by two crossing relationships is physically removed once but both relationships score',()=>{
  const first=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  const ids=first.generations[0].removedTileIds;
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(ids.length,5);
  assert.equal(first.generations[0].matches.length,2);
  assert.ok(first.generations[0].score.crossBonus>0);
});

test('gravity-created relationship becomes automatic cascade generation one',()=>{
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.ok(result.generations.length>=2);
  assert.equal(result.generations[1].cascadeDepth,1);
  assert.ok(result.generations[1].matches.some(m=>m.relationshipId==='take-a-break'));
});

test('newly discovered ids include both player-built and cascade-built relationships',()=>{
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.deepEqual(new Set(result.newlyDiscoveredIds),new Set(['look-after','take-a-break']));
});

test('activation refuses to run when the board has no ready relationships',()=>{
  const board=createBoard([['X','Y'],['Z','Q']]);
  assert.throws(
    ()=>resolvePlayerActivation({board,bank,discoveredIds:new Set(),refillTile:fillerRefill}),
    /no ready relationships/i
  );
});

test('pathological refill cannot create an infinite cascade',()=>{
  const loopBank=createRelationshipBank([
    relation('up-up',['UP','UP'],'fixed-expression',100,1)
  ]);
  const loopBoard=createBoard([['UP','UP']]);
  let id=0;
  assert.throws(
    ()=>resolvePlayerActivation({
      board:loopBoard,
      bank:loopBank,
      discoveredIds:new Set(),
      refillTile:()=>({id:'loop-'+(++id),word:'UP'}),
      maxCascadeDepth:3
    }),
    error=>error instanceof CascadeLimitError&&/cascade limit/i.test(error.message)
  );
});
