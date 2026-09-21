import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import {
  enumerateSwaps,
  findImmediateScoringMoves,
  hasViablePlay,
  createControlledBoard,
  recoverDeadBoard
} from '../engine/generator.mjs';
import { seeded } from './helpers.mjs';

const fullBank=createRelationshipBank(RELATIONSHIPS);
const fallbackBoard=createBoard([
  ['LOOK','WENT','AFTER','MONEY','BEGUN'],
  ['COFFEE','NOTES','PROMISE','SCHOOL','FUN'],
  ['MAKE','GONE','SENSE','RAIN','FOOD'],
  ['WROTE','SEEN','COLD','TIME','TRUTH'],
  ['DRANK','TAKE','A','BREAK','HABIT'],
  ['GAVE','KNOWN','WORK','IDEA','HOMEWORK'],
  ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
]);
const deadBoard=createBoard([
  ['ZZ1','ZZ2','ZZ3','ZZ4','ZZ5'],
  ['ZZ6','ZZ7','ZZ8','ZZ9','ZZ10'],
  ['ZZ11','ZZ12','ZZ13','ZZ14','ZZ15'],
  ['ZZ16','ZZ17','ZZ18','ZZ19','ZZ20'],
  ['ZZ21','ZZ22','ZZ23','ZZ24','ZZ25'],
  ['ZZ26','ZZ27','ZZ28','ZZ29','ZZ30'],
  ['ZZ31','ZZ32','ZZ33','ZZ34','ZZ35']
]);

test('enumerateSwaps returns each orthogonal edge once',()=>{
  const board=createBoard([
    ['A','B'],
    ['C','D']
  ]);
  assert.equal(enumerateSwaps(board).length,4);
});

test('a board with no immediate score but a match reachable in two setup swaps is not dead',()=>{
  const bank=createRelationshipBank([
    {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:100,difficulty:1}
  ]);
  const board=createBoard([
    ['LOOK','X','Y'],
    ['Z','Q','AFTER']
  ]);
  assert.equal(findImmediateScoringMoves(board,bank).length,0);
  assert.equal(hasViablePlay(board,bank,{maxDepth:2}),true);
});

test('a swap that only preserves an already-ready relationship is not an immediate scoring move',()=>{
  const bank=createRelationshipBank([
    {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:100,difficulty:1}
  ]);
  const board=createBoard([
    ['LOOK','AFTER','X'],
    ['A','B','C']
  ]);
  const moves=findImmediateScoringMoves(board,bank);
  assert.equal(moves.some(move=>
    move.swap.from.row===1&&move.swap.from.col===1&&
    move.swap.to.row===1&&move.swap.to.col===2
  ),false);
});

test('controlled board satisfies the minimum immediate scoring-move requirement',()=>{
  const board=createControlledBoard({
    bank:fullBank,rows:7,cols:5,rng:seeded(7),minScoringMoves:2,fallbackBoard
  });
  assert.equal(board.length,7);
  assert.equal(board[0].length,5);
  assert.ok(findImmediateScoringMoves(board,fullBank).length>=2);
});

test('dead board recovery returns a productive replacement and marks reset true',()=>{
  const result=recoverDeadBoard({board:deadBoard,bank:fullBank,rng:seeded(4),fallbackBoard});
  assert.equal(result.reset,true);
  assert.equal(result.board.length,7);
  assert.equal(result.board[0].length,5);
  assert.equal(hasViablePlay(result.board,fullBank,{maxDepth:2}),true);
});

test('live board recovery leaves the current board unchanged',()=>{
  const result=recoverDeadBoard({board:fallbackBoard,bank:fullBank,rng:seeded(4),fallbackBoard});
  assert.equal(result.reset,false);
  assert.equal(result.board,fallbackBoard);
});
