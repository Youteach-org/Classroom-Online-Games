import {
  areSwapNeighbors,
  cloneBoard,
  createBoard,
  neighborForDirection,
  swapTiles,
  tileById
} from './board.mjs';
import { findMatches } from './matcher.mjs';
import { scoreResolution } from './scoring.mjs';
import { buildRelationshipBag } from './refill.mjs';

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${(match.tileIds??[]).join(',')}`;
}

function swapSortKey(board,swap){
  const a=tileById(board,swap.fromTileId);
  const b=tileById(board,swap.toTileId);
  return [a?.row??99,a?.column??99,b?.row??99,b?.column??99];
}

export function enumerateSwaps(board){
  if(!board?.tiles)return [];
  const swaps=[];
  for(const tile of board.tiles){
    for(const direction of ['right','down']){
      const neighborId=neighborForDirection(board,tile.id,direction);
      if(neighborId&&areSwapNeighbors(board,tile.id,neighborId)){
        swaps.push({fromTileId:tile.id,toTileId:neighborId});
      }
    }
  }
  return swaps.sort((a,b)=>{
    const ak=swapSortKey(board,a),bk=swapSortKey(board,b);
    for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i])return ak[i]-bk[i];
    return a.fromTileId.localeCompare(b.fromTileId)||a.toTileId.localeCompare(b.toTileId);
  });
}

export function findImmediateScoringMoves(board,bank){
  const before=new Set(findMatches(board,bank).map(matchKey));
  const allKnown=new Set(bank?.byId?.keys?.()??[]);
  const scoring=[];
  for(const swap of enumerateSwaps(board)){
    const next=swapTiles(board,swap.fromTileId,swap.toTileId);
    const matches=findMatches(next,bank);
    const created=matches.filter(match=>!before.has(matchKey(match)));
    if(created.length===0)continue;
    const score=scoreResolution({matches:created,bank,discoveredIds:allKnown,cascadeDepth:0});
    scoring.push({swap,matches:created,projectedScore:score.total,board:next});
  }
  return scoring.sort((a,b)=>b.projectedScore-a.projectedScore);
}

export function hasViablePlay(board,bank){
  if(findMatches(board,bank).length>0)return true;
  return findImmediateScoringMoves(board,bank).length>0;
}

function productiveDimensions(board,moves){
  const rows=new Set(),columns=new Set();
  for(const move of moves){
    for(const id of [move.swap.fromTileId,move.swap.toTileId]){
      const tile=tileById(board,id);
      if(tile){rows.add(tile.row);columns.add(tile.column);}
    }
  }
  return {rows:rows.size,columns:columns.size};
}

function isProductiveEnough(board,bank,{minScoringMoves,minProductiveRows,minProductiveColumns,allowStartingMatches}){
  if(!allowStartingMatches&&findMatches(board,bank).length>0)return false;
  const moves=findImmediateScoringMoves(board,bank);
  const spread=productiveDimensions(board,moves);
  return moves.length>=minScoringMoves&&
    spread.rows>=minProductiveRows&&
    spread.columns>=minProductiveColumns;
}

function randomWordRows({rows,columns,words,rng}){
  const counts=new Map();
  return Array.from({length:rows},()=>Array.from({length:columns},()=>{
    let candidates=words.filter(word=>(counts.get(word)??0)<3);
    if(candidates.length===0)candidates=words;
    const word=candidates[Math.floor(rng()*candidates.length)]??words[0];
    counts.set(word,(counts.get(word)??0)+1);
    return word;
  }));
}

function seedProductiveMoves(wordRows,relations,count){
  if(count<=0||relations.length===0)return;
  const rows=wordRows.length,columns=wordRows[0].length;
  const seedCount=Math.min(rows,Math.max(1,count));
  for(let index=0;index<seedCount;index++){
    const relation=relations[index%relations.length];
    const tokens=[...relation.tokens];
    if(tokens.length<2||tokens.length>columns)continue;
    const row=seedCount===1?0:Math.round(index*(rows-1)/(seedCount-1));
    const maxStart=columns-tokens.length;
    const start=seedCount===1?0:Math.round(index*maxStart/(seedCount-1));
    [tokens[tokens.length-2],tokens[tokens.length-1]]=[tokens[tokens.length-1],tokens[tokens.length-2]];
    for(let offset=0;offset<tokens.length;offset++)wordRows[row][start+offset]=tokens[offset];
  }
}

export function createControlledBoard({
  bank,
  rows=7,
  columns=7,
  rng=Math.random,
  minScoringMoves=4,
  minProductiveRows=3,
  minProductiveColumns=3,
  allowStartingMatches=false,
  fallbackBoard=null
}){
  const minimum=Math.max(0,Number(minScoringMoves)||0);
  const minimumRows=Math.max(1,Number(minProductiveRows)||1);
  const minimumColumns=Math.max(1,Number(minProductiveColumns)||1);
  const bag=buildRelationshipBag(bank);
  const words=bag.map(entry=>entry.word);
  if(words.length===0)throw new Error('relationship bank has no playable words');
  const relations=[...(bank?.byId?.values?.()??[])]
    .filter(relation=>relation.tokens.length>=2&&relation.tokens.length<=columns)
    .sort((a,b)=>a.tokens.length-b.tokens.length||a.id.localeCompare(b.id));
  const seedCount=Math.max(minimum,minimumRows,minimumColumns);

  for(let attempt=0;attempt<240;attempt++){
    const wordRows=randomWordRows({rows,columns,words,rng});
    seedProductiveMoves(wordRows,relations,seedCount);
    const board=createBoard(wordRows,{columns});
    if(isProductiveEnough(board,bank,{
      minScoringMoves:minimum,
      minProductiveRows:minimumRows,
      minProductiveColumns:minimumColumns,
      allowStartingMatches
    }))return board;
  }

  if(fallbackBoard){
    const fallback=cloneBoard(fallbackBoard);
    if(fallback.rows!==rows||fallback.columns!==columns)throw new Error('fallback board dimensions do not match request');
    if(!isProductiveEnough(fallback,bank,{
      minScoringMoves:minimum,
      minProductiveRows:minimumRows,
      minProductiveColumns:minimumColumns,
      allowStartingMatches
    }))throw new Error('fallback board is not productive enough');
    return fallback;
  }
  throw new Error('unable to generate a productive board');
}

export function recoverDeadBoard({
  board,
  bank,
  rng=Math.random,
  fallbackBoard=null,
  minScoringMoves=4,
  minProductiveRows=3,
  minProductiveColumns=3
}){
  if(hasViablePlay(board,bank))return {board,reset:false};
  const replacement=createControlledBoard({
    bank,rows:board.rows,columns:board.columns,rng,
    minScoringMoves,minProductiveRows,minProductiveColumns,
    allowStartingMatches:false,fallbackBoard
  });
  return {board:replacement,reset:true};
}
