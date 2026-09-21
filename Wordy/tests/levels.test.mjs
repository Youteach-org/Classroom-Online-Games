import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS, getLevel, isObjectiveComplete, FALLBACK_BOARD_ROWS } from '../data/levels.mjs';
import { createBoard, swapTiles } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches, findCrossings } from '../engine/matcher.mjs';
import { findImmediateScoringMoves, hasViablePlay } from '../engine/generator.mjs';
import { resolvePlayerActivation } from '../engine/resolution.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);

function applyFixtureMoves(level){
  return level.fixtureMoves.reduce(
    (current,[from,to])=>swapTiles(current,from,to),
    createBoard(level.boardRows)
  );
}

test('all validation levels are 7x5, move-limited, and have instructions',()=>{
  assert.deepEqual(LEVELS.map(level=>level.id),['A','B','C','D','E','F','G']);
  for(const level of LEVELS){
    assert.equal(level.boardRows.length,7);
    assert.ok(level.boardRows.every(row=>row.length===5));
    assert.ok(Number.isInteger(level.moves)&&level.moves>0);
    assert.ok(level.instruction.length>0);
  }
});

test('level A starts without a ready match and its fixture creates LOOK AFTER',()=>{
  const level=getLevel('A');
  const start=createBoard(level.boardRows);
  assert.equal(findMatches(start,bank).length,0);
  assert.ok(findMatches(applyFixtureMoves(level),bank).some(match=>match.relationshipId==='phrasal-verb:look-after'));
});

test('level C fixture creates at least two simultaneous ready relationships',()=>{
  const level=getLevel('C');
  const matches=findMatches(applyFixtureMoves(level),bank);
  assert.ok(matches.some(match=>match.relationshipId==='phrasal-verb:look-after'));
  assert.ok(matches.some(match=>match.relationshipId==='collocation:make-sense'));
  assert.ok(matches.length>=2);
});

test('level D fixture produces the intended cascade under its documented activation',()=>{
  const level=getLevel('D');
  const prepared=applyFixtureMoves(level);
  let refillIndex=0;
  const result=resolvePlayerActivation({
    board:prepared,
    bank,
    discoveredIds:new Set(),
    refillTile:()=>({
      id:'fixture-'+(++refillIndex),
      word:level.fixtureRefillWords[(refillIndex-1)%level.fixtureRefillWords.length]
    })
  });
  assert.ok(result.generations.length>=2);
  assert.ok(result.generations[0].matches.some(match=>match.relationshipId==='phrasal-verb:look-after'));
  assert.ok(result.generations[1].matches.some(match=>match.relationshipId==='collocation:take-a-break'));
});

test('level E fixture creates a five-token fixed expression',()=>{
  const level=getLevel('E');
  const matches=findMatches(applyFixtureMoves(level),bank);
  assert.ok(matches.some(match=>match.relationshipId==='fixed-expression:as-a-matter-of-fact'&&match.cells.length===5));
});

test('level F fixture can produce a crossing before activation',()=>{
  const level=getLevel('F');
  const prepared=applyFixtureMoves(level);
  const matches=findMatches(prepared,bank);
  assert.ok(matches.some(match=>match.relationshipId==='collocation:make-a-decision'));
  assert.ok(matches.some(match=>match.relationshipId==='collocation:take-a-break'));
  assert.ok(findCrossings(matches).length>=1);
});

test('level G and fallback board are productive for mixed play',()=>{
  const level=getLevel('G');
  const board=createBoard(level.boardRows);
  assert.ok(findImmediateScoringMoves(board,bank).length>=2);
  assert.equal(hasViablePlay(board,bank,{maxDepth:2}),true);
  assert.deepEqual(FALLBACK_BOARD_ROWS,level.boardRows);
});

test('objective evaluation covers every prototype goal type',()=>{
  const state={score:1800,bestBatch:2,bestCascade:1,longestRelation:5,crossCount:1};
  for(const level of LEVELS)assert.equal(isObjectiveComplete(level,state),true,`level ${level.id}`);
  assert.equal(isObjectiveComplete(getLevel('A'),{...state,score:0}),false);
  assert.equal(isObjectiveComplete(getLevel('C'),{...state,bestBatch:1}),false);
});
