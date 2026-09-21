import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches, findCrossings, cellKey } from '../engine/matcher.mjs';

const bank=createRelationshipBank([
  {id:'short',category:'fixed-expression',tokens:['LOOK','FORWARD','TO'],baseScore:180,difficulty:2},
  {id:'long',category:'fixed-expression',tokens:['LOOK','FORWARD','TO','SEEING','YOU'],baseScore:300,difficulty:3},
  {id:'horizontal',category:'collocation',tokens:['MAKE','A','DECISION'],baseScore:180,difficulty:2},
  {id:'vertical',category:'collocation',tokens:['TAKE','A','BREAK'],baseScore:180,difficulty:2}
]);

test('finds only straight contiguous ordered relationships',()=>{
  const board=createBoard([
    ['LOOK','FORWARD','TO','SEEING','YOU'],
    ['X','X','X','X','X']
  ]);
  const matches=findMatches(board,bank);
  assert.deepEqual(matches.map(m=>m.relationshipId),['long']);
});

test('suppresses a shorter relationship fully contained in a longer same-line match',()=>{
  const board=createBoard([['LOOK','FORWARD','TO','SEEING','YOU']]);
  assert.deepEqual(findMatches(board,bank).map(m=>m.relationshipId),['long']);
});

test('keeps perpendicular crossing matches that share one cell',()=>{
  const board=createBoard([
    ['X','TAKE','X'],
    ['MAKE','A','DECISION'],
    ['X','BREAK','X']
  ]);
  const matches=findMatches(board,bank);
  assert.deepEqual(new Set(matches.map(m=>m.relationshipId)),new Set(['horizontal','vertical']));
  const crossings=findCrossings(matches);
  assert.equal(crossings.length,1);
  assert.deepEqual(crossings[0].cell,{row:1,col:1});
  assert.equal(crossings[0].matches.length,2);
});

test('does not match across null gaps or reversed token order',()=>{
  const withGap=createBoard([['MAKE',null,'DECISION']]);
  const reversed=createBoard([['DECISION','A','MAKE']]);
  assert.equal(findMatches(withGap,bank).length,0);
  assert.equal(findMatches(reversed,bank).length,0);
});

test('cellKey is stable for coordinate identity',()=>{
  assert.equal(cellKey({row:2,col:3}),'2:3');
});
