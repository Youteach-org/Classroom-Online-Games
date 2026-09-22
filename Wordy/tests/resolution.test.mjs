import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFromTiles, relation } from './helpers.mjs';
import { occupancyMap } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { resolvePlayerActivation, CascadeLimitError } from '../engine/resolution.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('take-a-break',['TAKE','A','BREAK'],'collocation',180,2),
  relation('make-a-decision',['MAKE','A','DECISION'],'collocation',180,2)
]);
const fillerWords={1:'ZZ',2:'ZZZ',3:'ZZZZZZ',4:'ZZZZZZZZZ'};
let refillId=0;
const fillerRefill=({span})=>({id:'refill-'+(++refillId),word:fillerWords[span]});

const crossBoard=boardFromTiles({rows:3,columns:12,tiles:[
  {id:'take',word:'TAKE',row:0,startColumn:1,span:2},
  {id:'make',word:'MAKE',row:1,startColumn:0,span:2},
  {id:'a',word:'A',row:1,startColumn:2,span:1},
  {id:'decision',word:'DECISION',row:1,startColumn:3,span:3},
  {id:'break',word:'BREAK',row:2,startColumn:1,span:2}
]});

const cascadeBoard=boardFromTiles({rows:4,columns:12,tiles:[
  {id:'take',word:'TAKE',row:0,startColumn:0,span:2},
  {id:'coffee',word:'COFFEE',row:0,startColumn:2,span:3},
  {id:'look',word:'LOOK',row:1,startColumn:0,span:2},
  {id:'after',word:'AFTER',row:1,startColumn:2,span:2},
  {id:'promise',word:'PROMISE',row:1,startColumn:4,span:3},
  {id:'i',word:'I',row:2,startColumn:0,span:1},
  {id:'a',word:'A',row:2,startColumn:1,span:1},
  {id:'break',word:'BREAK',row:3,startColumn:0,span:2}
]});

test('global activation resolves every ready relationship in generation zero',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.equal(result.generations[0].matches.length,2);
  assert.deepEqual(new Set(result.generations[0].matches.map(m=>m.relationshipId)),new Set(['make-a-decision','take-a-break']));
});

test('shared crossing tile is physically removed once while both relationships score',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  const ids=result.generations[0].removedTileIds;
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(ids.length,5);
  assert.ok(result.generations[0].score.crossBonus>0);
});

test('rigid gravity creates TAKE A BREAK as automatic cascade generation one',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.ok(result.generations.length>=2);
  assert.equal(result.generations[1].cascadeDepth,1);
  assert.ok(result.generations[1].matches.some(m=>m.relationshipId==='take-a-break'));
  assert.ok(occupancyMap(result.board).every(row=>row.every(Boolean)));
});

test('activation refuses to run when the board has no ready relationship',()=>{
  const board=boardFromTiles({rows:1,columns:12,tiles:[{id:'x',word:'ZZZ',row:0,startColumn:0,span:2}]});
  assert.throws(()=>resolvePlayerActivation({board,bank,refillTile:fillerRefill}),/no ready relationships/i);
});

test('pathological refill cannot create an infinite cascade',()=>{
  const loopBank=createRelationshipBank([relation('wide-loop',['WIDEWORDX','WIDEWORDX'],'fixed-expression',100,1)]);
  const board=boardFromTiles({rows:1,columns:12,tiles:[
    {id:'u1',word:'WIDEWORDX',row:0,startColumn:0,span:4},
    {id:'u2',word:'WIDEWORDX',row:0,startColumn:4,span:4}
  ]});
  let id=0;
  assert.throws(()=>resolvePlayerActivation({
    board,bank:loopBank,discoveredIds:new Set(),
    refillTile:({span})=>({id:'loop-'+(++id),word:span===4?'WIDEWORDX':fillerWords[span]}),
    maxCascadeDepth:2
  }),error=>error instanceof CascadeLimitError&&/cascade limit/i.test(error.message));
});
