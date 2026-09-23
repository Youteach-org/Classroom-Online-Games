import {
  areSwapNeighbors,
  cloneBoard,
  createBoard,
  neighborForDirection,
  swapTiles,
  tileById
} from './board.mjs';
import { spanForWord } from './tile-size.mjs';
import { findMatches } from './matcher.mjs';
import { scoreResolution } from './scoring.mjs';

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${(match.tileIds??[]).join(',')}`;
}

function shuffled(values,rng){
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.max(0,Math.min(i,Math.floor(rng()*(i+1))));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function swapSortKey(board,swap){
  const a=tileById(board,swap.fromTileId);
  const b=tileById(board,swap.toTileId);
  return [a?.row??99,a?.startColumn??99,b?.row??99,b?.startColumn??99];
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
    const ak=swapSortKey(board,a);
    const bk=swapSortKey(board,b);
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

  return scoring.sort((a,b)=>{
    if(a.projectedScore!==b.projectedScore)return b.projectedScore-a.projectedScore;
    const ak=swapSortKey(board,a.swap);
    const bk=swapSortKey(board,b.swap);
    for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i])return ak[i]-bk[i];
    return 0;
  });
}

export function hasViablePlay(board,bank){
  if(findMatches(board,bank).length>0)return true;
  return findImmediateScoringMoves(board,bank).length>0;
}

function productiveRowCount(board,moves){
  const rows=new Set();
  for(const move of moves){
    const a=tileById(board,move.swap.fromTileId);
    const b=tileById(board,move.swap.toTileId);
    if(a)rows.add(a.row);
    if(b)rows.add(b.row);
  }
  return rows.size;
}

function isProductiveEnough(board,bank,minScoringMoves,minProductiveRows){
  const moves=findImmediateScoringMoves(board,bank);
  return moves.length>=minScoringMoves && productiveRowCount(board,moves)>=minProductiveRows;
}

function wordsBySpan(bank){
  const pools=new Map([[1,[]],[2,[]],[3,[]],[4,[]]]);
  const seen=new Set();
  for(const relation of bank?.byId?.values?.()??[]){
    for(const word of relation.tokens){
      if(seen.has(word))continue;
      seen.add(word);
      pools.get(spanForWord(word)).push(word);
    }
  }
  return pools;
}

function canFill(width,pools,memo=new Map()){
  if(width===0)return true;
  if(width<0)return false;
  if(memo.has(width))return memo.get(width);
  const result=[1,2,3,4].some(span=>pools.get(span)?.length&&canFill(width-span,pools,memo));
  memo.set(width,result);
  return result;
}

function randomPackedRow(columns,pools,rng){
  const row=[];
  let remaining=columns;
  while(remaining>0){
    const possible=shuffled([1,2,3,4],rng).filter(span=>
      span<=remaining && pools.get(span)?.length && canFill(remaining-span,pools)
    );
    if(possible.length===0)throw new Error(`cannot pack ${remaining} remaining columns`);
    const span=possible[0];
    const words=pools.get(span);
    row.push(words[Math.floor(rng()*words.length)]);
    remaining-=span;
  }
  return row;
}

export function createControlledBoard({
  bank,
  rows=7,
  columns=12,
  rng=Math.random,
  minScoringMoves=4,
  minProductiveRows=3,
  fallbackBoard=null
}){
  const minimum=Math.max(0,Number(minScoringMoves)||0);
  const minimumRows=Math.max(1,Number(minProductiveRows)||1);
  const pools=wordsBySpan(bank);

  for(let attempt=0;attempt<300;attempt++){
    let wordRows;
    try{
      wordRows=Array.from({length:rows},()=>randomPackedRow(columns,pools,rng));
    }catch{
      break;
    }
    const board=createBoard(wordRows,{columns});
    if(isProductiveEnough(board,bank,minimum,minimumRows))return board;
  }

  if(fallbackBoard){
    const fallback=cloneBoard(fallbackBoard);
    if(fallback.rows!==rows||fallback.columns!==columns)throw new Error('fallback board dimensions do not match request');
    if(!isProductiveEnough(fallback,bank,minimum,minimumRows))throw new Error('fallback board is not productive enough');
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
  minProductiveRows=3
}){
  if(hasViablePlay(board,bank))return {board,reset:false};
  const replacement=createControlledBoard({
    bank,
    rows:board.rows,
    columns:board.columns,
    rng,
    minScoringMoves,
    minProductiveRows,
    fallbackBoard
  });
  return {board:replacement,reset:true};
}
