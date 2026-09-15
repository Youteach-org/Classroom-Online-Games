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
const FREE_ROOT=`${ROOT}/freeMode/students`;

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
  for(let tries=0;tries<8;tries++){
    const snap=await get(ref(db,`${ROOT}/sessions/${code}`));
    if(!snap.exists())break;
    code=makeCode();
  }
  const now=serverTimestamp();
  await set(ref(db,`${ROOT}/sessions/${code}`),{
    code,
    status:'active',
    createdAt:now,
    lastActivity:now,
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

function subscribeSession(code,callback,onError){
  code=normalizeCode(code);
  return onValue(
    ref(db,`${ROOT}/sessions/${code}`),
    snap=>callback(snap.exists()?snap.val():null),
    error=>onError?.(error)
  );
}

function subscribeSessions(callback,onError){
  return onValue(
    ref(db,`${ROOT}/sessions`),
    snap=>callback(snap.exists()?snap.val():{}),
    error=>onError?.(error)
  );
}

async function closeSession(code){
  code=normalizeCode(code);
  if(!code)return;
  await update(ref(db,`${ROOT}/sessions/${code}`),{
    status:'closed',
    closedAt:serverTimestamp(),
    lastActivity:serverTimestamp()
  });
}

async function registerFreeRunnerPresence(runnerId,data={}){
  if(!runnerId)return;
  const studentRef=ref(db,`${FREE_ROOT}/${runnerId}`);
  const existingSnap=await get(studentRef);
  const existing=existingSnap.exists()?existingSnap.val():null;
  const now=serverTimestamp();

  await update(studentRef,{
    id:runnerId,
    studentName:String(data.studentName||existing?.studentName||runnerId).slice(0,60),
    status:existing?.status||'waiting',
    online:true,
    joinedAt:existing?.joinedAt||now,
    lastSeen:now,
    runner:Number(data.runner??existing?.runner??0),
    difficulty:data.difficulty||existing?.difficulty||'medium',
    level:Number(data.level??existing?.level??1),
    mode:data.mode||existing?.mode||'race',
    total:Number(data.total??existing?.total??20),
    challenge:Number(existing?.challenge)||1,
    challengeLabel:existing?.challengeLabel||'Free mode · choosing race and runner',
    lastAction:'Connected in free mode',
    latestResult:existing?.latestResult||'waiting',
    lastEventAt:Date.now()
  });

  try{
    await onDisconnect(studentRef).update({
      online:false,
      lastSeen:serverTimestamp()
    });
  }catch{}
}

function subscribeFreeRunners(callback,onError){
  return onValue(
    ref(db,FREE_ROOT),
    snap=>callback(snap.exists()?snap.val():{}),
    error=>onError?.(error)
  );
}

async function connectFreeRunner(runnerId,data={}){
  if(!runnerId)return;
  const studentRef=ref(db,`${FREE_ROOT}/${runnerId}`);
  const existingSnap=await get(studentRef);
  const existing=existingSnap.exists()?existingSnap.val():null;
  await update(studentRef,{
    id:runnerId,
    studentName:String(data.studentName||existing?.studentName||runnerId).slice(0,60),
    status:'running',
    online:true,
    joinedAt:existing?.joinedAt||serverTimestamp(),
    lastSeen:serverTimestamp(),
    progress:0,
    total:Number(data.total)||20,
    momentum:75,
    streak:0,
    correct:0,
    grammarErrors:0,
    obstacleHits:0,
    runner:Number(data.runner)||0,
    difficulty:data.difficulty||'medium',
    level:Number(data.level)||1,
    mode:data.mode||'race',
    challenge:1,
    challengeLabel:'Preparing challenge',
    lastAction:'Started Verb Runner · free mode',
    latestChoice:'',
    latestResult:'waiting',
    correctAnswer:'',
    lastPrompt:'',
    attempt:1,
    lastEventAt:Date.now()
  });
  try{
    await onDisconnect(studentRef).update({
      online:false,
      lastSeen:serverTimestamp()
    });
  }catch{}
}

async function updateFreeRunner(runnerId,patch={}){
  if(!runnerId)return;
  await update(ref(db,`${FREE_ROOT}/${runnerId}`),{
    ...patch,
    online:true,
    lastSeen:serverTimestamp()
  });
}

async function finishFreeRunner(runnerId,result={}){
  return updateFreeRunner(runnerId,{
    ...result,
    status:'finished',
    latestResult:'completed',
    lastAction:'Finished race · free mode',
    finishedAt:serverTimestamp(),
    lastEventAt:Date.now()
  });
}

async function registerRunnerPresence(code,runnerId,data={}){
  code=normalizeCode(code);
  if(!code||!runnerId)return;
  const studentRef=ref(db,`${ROOT}/sessions/${code}/students/${runnerId}`);
  const existingSnap=await get(studentRef);
  const existing=existingSnap.exists()?existingSnap.val():null;
  const now=serverTimestamp();

  await update(studentRef,{
    id:runnerId,
    studentName:String(data.studentName||existing?.studentName||runnerId).slice(0,60),
    status:'waiting',
    online:true,
    joinedAt:existing?.joinedAt||now,
    lastSeen:now,
    runner:Number(data.runner??existing?.runner??0),
    difficulty:data.difficulty||existing?.difficulty||'medium',
    level:Number(data.level??existing?.level??1),
    mode:data.mode||existing?.mode||'race',
    challenge:Number(existing?.challenge)||1,
    challengeLabel:existing?.challengeLabel||'Choosing race and runner',
    lastAction:'Connected to Verb Runner',
    latestResult:existing?.latestResult||'waiting',
    lastEventAt:Date.now()
  });

  await update(ref(db,`${ROOT}/sessions/${code}`),{lastActivity:serverTimestamp()});

  try{
    await onDisconnect(studentRef).update({
      online:false,
      lastSeen:serverTimestamp()
    });
  }catch{}
}

async function connectRunner(code,runnerId,data={}){
  code=normalizeCode(code);
  if(!code||!runnerId)return;
  const studentRef=ref(db,`${ROOT}/sessions/${code}/students/${runnerId}`);
  await set(studentRef,{
    id:runnerId,
    studentName:String(data.studentName||runnerId).slice(0,60),
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
    difficulty:data.difficulty||'medium',
    level:Number(data.level)||1,
    mode:data.mode||'race',
    challenge:1,
    challengeLabel:'Preparing challenge',
    lastAction:'Started Verb Runner',
    latestChoice:'',
    latestResult:'waiting',
    correctAnswer:'',
    lastPrompt:'',
    attempt:1,
    lastEventAt:Date.now()
  });
  await update(ref(db,`${ROOT}/sessions/${code}`),{lastActivity:serverTimestamp()});
  try{
    await onDisconnect(studentRef).update({
      online:false,
      lastSeen:serverTimestamp()
    });
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
  await update(ref(db,`${ROOT}/sessions/${code}`),{lastActivity:serverTimestamp()});
}

async function finishRunner(code,runnerId,result={}){
  return updateRunner(code,runnerId,{
    ...result,
    status:'finished',
    latestResult:'completed',
    lastAction:'Finished race',
    finishedAt:serverTimestamp(),
    lastEventAt:Date.now()
  });
}

export {
  normalizeCode,makeRunnerId,createSession,loadSession,subscribeSession,subscribeSessions,closeSession,
  registerFreeRunnerPresence,subscribeFreeRunners,connectFreeRunner,updateFreeRunner,finishFreeRunner,
  registerRunnerPresence,connectRunner,updateRunner,finishRunner
};
