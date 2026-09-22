import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS } from '../data/levels.mjs';
import { occupancyMap } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { createGameController } from '../engine/controller.mjs';
import { findImmediateScoringMoves, hasViablePlay, createControlledBoard } from '../engine/generator.mjs';
import { createFakeStorage, seeded } from './helpers.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);
const fillerWords={1:'ZZ',2:'ZZZ',3:'ZZZZZZ',4:'ZZZZZZZZZ'};

function tile(state,row,word){
  const found=state.board.tiles.find(candidate=>candidate.row===row&&candidate.word===word);
  assert.ok(found,`missing ${word} on row ${row}`);
  return found;
}

function assertValidStableBoard(board){
  assert.equal(board.rows,7);
  assert.equal(board.columns,12);
  for(const tile of board.tiles){
    assert.ok(tile.span>=1&&tile.span<=4,`invalid span for ${tile.id}`);
    assert.ok(tile.row>=0&&tile.row<board.rows,`row out of bounds for ${tile.id}`);
    assert.ok(tile.startColumn>=0&&tile.startColumn+tile.span<=board.columns,`column out of bounds for ${tile.id}`);
  }
  const map=occupancyMap(board);
  assert.equal(map.length,7);
  assert.equal(map.flat().length,84);
  assert.ok(map.every(row=>row.every(Boolean)),'stable board must occupy all 84 microcells');
}

test('Level A rebound, accepted LOOK AFTER swap, POP, gravity/refill and recovery stay valid end to end',()=>{
  const game=createGameController({
    bank,
    levels:LEVELS,
    initialLevelId:'A',
    rng:seeded(17),
    storage:createFakeStorage(),
    refillWord:({span})=>fillerWords[span]
  });

  const initial=game.state();
  const initialMoves=initial.movesLeft;
  assertValidStableBoard(initial.board);

  const coffee=tile(initial,1,'COFFEE');
  const notes=tile(initial,1,'NOTES');
  assert.equal(game.attemptSwap(coffee.id,notes.id).status,'rebound');
  assert.equal(game.state().movesLeft,initialMoves);

  const beforeProductive=game.state();
  const went=tile(beforeProductive,0,'WENT');
  const after=tile(beforeProductive,0,'AFTER');
  assert.equal(game.attemptSwap(went.id,after.id).status,'accepted');

  const ready=game.state();
  assert.equal(ready.movesLeft,initialMoves-1);
  assert.ok(ready.readyMatches.some(match=>match.relationshipId==='phrasal-verb:look-after'));

  assert.equal(game.pop(),true);
  const resolved=game.state();
  assertValidStableBoard(resolved.board);
  assert.ok(
    resolved.phase==='result'||hasViablePlay(resolved.board,bank),
    'round must either finish by objective or remain immediately playable'
  );
});

test('controlled generated board preserves 12x7 geometry and the four-move three-row productivity floor',()=>{
  const fallbackLevel=LEVELS.find(level=>level.id==='G');
  const fallbackGame=createGameController({
    bank,
    levels:[fallbackLevel],
    initialLevelId:'G',
    rng:seeded(1),
    storage:createFakeStorage()
  });
  const fallback=fallbackGame.state().board;
  const generated=createControlledBoard({
    bank,
    rows:7,
    columns:12,
    rng:seeded(23),
    minScoringMoves:4,
    minProductiveRows:3,
    fallbackBoard:fallback
  });
  assertValidStableBoard(generated);
  const moves=findImmediateScoringMoves(generated,bank);
  assert.ok(moves.length>=4,`expected at least 4 productive moves, got ${moves.length}`);
  const rows=new Set(moves.flatMap(move=>[
    generated.tiles.find(tile=>tile.id===move.swap.fromTileId)?.row,
    generated.tiles.find(tile=>tile.id===move.swap.toTileId)?.row
  ]).filter(Number.isInteger));
  assert.ok(rows.size>=3,`expected productive swaps across at least 3 rows, got ${rows.size}`);
});
