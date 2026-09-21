import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoard,
  areAdjacent,
  swapTiles,
  removeCells,
  collapseColumns,
  boardKey
} from '../engine/board.mjs';

test('only orthogonally adjacent cells are legal swaps',()=>{
  assert.equal(areAdjacent({row:1,col:1},{row:1,col:2}),true);
  assert.equal(areAdjacent({row:1,col:1},{row:2,col:1}),true);
  assert.equal(areAdjacent({row:1,col:1},{row:2,col:2}),false);
  assert.equal(areAdjacent({row:1,col:1},{row:1,col:3}),false);
});

test('swap is immutable and preserves tile identity',()=>{
  const board=createBoard([['LOOK','UP'],['AFTER','GO']]);
  const next=swapTiles(board,{row:0,col:1},{row:1,col:1});
  assert.equal(board[0][1].word,'UP');
  assert.equal(next[0][1].word,'GO');
  assert.equal(next[1][1].word,'UP');
  assert.equal(next[0][1].id,board[1][1].id);
});

test('invalid edge swap throws before a move can be charged',()=>{
  const board=createBoard([['LOOK','AFTER']]);
  assert.throws(
    ()=>swapTiles(board,{row:0,col:1},{row:0,col:2}),
    /outside board|invalid/i
  );
});

test('removing the same shared cell twice still clears one physical tile',()=>{
  const board=createBoard([['MAKE','A'],['TAKE','BREAK']]);
  const next=removeCells(board,[{row:0,col:1},{row:0,col:1}]);
  assert.equal(next[0][1],null);
  assert.equal(board[0][1].word,'A');
});

test('collapseColumns preserves falling tile ids and refills only new top gaps',()=>{
  const board=createBoard([
    ['TOP','A'],
    ['MID','B'],
    ['BOTTOM','C']
  ]);
  const topId=board[0][0].id;
  const bottomId=board[2][0].id;
  const removed=removeCells(board,[{row:1,col:0},{row:2,col:0}]);
  const calls=[];
  const next=collapseColumns(removed,({row,col})=>{
    calls.push({row,col});
    return {id:`new-${row}-${col}`,word:`NEW${row}${col}`};
  });
  assert.equal(next[2][0].id,topId);
  assert.equal(next[2][0].word,'TOP');
  assert.notEqual(next[2][0].id,bottomId);
  assert.deepEqual(calls,[{row:0,col:0},{row:1,col:0}]);
  assert.equal(next[0][0].id,'new-0-0');
  assert.equal(next[1][0].id,'new-1-0');
});

test('boardKey represents word arrangement rather than tile identity',()=>{
  const a=createBoard([['LOOK','AFTER']]);
  const b=createBoard([['LOOK','AFTER']],({row,col})=>`other-${row}-${col}`);
  const c=createBoard([['AFTER','LOOK']]);
  assert.equal(boardKey(a),boardKey(b));
  assert.notEqual(boardKey(a),boardKey(c));
});
