import test from 'node:test';
import assert from 'node:assert/strict';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { createGameController } from '../engine/controller.mjs';
import { createFakeStorage, relation, seeded } from './helpers.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('make-sense',['MAKE','SENSE'],'collocation',130,1)
]);

function makeLevel({ready=false,moves=10,target=9999,id='T'}={}){
  return {
    id,title:'Test',moves,goal:{type:'score',target},instruction:'Test',
    boardRows:ready?[
      ['LOOK','AFTER','X','Y','Z'],['A','B','C','D','E'],['F','G','H','I','J'],
      ['K','L','M','N','O'],['P','Q','R','S','T'],['U','V','W','AA','BB'],['CC','DD','EE','FF','GG']
    ]:[
      ['LOOK','X','AFTER','Y','Z'],['A','B','C','D','E'],['F','G','H','I','J'],
      ['K','L','M','N','O'],['P','Q','R','S','T'],['U','V','W','AA','BB'],['CC','DD','EE','FF','GG']
    ],fixtureMoves:[]
  };
}

function makeGame(options={}){
  const storage=createFakeStorage();
  const level=makeLevel(options);
  const game=createGameController({
    bank,levels:[level],initialLevelId:level.id,rng:seeded(3),storage,refillWord:()=> 'ZZZ'
  });
  return {game,storage};
}

test('legal non-scoring setup swap consumes one move and stays in place',()=>{
  const {game}=makeGame();
  const before=game.state();
  const from={row:6,col:3},to={row:6,col:4};
  assert.equal(game.swap(from,to),true);
  const after=game.state();
  assert.equal(after.movesLeft,before.movesLeft-1);
  assert.equal(after.board[6][3].word,'GG');
  assert.equal(after.board[6][4].word,'FF');
});

test('invalid edge or diagonal swap consumes no move',()=>{
  const {game}=makeGame();
  const before=game.state().movesLeft;
  assert.equal(game.swap({row:0,col:0},{row:-1,col:0}),false);
  assert.equal(game.swap({row:0,col:0},{row:1,col:1}),false);
  assert.equal(game.state().movesLeft,before);
});

test('ready relationship persists through unrelated setup moves',()=>{
  const {game}=makeGame({ready:true});
  assert.equal(game.state().readyMatches.length,1);
  game.swap({row:6,col:3},{row:6,col:4});
  assert.equal(game.state().readyMatches.length,1);
});

test('global pop does not consume an additional move',()=>{
  const {game}=makeGame({ready:true});
  const before=game.state().movesLeft;
  assert.equal(game.pop(),true);
  assert.equal(game.state().movesLeft,before);
  assert.ok(game.state().score>0);
});

test('zero moves with a ready relationship still permits the final pop',()=>{
  const {game}=makeGame({moves:1,target:100});
  assert.equal(game.swap({row:0,col:1},{row:0,col:2}),true);
  assert.equal(game.state().movesLeft,0);
  assert.equal(game.state().phase,'playing');
  assert.equal(game.state().readyMatches.length,1);
  game.pop();
  assert.equal(game.state().phase,'result');
  assert.equal(game.state().success,true);
});

test('replay resets round score and moves while preserving discovered relationships',()=>{
  const {game}=makeGame({ready:true,target:100});
  game.pop();
  assert.equal(game.state().phase,'result');
  assert.ok(game.state().discoveredIds.has('look-after'));
  game.replay();
  assert.equal(game.state().phase,'playing');
  assert.equal(game.state().score,0);
  assert.equal(game.state().movesLeft,10);
  assert.ok(game.state().discoveredIds.has('look-after'));
});

test('next advances through supplied validation levels',()=>{
  const storage=createFakeStorage();
  const first=makeLevel({id:'A',ready:true,target:100});
  const second={...makeLevel({id:'B'}),id:'B',title:'Second'};
  const game=createGameController({bank,levels:[first,second],initialLevelId:'A',rng:seeded(2),storage,refillWord:()=> 'ZZZ'});
  game.pop();
  assert.equal(game.next(),true);
  assert.equal(game.state().levelId,'B');
  assert.equal(game.state().phase,'playing');
});

test('telemetry records the prototype loop events',()=>{
  const {game}=makeGame({moves:1,target:100});
  game.swap({row:0,col:1},{row:0,col:2});
  game.pop();
  const types=game.telemetryEvents().map(event=>event.type);
  assert.ok(types.includes('level-start'));
  assert.ok(types.includes('swap'));
  assert.ok(types.includes('ready-change'));
  assert.ok(types.includes('pop'));
  assert.ok(types.includes('level-end'));
});


test('dead-board recovery can borrow a productive authored fallback when the current level fallback is too sparse',()=>{
  const storage=createFakeStorage();
  const current=makeLevel({id:'A',ready:true,target:9999});
  const rescue={
    id:'B',title:'Rescue',moves:10,goal:{type:'score',target:9999},instruction:'Rescue',
    boardRows:[
      ['LOOK','X','AFTER','Y','Z'],
      ['MAKE','Q','SENSE','R','S'],
      ['A','B','C','D','E'],['F','G','H','I','J'],['K','L','M','N','O'],
      ['P','T','U','V','W'],['AA','BB','CC','DD','EE']
    ],fixtureMoves:[]
  };
  const game=createGameController({
    bank,levels:[current,rescue],initialLevelId:'A',rng:()=>0,storage,refillWord:()=> 'ZZZ'
  });
  assert.doesNotThrow(()=>game.pop());
  assert.equal(game.state().phase,'playing');
  assert.ok(game.state().movesLeft>0);
});


test('telemetry identifies formed and broken relationships, not only ready counts',()=>{
  const {game}=makeGame({moves:3,target:9999});
  game.swap({row:0,col:1},{row:0,col:2});
  let events=game.telemetryEvents();
  const formed=events.find(event=>event.type==='relationship-formed');
  const ready=events.filter(event=>event.type==='ready-change').at(-1);
  const swap=events.find(event=>event.type==='swap');
  assert.deepEqual(formed.payload.relationshipIds,['look-after']);
  assert.deepEqual(ready.payload.relationshipIds,['look-after']);
  assert.deepEqual(swap.payload.createdRelationshipIds,['look-after']);

  game.swap({row:0,col:1},{row:0,col:2});
  events=game.telemetryEvents();
  const broken=events.find(event=>event.type==='relationship-broken');
  assert.deepEqual(broken.payload.relationshipIds,['look-after']);
});

test('replay and abandonment are explicit telemetry events',()=>{
  const {game}=makeGame();
  game.abandon();
  game.replay();
  const types=game.telemetryEvents().map(event=>event.type);
  assert.ok(types.includes('level-abandon'));
  assert.ok(types.includes('level-replay'));
});

test('missed high-value opportunities are telemetry events',()=>{
  const {game}=makeGame({moves:3,target:9999});
  game.swap({row:6,col:3},{row:6,col:4});
  const missed=game.telemetryEvents().find(event=>event.type==='missed-opportunity');
  assert.equal(missed.payload.relationshipId,'look-after');
  assert.ok(missed.payload.projectedScore>0);
});

test('creating a crossword emits cross-created telemetry',()=>{
  const crossBank=createRelationshipBank([
    relation('make-a-decision',['MAKE','A','DECISION'],'collocation',180,2),
    relation('take-a-break',['TAKE','A','BREAK'],'collocation',180,2)
  ]);
  const crossLevel={
    id:'F',title:'Cross',moves:5,goal:{type:'cross',target:1},instruction:'Cross',
    boardRows:[
      ['WENT','COFFEE','GONE','NOTES','BEGUN'],
      ['BROKE','PROMISE','CHOSEN','SCHOOL','FUN'],
      ['RAIN','TAKE','FOOD','HABIT','TRUTH'],
      ['COLD','MAKE','A','DECISION','TIME'],
      ['SEEN','WORK','BREAK','IDEA','HOMEWORK'],
      ['DRANK','KNOWN','EXERCISE','BREAKFAST','DIFFERENCE'],
      ['DROVE','FALLEN','COURSE','OPINION','ATTENTION']
    ],fixtureMoves:[]
  };
  const game=createGameController({
    bank:crossBank,levels:[crossLevel],initialLevelId:'F',rng:seeded(5),storage:createFakeStorage(),refillWord:()=> 'ZZZ'
  });
  game.swap({row:2,col:1},{row:2,col:2});
  const cross=game.telemetryEvents().find(event=>event.type==='cross-created');
  assert.equal(cross.payload.crossCount,1);
  assert.deepEqual(new Set(cross.payload.relationshipIds),new Set(['make-a-decision','take-a-break']));
});


test('pop exposes resolution events for UI playback',()=>{
  const {game}=makeGame({ready:true,target:9999});
  assert.deepEqual(game.state().resolutionEvents,[]);
  game.pop();
  const events=game.state().resolutionEvents;
  assert.equal(events.length,1);
  assert.equal(events[0].label,'LOOK AFTER');
  assert.deepEqual(events[0].relationshipIds,['look-after']);
});
