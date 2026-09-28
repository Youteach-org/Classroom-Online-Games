import { analyzeProsody } from "./speech/prosody.mjs";
import { evaluateAttempt } from "./evaluation/evaluation-engine.mjs";

const ATTEMPT_KEY="talkTalkStandaloneAttemptV1";
const DB_NAME="talk-talk-standalone";
const STORE_NAME="audio";
const DB_VERSION=1;

function safeNow(now){
  return typeof now==="function" ? Number(now()) : Date.now();
}

function clone(value){
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createStandaloneAttempt({
  studentKey="student",
  studentName="Paul",
  partnerName="Paulina",
  activityTitle="Tell me what happened",
  now=Date.now
}={}){
  const createdAt=safeNow(now);
  return {
    version:1,
    attemptId:"standalone-"+createdAt,
    studentKey:String(studentKey),
    studentName:String(studentName),
    partnerName:String(partnerName),
    activityTitle:String(activityTitle),
    mode:"practice",
    status:"ready",
    createdAt,
    completedAt:null,
    durationMs:0,
    audioKey:"",
    transcript:{
      status:"pending",
      heardText:"",
      source:"oral-grader-not-connected"
    },
    evaluation:null,
    teacher:{
      status:"unreviewed",
      published:false,
      comments:""
    }
  };
}

export function buildLocalStandaloneEvaluation({
  samples,
  sampleRate=16000,
  durationMs=0
}={}){
  const prosody=analyzeProsody(samples,sampleRate);
  const duration=Number(durationMs || prosody.durationMs || 0);
  const completionScore=duration > 0
    ? Math.max(20,Math.min(100,Math.round(duration/30000*100)))
    : 0;

  return evaluateAttempt({
    task:{
      kind:"conversation",
      weights:{
        pronunciation:20,
        fluency:20,
        grammarVocabulary:20,
        interaction:20,
        taskCompletion:20
      }
    },
    prosody,
    taskCompletionEvidence:{
      confidence:duration > 0 ? "high" : "low",
      score:completionScore,
      evidence:[{type:"recorded-duration",durationMs:duration}]
    }
  });
}

export function completeStandaloneAttempt(attempt,{
  durationMs=0,
  audioKey="standalone-latest-audio",
  evaluation=null,
  now=Date.now
}={}){
  return {
    ...clone(attempt),
    status:"recorded",
    completedAt:safeNow(now),
    durationMs:Number(durationMs)||0,
    audioKey:String(audioKey||""),
    transcript:{
      status:"pending",
      heardText:"",
      source:"oral-grader-not-connected"
    },
    evaluation:clone(evaluation)
  };
}

export function publishStandaloneAttempt(attempt,{
  comments="",
  now=Date.now
}={}){
  return {
    ...clone(attempt),
    teacher:{
      status:"reviewed",
      published:true,
      comments:String(comments||""),
      publishedAt:safeNow(now)
    }
  };
}

function openDb(indexedDBApi=globalThis.indexedDB){
  if(!indexedDBApi) return Promise.resolve(null);
  return new Promise((resolve,reject)=>{
    const request=indexedDBApi.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("IndexedDB open failed."));
  });
}

export function createIndexedDbBlobStore(indexedDBApi=globalThis.indexedDB){
  return {
    async put(key,blob){
      const db=await openDb(indexedDBApi);
      if(!db) return false;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,"readwrite");
        tx.objectStore(STORE_NAME).put(blob,key);
        tx.oncomplete=()=>{ db.close?.(); resolve(true); };
        tx.onerror=()=>{ db.close?.(); reject(tx.error||new Error("Audio save failed.")); };
      });
    },
    async get(key){
      const db=await openDb(indexedDBApi);
      if(!db) return null;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,"readonly");
        const request=tx.objectStore(STORE_NAME).get(key);
        request.onsuccess=()=>resolve(request.result??null);
        request.onerror=()=>reject(request.error||new Error("Audio load failed."));
        tx.oncomplete=()=>db.close?.();
      });
    },
    async delete(key){
      const db=await openDb(indexedDBApi);
      if(!db) return false;
      return new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE_NAME,"readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete=()=>{ db.close?.(); resolve(true); };
        tx.onerror=()=>{ db.close?.(); reject(tx.error||new Error("Audio delete failed.")); };
      });
    }
  };
}

export function createStandaloneAttemptStore({
  storage=globalThis.localStorage,
  blobStore=createIndexedDbBlobStore()
}={}){
  return {
    async save(attempt,{audioBlob=null}={}){
      if(!storage?.setItem) throw new Error("Standalone storage is unavailable.");
      const safe=clone(attempt);
      storage.setItem(ATTEMPT_KEY,JSON.stringify(safe));
      if(audioBlob && safe?.audioKey) await blobStore?.put?.(safe.audioKey,audioBlob);
      return safe;
    },
    async load(){
      if(!storage?.getItem) return {attempt:null,audioBlob:null};
      let attempt=null;
      try{ attempt=JSON.parse(storage.getItem(ATTEMPT_KEY)||"null"); }catch{ attempt=null; }
      const audioBlob=attempt?.audioKey ? await blobStore?.get?.(attempt.audioKey) ?? null : null;
      return {attempt,audioBlob};
    },
    async clear(){
      let attempt=null;
      try{ attempt=JSON.parse(storage?.getItem?.(ATTEMPT_KEY)||"null"); }catch{}
      storage?.removeItem?.(ATTEMPT_KEY);
      if(attempt?.audioKey) await blobStore?.delete?.(attempt.audioKey);
    }
  };
}
