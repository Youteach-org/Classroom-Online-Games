import { findCrossings } from './matcher.mjs';
import { getRelationship } from './relationship-bank.mjs';

export const DEFAULT_SCORE_CONFIG={
  lengthBonus:{2:0,3:40,4:90,5:150},
  batchBonusPerExtra:75,
  crossBonus:120,
  discoveryBonus:50,
  cascadeMultiplierStep:0.5
};

function lengthBonusFor(length,config){
  if(Object.prototype.hasOwnProperty.call(config.lengthBonus,length))return config.lengthBonus[length];
  const known=Object.keys(config.lengthBonus).map(Number).sort((a,b)=>a-b);
  const max=known.at(-1)??0;
  return length>max?(config.lengthBonus[max]??0)+(length-max)*60:0;
}

export function scoreResolution({
  matches,
  bank,
  discoveredIds=new Set(),
  cascadeDepth=0,
  config=DEFAULT_SCORE_CONFIG
}){
  const resolved=Array.isArray(matches)?matches:[];
  const known=discoveredIds instanceof Set?discoveredIds:new Set(discoveredIds??[]);
  let baseScore=0;
  let lengthBonus=0;
  const newIds=new Set();

  for(const match of resolved){
    const relation=getRelationship(bank,match.relationshipId);
    if(!relation)throw new Error('unknown relationship: '+match.relationshipId);
    baseScore+=relation.baseScore;
    lengthBonus+=lengthBonusFor(match.tileIds?.length??relation.tokens.length,config);
    if(!known.has(relation.id))newIds.add(relation.id);
  }

  const batchBonus=Math.max(0,resolved.length-1)*config.batchBonusPerExtra;
  const crossCount=findCrossings(resolved).length;
  const crossBonus=crossCount*config.crossBonus;
  const discoveryBonus=newIds.size*config.discoveryBonus;
  const subtotal=baseScore+lengthBonus+batchBonus+crossBonus+discoveryBonus;
  const multiplier=1+Math.max(0,Number(cascadeDepth)||0)*config.cascadeMultiplierStep;
  const total=Math.round(subtotal*multiplier);

  return {
    baseScore,
    lengthBonus,
    batchBonus,
    crossCount,
    crossBonus,
    discoveryBonus,
    multiplier,
    subtotal,
    total
  };
}
