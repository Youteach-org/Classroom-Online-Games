import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFromSwipe, bindBoardInput } from '../ui/input.mjs';

test('clear cardinal swipe maps to one direction while ambiguous gestures do not',()=>{
  assert.equal(directionFromSwipe(40,3),'right');
  assert.equal(directionFromSwipe(-40,2),'left');
  assert.equal(directionFromSwipe(2,-40),'up');
  assert.equal(directionFromSwipe(1,42),'down');
  assert.equal(directionFromSwipe(10,4),null);
  assert.equal(directionFromSwipe(35,34),null);
});

function fakeTile(id){return {dataset:{tileId:id},closest(selector){return selector==='[data-tile-id]'?this:null;}};}
function fakeBoard(){const handlers=new Map();return {addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},removeEventListener(type,handler){handlers.get(type)?.delete(handler);},dispatch(type,event){for(const handler of handlers.get(type)??[])handler(event);},count(type){return handlers.get(type)?.size??0;}};}

const neighbors=new Set(['wide|small','small|wide']);
const areNeighbors=(a,b)=>neighbors.has(`${a}|${b}`);
const getNeighbor=(id,direction)=>id==='wide'&&direction==='right'?'small':null;

test('two geometric-neighbor taps emit one tile-id swap request',()=>{
  const board=fakeBoard(),swaps=[];
  const cleanup=bindBoardInput(board,{getNeighbor,areNeighbors,onSwap:(from,to)=>swaps.push([from,to])});
  board.dispatch('click',{target:fakeTile('wide')});
  board.dispatch('click',{target:fakeTile('small')});
  assert.deepEqual(swaps,[['wide','small']]);
  cleanup();
  assert.equal(board.count('click'),0);
});

test('non-neighbor second tap selects the new tile without swapping',()=>{
  const board=fakeBoard(),swaps=[];
  bindBoardInput(board,{getNeighbor,areNeighbors,onSwap:(a,b)=>swaps.push([a,b])});
  board.dispatch('click',{target:fakeTile('wide')});
  board.dispatch('click',{target:fakeTile('other')});
  assert.deepEqual(swaps,[]);
});

test('cardinal swipe asks geometry for the actual neighbor and suppresses synthetic click',()=>{
  const board=fakeBoard(),swaps=[];
  bindBoardInput(board,{getNeighbor,areNeighbors,onSwap:(from,to)=>swaps.push([from,to])});
  const tile=fakeTile('wide');
  board.dispatch('pointerdown',{target:tile,pointerId:7,clientX:100,clientY:100});
  board.dispatch('pointerup',{target:tile,pointerId:7,clientX:142,clientY:103});
  board.dispatch('click',{target:tile});
  assert.deepEqual(swaps,[['wide','small']]);
});

test('swipe with no geometric neighbor emits no swap',()=>{
  const board=fakeBoard(),swaps=[];
  bindBoardInput(board,{getNeighbor:()=>null,areNeighbors,onSwap:(a,b)=>swaps.push([a,b])});
  const tile=fakeTile('wide');
  board.dispatch('pointerdown',{target:tile,pointerId:1,clientX:0,clientY:0});
  board.dispatch('pointerup',{target:tile,pointerId:1,clientX:0,clientY:-40});
  assert.deepEqual(swaps,[]);
});
