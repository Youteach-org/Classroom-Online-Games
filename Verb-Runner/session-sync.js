import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getDatabase, ref, set, update, get, onValue, onDisconnect, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const firebaseConfig={
  apiKey:'AIzaSyCpKL-4eHrqFiUntViiUB2BPs60XumC1K4',
  authDomain:'youteach-d9a79.firebaseapp.com',
  databaseURL:'https://youteach-d9a79-default-rtdb.firebaseio.com',
  projectId:'youteach-d9a79',
  storageBucket:'youteach-d9a79.firebasestorage.app',
  messagingSenderId:'302548732789',
  appId:'1:302548732789:web:b230b7f74366488d45a13c'
};

const app=getApps()[0]||initializeApp(firebaseConfig);
const db=getDatabase(app);
const ROOT='classroomGames/verbRunnerV2';

function normalizeCode(code){
  return String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
}

function makeCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out='';
  for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}

function makeRunnerId(){
  const stored=localStorage.getItem('verbRunnerV2RunnerId');
  if(stored)return stored;
  const id='R-'+Math.random().toString(36).slice(2,6).toUpperCase();
  localStorage.setItem('verbRunnerV2RunnerId',id);
  return id;
}

async function createSession(settings){
  let code=makeCode();
  for(let tries=0;tries<5;tries++){
    const snap=await get(ref(db,`${ROOT}/sessions/${code}`));
    if(!snap.exists())break;
    code=makeCode();
  }
  await set(ref(db,`${ROOT}/sessions/${code}`),{
    status:'active',
    createdAt:serverTimestamp(),
    settings,
    students:{}
  });
  return code;
}

async function loadSession(code){
  code=normalizeCode(code);
  if(!code)return null;
  const snap=await get(ref(db,`${ROOT}/sessions/${code}`));
  return snap.exists()?snap.val():null;
}

function subscribeSession(code,callback){
  code=normalizeCode(code);
  return onValue(ref(db,`${ROOT}/sessions/${code}`),snap=>callback(snap.exists()?snap.val():null));
}

async function closeSession(code){
  code=normalizeCode(code);
  if(!code)return;
  await update(ref(db,`${ROOT}/sessions/${code}`),{status:'closed',closedAt:serverTimestamp()});
}

async function connectRunner(code,runnerId,data={}){
  code=normalizeCode(code);
  if(!code||!runnerId)return;
  const studentRef=ref(db,`${ROOT}/sessions/${code}/students/${runnerId}`);
  await set(studentRef,{
    id:runnerId,
    status:'running',
    online:true,
    joinedAt:serverTimestamp(),
    lastSeen:serverTimestamp(),
    progress:0,
    total:Number(data.total)||20,
    momentum:75,
    streak:0,
    correct:0,
    grammarErrors:0,
    obstacleHits:0,
    runner:Number(data.runner)||0,
    difficulty:data.difficulty||'medium'
  });
  try{
    await onDisconnect(studentRef).update({online:false,lastSeen:serverTimestamp(),status:'offline'});
  }catch{}
}

async function updateRunner(code,runnerId,patch={}){
  code=normalizeCode(code);
  if(!code||!runnerId)return;
  await update(ref(db,`${ROOT}/sessions/${code}/students/${runnerId}`),{
    ...patch,
    online:true,
    lastSeen:serverTimestamp()
  });
}

async function finishRunner(code,runnerId,result={}){
  return updateRunner(code,runnerId,{...result,status:'finished',finishedAt:serverTimestamp()});
}

export {
  normalizeCode,makeRunnerId,createSession,loadSession,subscribeSession,closeSession,
  connectRunner,updateRunner,finishRunner
};
