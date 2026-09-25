import { cloneBoard } from './board.mjs';

function phraseFor(match){
  const tokens=Array.isArray(match?.tokens)?match.tokens:[];
  return tokens.join(' ').trim();
}

export function buildResolutionEvents(result){
  const generations=Array.isArray(result?.generations)?result.generations:[];
  return generations.map((generation,index)=>{
    const matches=Array.isArray(generation?.matches)?generation.matches:[];
    const phrases=matches.map(phraseFor).filter(Boolean);
    const depth=Number.isInteger(generation?.cascadeDepth)?generation.cascadeDepth:index;
    let prefix='';
    if(depth>0)prefix=`COMBO ×${depth+1} · `;
    else if(matches.length>1)prefix=`POP ×${matches.length} · `;
    const event={
      cascadeDepth:depth,
      relationshipIds:matches.map(match=>match.relationshipId),
      phrases,
      label:prefix+phrases.join(' + '),
      score:generation?.score?.total??0,
      removedTileIds:[...(generation?.removedTileIds??[])]
    };
    for(const key of ['boardBefore','boardAfterRemoval','boardAfterGravity','boardAfterRefill']){
      if(generation?.[key])event[key]=cloneBoard(generation[key]);
    }
    return event;
  }).filter(event=>event.label);
}
