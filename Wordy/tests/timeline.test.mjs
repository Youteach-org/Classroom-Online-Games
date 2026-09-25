import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResolutionEvents } from '../engine/resolution-events.mjs';
import { playResolutionTimeline } from '../ui/timeline.mjs';

const match=(id,tokens)=>({relationshipId:id,tokens,tileIds:tokens.map((_,index)=>`${id}-${index}`)});

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


test('resolution events carry board stages needed for visible falling animation',()=>{
  const boardBefore={rows:2,columns:1,tiles:[
    {id:'remove',word:'LOOK',row:0,column:0},
    {id:'fall',word:'AFTER',row:1,column:0}
  ]};
  const boardAfterRemoval={rows:2,columns:1,tiles:[
    {id:'fall',word:'AFTER',row:1,column:0}
  ]};
  const boardAfterGravity={rows:2,columns:1,tiles:[
    {id:'fall',word:'AFTER',row:1,column:0}
  ]};
  const boardAfterRefill={rows:2,columns:1,tiles:[
    {id:'new',word:'KEEP',row:0,column:0},
    {id:'fall',word:'AFTER',row:1,column:0}
  ]};
  const events=buildResolutionEvents({generations:[{
    cascadeDepth:0,
    matches:[match('look-after',['LOOK','AFTER'])],
    removedTileIds:['remove'],
    score:{total:170},
    boardBefore,boardAfterRemoval,boardAfterGravity,boardAfterRefill
  }]});
  assert.equal(events.length,1);
  assert.deepEqual(events[0].removedTileIds,['remove']);
  assert.deepEqual(events[0].boardBefore,boardBefore);
  assert.deepEqual(events[0].boardAfterRemoval,boardAfterRemoval);
  assert.deepEqual(events[0].boardAfterGravity,boardAfterGravity);
  assert.deepEqual(events[0].boardAfterRefill,boardAfterRefill);
  assert.notEqual(events[0].boardBefore,boardBefore,'event snapshot should be cloned');
});
