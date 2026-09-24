import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS } from '../data/levels.mjs';
import { occupancyMap } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { createGameController } from '../engine/controller.mjs';
import {
  enumerateSwaps,
  findImmediateScoringMoves,
  relationshipCoverage
} from '../engine/generator.mjs';
import { createFakeStorage, seeded } from './helpers.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);

function swapKey(swap){
  return [swap.fromTileId,swap.toTileId].sort().join('|');
}

function assertValidStableBoard(board){
  assert.equal(board.rows,7);
  assert.equal(board.columns,7);
  assert.equal(board.tiles.length,49);
  for(const tile of board.tiles){
    assert.equal(Number.isInteger(tile.row),true,`invalid row for ${tile.id}`);
    assert.equal(Number.isInteger(tile.column),true,`invalid column for ${tile.id}`);
    assert.ok(tile.row>=0&&tile.row<board.rows,`row out of bounds for ${tile.id}`);
    assert.ok(tile.column>=0&&tile.column<board.columns,`column out of bounds for ${tile.id}`);
    assert.equal('span' in tile,false,`legacy span on ${tile.id}`);
    assert.equal('startColumn' in tile,false,`legacy startColumn on ${tile.id}`);
  }
  const map=occupancyMap(board);
  assert.equal(map.length,7);
  assert.equal(map.flat().length,49);
  assert.ok(map.every(row=>row.every(Boolean)),'stable board must occupy all 49 cells');
}

test('Level A behaves as a dense generated round instead of a scripted two-combination demo',()=>{
  const game=createGameController({
    bank,
    levels:LEVELS,
    initialLevelId:'A',
    rng:seeded(17),
    storage:createFakeStorage()
  });

  const initial=game.state();
  assertValidStableBoard(initial.board);
  assert.equal(initial.movesLeft,18);
  assert.equal(initial.activeRelationshipIds.length,12);
  assert.ok(relationshipCoverage(initial.board,bank,initial.activeRelationshipIds)>=0.85);

  const productive=findImmediateScoringMoves(initial.board,bank);
  assert.ok(productive.length>=8,`expected >=8 starting productive swaps, got ${productive.length}`);

  const productiveKeys=new Set(productive.map(move=>swapKey(move.swap)));
  const rejected=enumerateSwaps(initial.board).find(swap=>!productiveKeys.has(swapKey(swap)));
  assert.ok(rejected,'expected at least one nonproductive adjacent swap');
  assert.equal(game.attemptSwap(rejected.fromTileId,rejected.toTileId).status,'rebound');
  assert.equal(game.state().movesLeft,18);
  assert.equal(game.state().eventLabel,'NO MATCH');

  const chosen=findImmediateScoringMoves(game.state().board,bank)[0];
  assert.ok(chosen,'expected productive move after rebound');
  assert.equal(game.attemptSwap(chosen.swap.fromTileId,chosen.swap.toTileId).status,'accepted');
  const ready=game.state();
  assert.equal(ready.movesLeft,17);
  assert.ok(ready.readyMatches.length>=1);

  const activeWords=new Set(
    ready.activeRelationshipIds.flatMap(id=>bank.byId.get(id).tokens)
  );
  assert.equal(game.pop(),true);
  const resolved=game.state();
  assertValidStableBoard(resolved.board);
  assert.ok(resolved.board.tiles.every(tile=>activeWords.has(tile.word)),'refill/recovery leaked a word outside the round neighborhood');

  if(resolved.phase==='playing'){
    const continuation=findImmediateScoringMoves(resolved.board,bank);
    assert.ok(continuation.length>=4,`expected meaningful continuation after POP, got ${continuation.length}`);
  }else{
    assert.ok(resolved.score>=LEVELS[0].goal.target,'round ended before reaching the configured score target');
  }
});

test('mixed Level G begins with at least twelve productive swaps from a twenty-relation neighborhood',()=>{
  const game=createGameController({
    bank,
    levels:LEVELS,
    initialLevelId:'G',
    rng:seeded(23),
    storage:createFakeStorage()
  });
  const state=game.state();
  assertValidStableBoard(state.board);
  assert.equal(state.activeRelationshipIds.length,20);
  const moves=findImmediateScoringMoves(state.board,bank);
  assert.ok(moves.length>=12,`expected at least 12 productive moves, got ${moves.length}`);
  assert.ok(relationshipCoverage(state.board,bank,state.activeRelationshipIds)>=0.85);
});

test('runtime contains no legacy span geometry engine',()=>{
  const tileSizeUrl=new URL('../engine/tile-size.mjs',import.meta.url);
  assert.equal(existsSync(tileSizeUrl),false,'tile-size.mjs must be removed');

  const runtimePaths=[
    '../app.mjs',
    '../engine/board.mjs',
    '../engine/controller.mjs',
    '../engine/generator.mjs',
    '../engine/matcher.mjs',
    '../engine/refill.mjs',
    '../engine/resolution.mjs',
    '../engine/review.mjs',
    '../ui/input.mjs',
    '../ui/render.mjs',
    '../ui/swap-animation.mjs'
  ];
  for(const relative of runtimePaths){
    const source=readFileSync(new URL(relative,import.meta.url),'utf8');
    assert.doesNotMatch(source,/\bstartColumn\b|\bspanForWord\b|\bpartitionRun\b/,relative);
  }
});
