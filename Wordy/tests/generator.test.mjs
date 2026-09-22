import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { getLevel } from '../data/levels.mjs';
import { enumerateSwaps, findImmediateScoringMoves, hasViablePlay, createControlledBoard, recoverDeadBoard } from '../engine/generator.mjs';
import { boardFromTiles, seeded } from './helpers.mjs';

const bank=createRelationshipBank([
  {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:120,difficulty:1},
  {id:'make-sense',category:'collocation',tokens:['MAKE','SENSE'],baseScore:120,difficulty:1},
  {id:'take-notes',category:'collocation',tokens:['TAKE','NOTES'],baseScore:120,difficulty:1},
  {id:'pay-attention',category:'collocation',tokens:['PAY','ATTENTION'],baseScore:120,difficulty:1},
  {id:'give-up',category:'phrasal-verb',tokens:['GIVE','UP'],baseScore:120,difficulty:1}
]);

const fallbackBoard=createBoard(getLevel('G').boardRows);
const deadRows=Array.from({length:7},()=>['ZZZ','QQQ','XXX','VVV','NNN','MMM']);
const deadBoard=createBoard(deadRows);

test('enumerateSwaps includes horizontal touching pairs and only exact-footprint vertical pairs',()=>{
  const board=boardFromTiles({rows:2,columns:12,tiles:[
    {id:'a',word:'A',row:0,startColumn:0,span:1},
    {id:'look',word:'LOOK',row:0,startColumn:1,span:2},
    {id:'after',word:'AFTER',row:1,startColumn:1,span:2},
    {id:'small',word:'OF',row:1,startColumn:0,span:1}
  ]});
  const keys=enumerateSwaps(board).map(s=>[s.fromTileId,s.toTileId].sort().join('|'));
  assert.ok(keys.includes('a|look'));
  assert.ok(keys.includes('after|look'));
  assert.equal(keys.includes('a|small'),true);
  assert.equal(keys.includes('look|small'),false);
});

test('a swap that only preserves an already-ready relationship is not productive',()=>{
  const readyBank=createRelationshipBank([{id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:100,difficulty:1}]);
  const board=boardFromTiles({rows:1,columns:12,tiles:[
    {id:'look',word:'LOOK',row:0,startColumn:0,span:2},
    {id:'after',word:'AFTER',row:0,startColumn:2,span:2},
    {id:'x',word:'XXX',row:0,startColumn:4,span:2},
    {id:'y',word:'YYY',row:0,startColumn:6,span:2}
  ]});
  const moves=findImmediateScoringMoves(board,readyBank);
  assert.equal(moves.some(move=>new Set([move.swap.fromTileId,move.swap.toTileId]).has('x')&&new Set([move.swap.fromTileId,move.swap.toTileId]).has('y')),false);
});

test('level G fallback exposes at least four productive swaps across at least three rows',()=>{
  const moves=findImmediateScoringMoves(fallbackBoard,bank);
  const rows=new Set(moves.flatMap(move=>{
    const ids=[move.swap.fromTileId,move.swap.toTileId];
    return ids.map(id=>fallbackBoard.tiles.find(tile=>tile.id===id).row);
  }));
  assert.ok(moves.length>=4,`expected >=4 productive swaps, got ${moves.length}`);
  assert.ok(rows.size>=3,`expected >=3 productive rows, got ${rows.size}`);
});

test('controlled board satisfies minimum productivity and returns 12-column geometry',()=>{
  const board=createControlledBoard({bank,rows:7,columns:12,rng:seeded(7),minScoringMoves:4,minProductiveRows:3,fallbackBoard});
  assert.equal(board.rows,7);
  assert.equal(board.columns,12);
  assert.ok(findImmediateScoringMoves(board,bank).length>=4);
});

test('dead board recovery returns a productive replacement',()=>{
  const result=recoverDeadBoard({board:deadBoard,bank,rng:seeded(4),fallbackBoard});
  assert.equal(result.reset,true);
  assert.equal(result.board.rows,7);
  assert.equal(result.board.columns,12);
  assert.equal(hasViablePlay(result.board,bank),true);
});

test('live board recovery leaves current board unchanged',()=>{
  const result=recoverDeadBoard({board:fallbackBoard,bank,rng:seeded(4),fallbackBoard});
  assert.equal(result.reset,false);
  assert.equal(result.board,fallbackBoard);
});
