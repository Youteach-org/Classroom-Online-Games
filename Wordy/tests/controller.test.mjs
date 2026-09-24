import test from 'node:test';
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
