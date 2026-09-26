import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResolutionEvents } from '../engine/resolution-events.mjs';
import { playResolutionTimeline, gravityAnimationSpec, refillAnimationSpec } from '../ui/timeline.mjs';

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


test('timeline plays remove gravity refill for every generation in order',async()=>{
  const stages=[];
  const labels=[];
  const node={
    get textContent(){return labels.at(-1)??'';},
    set textContent(value){labels.push(String(value));}
  };
  const root={querySelector:selector=>selector==='#eventLabel'?node:null};
  const board=(suffix)=>({rows:1,columns:1,tiles:[{id:'tile-'+suffix,word:'X',row:0,column:0}]});
  const events=[0,1].map(index=>({
    label:index===0?'LOOK AFTER':'COMBO ×2 · KEEP UP',
    cascadeDepth:index,
    removedTileIds:['old-'+index],
    boardBefore:board('before-'+index),
    boardAfterRemoval:{rows:1,columns:1,tiles:[]},
    boardAfterGravity:{rows:1,columns:1,tiles:[]},
    boardAfterRefill:board('refill-'+index)
  }));
  await playResolutionTimeline(root,events,{
    delayMs:0,
    sleep:async()=>{},
    animateRemoval:async(_root,event)=>{stages.push('remove-'+event.cascadeDepth);},
    animateGravity:async(_root,event)=>{stages.push('gravity-'+event.cascadeDepth);},
    animateRefill:async(_root,event)=>{stages.push('refill-'+event.cascadeDepth);}
  });
  assert.deepEqual(stages,[
    'remove-0','gravity-0','refill-0',
    'remove-1','gravity-1','refill-1'
  ]);
  assert.deepEqual(labels,['LOOK AFTER','COMBO ×2 · KEEP UP']);
});


test('gravity motion is visibly readable with landing overshoot instead of a near-instant jump',()=>{
  const spec=gravityAnimationSpec(
    {left:10,top:80,width:50,height:50},
    {left:10,top:250,width:50,height:50}
  );
  assert.ok(spec.options.duration>=480);
  assert.ok(spec.keyframes.length>=3);
  assert.equal(spec.keyframes[0].transform,'translate(0px,-170px)');
  assert.match(spec.keyframes.at(-2).transform,/translate\(0px,[6-9]px\)/);
  assert.equal(spec.keyframes.at(-1).transform,'translate(0px,0px)');
});

test('refill motion enters clearly from above and lands with a small bounce',()=>{
  const spec=refillAnimationSpec({
    dy:-220,
    row:2,
    column:3
  });
  assert.ok(spec.options.duration>=520);
  assert.ok(spec.keyframes.length>=3);
  assert.equal(spec.keyframes[0].transform,'translateY(-220px)');
  assert.ok(spec.keyframes[0].opacity<=0.45);
  assert.match(spec.keyframes.at(-2).transform,/translateY\([6-9]px\)/);
  assert.equal(spec.keyframes.at(-1).transform,'translateY(0px)');
});
