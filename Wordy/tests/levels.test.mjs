import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, getLevel, isObjectiveComplete, FALLBACK_BOARD_ROWS } from '../data/levels.mjs';
import { createBoard, swapTiles } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches, findCrossings } from '../engine/matcher.mjs';
import { findImmediateScoringMoves } from '../engine/generator.mjs';

const bank=createRelationshipBank([
  {id:'phrasal-verb:look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:120,difficulty:1},
  {id:'collocation:make-sense',category:'collocation',tokens:['MAKE','SENSE'],baseScore:120,difficulty:1},
  {id:'collocation:take-notes',category:'collocation',tokens:['TAKE','NOTES'],baseScore:120,difficulty:1},
  {id:'collocation:pay-attention',category:'collocation',tokens:['PAY','ATTENTION'],baseScore:120,difficulty:1},
  {id:'phrasal-verb:give-up',category:'phrasal-verb',tokens:['GIVE','UP'],baseScore:120,difficulty:1},
  {id:'fixed-expression:as-a-matter-of-fact',category:'fixed-expression',tokens:['AS','A','MATTER','OF','FACT'],baseScore:300,difficulty:3},
  {id:'collocation:make-a-decision',category:'collocation',tokens:['MAKE','A','DECISION'],baseScore:180,difficulty:2},
  {id:'collocation:take-a-break',category:'collocation',tokens:['TAKE','A','BREAK'],baseScore:180,difficulty:2}
]);

function tileByWord(board,row,word){
  return board.tiles.find(tile=>tile.row===row&&tile.word===word);
}
function applyFixtureMove(level,index=0){
  const board=createBoard(level.boardRows);
  const [fromWord,toWord]=level.fixtureMoveWords[index];
  const row=level.fixtureMoveRows?.[index]??0;
  return swapTiles(board,tileByWord(board,row,fromWord).id,tileByWord(board,row,toWord).id);
}

test('every validation level is an exact 7x7 equal-cell board',()=>{
  assert.deepEqual(LEVELS.map(level=>level.id),['A','B','C','D','E','F','G']);
  for(const level of LEVELS){
    assert.equal(level.boardRows.length,7);
    assert.ok(level.boardRows.every(row=>row.length===7),`ragged level ${level.id}`);
    const board=createBoard(level.boardRows);
    assert.equal(board.rows,7);
    assert.equal(board.columns,7);
    assert.equal(board.tiles.length,49);
  }
});

test('level A starts unready and its fixture creates LOOK AFTER',()=>{
  const level=getLevel('A');
  const start=createBoard(level.boardRows);
  assert.equal(findMatches(start,bank).some(m=>m.relationshipId==='phrasal-verb:look-after'),false);
  assert.equal(findMatches(applyFixtureMove(level),bank).some(m=>m.relationshipId==='phrasal-verb:look-after'),true);
});

test('level C fixture moves can create LOOK AFTER and MAKE SENSE together',()=>{
  const level=getLevel('C');
  let board=createBoard(level.boardRows);
  for(let i=0;i<level.fixtureMoveWords.length;i++){
    const row=level.fixtureMoveRows[i];
    const [a,b]=level.fixtureMoveWords[i];
    board=swapTiles(board,tileByWord(board,row,a).id,tileByWord(board,row,b).id);
  }
  const ids=new Set(findMatches(board,bank).map(m=>m.relationshipId));
  assert.ok(ids.has('phrasal-verb:look-after'));
  assert.ok(ids.has('collocation:make-sense'));
});

test('level E fixture creates AS A MATTER OF FACT',()=>{
  const level=getLevel('E');
  const matches=findMatches(applyFixtureMove(level),bank);
  assert.ok(matches.some(m=>m.relationshipId==='fixed-expression:as-a-matter-of-fact'&&m.tileIds.length===5));
});

test('level F fixture creates TAKE A BREAK crossing MAKE A DECISION',()=>{
  const level=getLevel('F');
  const prepared=applyFixtureMove(level);
  const matches=findMatches(prepared,bank);
  const ids=new Set(matches.map(m=>m.relationshipId));
  assert.ok(ids.has('collocation:make-a-decision'));
  assert.ok(ids.has('collocation:take-a-break'));
  assert.ok(findCrossings(matches).length>=1);
});

test('level G fallback exposes at least four productive swaps',()=>{
  const level=getLevel('G');
  const board=createBoard(level.boardRows);
  const moves=findImmediateScoringMoves(board,bank);
  assert.ok(moves.length>=4,`expected >=4, got ${moves.length}`);
  assert.deepEqual(FALLBACK_BOARD_ROWS,level.boardRows);
});

test('objective evaluation covers every prototype goal type',()=>{
  const state={score:1800,bestBatch:2,bestCascade:1,longestRelation:5,crossCount:1};
  for(const level of LEVELS)assert.equal(isObjectiveComplete(level,state),true,`level ${level.id}`);
});
