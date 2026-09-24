import test from 'node:test';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import * as generatorModule from '../engine/generator.mjs';
import assert from 'node:assert/strict';
import { createBoard, tileById } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches } from '../engine/matcher.mjs';
import {
  enumerateSwaps,
  findImmediateScoringMoves,
  hasViablePlay,
  createControlledBoard,
  recoverDeadBoard
} from '../engine/generator.mjs';
import { seeded } from './helpers.mjs';

const bank=createRelationshipBank([
  {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:120,difficulty:1},
  {id:'make-sense',category:'collocation',tokens:['MAKE','SENSE'],baseScore:120,difficulty:1},
  {id:'take-notes',category:'collocation',tokens:['TAKE','NOTES'],baseScore:120,difficulty:1},
  {id:'pay-attention',category:'collocation',tokens:['PAY','ATTENTION'],baseScore:120,difficulty:1},
  {id:'give-up',category:'phrasal-verb',tokens:['GIVE','UP'],baseScore:120,difficulty:1},
  {id:'heavy-rain',category:'collocation',tokens:['HEAVY','RAIN'],baseScore:120,difficulty:1}
]);

const fallbackRows=[
  ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A'],
  ['COLD','TIME','TRUTH','WORK','IDEA','HOME','COURSE'],
  ['FOOD','HABIT','MAKE','GONE','SENSE','BREAK','COFFEE'],
  ['BROKE','CHOSEN','SEEN','FALLEN','KNOWN','FUN','SCHOOL'],
  ['PROMISE','MATTER','FACT','FRONT','TAKE','WENT','NOTES'],
  ['WRITE','TURN','PICK','FIND','STAND','WAKE','SIT'],
  ['PAY','WENT','ATTENTION','GIVE','DOWN','OTHER','END']
];
const fallbackBoard=createBoard(fallbackRows);
const deadBoard=createBoard(Array.from({length:7},(_,row)=>
  Array.from({length:7},(_,column)=>`DEAD${row}${column}`)
));

test('enumerateSwaps exposes every right/down orthogonal pair exactly once',()=>{
  const board=createBoard([
    ['A','B','C'],
    ['D','E','F']
  ]);
  const swaps=enumerateSwaps(board);
  assert.equal(swaps.length,7);
  const keys=new Set(swaps.map(s=>[s.fromTileId,s.toTileId].sort().join('|')));
  assert.equal(keys.size,7);
});

test('a swap that only preserves an already-ready relation is not productive',()=>{
  const readyBank=createRelationshipBank([
    {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:100,difficulty:1}
  ]);
  const board=createBoard([['LOOK','AFTER','X','Y']]);
  const x=board.tiles.find(t=>t.word==='X');
  const y=board.tiles.find(t=>t.word==='Y');
  const moves=findImmediateScoringMoves(board,readyBank);
  assert.equal(moves.some(move=>
    new Set([move.swap.fromTileId,move.swap.toTileId]).has(x.id)&&
    new Set([move.swap.fromTileId,move.swap.toTileId]).has(y.id)
  ),false);
});

test('controlled board is full, starts match-free, and distributes productive swaps',()=>{
  const board=createControlledBoard({
    bank,rows:7,columns:7,rng:seeded(42),
    minScoringMoves:4,minProductiveRows:3,minProductiveColumns:3,
    allowStartingMatches:false
  });
  assert.equal(board.rows,7);
  assert.equal(board.columns,7);
  assert.equal(board.tiles.length,49);
  assert.equal(findMatches(board,bank).length,0);
  const moves=findImmediateScoringMoves(board,bank);
  assert.ok(moves.length>=4,`expected >=4 productive swaps, got ${moves.length}`);
  const rows=new Set();
  const columns=new Set();
  for(const move of moves){
    for(const id of [move.swap.fromTileId,move.swap.toTileId]){
      const tile=tileById(board,id);
      rows.add(tile.row);
      columns.add(tile.column);
    }
  }
  assert.ok(rows.size>=3,`expected >=3 productive rows, got ${rows.size}`);
  assert.ok(columns.size>=3,`expected >=3 productive columns, got ${columns.size}`);
});

test('dead board recovery returns a productive 7x7 replacement',()=>{
  const result=recoverDeadBoard({
    board:deadBoard,bank,rng:seeded(4),
    minScoringMoves:4,minProductiveRows:3,minProductiveColumns:3,
    fallbackBoard
  });
  assert.equal(result.reset,true);
  assert.equal(result.board.rows,7);
  assert.equal(result.board.columns,7);
  assert.equal(hasViablePlay(result.board,bank),true);
});

test('live board recovery leaves the board object unchanged',()=>{
  const result=recoverDeadBoard({board:fallbackBoard,bank,rng:seeded(4),fallbackBoard});
  assert.equal(result.reset,false);
  assert.equal(result.board,fallbackBoard);
});


const fullBank=createRelationshipBank(RELATIONSHIPS);

function relationIdsConnected(ids,bank,seedCount=1){
  if(ids.length<=seedCount)return true;
  const tokens=new Set();
  for(const id of ids.slice(0,seedCount)){
    const relation=bank.byId.get(id);
    if(!relation)return false;
    for(const token of relation.tokens)tokens.add(token);
  }
  for(const id of ids.slice(seedCount)){
    const relation=bank.byId.get(id);
    if(!relation)return false;
    if(!relation.tokens.some(token=>tokens.has(token)))return false;
    for(const token of relation.tokens)tokens.add(token);
  }
  return true;
}

test('selectRelationshipNeighborhood preserves required ids and grows a connected active pool',()=>{
  assert.equal(typeof generatorModule.selectRelationshipNeighborhood,'function');
  const ids=generatorModule.selectRelationshipNeighborhood({
    bank:fullBank,
    rng:seeded(19),
    size:16,
    requiredRelationshipIds:['phrasal-verb:look-after','collocation:take-a-break']
  });
  assert.equal(ids.length,16);
  assert.ok(ids.includes('phrasal-verb:look-after'));
  assert.ok(ids.includes('collocation:take-a-break'));
  assert.equal(relationIdsConnected(ids,fullBank,2),true);
});

test('controlled neighborhood board exposes at least eight productive swaps with high relationship coverage',()=>{
  assert.equal(typeof generatorModule.relationshipCoverage,'function');
  const ids=generatorModule.selectRelationshipNeighborhood({
    bank:fullBank,rng:seeded(31),size:16
  });
  const board=createControlledBoard({
    bank:fullBank,
    relationshipIds:ids,
    rows:7,columns:7,
    rng:seeded(44),
    minScoringMoves:8,
    minProductiveRows:4,
    minProductiveColumns:4,
    minRelationshipCoverage:0.85,
    allowStartingMatches:false
  });
  const moves=findImmediateScoringMoves(board,fullBank);
  assert.ok(moves.length>=8,`expected >=8 productive swaps, got ${moves.length}`);
  const activeWords=new Set(ids.flatMap(id=>fullBank.byId.get(id).tokens));
  assert.ok(board.tiles.every(tile=>activeWords.has(tile.word)),'board contains word outside active neighborhood');
  assert.ok(generatorModule.relationshipCoverage(board,fullBank,ids)>=0.85);
  assert.equal(findMatches(board,fullBank).length,0);
});


function selectedGraphIsConnected(ids,bank){
  if(ids.length<=1)return true;
  const remaining=new Set(ids);
  const queue=[ids[0]];
  remaining.delete(ids[0]);
  while(queue.length){
    const id=queue.shift();
    const tokens=new Set(bank.byId.get(id).tokens);
    for(const other of [...remaining]){
      if(bank.byId.get(other).tokens.some(token=>tokens.has(token))){
        remaining.delete(other);
        queue.push(other);
      }
    }
  }
  return remaining.size===0;
}

test('normal 12-20 relation neighborhoods are graph-connected across representative seeds',()=>{
  for(const size of [12,16,20]){
    for(const seed of [3,17,41]){
      const ids=generatorModule.selectRelationshipNeighborhood({
        bank:fullBank,rng:seeded(seed),size
      });
      assert.equal(
        selectedGraphIsConnected(ids,fullBank),
        true,
        `disconnected neighborhood size=${size} seed=${seed}: ${ids.join(', ')}`
      );
    }
  }
});

test('tutorial-required LOOK AFTER and MAKE SENSE still end inside one connected neighborhood',()=>{
  const ids=generatorModule.selectRelationshipNeighborhood({
    bank:fullBank,
    rng:seeded(27),
    size:16,
    requiredRelationshipIds:['phrasal-verb:look-after','collocation:make-sense']
  });
  assert.equal(selectedGraphIsConnected(ids,fullBank),true);
});
