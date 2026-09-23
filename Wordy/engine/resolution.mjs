import { removeTiles, settleGravity, refillEmptyRuns } from './board.mjs';
import { findMatches } from './matcher.mjs';
import { scoreResolution } from './scoring.mjs';

export class CascadeLimitError extends Error{
  constructor(message='cascade limit exceeded'){
    super(message);
    this.name='CascadeLimitError';
  }
}

export function resolvePlayerActivation({
  board,bank,discoveredIds=new Set(),refillTile,maxCascadeDepth=12
}){
  if(typeof refillTile!=='function')throw new Error('refillTile must be a function');
  const known=discoveredIds instanceof Set?new Set(discoveredIds):new Set(discoveredIds??[]);
  const originalKnown=new Set(known);
  let current=board;
  let matches=findMatches(current,bank);
  if(matches.length===0)throw new Error('no ready relationships');

  const generations=[];
  for(let depth=0;matches.length>0;depth++){
    if(depth>maxCascadeDepth)throw new CascadeLimitError();
    const score=scoreResolution({matches,bank,discoveredIds:known,cascadeDepth:depth});
    const removedTileIds=[...new Set(matches.flatMap(match=>match.tileIds??[]))];
    current=removeTiles(current,removedTileIds);
    current=settleGravity(current);
    current=refillEmptyRuns(current,refillTile);
    generations.push({matches,removedTileIds,score,cascadeDepth:depth});
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
