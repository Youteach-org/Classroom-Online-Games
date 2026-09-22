export function seeded(seed=1){
  let value=seed>>>0;
  return ()=>{
    value=(value*1664525+1013904223)>>>0;
    return value/4294967296;
  };
}

export function createFakeStorage(){
  const values=new Map();
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
}

export function relation(id,tokens,category='collocation',baseScore=120,difficulty=1){
  return {id,category,tokens,baseScore,difficulty,meaning:id,explanation:id};
}

export function match(relationshipId,cells,orientation='horizontal',tokens=[]){
  return {relationshipId,cells,orientation,tokens};
}

export function boardFromTiles({rows,columns=12,tiles}){
  return {
    rows,
    columns,
    tiles:(tiles??[]).map(tile=>({...tile}))
  };
}
