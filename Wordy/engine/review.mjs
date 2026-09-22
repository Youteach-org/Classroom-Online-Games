import { cloneBoard } from './board.mjs';
import { getRelationship } from './relationship-bank.mjs';

function sameSwap(a,b){
  if(!a||!b)return false;
  return (a.fromTileId===b.fromTileId&&a.toTileId===b.toTileId)||
    (a.fromTileId===b.toTileId&&a.toTileId===b.fromTileId);
}

function primaryMatch(move,bank){
  return [...(move.matches??[])].sort((a,b)=>{
    const ar=getRelationship(bank,a.relationshipId);
    const br=getRelationship(bank,b.relationshipId);
    return (br?.baseScore??0)-(ar?.baseScore??0)||
      (b.tileIds?.length??0)-(a.tileIds?.length??0)||
      String(a.relationshipId).localeCompare(String(b.relationshipId));
  })[0]??null;
}

export function captureMissedOpportunity({board,scoringMoves,chosenSwap,bank}){
  const moves=[...(scoringMoves??[])].sort((a,b)=>(b.projectedScore??0)-(a.projectedScore??0));
  if(moves.length===0)return null;
  const best=moves[0];
  const chosen=moves.find(move=>sameSwap(move.swap,chosenSwap));
  if(chosen&&(chosen.projectedScore??0)>=(best.projectedScore??0))return null;
  const match=primaryMatch(best,bank);
  if(!match||!getRelationship(bank,match.relationshipId))return null;
  return {
    boardSnapshot:cloneBoard(board),
    relationshipId:match.relationshipId,
    suggestedSwap:{fromTileId:best.swap.fromTileId,toTileId:best.swap.toTileId},
    projectedScore:best.projectedScore??0
  };
}

export function buildRoundReview({newRelationshipIds,missedOpportunities,bank,limit=3}){
  const cap=Math.max(0,Number(limit)||0);
  const seenNew=new Set();
  const newLearning=[];
  for(const id of newRelationshipIds??[]){
    if(seenNew.has(id))continue;
    seenNew.add(id);
    const relation=getRelationship(bank,id);
    if(relation)newLearning.push(relation);
    if(newLearning.length>=cap)break;
  }

  const seenMissed=new Set();
  const missed=[];
  for(const item of [...(missedOpportunities??[])].sort((a,b)=>(b.projectedScore??0)-(a.projectedScore??0))){
    const relation=getRelationship(bank,item.relationshipId);
    if(!relation)continue;
    const swap=item.suggestedSwap;
    const ids=[String(swap?.fromTileId??''),String(swap?.toTileId??'')].sort();
    const key=`${item.relationshipId}|${ids[0]}>${ids[1]}`;
    if(seenMissed.has(key))continue;
    seenMissed.add(key);
    missed.push({...item,relationship:relation});
    if(missed.length>=cap)break;
  }
  return {newLearning,missed};
}
