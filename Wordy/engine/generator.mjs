import { createBoard, swapTiles } from './board.mjs';
import { findMatches, cellKey } from './matcher.mjs';
import { scoreResolution } from './scoring.mjs';

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${match.cells.map(cellKey).join(',')}`;
}

function cloneBoard(board){
  return board.map(row=>row.map(tile=>tile==null?null:{...tile}));
}

function shuffled(values,rng){
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.max(0,Math.min(i,Math.floor(rng()*(i+1))));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export function enumerateSwaps(board){
  if(!Array.isArray(board)||board.length===0||!Array.isArray(board[0]))return [];
  const swaps=[];
  const rows=board.length;
  const cols=board[0].length;
  for(let row=0;row<rows;row++){
    for(let col=0;col<cols;col++){
      if(col+1<cols)swaps.push({from:{row,col},to:{row,col:col+1}});
      if(row+1<rows)swaps.push({from:{row,col},to:{row:row+1,col}});
    }
  }
  return swaps;
}

export function findImmediateScoringMoves(board,bank){
  const before=new Set(findMatches(board,bank).map(matchKey));
  const allKnown=new Set(bank?.byId?.keys?.()??[]);
  const scoring=[];

  for(const swap of enumerateSwaps(board)){
    const next=swapTiles(board,swap.from,swap.to);
    const matches=findMatches(next,bank);
    const created=matches.filter(match=>!before.has(matchKey(match)));
    if(created.length===0)continue;
    const score=scoreResolution({
      matches:created,
      bank,
      discoveredIds:allKnown,
      cascadeDepth:0
    });
    scoring.push({swap,matches:created,projectedScore:score.total,board:next});
  }

  return scoring.sort((a,b)=>b.projectedScore-a.projectedScore||
    a.swap.from.row-b.swap.from.row||a.swap.from.col-b.swap.from.col||
    a.swap.to.row-b.swap.to.row||a.swap.to.col-b.swap.to.col);
}

export function hasViablePlay(board,bank){
  if(findMatches(board,bank).length>0)return true;
  return findImmediateScoringMoves(board,bank).length>0;
}

function connectedRelationshipSubset(bank,rng,targetSize){
  const all=[...(bank?.byId?.values?.()??[])];
  if(all.length===0)throw new Error('relationship bank is empty');
  const target=Math.min(all.length,Math.max(1,targetSize));
  const first=all[Math.floor(rng()*all.length)];
  const selected=[first];
  const selectedIds=new Set([first.id]);
  const tokens=new Set(first.tokens);

  while(selected.length<target){
    const connected=all.filter(relation=>
      !selectedIds.has(relation.id)&&relation.tokens.some(token=>tokens.has(token))
    );
    const pool=connected.length>0?connected:all.filter(relation=>!selectedIds.has(relation.id));
    if(pool.length===0)break;
    const relation=pool[Math.floor(rng()*pool.length)];
    selected.push(relation);
    selectedIds.add(relation.id);
    for(const token of relation.tokens)tokens.add(token);
  }

  return selected;
}

function wordRowsFromRelations(relations,rows,cols,rng){
  const needed=rows*cols;
  const source=relations.flatMap(relation=>relation.tokens);
  if(source.length===0)throw new Error('cannot generate board without tokens');
  const bag=[];
  while(bag.length<needed)bag.push(...shuffled(source,rng));
  const words=shuffled(bag.slice(0,needed),rng);
  return Array.from({length:rows},(_,row)=>words.slice(row*cols,(row+1)*cols));
}

export function createControlledBoard({
  bank,
  rows=7,
  cols=5,
  rng=Math.random,
  minScoringMoves=2,
  fallbackBoard=null
}){
  const targetSize=10+Math.floor(rng()*5);
  const relations=connectedRelationshipSubset(bank,rng,targetSize);
  const minimum=Math.max(0,Number(minScoringMoves)||0);

  for(let attempt=0;attempt<250;attempt++){
    const board=createBoard(wordRowsFromRelations(relations,rows,cols,rng));
    if(findImmediateScoringMoves(board,bank).length>=minimum)return board;
  }

  if(fallbackBoard){
    const fallback=cloneBoard(fallbackBoard);
    if(fallback.length!==rows||fallback[0]?.length!==cols)throw new Error('fallback board dimensions do not match request');
    if(findImmediateScoringMoves(fallback,bank).length<minimum)throw new Error('fallback board is not productive enough');
    return fallback;
  }

  throw new Error('unable to generate a productive board');
}

export function recoverDeadBoard({board,bank,rng=Math.random,fallbackBoard=null}){
  if(hasViablePlay(board,bank))return {board,reset:false};
  const replacement=createControlledBoard({
    bank,
    rows:board.length,
    cols:board[0].length,
    rng,
    minScoringMoves:2,
    fallbackBoard
  });
  return {board:replacement,reset:true};
}
