import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFromSwipe, neighborForDirection, bindBoardInput } from '../ui/input.mjs';

test('clear cardinal swipe maps to one orthogonal direction',()=>{
  assert.equal(directionFromSwipe(40,3),'right');
  assert.equal(directionFromSwipe(-40,2),'left');
  assert.equal(directionFromSwipe(2,-40),'up');
  assert.equal(directionFromSwipe(1,42),'down');
});

test('short or diagonal ambiguous gestures do not become swaps',()=>{
  assert.equal(directionFromSwipe(10,4),null);
  assert.equal(directionFromSwipe(35,34),null);
});

test('neighborForDirection can point outside but board controller must reject before charging move',()=>{
  assert.deepEqual(neighborForDirection({row:0,col:0},'up'),{row:-1,col:0});
});

function fakeTile(row,col){
  return {
    dataset:{row:String(row),col:String(col)},
    closest(selector){ return selector==='[data-row][data-col]'?this:null; }
  };
}

function fakeBoard(){
  const handlers=new Map();
  return {
    addEventListener(type,handler){
      if(!handlers.has(type))handlers.set(type,new Set());
      handlers.get(type).add(handler);
    },
    removeEventListener(type,handler){ handlers.get(type)?.delete(handler); },
    dispatch(type,event){ for(const handler of handlers.get(type)??[])handler(event); },
    count(type){ return handlers.get(type)?.size??0; }
  };
}

test('two adjacent taps emit one swap request',()=>{
  const board=fakeBoard();
  const swaps=[];
  const cleanup=bindBoardInput(board,{onSwap:(from,to)=>swaps.push({from,to})});
  board.dispatch('click',{target:fakeTile(1,1)});
  board.dispatch('click',{target:fakeTile(1,2)});
  assert.deepEqual(swaps,[{from:{row:1,col:1},to:{row:1,col:2}}]);
  cleanup();
  assert.equal(board.count('click'),0);
});

test('cardinal swipe emits one swap and suppresses the synthetic click',()=>{
  const board=fakeBoard();
  const swaps=[];
  bindBoardInput(board,{onSwap:(from,to)=>swaps.push({from,to})});
  const tile=fakeTile(2,2);
  board.dispatch('pointerdown',{target:tile,pointerId:7,clientX:100,clientY:100});
  board.dispatch('pointerup',{target:tile,pointerId:7,clientX:142,clientY:103});
  board.dispatch('click',{target:tile});
  assert.deepEqual(swaps,[{from:{row:2,col:2},to:{row:2,col:3}}]);
});

test('ambiguous swipe emits no swap',()=>{
  const board=fakeBoard();
  const swaps=[];
  bindBoardInput(board,{onSwap:(from,to)=>swaps.push({from,to})});
  const tile=fakeTile(0,0);
  board.dispatch('pointerdown',{target:tile,pointerId:1,clientX:0,clientY:0});
  board.dispatch('pointerup',{target:tile,pointerId:1,clientX:35,clientY:34});
  assert.equal(swaps.length,0);
});
