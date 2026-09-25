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

test('horizontal match uses consecutive columns',()=>{
  const board=boardFromTiles({
    rows:1,columns:3,
    tiles:[
      {id:'make',word:'MAKE',row:0,column:0},
      {id:'a',word:'A',row:0,column:1},
      {id:'decision',word:'DECISION',row:0,column:2}
    ]
  });
  const match=findMatches(board,bank).find(m=>m.relationshipId==='make-a-decision');
  assert.deepEqual(match.tileIds,['make','a','decision']);
  assert.equal(match.orientation,'horizontal');
});

test('vertical match uses consecutive rows in one column',()=>{
  const board=boardFromTiles({
    rows:3,columns:2,
    tiles:[
      {id:'take',word:'TAKE',row:0,column:0},
      {id:'x0',word:'X',row:0,column:1},
      {id:'a',word:'A',row:1,column:0},
      {id:'x1',word:'X',row:1,column:1},
      {id:'break',word:'BREAK',row:2,column:0},
      {id:'x2',word:'X',row:2,column:1}
    ]
  });
  const match=findMatches(board,bank).find(m=>m.relationshipId==='take-a-break');
  assert.deepEqual(match.tileIds,['take','a','break']);
  assert.equal(match.orientation,'vertical');
});

test('suppresses a shorter relation contained in a longer straight sequence',()=>{
  const board=boardFromTiles({
    rows:1,columns:5,
    tiles:[
      {id:'look',word:'LOOK',row:0,column:0},
      {id:'forward',word:'FORWARD',row:0,column:1},
      {id:'to',word:'TO',row:0,column:2},
      {id:'seeing',word:'SEEING',row:0,column:3},
      {id:'you',word:'YOU',row:0,column:4}
    ]
  });
  assert.deepEqual(findMatches(board,bank).map(m=>m.relationshipId),['long']);
});

test('keeps perpendicular crossing matches that share one physical tile',()=>{
  const board=boardFromTiles({
    rows:3,columns:3,
    tiles:[
      {id:'x0',word:'X',row:0,column:0},
      {id:'take',word:'TAKE',row:0,column:1},
      {id:'x1',word:'X',row:0,column:2},
      {id:'make',word:'MAKE',row:1,column:0},
      {id:'a',word:'A',row:1,column:1},
      {id:'decision',word:'DECISION',row:1,column:2},
      {id:'x2',word:'X',row:2,column:0},
      {id:'break',word:'BREAK',row:2,column:1},
      {id:'x3',word:'X',row:2,column:2}
    ]
  });
  const matches=findMatches(board,bank);
  assert.deepEqual(new Set(matches.map(m=>m.relationshipId)),new Set(['make-a-decision','take-a-break']));
  const crossings=findCrossings(matches);
  assert.equal(crossings.length,1);
  assert.equal(crossings[0].tileId,'a');
});

test('does not match across a cell gap or reversed token order',()=>{
  const gap=boardFromTiles({
    rows:1,columns:4,
    tiles:[
      {id:'make',word:'MAKE',row:0,column:0},
      {id:'a',word:'A',row:0,column:2},
      {id:'decision',word:'DECISION',row:0,column:3}
    ]
  });
  const reversed=boardFromTiles({
    rows:1,columns:3,
    tiles:[
      {id:'decision',word:'DECISION',row:0,column:0},
      {id:'a',word:'A',row:0,column:1},
      {id:'make',word:'MAKE',row:0,column:2}
    ]
  });
  assert.equal(findMatches(gap,bank).some(m=>m.relationshipId==='make-a-decision'),false);
  assert.equal(findMatches(reversed,bank).some(m=>m.relationshipId==='make-a-decision'),false);
});


test('canonical A tile matches AN in HAVE AN OPINION while match keeps grammatical surface token',()=>{
  const articleBank=createRelationshipBank([
    {id:'have-an-opinion',category:'collocation',tokens:['HAVE','AN','OPINION'],baseScore:180,difficulty:2}
  ]);
  const board=boardFromTiles({
    rows:1,columns:3,
    tiles:[
      {id:'have',word:'HAVE',row:0,column:0},
      {id:'article',word:'A',row:0,column:1},
      {id:'opinion',word:'OPINION',row:0,column:2}
    ]
  });
  const match=findMatches(board,articleBank)[0];
  assert.ok(match);
  assert.equal(match.relationshipId,'have-an-opinion');
  assert.deepEqual(match.tileIds,['have','article','opinion']);
  assert.deepEqual(match.tokens,['HAVE','AN','OPINION']);
});
