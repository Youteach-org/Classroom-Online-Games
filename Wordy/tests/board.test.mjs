import test from 'node:test';
import assert from 'node:assert/strict';
import { spanForWord } from '../engine/tile-size.mjs';
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
  emptyRuns,
  boardKey
} from '../engine/board.mjs';
import { boardFromTiles } from './helpers.mjs';

test('spanForWord returns only the four approved width buckets',()=>{
  assert.equal(spanForWord('A'),1);
  assert.equal(spanForWord('OF'),1);
  assert.equal(spanForWord('LOOK'),2);
  assert.equal(spanForWord('AFTER'),2);
  assert.equal(spanForWord('COFFEE'),3);
  assert.equal(spanForWord('HOMEWORK'),3);
  assert.equal(spanForWord('ATTENTION'),4);
  assert.equal(spanForWord('DIFFERENCE'),4);
});

test('createBoard packs an authored row to exactly 12 microcolumns',()=>{
  const board=createBoard([
    ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']
  ]);
  assert.equal(board.columns,12);
  assert.equal(board.rows,1);
  assert.deepEqual(
    board.tiles.map(t=>[t.word,t.startColumn,t.span]),
    [
      ['LOOK',0,2],['WENT',2,2],['AFTER',4,2],['MONEY',6,2],
      ['BEGUN',8,2],['OF',10,1],['A',11,1]
    ]
  );
});

test('createBoard rejects rows that underfill or overflow 12 columns',()=>{
  assert.throws(()=>createBoard([['LOOK','AFTER']]),/exactly 12/i);
  assert.throws(
    ()=>createBoard([['ATTENTION','DIFFERENCE','HOMEWORK','COFFEE']]),
    /12 columns/i
  );
});

test('occupancyMap fills every microcell covered by each tile',()=>{
  const board=createBoard([
    ['A','ATTENTION','LOOK','MAKE','OF','TO','I']
  ]);
  const map=occupancyMap(board);
  const attention=board.tiles.find(t=>t.word==='ATTENTION');
  assert.deepEqual(map[0].slice(attention.startColumn,attention.startColumn+attention.span),
    Array(attention.span).fill(attention.id));
  assert.equal(map[0].filter(Boolean).length,12);
});

test('different-width touching tiles can swap horizontally and preserve identity',()=>{
  const board=createBoard([
    ['A','ATTENTION','LOOK','MAKE','OF','TO','I']
  ]);
  const a=board.tiles.find(t=>t.word==='A');
  const attention=board.tiles.find(t=>t.word==='ATTENTION');
  assert.equal(areSwapNeighbors(board,a.id,attention.id),true);
  assert.equal(neighborForDirection(board,a.id,'right'),attention.id);
  const next=swapTiles(board,a.id,attention.id);
  assert.equal(tileById(board,a.id).startColumn,0);
  assert.equal(tileById(next,attention.id).startColumn,0);
  assert.equal(tileById(next,a.id).startColumn,4);
  assert.equal(tileById(next,a.id).id,a.id);
});

test('vertical swap requires identical complete footprint',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'wide',word:'COFFEE',row:0,startColumn:0,span:3},
      {id:'one',word:'A',row:1,startColumn:0,span:1},
      {id:'two',word:'OF',row:1,startColumn:1,span:1},
      {id:'three',word:'TO',row:1,startColumn:2,span:1}
    ]
  });
  assert.equal(areSwapNeighbors(board,'wide','one'),false);
  assert.equal(neighborForDirection(board,'wide','down'),null);
});

test('identical footprints on adjacent rows are vertical swap neighbors',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'look',word:'LOOK',row:0,startColumn:3,span:2},
      {id:'after',word:'AFTER',row:1,startColumn:3,span:2}
    ]
  });
  assert.equal(areSwapNeighbors(board,'look','after'),true);
  assert.equal(neighborForDirection(board,'look','down'),'after');
  const next=swapTiles(board,'look','after');
  assert.equal(tileById(next,'look').row,1);
  assert.equal(tileById(next,'after').row,0);
});

test('removeTiles is immutable and removes duplicate tile ids once',()=>{
  const board=createBoard([
    ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']
  ]);
  const look=board.tiles.find(t=>t.word==='LOOK');
  const next=removeTiles(board,[look.id,look.id]);
  assert.ok(tileById(board,look.id));
  assert.equal(tileById(next,look.id),null);
  assert.equal(next.tiles.length,board.tiles.length-1);
});

test('emptyRuns reports exact horizontal gaps in incomplete rows',()=>{
  const board=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'left',word:'LOOK',row:0,startColumn:0,span:2},
      {id:'right',word:'ATTENTION',row:0,startColumn:5,span:4}
    ]
  });
  assert.deepEqual(emptyRuns(board,0),[
    {row:0,startColumn:2,width:3},
    {row:0,startColumn:9,width:3}
  ]);
});

test('cloneBoard and tilesInRow expose copies in geometric order',()=>{
  const board=createBoard([
    ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']
  ]);
  const copy=cloneBoard(board);
  copy.tiles[0].word='CHANGED';
  assert.equal(board.tiles[0].word,'LOOK');
  assert.deepEqual(tilesInRow(board,0).map(t=>t.word),
    ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']);
});

test('boardKey represents geometric word arrangement rather than tile identity',()=>{
  const words=[['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']];
  const a=createBoard(words);
  const b=createBoard(words,{idFactory:({row,index})=>`other-${row}-${index}`});
  const c=swapTiles(a,a.tiles[0].id,a.tiles[1].id);
  assert.equal(boardKey(a),boardKey(b));
  assert.notEqual(boardKey(a),boardKey(c));
});
