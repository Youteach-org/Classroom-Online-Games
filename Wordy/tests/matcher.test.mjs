import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches, findCrossings } from '../engine/matcher.mjs';
import { boardFromTiles } from './helpers.mjs';

const bank=createRelationshipBank([
  {id:'short',category:'fixed-expression',tokens:['LOOK','FORWARD','TO'],baseScore:180,difficulty:2},
  {id:'long',category:'fixed-expression',tokens:['LOOK','FORWARD','TO','SEEING','YOU'],baseScore:300,difficulty:3},
  {id:'make-a-decision',category:'collocation',tokens:['MAKE','A','DECISION'],baseScore:180,difficulty:2},
  {id:'take-a-break',category:'collocation',tokens:['TAKE','A','BREAK'],baseScore:180,difficulty:2},
  {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:120,difficulty:1}
]);

test('horizontal matching follows touching tiles even when spans differ',()=>{
  const board=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'make',word:'MAKE',row:0,startColumn:0,span:2},
      {id:'a',word:'A',row:0,startColumn:2,span:1},
      {id:'decision',word:'DECISION',row:0,startColumn:3,span:3}
    ]
  });
  const match=findMatches(board,bank).find(m=>m.relationshipId==='make-a-decision');
  assert.deepEqual(match.tileIds,['make','a','decision']);
  assert.equal(match.orientation,'horizontal');
});

test('suppresses a shorter relationship fully contained in a longer touching sequence',()=>{
  const board=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'look',word:'LOOK',row:0,startColumn:0,span:2},
      {id:'forward',word:'FORWARD',row:0,startColumn:2,span:3},
      {id:'to',word:'TO',row:0,startColumn:5,span:1},
      {id:'seeing',word:'SEEING',row:0,startColumn:6,span:3},
      {id:'you',word:'YOU',row:0,startColumn:9,span:2}
    ]
  });
  assert.deepEqual(findMatches(board,bank).map(m=>m.relationshipId),['long']);
});

test('TAKE A BREAK can match vertically with mixed widths sharing one microcolumn',()=>{
  const board=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'take',word:'TAKE',row:0,startColumn:1,span:2},
      {id:'a',word:'A',row:1,startColumn:2,span:1},
      {id:'break',word:'BREAK',row:2,startColumn:1,span:2}
    ]
  });
  const match=findMatches(board,bank).find(m=>m.relationshipId==='take-a-break');
  assert.deepEqual(match.tileIds,['take','a','break']);
  assert.equal(match.orientation,'vertical');
});

test('mixed-width vertical sequence does not match without a common microcolumn',()=>{
  const board=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'take',word:'TAKE',row:0,startColumn:0,span:2},
      {id:'a',word:'A',row:1,startColumn:3,span:1},
      {id:'break',word:'BREAK',row:2,startColumn:0,span:2}
    ]
  });
  assert.equal(findMatches(board,bank).some(m=>m.relationshipId==='take-a-break'),false);
});

test('wide vertical phrase found through two shared lanes is emitted once',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'look',word:'LOOK',row:0,startColumn:4,span:2},
      {id:'after',word:'AFTER',row:1,startColumn:4,span:2}
    ]
  });
  const matches=findMatches(board,bank).filter(m=>m.relationshipId==='look-after');
  assert.equal(matches.length,1);
  assert.deepEqual(matches[0].tileIds,['look','after']);
});

test('keeps perpendicular crossing matches that share the same physical tile',()=>{
  const board=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'take',word:'TAKE',row:0,startColumn:1,span:2},
      {id:'make',word:'MAKE',row:1,startColumn:0,span:2},
      {id:'a',word:'A',row:1,startColumn:2,span:1},
      {id:'decision',word:'DECISION',row:1,startColumn:3,span:3},
      {id:'break',word:'BREAK',row:2,startColumn:1,span:2}
    ]
  });
  const matches=findMatches(board,bank);
  assert.deepEqual(new Set(matches.map(m=>m.relationshipId)),new Set(['make-a-decision','take-a-break']));
  const crossings=findCrossings(matches);
  assert.equal(crossings.length,1);
  assert.equal(crossings[0].tileId,'a');
  assert.equal(crossings[0].matches.length,2);
});

test('does not match across horizontal gaps or reversed token order',()=>{
  const gap=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'make',word:'MAKE',row:0,startColumn:0,span:2},
      {id:'a',word:'A',row:0,startColumn:3,span:1},
      {id:'decision',word:'DECISION',row:0,startColumn:4,span:3}
    ]
  });
  const reversed=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'decision',word:'DECISION',row:0,startColumn:0,span:3},
      {id:'a',word:'A',row:0,startColumn:3,span:1},
      {id:'make',word:'MAKE',row:0,startColumn:4,span:2}
    ]
  });
  assert.equal(findMatches(gap,bank).some(m=>m.relationshipId==='make-a-decision'),false);
  assert.equal(findMatches(reversed,bank).some(m=>m.relationshipId==='make-a-decision'),false);
});
