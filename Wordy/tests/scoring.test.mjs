import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { scoreResolution, DEFAULT_SCORE_CONFIG } from '../engine/scoring.mjs';
import { relation, match } from './helpers.mjs';

const bank=createRelationshipBank([
  relation('m1',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('m2',['MAKE','SENSE'],'collocation',130,1),
  relation('h',['MAKE','A','DECISION'],'collocation',180,2),
  relation('v',['TAKE','A','BREAK'],'collocation',180,2)
]);

const m1=match('m1',[{row:0,col:0},{row:0,col:1}],'horizontal',['LOOK','AFTER']);
const m2=match('m2',[{row:2,col:0},{row:2,col:1}],'horizontal',['MAKE','SENSE']);
const horizontal=match('h',[
  {row:1,col:0},{row:1,col:1},{row:1,col:2}
],'horizontal',['MAKE','A','DECISION']);
const vertical=match('v',[
  {row:0,col:1},{row:1,col:1},{row:2,col:1}
],'vertical',['TAKE','A','BREAK']);

test('batch bonus rewards resolving several ready relationships together',()=>{
  const one=scoreResolution({matches:[m1],bank,discoveredIds:new Set(),cascadeDepth:0});
  const two=scoreResolution({matches:[m1,m2],bank,discoveredIds:new Set(),cascadeDepth:0});
  assert.ok(two.batchBonus>one.batchBonus);
  assert.equal(one.batchBonus,0);
  assert.equal(two.batchBonus,DEFAULT_SCORE_CONFIG.batchBonusPerExtra);
});

test('crossing relationships both score and add one cross bonus',()=>{
  const result=scoreResolution({matches:[horizontal,vertical],bank,discoveredIds:new Set(['h','v']),cascadeDepth:0});
  assert.equal(result.baseScore,360);
  assert.equal(result.crossCount,1);
  assert.equal(result.crossBonus,120);
});

test('first automatic cascade applies x1.5 multiplier',()=>{
  const result=scoreResolution({matches:[m1],bank,discoveredIds:new Set(['m1']),cascadeDepth:1});
  assert.equal(result.multiplier,1.5);
  assert.equal(result.total,Math.round(result.subtotal*1.5));
});

test('discovery bonus is added only for unique relationships not already discovered',()=>{
  const fresh=scoreResolution({matches:[m1],bank,discoveredIds:new Set(),cascadeDepth:0});
  const known=scoreResolution({matches:[m1],bank,discoveredIds:new Set(['m1']),cascadeDepth:0});
  assert.equal(fresh.discoveryBonus-known.discoveryBonus,50);
});

test('length bonus is derived from resolved relationship length',()=>{
  const result=scoreResolution({matches:[horizontal],bank,discoveredIds:new Set(['h']),cascadeDepth:0});
  assert.equal(result.lengthBonus,40);
});
