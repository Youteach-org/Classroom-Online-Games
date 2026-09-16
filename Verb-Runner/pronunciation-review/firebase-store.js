import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getDatabase,ref,get,onValue,push,set,update} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const cfg=window.SUPPORT_METER_CONFIG;
if(!cfg?.firebase)throw new Error('Firebase configuration is unavailable.');

export const ROOT='classroomGames/verbRunnerV2/pronunciationReview';
const db=getDatabase(initializeApp(cfg.firebase));
const at=path=>ref(db,`${ROOT}/${path}`);

export function watchRecords(callback,onError){
  return onValue(at('audios'),snap=>callback(snap.exists()?snap.val()||{}:{}),onError);
}

export async function getReport(audioId,reportId){
  const snap=await get(at(`audios/${audioId}/reports/${reportId}`));
  return snap.exists()?snap.val():null;
}

export async function saveAudioPatch(audioId,patch){
  await update(at(`audios/${audioId}`),patch);
}

export async function addReport(audioId,report){
  const item=push(at(`audios/${audioId}/reports`));
  await set(item,report);
  return item.key;
}

export async function setNamedReport(audioId,reportId,report){
  await set(at(`audios/${audioId}/reports/${reportId}`),report);
}

export async function updateReport(audioId,reportId,patch){
  await update(at(`audios/${audioId}/reports/${reportId}`),patch);
}

export async function addHistory(audioId,event){
  const item=push(at(`audios/${audioId}/history`));
  await set(item,event);
  return item.key;
}
