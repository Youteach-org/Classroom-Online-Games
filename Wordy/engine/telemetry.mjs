export const DEFAULT_TELEMETRY_KEY='wordy.prototype.telemetry.v1';

function readEvents(storage,key){
  if(!storage||typeof storage.getItem!=='function')return [];
  try{
    const raw=storage.getItem(key);
    if(!raw)return [];
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed:[];
  }catch{
    return [];
  }
}

function persist(storage,key,events){
  if(!storage||typeof storage.setItem!=='function')return;
  try{
    storage.setItem(key,JSON.stringify(events));
  }catch{
    // Prototype telemetry must never interrupt gameplay.
  }
}

export function createTelemetryStore({storage=null,key=DEFAULT_TELEMETRY_KEY}={}){
  let list=readEvents(storage,key);

  return {
    record(type,payload={}){
      const event={at:Date.now(),type:String(type),payload:{...payload}};
      list.push(event);
      persist(storage,key,list);
      return {...event,payload:{...event.payload}};
    },
    events(){
      return list.map(event=>({...event,payload:{...event.payload}}));
    },
    clear(){
      list=[];
      if(storage&&typeof storage.removeItem==='function'){
        try{ storage.removeItem(key); }catch{ /* non-fatal */ }
      }else{
        persist(storage,key,list);
      }
    }
  };
}
