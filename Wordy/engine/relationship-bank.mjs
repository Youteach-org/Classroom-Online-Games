export function normalizeToken(value){
  return String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
}

function assertRelationship(raw,index){
  if(!raw||typeof raw!=='object')throw new Error(`invalid relationship at index ${index}`);
  if(!String(raw.id||'').trim())throw new Error(`invalid relationship id at index ${index}`);
  if(!String(raw.category||'').trim())throw new Error(`invalid relationship category for ${raw.id}`);
  if(!Array.isArray(raw.tokens)||raw.tokens.length<2)throw new Error(`invalid relationship tokens for ${raw.id}`);
  if(!Number.isFinite(raw.baseScore)||raw.baseScore<=0)throw new Error(`invalid base score for ${raw.id}`);
  if(!Number.isFinite(raw.difficulty)||raw.difficulty<1)throw new Error(`invalid difficulty for ${raw.id}`);
}

export function createRelationshipBank(entries){
  if(!Array.isArray(entries))throw new Error('relationship entries must be an array');
  const byId=new Map();
  const byLength=new Map();
  const signatures=new Set();

  entries.forEach((raw,index)=>{
    assertRelationship(raw,index);
    const relation={
      ...raw,
      id:String(raw.id).trim(),
      category:String(raw.category).trim(),
      tokens:raw.tokens.map(normalizeToken)
    };
    if(relation.tokens.some(token=>!token))throw new Error(`invalid empty token for ${relation.id}`);
    if(byId.has(relation.id))throw new Error('duplicate relationship id: '+relation.id);
    const signature=relation.category+':'+relation.tokens.join('|');
    if(signatures.has(signature))throw new Error('duplicate relationship sequence: '+signature);
    signatures.add(signature);
    byId.set(relation.id,relation);
    if(!byLength.has(relation.tokens.length))byLength.set(relation.tokens.length,[]);
    byLength.get(relation.tokens.length).push(relation);
  });

  return {byId,byLength};
}

export function getRelationship(bank,id){
  return bank?.byId?.get(id)??null;
}

export function relationshipLengths(bank){
  return [...(bank?.byLength?.keys?.()??[])].sort((a,b)=>a-b);
}
