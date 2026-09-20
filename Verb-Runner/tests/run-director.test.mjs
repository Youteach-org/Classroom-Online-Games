import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const director=require('../run-director.js');

test('only Sentence Runner alternates grammar gates with the existing card format',()=>{
  assert.equal(director.presentationFor({level:1,challengeIndex:0}),'cards');
  assert.equal(director.presentationFor({level:2,challengeIndex:0}),'grammar-gate');
  assert.equal(director.presentationFor({level:2,challengeIndex:1}),'cards');
  assert.equal(director.presentationFor({level:2,challengeIndex:2}),'grammar-gate');
  assert.equal(director.presentationFor({level:3,challengeIndex:0}),'cards');
});

test('grammar gates always contain exactly three choices with one correct answer',()=>{
  const source=[
    {value:'finished',correct:true},
    {value:'finish',correct:false},
    {value:'has finished',correct:false},
    {value:'finishes',correct:false},
    {value:'was finishing',correct:false}
  ];
  const result=director.buildGrammarGateSequence(source,()=>0.25);
  assert.equal(result.length,3);
  assert.equal(result.filter(item=>item.correct).length,1);
  assert.equal(new Set(result.map(item=>item.value)).size,3);
  assert.ok(result.some(item=>item.value==='finished'));
});

test('grammar gate sequence refuses to build when no correct answer exists',()=>{
  const result=director.buildGrammarGateSequence([
    {value:'go',correct:false},
    {value:'went',correct:false},
    {value:'gone',correct:false}
  ],()=>0.5);
  assert.deepEqual(result,[]);
});
