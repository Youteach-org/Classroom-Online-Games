import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import { LEVELS } from '../data/levels.mjs';
import { occupancyMap } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { createGameController } from '../engine/controller.mjs';
import { findImmediateScoringMoves, hasViablePlay, createControlledBoard } from '../engine/generator.mjs';
import { createFakeStorage, seeded } from './helpers.mjs';

const bank=createRelationshipBank(RELATIONSHIPS);

function tile(state,row,word){
  const found=state.board.tiles.find(candidate=>candidate.row===row&&candidate.word===word);
  assert.ok(found,`missing ${word} on row ${row}`);
  return found;
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

test('Level A rebound, accepted LOOK AFTER swap, POP, column fall/refill and recovery stay valid end to end',()=>{
  const game=createGameController({
    bank,
    levels:LEVELS,
    initialLevelId:'A',
    rng:seeded(17),
    storage:createFakeStorage(),
    refillWord:()=> 'ZZ'
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

test('controlled generated board is 7x7 and spreads at least four productive swaps across rows and columns',()=>{
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
    columns:7,
    rng:seeded(23),
    minScoringMoves:4,
    minProductiveRows:3,
    minProductiveColumns:3,
    allowStartingMatches:false,
    fallbackBoard:fallback
  });
  assertValidStableBoard(generated);
  const moves=findImmediateScoringMoves(generated,bank);
  assert.ok(moves.length>=4,`expected at least 4 productive moves, got ${moves.length}`);
  const rows=new Set();
  const columns=new Set();
  for(const move of moves){
    for(const id of [move.swap.fromTileId,move.swap.toTileId]){
      const item=generated.tiles.find(tile=>tile.id===id);
      if(item){rows.add(item.row);columns.add(item.column);}
    }
  }
  assert.ok(rows.size>=3,`expected productive swaps across >=3 rows, got ${rows.size}`);
  assert.ok(columns.size>=3,`expected productive swaps across >=3 columns, got ${columns.size}`);
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
