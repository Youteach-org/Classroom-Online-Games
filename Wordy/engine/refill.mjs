import { areSwapNeighbors, cloneBoard, neighborForDirection, swapTiles } from './board.mjs';
import { findMatches } from './matcher.mjs';
import { normalizeToken } from './relationship-bank.mjs';

export const DEFAULT_REFILL_PROFILE={
  cascadeWeight:0.15,
  opportunityWeight:0.70,
  distractorWeight:0.15
};

export function buildRelationshipBag(bank,{relationshipIds=null,categoryWeights={}}={}){
  const allowed=relationshipIds?new Set(relationshipIds):null;
  const weights=new Map();
  for(const relation of bank?.byId?.values?.()??[]){
    if(allowed&&!allowed.has(relation.id))continue;
    const categoryWeight=Math.max(0,Number(categoryWeights[relation.category]??1));
    if(categoryWeight===0)continue;
    for(const token of relation.tokens){
      const word=normalizeToken(token);
      weights.set(word,(weights.get(word)??0)+categoryWeight);
    }
  }
  return [...weights.entries()]
    .map(([word,weight])=>({word,weight}))
    .sort((a,b)=>b.weight-a.weight||a.word.localeCompare(b.word));
}

function placeCandidate({word,row,column,board}){
  const normalized=normalizeToken(word);
  if(!normalized)throw new Error('candidate word is required');
  if(board.tiles.some(tile=>tile.row===row&&tile.column===column))throw new Error('refill cell is already occupied');
  const next=cloneBoard(board);
  next.tiles.push({id:'__refill_probe__',word:normalized,row,column});
  return next;
}

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${(match.tileIds??[]).join(',')}`;
}

function relationConnects(bank,a,b){
  for(const relation of bank?.byId?.values?.()??[]){
    if(relation.tokens.includes(a)&&relation.tokens.includes(b))return true;
  }
  return false;
}

function inspectCandidate({word,row,column,board,bank}){
  const normalized=normalizeToken(word);
  const placed=placeCandidate({word:normalized,row,column,board});
  const immediate=findMatches(placed,bank).filter(match=>match.tileIds.includes('__refill_probe__'));
  const beforeKeys=new Set(findMatches(placed,bank).map(matchKey));
  let oneSwap=false;
  for(const direction of ['left','right','up','down']){
    const neighborId=neighborForDirection(placed,'__refill_probe__',direction);
    if(!neighborId||!areSwapNeighbors(placed,'__refill_probe__',neighborId))continue;
    const swapped=swapTiles(placed,'__refill_probe__',neighborId);
    const created=findMatches(swapped,bank).filter(match=>!beforeKeys.has(matchKey(match)));
    if(created.some(match=>match.tileIds.includes('__refill_probe__'))){oneSwap=true;break;}
  }
  let adjacentConnections=0;
  for(const direction of ['left','right','up','down']){
    const neighborId=neighborForDirection(placed,'__refill_probe__',direction);
    const neighbor=placed.tiles.find(tile=>tile.id===neighborId);
    if(neighbor&&relationConnects(bank,normalized,neighbor.word))adjacentConnections++;
  }
  const duplicates=board.tiles.filter(tile=>tile.word===normalized).length;
  return {normalized,immediateCount:immediate.length,oneSwap,adjacentConnections,duplicates};
}

export function scoreRefillCandidate(args){
  const info=inspectCandidate(args);
  let score=0;
  score+=info.immediateCount*100;
  if(info.oneSwap)score+=30;
  score+=info.adjacentConnections*12;
  score-=info.duplicates*10;
  if(info.duplicates>=3)score-=20;
  return score;
}

function weightedPick(entries,rng){
  if(entries.length===0)return null;
  const weights=entries.map(entry=>Math.max(0.001,Number(entry.pickWeight)||0.001));
  const total=weights.reduce((sum,value)=>sum+value,0);
  let target=Math.min(0.999999999,Math.max(0,Number(rng())||0))*total;
  for(let index=0;index<entries.length;index++){
    target-=weights[index];
    if(target<0)return entries[index];
  }
  return entries[entries.length-1];
}

export function chooseRefillWord({
  row,column,board,bank,bag=null,rng=Math.random,profile=DEFAULT_REFILL_PROFILE,
  maxTokenCopies=Infinity
}){
  const candidates=(bag??buildRelationshipBag(bank)).map(entry=>{
    const info=inspectCandidate({word:entry.word,row,column,board,bank});
    if(info.duplicates>=maxTokenCopies)return null;
    const localScore=scoreRefillCandidate({word:entry.word,row,column,board,bank});
    const bucket=info.immediateCount>0?'cascade':(info.oneSwap||info.adjacentConnections>0?'opportunity':'distractor');
    return {...entry,localScore,bucket,pickWeight:entry.weight*Math.max(1,localScore+40)};
  }).filter(Boolean);
  if(candidates.length===0)throw new Error('refill has no candidate below copy cap');

  const groups={
    cascade:candidates.filter(item=>item.bucket==='cascade'),
    opportunity:candidates.filter(item=>item.bucket==='opportunity'),
    distractor:candidates.filter(item=>item.bucket==='distractor')
  };
  const bucketWeights=[
    ['cascade',Math.max(0,Number(profile.cascadeWeight)||0)],
    ['opportunity',Math.max(0,Number(profile.opportunityWeight)||0)],
    ['distractor',Math.max(0,Number(profile.distractorWeight)||0)]
  ].filter(([name,weight])=>weight>0&&groups[name].length>0);
  const total=bucketWeights.reduce((sum,[,weight])=>sum+weight,0);
  let roll=Math.min(0.999999999,Math.max(0,Number(rng())||0))*total;
  let chosenBucket=bucketWeights.at(-1)?.[0]??'distractor';
  for(const [name,weight] of bucketWeights){
    roll-=weight;
    if(roll<0){chosenBucket=name;break;}
  }
  const picked=weightedPick(groups[chosenBucket],rng)??weightedPick(candidates,rng);
  return picked.word;
}
