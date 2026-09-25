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

let refillId=0;
const fillerRefill=({row,column})=>({id:`refill-${++refillId}-${row}-${column}`,word:'ZZ'});

const crossBoard=boardFromTiles({rows:3,columns:3,tiles:[
  {id:'x0',word:'X',row:0,column:0},
  {id:'take',word:'TAKE',row:0,column:1},
  {id:'x1',word:'X',row:0,column:2},
  {id:'make',word:'MAKE',row:1,column:0},
  {id:'a',word:'A',row:1,column:1},
  {id:'decision',word:'DECISION',row:1,column:2},
  {id:'x2',word:'X',row:2,column:0},
  {id:'break',word:'BREAK',row:2,column:1},
  {id:'x3',word:'X',row:2,column:2}
]});

const cascadeBoard=boardFromTiles({rows:4,columns:3,tiles:[
  {id:'take',word:'TAKE',row:0,column:0},
  {id:'x0',word:'X',row:0,column:1},
  {id:'y0',word:'Y',row:0,column:2},
  {id:'look',word:'LOOK',row:1,column:0},
  {id:'after',word:'AFTER',row:1,column:1},
  {id:'z1',word:'Z',row:1,column:2},
  {id:'a',word:'A',row:2,column:0},
  {id:'u2',word:'U',row:2,column:1},
  {id:'v2',word:'V',row:2,column:2},
  {id:'break',word:'BREAK',row:3,column:0},
  {id:'w3',word:'W',row:3,column:1},
  {id:'q3',word:'Q',row:3,column:2}
]});

test('global activation resolves every ready relationship in generation zero',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.equal(result.generations[0].matches.length,2);
  assert.deepEqual(new Set(result.generations[0].matches.map(m=>m.relationshipId)),new Set(['make-a-decision','take-a-break']));
});

test('shared crossing tile is removed once while both relationships score',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  const ids=result.generations[0].removedTileIds;
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(ids.length,5);
  assert.ok(result.generations[0].score.crossBonus>0);
});

test('column gravity creates TAKE A BREAK as automatic cascade generation one',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  assert.ok(result.generations.length>=2);
  assert.equal(result.generations[1].cascadeDepth,1);
  assert.ok(result.generations[1].matches.some(m=>m.relationshipId==='take-a-break'));
  assert.ok(occupancyMap(result.board).every(row=>row.every(Boolean)));
});

test('gravity never moves surviving tiles laterally',()=>{
  refillId=0;
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill});
  const original=new Map(cascadeBoard.tiles.map(tile=>[tile.id,tile.column]));
  for(const tile of result.board.tiles){
    if(original.has(tile.id))assert.equal(tile.column,original.get(tile.id));
  }
});

test('refill requests only top-of-column holes and returns a full board',()=>{
  refillId=0;
  const calls=[];
  const refillTile=args=>{
    calls.push({...args});
    return {id:`new-${calls.length}`,word:'ZZ'};
  };
  const result=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile});
  assert.ok(calls.length>0);
  assert.ok(calls.every(call=>Number.isInteger(call.row)&&Number.isInteger(call.column)));
  assert.ok(occupancyMap(result.board).every(row=>row.every(Boolean)));
  for(let column=0;column<result.board.columns;column++){
    const rows=calls.filter(call=>call.column===column).map(call=>call.row).sort((a,b)=>a-b);
    if(rows.length)assert.deepEqual(rows,Array.from({length:rows.length},(_,index)=>index));
  }
});

test('activation refuses to run when the board has no ready relationship',()=>{
  const board=boardFromTiles({rows:1,columns:2,tiles:[
    {id:'x',word:'ZZ',row:0,column:0},
    {id:'y',word:'YY',row:0,column:1}
  ]});
  assert.throws(()=>resolvePlayerActivation({board,bank,refillTile:fillerRefill}),/no ready relationships/i);
});

test('pathological refill cannot create an infinite cascade',()=>{
  const loopBank=createRelationshipBank([relation('loop',['LOOP','LOOP'],'fixed-expression',100,1)]);
  const board=boardFromTiles({rows:1,columns:2,tiles:[
    {id:'u1',word:'LOOP',row:0,column:0},
    {id:'u2',word:'LOOP',row:0,column:1}
  ]});
  let id=0;
  assert.throws(()=>resolvePlayerActivation({
    board,bank:loopBank,discoveredIds:new Set(),
    refillTile:()=>({id:'loop-'+(++id),word:'LOOP'}),
    maxCascadeDepth:2
  }),error=>error instanceof CascadeLimitError&&/cascade limit/i.test(error.message));
});


test('resolution generation preserves removal gravity and refill board stages for animation',()=>{
  refillId=0;
  const result=resolvePlayerActivation({
    board:cascadeBoard,bank,discoveredIds:new Set(),refillTile:fillerRefill
  });
  const generation=result.generations[0];
  assert.ok(generation.boardBefore,'missing boardBefore');
  assert.ok(generation.boardAfterRemoval,'missing boardAfterRemoval');
  assert.ok(generation.boardAfterGravity,'missing boardAfterGravity');
  assert.ok(generation.boardAfterRefill,'missing boardAfterRefill');

  const rowOf=(board,id)=>board.tiles.find(tile=>tile.id===id)?.row;
  assert.equal(rowOf(generation.boardBefore,'take'),0);
  assert.equal(rowOf(generation.boardAfterRemoval,'take'),0,'survivor must not move during removal');
  assert.equal(rowOf(generation.boardAfterGravity,'take'),1,'survivor must visibly fall one row');
  assert.equal(generation.boardAfterRemoval.tiles.some(tile=>tile.id==='look'),false);
  assert.equal(generation.boardAfterGravity.tiles.some(tile=>tile.id==='look'),false);
  assert.ok(generation.boardAfterRefill.tiles.some(tile=>tile.id.startsWith('refill-')),'refill snapshot must contain new tile ids');
  assert.equal(generation.boardAfterRefill.tiles.length,cascadeBoard.rows*cascadeBoard.columns);
});
