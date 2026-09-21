import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { captureMissedOpportunity, buildRoundReview } from '../engine/review.mjs';
import { createTelemetryStore } from '../engine/telemetry.mjs';
import { createFakeStorage, relation } from './helpers.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('make-sense',['MAKE','SENSE'],'collocation',130,1),
  relation('take-a-break',['TAKE','A','BREAK'],'collocation',180,2),
  relation('by-the-way',['BY','THE','WAY'],'fixed-expression',170,2)
]);
const board=createBoard([
  ['LOOK','X','AFTER'],
  ['MAKE','X','SENSE'],
  ['TAKE','A','BREAK']
]);
const bestMove={
  swap:{from:{row:0,col:1},to:{row:0,col:2}},
  matches:[{relationshipId:'look-after'}],
  projectedScore:170
};
const lowMove={
  swap:{from:{row:1,col:1},to:{row:1,col:2}},
  matches:[{relationshipId:'make-sense'}],
  projectedScore:140
};
const otherSwap={from:{row:0,col:0},to:{row:1,col:0}};
const m1={relationshipId:'look-after',projectedScore:100};
const m2={relationshipId:'take-a-break',projectedScore:220};
const m3={relationshipId:'make-sense',projectedScore:140};
const m4={relationshipId:'by-the-way',projectedScore:180};

test('chosen best scoring swap is not recorded as missed',()=>{
  const missed=captureMissedOpportunity({
    board,
    scoringMoves:[bestMove],
    chosenSwap:bestMove.swap,
    bank
  });
  assert.equal(missed,null);
});

test('a different chosen move records the highest verified immediate opportunity with logical board snapshot',()=>{
  const missed=captureMissedOpportunity({
    board,
    scoringMoves:[lowMove,bestMove],
    chosenSwap:otherSwap,
    bank
  });
  assert.equal(missed.relationshipId,bestMove.matches[0].relationshipId);
  assert.equal(Array.isArray(missed.boardRows),true);
  assert.equal(missed.boardRows[0][0],'LOOK');
  assert.equal('image' in missed,false);
  assert.deepEqual(missed.suggestedSwap,bestMove.swap);
});

test('choosing a lower-value scoring move records only the better missed opportunity',()=>{
  const missed=captureMissedOpportunity({
    board,
    scoringMoves:[lowMove,bestMove],
    chosenSwap:lowMove.swap,
    bank
  });
  assert.equal(missed.relationshipId,'look-after');
  assert.equal(missed.projectedScore,170);
});

test('round review returns at most three new and three missed items ordered by value',()=>{
  const review=buildRoundReview({newRelationshipIds:['look-after','make-sense','take-a-break','by-the-way'],missedOpportunities:[m1,m2,m3,m4],bank,limit:3});
  assert.equal(review.newLearning.length,3);
  assert.equal(review.missed.length,3);
  assert.ok(review.missed[0].projectedScore>=review.missed[1].projectedScore);
  assert.equal(review.newLearning[0].id,'look-after');
});

test('telemetry store persists and restores events without a backend',()=>{
  const storage=createFakeStorage();
  const store=createTelemetryStore({storage});
  store.record('swap',{from:[0,0],to:[0,1]});
  const restored=createTelemetryStore({storage});
  assert.equal(restored.events().length,1);
  assert.equal(restored.events()[0].type,'swap');
});

test('telemetry tolerates corrupt persisted data and can be cleared',()=>{
  const storage=createFakeStorage();
  storage.setItem('wordy.prototype.telemetry.v1','not-json');
  const store=createTelemetryStore({storage});
  assert.deepEqual(store.events(),[]);
  store.record('level-start',{levelId:'A'});
  assert.equal(store.events().length,1);
  store.clear();
  assert.deepEqual(store.events(),[]);
});
