import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBoard,
  cloneBoard,
  tileById,
  tilesInRow,
  occupancyMap,
  areSwapNeighbors,
  neighborForDirection,
  swapTiles,
  removeTiles,
  settleGravity,
  emptyCellsByColumn,
  boardKey
} from '../engine/board.mjs';
import { boardFromTiles } from './helpers.mjs';

test('every tile occupies exactly one row/column cell',()=>{
  const board=createBoard([
    ['LOOK','AFTER','GO'],
    ['MAKE','A','DECISION']
  ]);
  assert.equal(board.rows,2);
  assert.equal(board.columns,3);
  assert.deepEqual(
    board.tiles.map(({word,row,column})=>({word,row,column})),
    [
      {word:'LOOK',row:0,column:0},
      {word:'AFTER',row:0,column:1},
      {word:'GO',row:0,column:2},
      {word:'MAKE',row:1,column:0},
      {word:'A',row:1,column:1},
      {word:'DECISION',row:1,column:2}
    ]
  );
  assert.ok(board.tiles.every(tile=>!('span' in tile)&&!('startColumn' in tile)));
});

test('createBoard rejects ragged rows',()=>{
  assert.throws(
    ()=>createBoard([['LOOK','AFTER'],['MAKE','A','DECISION']]),
    /same number of columns/i
  );
});

test('occupancyMap maps exactly one tile id per occupied cell',()=>{
  const board=createBoard([
    ['LOOK','AFTER'],
    ['MAKE','DECISION']
  ]);
  const map=occupancyMap(board);
  assert.equal(map.length,2);
  assert.equal(map[0].length,2);
  assert.equal(map[0][0],board.tiles.find(t=>t.word==='LOOK').id);
  assert.equal(map[1][1],board.tiles.find(t=>t.word==='DECISION').id);
});

test('interior tile has four conventional orthogonal neighbors',()=>{
  const board=createBoard([
    ['A','B','C'],
    ['D','E','F'],
    ['G','H','I']
  ]);
  const e=board.tiles.find(tile=>tile.word==='E');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'left')).word,'D');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'right')).word,'F');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'up')).word,'B');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'down')).word,'H');
});

test('edge tile exposes only real neighbors',()=>{
  const board=createBoard([
    ['A','B'],
    ['C','D']
  ]);
  const a=board.tiles.find(tile=>tile.word==='A');
  assert.equal(neighborForDirection(board,a.id,'left'),null);
  assert.equal(neighborForDirection(board,a.id,'up'),null);
  assert.equal(tileById(board,neighborForDirection(board,a.id,'right')).word,'B');
  assert.equal(tileById(board,neighborForDirection(board,a.id,'down')).word,'C');
});

test('all orthogonally adjacent tiles can swap regardless of word length',()=>{
  const board=createBoard([
    ['A','ATTENTION'],
    ['LOOK','DIFFERENCE']
  ]);
  const a=board.tiles.find(t=>t.word==='A');
  const attention=board.tiles.find(t=>t.word==='ATTENTION');
  const look=board.tiles.find(t=>t.word==='LOOK');
  assert.equal(areSwapNeighbors(board,a.id,attention.id),true);
  assert.equal(areSwapNeighbors(board,a.id,look.id),true);
  const horizontal=swapTiles(board,a.id,attention.id);
  assert.equal(tileById(horizontal,attention.id).column,0);
  assert.equal(tileById(horizontal,a.id).column,1);
  const vertical=swapTiles(board,a.id,look.id);
  assert.equal(tileById(vertical,look.id).row,0);
  assert.equal(tileById(vertical,a.id).row,1);
});

test('removeTiles is immutable and removes duplicate ids once',()=>{
  const board=createBoard([['LOOK','AFTER'],['MAKE','DECISION']]);
  const look=board.tiles.find(t=>t.word==='LOOK');
  const next=removeTiles(board,[look.id,look.id]);
  assert.ok(tileById(board,look.id));
  assert.equal(tileById(next,look.id),null);
  assert.equal(next.tiles.length,board.tiles.length-1);
});

test('gravity bottom-packs each column and never changes column',()=>{
  const board=createBoard([
    ['A','B'],
    ['C','D'],
    ['E','F']
  ]);
  const removed=removeTiles(board,[
    board.tiles.find(t=>t.word==='C').id,
    board.tiles.find(t=>t.word==='F').id
  ]);
  const settled=settleGravity(removed);
  assert.deepEqual(
    settled.tiles.filter(t=>t.column===0).sort((a,b)=>a.row-b.row).map(t=>[t.word,t.row,t.column]),
    [['A',1,0],['E',2,0]]
  );
  assert.deepEqual(
    settled.tiles.filter(t=>t.column===1).sort((a,b)=>a.row-b.row).map(t=>[t.word,t.row,t.column]),
    [['B',1,1],['D',2,1]]
  );
});

test('emptyCellsByColumn reports only top holes after gravity',()=>{
  const board=boardFromTiles({
    rows:4,columns:2,
    tiles:[
      {id:'a',word:'A',row:2,column:0},
      {id:'b',word:'B',row:3,column:0},
      {id:'c',word:'C',row:1,column:1},
      {id:'d',word:'D',row:2,column:1},
      {id:'e',word:'E',row:3,column:1}
    ]
  });
  assert.deepEqual(emptyCellsByColumn(board),[
    {row:0,column:0},
    {row:1,column:0},
    {row:0,column:1}
  ]);
});

test('cloneBoard and tilesInRow expose copies in column order',()=>{
  const board=createBoard([['LOOK','AFTER','GO']]);
  const copy=cloneBoard(board);
  copy.tiles[0].word='CHANGED';
  assert.equal(board.tiles[0].word,'LOOK');
  assert.deepEqual(tilesInRow(board,0).map(t=>t.word),['LOOK','AFTER','GO']);
});

test('boardKey represents word arrangement rather than tile identity',()=>{
  const words=[['LOOK','AFTER'],['MAKE','DECISION']];
  const a=createBoard(words);
  const b=createBoard(words,{idFactory:({row,column})=>`other-${row}-${column}`});
  const c=swapTiles(a,a.tiles[0].id,a.tiles[1].id);
  assert.equal(boardKey(a),boardKey(b));
  assert.notEqual(boardKey(a),boardKey(c));
});
