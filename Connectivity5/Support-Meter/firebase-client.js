import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getDatabase,ref,push,set,update,get,onValue,query,orderByChild,equalTo,onDisconnect,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const cfg=window.SUPPORT_METER_CONFIG;
const app=initializeApp(cfg.firebase);
const db=getDatabase(app);
const root=cfg.firebaseRoot||'classroomGames/supportMeter';
const at=path=>ref(db,`${root}/${path}`);
const token=bytes=>Array.from(crypto.getRandomValues(new Uint8Array(bytes)),value=>value.toString(16).padStart(2,'0')).join('');
const value=snapshot=>snapshot.exists()?snapshot.val():null;

export async function createAssignedSession(setNumber){
  const sessionRef=push(at('sessions')),sessionId=sessionRef.key,joinToken=token(18),manageToken=token(24),now=Date.now();
  await update(at(''),{[`sessions/${sessionId}`]:{setNumber:Number(setNumber),joinToken,manageToken,status:'open',createdAt:now,lastActivity:now},[`sessionTokens/${joinToken}`]:{sessionId}});
  return {sessionId,joinToken,manageToken,setNumber:Number(setNumber),createdAt:now};
}

export async function resolveJoinToken(joinToken){
  if(!joinToken)return null;
  const lookup=value(await get(at(`sessionTokens/${joinToken}`)));if(!lookup?.sessionId)return null;
  const session=value(await get(at(`sessions/${lookup.sessionId}`)));
  return session?.status==='open'?{...session,sessionId:lookup.sessionId}:null;
}

export async function createRun(input){
  const runRef=push(at('runs')),runId=runRef.key,now=Date.now();
  const run={studentName:String(input.studentName||'Student').slice(0,60),classCode:String(input.classCode||'CONNECT5').slice(0,40),sessionId:input.sessionId||'free',setNumber:Number(input.setNumber),storyOrder:input.storyOrder||[1,2,3,4,5,6,7,8],storyProgress:1,currentStory:Number(input.setNumber)*10+Number(input.storyOrder?.[0]||1),phase:'story',lastAction:'Started Support Meter',liveFeeling:null,liveExpression:null,latestResult:'waiting',attempt:1,supportMeter:0,score:0,streak:0,status:'online',startedAt:now,lastSeen:now,updatedAt:now,completedAt:null,redirectGeneration:0};
  await set(runRef,run);await onDisconnect(runRef).update({status:'offline',lastSeen:serverTimestamp(),updatedAt:serverTimestamp()});
  return {runId,run};
}

export async function updateRun(runId,patch){await update(at(`runs/${runId}`),{...patch,lastSeen:Date.now(),updatedAt:Date.now()});}
export async function completeRun(runId,patch){
  const runRef=at(`runs/${runId}`);await update(runRef,{...patch,status:'completed',phase:'completed',completedAt:serverTimestamp(),lastSeen:serverTimestamp(),updatedAt:serverTimestamp()});
  return value(await get(runRef));
}
export async function appendResponse(runId,response){const responseRef=push(at(`responses/${runId}`));await set(responseRef,{...response,createdAt:Date.now()});return responseRef.key;}
export function watchRun(runId,callback){return onValue(at(`runs/${runId}`),snapshot=>callback(value(snapshot)));}
export function watchSessions(callback){return onValue(at(''),snapshot=>{const data=value(snapshot)||{};callback({sessions:data.sessions||{},runs:data.runs||{}});});}
export function watchRuns(sessionId,callback){const request=query(at('runs'),orderByChild('sessionId'),equalTo(sessionId));return onValue(request,snapshot=>callback(value(snapshot)||{}));}
export async function deleteRun(runId){await update(at(''),{[`runs/${runId}`]:null,[`responses/${runId}`]:null});}

export async function redirectRun(runId,target){
  const run=value(await get(at(`runs/${runId}`)));if(!run)throw new Error('Student activity is no longer available.');
  const reset=window.SupportMeterFirebaseCore.resetForRedirect({...run,id:runId},target,Date.now());delete reset.id;
  await update(at(''),{[`runs/${runId}`]:reset,[`responses/${runId}`]:null,[`sessions/${target.sessionId}/lastActivity`]:Date.now()});
}

export async function downloadSessionData(sessionId){
  const runs=value(await get(query(at('runs'),orderByChild('sessionId'),equalTo(sessionId))))||{},allResponses=value(await get(at('responses')))||{},responses={};
  for(const runId of Object.keys(runs))responses[runId]=allResponses[runId]||{};
  return {runs,responses};
}

export async function deleteAssignedSession(sessionId){
  const session=value(await get(at(`sessions/${sessionId}`)));if(!session)return false;
  const {runs}=await downloadSessionData(sessionId),changes={[`sessions/${sessionId}`]:null,[`sessionTokens/${session.joinToken}`]:null};
  for(const runId of Object.keys(runs)){changes[`runs/${runId}`]=null;changes[`responses/${runId}`]=null;}
  await update(at(''),changes);return true;
}

export async function cleanupExpiredFreeRuns(){
  const runs=value(await get(query(at('runs'),orderByChild('sessionId'),equalTo('free'))))||{},changes={},now=Date.now();
  for(const [runId,run] of Object.entries(runs))if(window.SupportMeterFirebaseCore.retentionDecision(run,now)==='delete'){changes[`runs/${runId}`]=null;changes[`responses/${runId}`]=null;}
  if(Object.keys(changes).length)await update(at(''),changes);return Object.keys(changes).length/2;
}

export {db};
