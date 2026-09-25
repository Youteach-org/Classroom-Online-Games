import test from 'node:test';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS } from '../data/levels.mjs';
import { findImmediateScoringMoves, relationshipCoverage } from '../engine/generator.mjs';
import assert from 'node:assert/strict';
import { boardKey } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { createGameController } from '../engine/controller.mjs';
import { createFakeStorage, relation, seeded } from './helpers.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('make-sense',['MAKE','SENSE'],'collocation',130,1)
]);

const FILLER=[
  ['COFFEE','NOTES','PROMISE','SCHOOL','COLD','TIME','TRUTH'],
  ['BROKE','CHOSEN','RAIN','FOOD','HABIT','IDEA','WORK'],
  ['WROTE','SEEN','COURSE','MONEY','BEGUN','KNOWN','HOME'],
  ['DRANK','GONE','EXERCISE','DIFFERENCE','GAVE','FALLEN','FUN'],
  ['DROVE','PAY','ATTENTION','FRONT','WAY','FACT','MATTER'],
  ['HEAVY','BREAK','DECISION','TAKE','WRITE','TURN','GIVE']
];

function makeLevel({ready=false,moves=10,target=9999,id='T'}={}){
  return {
    id,title:'Test',moves,goal:{type:'score',target},instruction:'Test',generated:false,
    boardRows:[
      ready
        ?['LOOK','AFTER','WENT','MONEY','BEGUN','OF','A']
        :['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A'],
      ...FILLER
    ]
  };
}

function makeGame(options={}){
  const storage=createFakeStorage();
  const level=makeLevel(options);
  const game=createGameController({
    bank,levels:[level],initialLevelId:level.id,rng:seeded(3),storage
  });
  return {game,storage};
}

function tile(state,row,word){
  const found=state.board.tiles.find(tile=>tile.row===row&&tile.word===word);
  assert.ok(found,`missing ${word} on row ${row}`);
  return found;
}

test('geometrically valid non-scoring attempt rebounds without changing canonical state or moves',()=>{
  const {game}=makeGame();
  const before=game.state();
  const left=tile(before,1,'COFFEE');
  const right=tile(before,1,'NOTES');
  const result=game.attemptSwap(left.id,right.id);
  assert.deepEqual(result,{status:'rebound',fromTileId:left.id,toTileId:right.id});
  const after=game.state();
  assert.equal(after.movesLeft,before.movesLeft);
  assert.equal(boardKey(after.board),boardKey(before.board));
});

test('rebound preserves existing ready matches, score, moves and coordinates',()=>{
  const {game}=makeGame({ready:true});
  const before=game.state();
  assert.deepEqual(before.readyMatches.map(m=>m.relationshipId),['look-after']);
  const left=tile(before,1,'COFFEE');
  const right=tile(before,1,'NOTES');
  assert.equal(game.attemptSwap(left.id,right.id).status,'rebound');
  const after=game.state();
  assert.deepEqual(after.readyMatches,before.readyMatches);
  assert.equal(after.score,before.score);
  assert.equal(after.movesLeft,before.movesLeft);
  assert.deepEqual(after.board,before.board);
});

test('productive attempt remains, spends one move, and creates a ready relation',()=>{
  const {game}=makeGame({moves:3});
  const before=game.state();
  const went=tile(before,0,'WENT');
  const afterWord=tile(before,0,'AFTER');
  const result=game.attemptSwap(went.id,afterWord.id);
  assert.equal(result.status,'accepted');
  const after=game.state();
  assert.equal(after.movesLeft,2);
  assert.ok(after.readyMatches.some(m=>m.relationshipId==='look-after'));
  assert.notEqual(boardKey(after.board),boardKey(before.board));
});

test('vertical adjacent equal-cell tiles are valid swap candidates',()=>{
  const {game}=makeGame();
  const before=game.state();
  const top=tile(before,0,'LOOK');
  const below=tile(before,1,'COFFEE');
  const result=game.attemptSwap(top.id,below.id);
  assert.notEqual(result.status,'invalid');
});

test('unknown or non-neighbor pair is invalid and costs no move',()=>{
  const {game}=makeGame();
  const before=game.state();
  const look=tile(before,0,'LOOK');
  const money=tile(before,0,'MONEY');
  assert.equal(game.attemptSwap('missing',look.id).status,'invalid');
  assert.equal(game.attemptSwap(look.id,money.id).status,'invalid');
  assert.equal(game.state().movesLeft,before.movesLeft);
  assert.equal(boardKey(game.state().board),boardKey(before.board));
});

test('rebound telemetry never becomes a missed opportunity',()=>{
  const {game}=makeGame();
  const state=game.state();
  const left=tile(state,1,'COFFEE');
  const right=tile(state,1,'NOTES');
  game.attemptSwap(left.id,right.id);
  const events=game.telemetryEvents();
  assert.ok(events.some(event=>event.type==='swap-rebound'));
  assert.equal(events.some(event=>event.type==='missed-opportunity'),false);
});


const fullBank=createRelationshipBank(RELATIONSHIPS);

test('generated level A exposes its active neighborhood and at least eight productive swaps',()=>{
  const game=createGameController({
    bank:fullBank,
    levels:LEVELS,
    initialLevelId:'A',
    rng:seeded(27),
    storage:createFakeStorage()
  });
  const state=game.state();
  assert.equal(state.movesLeft,18);
  assert.equal(state.activeRelationshipIds.length,24);
  assert.ok(findImmediateScoringMoves(state.board,fullBank).length>=8);
  assert.ok(relationshipCoverage(state.board,fullBank,state.activeRelationshipIds)>=0.85);
  assert.equal(state.phase,'playing');
});

test('generated mixed level G starts with at least twelve productive swaps',()=>{
  const game=createGameController({
    bank:fullBank,
    levels:LEVELS,
    initialLevelId:'G',
    rng:seeded(41),
    storage:createFakeStorage()
  });
  const state=game.state();
  assert.equal(state.activeRelationshipIds.length,32);
  assert.ok(findImmediateScoringMoves(state.board,fullBank).length>=12);
});

test('rejected swap gives immediate NO MATCH feedback without charging a move',()=>{
  const {game}=makeGame();
  const before=game.state();
  const left=tile(before,1,'COFFEE');
  const right=tile(before,1,'NOTES');
  assert.equal(game.attemptSwap(left.id,right.id).status,'rebound');
  const after=game.state();
  assert.equal(after.eventLabel,'NO MATCH');
  assert.equal(after.movesLeft,before.movesLeft);
});


test('round validity is scoped to active relationship ids, not the global bank',()=>{
  const scopedBank=createRelationshipBank([
    relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
    relation('after-look',['AFTER','LOOK'],'fixed-expression',120,1),
    relation('look-up',['LOOK','UP'],'phrasal-verb',120,1)
  ]);
  const level={
    id:'S',title:'Scoped',moves:8,goal:{type:'score',target:9999},instruction:'Scoped',
    generated:false,
    relationshipIds:['look-after'],
    boardRows:[
      ['AFTER','LOOK','A','B','C','D','E'],
      ['LOOK','X','UP','F','G','H','I'],
      ['J','K','L','M','N','O','P'],
      ['Q','R','S','T','U','V','W'],
      ['AA','BB','CC','DD','EE','FF','GG'],
      ['HH','II','JJ','KK','LL','MM','NN'],
      ['OO','PP','SS','TT','UU','VV','WW']
    ]
  };
  const game=createGameController({
    bank:scopedBank,levels:[level],initialLevelId:'S',rng:seeded(5),storage:createFakeStorage()
  });
  const state=game.state();
  assert.deepEqual(state.activeRelationshipIds,['look-after']);
  assert.equal(state.readyMatches.some(match=>match.relationshipId==='after-look'),false);

  const x=tile(state,1,'X');
  const up=tile(state,1,'UP');
  assert.equal(game.attemptSwap(x.id,up.id).status,'rebound');
  assert.equal(game.state().readyMatches.some(match=>match.relationshipId==='look-up'),false);
});


test('reaching score target on POP does not end round while moves remain',()=>{
  const {game}=makeGame({ready:true,moves:3,target:50});
  const before=game.state();
  assert.equal(before.readyMatches.length,1);
  assert.equal(game.pop(),true);
  const after=game.state();
  assert.ok(after.score>=50);
  assert.equal(after.movesLeft,3);
  assert.equal(after.phase,'playing');
  assert.equal(after.success,null);
});

test('last move with READY disables further swaps but preserves one final free POP',()=>{
  const {game}=makeGame({moves:1,target:50});
  const before=game.state();
  const went=tile(before,0,'WENT');
  const afterWord=tile(before,0,'AFTER');
  assert.equal(game.attemptSwap(went.id,afterWord.id).status,'accepted');

  const zero=game.state();
  assert.equal(zero.movesLeft,0);
  assert.equal(zero.phase,'playing');
  assert.ok(zero.readyMatches.length>=1);

  const coffee=tile(zero,1,'COFFEE');
  const notes=tile(zero,1,'NOTES');
  assert.equal(game.attemptSwap(coffee.id,notes.id).status,'invalid');
  assert.equal(game.state().movesLeft,0);

  assert.equal(game.pop(),true);
  const finished=game.state();
  assert.equal(finished.movesLeft,0);
  assert.equal(finished.phase,'result');
  assert.equal(finished.success,true);
  assert.ok(finished.score>=50);
});

test('last move without READY ends immediately and evaluates final score',()=>{
  const {game}=makeGame({moves:1,target:9999});
  const state=game.state();
  const left=tile(state,1,'COFFEE');
  const right=tile(state,1,'NOTES');
  assert.equal(game.attemptSwap(left.id,right.id).status,'rebound');
  assert.equal(game.state().movesLeft,1,'rebound still costs no move');

  const went=tile(game.state(),0,'WENT');
  const afterWord=tile(game.state(),0,'AFTER');
  assert.equal(game.attemptSwap(went.id,afterWord.id).status,'accepted');
  assert.equal(game.state().movesLeft,0);
  assert.ok(game.state().readyMatches.length>=1);
});
