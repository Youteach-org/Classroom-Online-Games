import { getRelationship } from './relationship-bank.mjs';

function sameCell(a,b){
  return a?.row===b?.row&&a?.col===b?.col;
}

function sameSwap(a,b){
  if(!a||!b)return false;
  return (sameCell(a.from,b.from)&&sameCell(a.to,b.to))||
    (sameCell(a.from,b.to)&&sameCell(a.to,b.from));
}

function snapshotRows(board){
  return board.map(row=>row.map(tile=>tile?.word??null));
}

function primaryMatch(move,bank){
  return [...(move.matches??[])].sort((a,b)=>{
    const ar=getRelationship(bank,a.relationshipId);
    const br=getRelationship(bank,b.relationshipId);
    return (br?.baseScore??0)-(ar?.baseScore??0)||
      (b.cells?.length??0)-(a.cells?.length??0)||
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
  if(!match)return null;
  if(!getRelationship(bank,match.relationshipId))return null;

  return {
    boardRows:snapshotRows(board),
    relationshipId:match.relationshipId,
    suggestedSwap:{
      from:{...best.swap.from},
      to:{...best.swap.to}
    },
    projectedScore:best.projectedScore??0
  };
}

export function buildRoundReview({
  newRelationshipIds,
  missedOpportunities,
  bank,
  limit=3
}){
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
    const key=`${item.relationshipId}|${swap?.from?.row}:${swap?.from?.col}>${swap?.to?.row}:${swap?.to?.col}`;
    if(seenMissed.has(key))continue;
    seenMissed.add(key);
    missed.push({...item,relationship:relation});
    if(missed.length>=cap)break;
  }

  return {newLearning,missed};
}
