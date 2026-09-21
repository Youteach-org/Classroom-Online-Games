import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResolutionEvents } from '../engine/resolution-events.mjs';
import { playResolutionTimeline } from '../ui/timeline.mjs';

const match=(id,tokens)=>({relationshipId:id,tokens,cells:tokens.map((_,col)=>({row:0,col}))});

test('resolution events describe player pop then each automatic cascade generation',()=>{
  const events=buildResolutionEvents({
    generations:[
      {cascadeDepth:0,matches:[match('look-after',['LOOK','AFTER'])],score:{total:170}},
      {cascadeDepth:1,matches:[match('take-a-break',['TAKE','A','BREAK'])],score:{total:405}}
    ]
  });
  assert.deepEqual(events.map(event=>event.label),['LOOK AFTER','COMBO ×2 · TAKE A BREAK']);
  assert.deepEqual(events[1].relationshipIds,['take-a-break']);
  assert.equal(events[1].score,405);
});

test('initial batch names every relationship without pretending it is a cascade',()=>{
  const events=buildResolutionEvents({
    generations:[{
      cascadeDepth:0,
      matches:[
        match('look-after',['LOOK','AFTER']),
        match('make-sense',['MAKE','SENSE'])
      ],
      score:{total:500}
    }]
  });
  assert.equal(events[0].label,'POP ×2 · LOOK AFTER + MAKE SENSE');
});

test('timeline writes each generation label in order and waits only between generations',async()=>{
  const history=[];
  const node={
    get textContent(){ return history.at(-1)??''; },
    set textContent(value){ history.push(String(value)); }
  };
  const root={querySelector:selector=>selector==='#eventLabel'?node:null};
  const delays=[];
  await playResolutionTimeline(root,[
    {label:'LOOK AFTER'},
    {label:'COMBO ×2 · TAKE A BREAK'}
  ],{
    delayMs:120,
    sleep:async ms=>{ delays.push(ms); }
  });
  assert.deepEqual(history,['LOOK AFTER','COMBO ×2 · TAKE A BREAK']);
  assert.deepEqual(delays,[120]);
});
