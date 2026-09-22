import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFromTiles, createFakeStorage, relation } from './helpers.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { captureMissedOpportunity, buildRoundReview } from '../engine/review.mjs';
import { createTelemetryStore } from '../engine/telemetry.mjs';

const bank=createRelationshipBank([
  relation('look-after',['LOOK','AFTER'],'phrasal-verb',120,1),
  relation('make-sense',['MAKE','SENSE'],'collocation',130,1),
  relation('take-a-break',['TAKE','A','BREAK'],'collocation',180,2),
  relation('by-the-way',['BY','THE','WAY'],'fixed-expression',170,2)
]);

const board=boardFromTiles({rows:2,columns:3,tiles:[
  {id:'look',word:'LOOK',row:0,column:0},
  {id:'x',word:'WENT',row:0,column:1},
  {id:'after',word:'AFTER',row:0,column:2},
  {id:'make',word:'MAKE',row:1,column:0},
  {id:'y',word:'GONE',row:1,column:1},
  {id:'sense',word:'SENSE',row:1,column:2}
]});

const bestMove={
  swap:{fromTileId:'x',toTileId:'after'},
  matches:[{relationshipId:'look-after',tileIds:['look','after']}],
  projectedScore:170
};
const lowMove={
  swap:{fromTileId:'y',toTileId:'sense'},
  matches:[{relationshipId:'make-sense',tileIds:['make','sense']}],
  projectedScore:140
};

const m1={relationshipId:'look-after',projectedScore:100,suggestedSwap:{fromTileId:'a',toTileId:'b'}};
const m2={relationshipId:'take-a-break',projectedScore:220,suggestedSwap:{fromTileId:'c',toTileId:'d'}};
const m3={relationshipId:'make-sense',projectedScore:140,suggestedSwap:{fromTileId:'e',toTileId:'f'}};
const m4={relationshipId:'by-the-way',projectedScore:180,suggestedSwap:{fromTileId:'g',toTileId:'h'}};

test('chosen best scoring swap is not recorded as missed',()=>{
  const missed=captureMissedOpportunity({board,scoringMoves:[bestMove],chosenSwap:bestMove.swap,bank});
  assert.equal(missed,null);
});

test('different move records best opportunity with row-column snapshot',()=>{
  const missed=captureMissedOpportunity({
    board,scoringMoves:[lowMove,bestMove],chosenSwap:lowMove.swap,bank
  });
  assert.equal(missed.relationshipId,'look-after');
  assert.equal(missed.boardSnapshot.columns,3);
  assert.equal(missed.boardSnapshot.tiles.find(t=>t.id==='look').column,0);
  assert.equal('startColumn' in missed.boardSnapshot.tiles[0],false);
  assert.deepEqual(missed.suggestedSwap,{fromTileId:'x',toTileId:'after'});
});

test('round review deduplicates missed items using tile-id swap identity',()=>{
  const duplicate={...m2,projectedScore:210};
  const review=buildRoundReview({
    newRelationshipIds:['look-after','make-sense','take-a-break','by-the-way'],
    missedOpportunities:[m1,m2,duplicate,m3,m4],bank,limit:3
  });
  assert.equal(review.newLearning.length,3);
  assert.equal(review.missed.length,3);
  assert.equal(review.missed.filter(item=>item.relationshipId==='take-a-break').length,1);
  assert.ok(review.missed[0].projectedScore>=review.missed[1].projectedScore);
});

test('telemetry store persists and restores events without a backend',()=>{
  const storage=createFakeStorage();
  const store=createTelemetryStore({storage});
  store.record('swap-rebound',{fromTileId:'a',toTileId:'b'});
  const restored=createTelemetryStore({storage});
  assert.equal(restored.events().length,1);
  assert.equal(restored.events()[0].type,'swap-rebound');
});

test('telemetry tolerates corrupt persisted data and can be cleared',()=>{
  const storage=createFakeStorage();
  storage.setItem('wordy.prototype.telemetry.v1','not-json');
  const store=createTelemetryStore({storage});
  assert.deepEqual(store.events(),[]);
  store.record('level-start',{levelId:'A'});
  store.clear();
  assert.deepEqual(store.events(),[]);
});
