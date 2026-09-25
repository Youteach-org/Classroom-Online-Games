import { cloneBoard, emptyCellsByColumn, occupancyMap, removeTiles, settleGravity } from './board.mjs';
import { findMatches } from './matcher.mjs';
import { normalizeToken } from './relationship-bank.mjs';
import { scoreResolution } from './scoring.mjs';

export class CascadeLimitError extends Error{
  constructor(message='cascade limit exceeded'){
    super(message);
    this.name='CascadeLimitError';
  }
}

function refillFromTop(board,refillTile,cascadeDepth){
  const current=cloneBoard(board);
  const cells=emptyCellsByColumn(current);
  for(const {row,column} of cells){
    const raw=refillTile({
      row,
      column,
      board:cloneBoard(current),
      cascadeDepth
    });
    const id=String(raw?.id??'');
    const word=normalizeToken(raw?.word);
    if(!id)throw new Error(`invalid refill tile at ${row},${column}`);
    if(!word)throw new Error(`invalid refill word at ${row},${column}`);
    current.tiles.push({id,word,row,column});
  }
  const map=occupancyMap(current);
  if(map.some(row=>row.some(cell=>cell==null)))throw new Error('refill did not fill board');
  return current;
}

export function resolvePlayerActivation({
  board,bank,discoveredIds=new Set(),refillTile,maxCascadeDepth=12
}){
  if(typeof refillTile!=='function')throw new Error('refillTile must be a function');
  const known=discoveredIds instanceof Set?new Set(discoveredIds):new Set(discoveredIds??[]);
  const originalKnown=new Set(known);
  let current=cloneBoard(board);
  let matches=findMatches(current,bank);
  if(matches.length===0)throw new Error('no ready relationships');

  const generations=[];
  for(let depth=0;matches.length>0;depth++){
    if(depth>maxCascadeDepth)throw new CascadeLimitError();
    const boardBefore=cloneBoard(current);
    const score=scoreResolution({matches,bank,discoveredIds:known,cascadeDepth:depth});
    const removedTileIds=[...new Set(matches.flatMap(match=>match.tileIds??[]))];
    const boardAfterRemoval=removeTiles(current,removedTileIds);
    const boardAfterGravity=settleGravity(boardAfterRemoval);
    const boardAfterRefill=refillFromTop(boardAfterGravity,refillTile,depth+1);
    current=boardAfterRefill;
    generations.push({
      matches,
      removedTileIds,
      score,
      cascadeDepth:depth,
      boardBefore,
      boardAfterRemoval:cloneBoard(boardAfterRemoval),
      boardAfterGravity:cloneBoard(boardAfterGravity),
      boardAfterRefill:cloneBoard(boardAfterRefill)
    });
    for(const match of matches)known.add(match.relationshipId);
    matches=findMatches(current,bank);
  }

  return {
    board:current,
    generations,
    newlyDiscoveredIds:[...known].filter(id=>!originalKnown.has(id)),
    totalScore:generations.reduce((total,generation)=>total+generation.score.total,0)
  };
}
