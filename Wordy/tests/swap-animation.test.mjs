import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translationBetween, captureTileRects, animateAcceptedSwap, animateRejectedSwap } from '../ui/swap-animation.mjs';

const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');

test('translationBetween returns the inverse FLIP delta',()=>{
  assert.deepEqual(translationBetween(
    {left:10,top:20,width:40,height:40},
    {left:70,top:25,width:80,height:40}
  ),{x:-60,y:-5});
});

function fakeNode(id,rect,{animated=true}={}){
  const calls=[];
  return {
    dataset:{tileId:id},
    getBoundingClientRect:()=>({...rect}),
    calls,
    ...(animated?{animate:(frames,options)=>{calls.push({frames,options});return {finished:Promise.resolve()};}}:{})
  };
}
function fakeBoard(nodes){return {querySelectorAll:selector=>selector==='[data-tile-id]'?nodes:[]};}

test('captureTileRects records only requested physical tiles',()=>{
  const a=fakeNode('a',{left:0,top:0,width:20,height:20});
  const b=fakeNode('b',{left:20,top:0,width:40,height:20});
  const rects=captureTileRects(fakeBoard([a,b]),['b']);
  assert.equal(rects.size,1);
  assert.equal(rects.get('b').left,20);
});

test('accepted swap animates each tile from old rect to its rendered rect',async()=>{
  const a=fakeNode('a',{left:60,top:0,width:20,height:20});
  const b=fakeNode('b',{left:0,top:0,width:60,height:20});
  const before=new Map([
    ['a',{left:0,top:0,width:20,height:20}],
    ['b',{left:20,top:0,width:60,height:20}]
  ]);
  await animateAcceptedSwap(fakeBoard([a,b]),before,['a','b'],{duration:150});
  assert.equal(a.calls.length,1);
  assert.equal(a.calls[0].frames[0].transform,'translate(-60px, 0px)');
  assert.equal(a.calls[0].frames.at(-1).transform,'translate(0px, 0px)');
});

test('rejected swap animates forward to the neighbor and back without needing state change',async()=>{
  const a=fakeNode('a',{left:0,top:0,width:20,height:20});
  const b=fakeNode('b',{left:20,top:0,width:60,height:20});
  await animateRejectedSwap(fakeBoard([a,b]),['a','b'],{duration:110});
  assert.equal(a.calls.length,1);
  assert.equal(a.calls[0].frames[1].transform,'translate(20px, 0px)');
  assert.equal(a.calls[0].frames.at(-1).transform,'translate(0px, 0px)');
});

test('animation helpers resolve when Web Animations API is unavailable',async()=>{
  const a=fakeNode('a',{left:0,top:0,width:20,height:20},{animated:false});
  const b=fakeNode('b',{left:20,top:0,width:20,height:20},{animated:false});
  await assert.doesNotReject(()=>animateRejectedSwap(fakeBoard([a,b]),['a','b']));
});

test('app routes geometric input through attemptSwap and locks input during accepted or rebound animation',()=>{
  assert.match(app,/inputLocked/);
  assert.match(app,/controller\.attemptSwap/);
  assert.match(app,/result\.status===['"]accepted['"]/);
  assert.match(app,/result\.status===['"]rebound['"]/);
  assert.match(app,/animateAcceptedSwap/);
  assert.match(app,/animateRejectedSwap/);
  assert.match(app,/neighborForDirection/);
  assert.match(app,/areSwapNeighbors/);
});
