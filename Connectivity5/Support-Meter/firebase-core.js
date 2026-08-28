(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.SupportMeterFirebaseCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const HOUR=60*60*1000,DAY=24*HOUR,FIVE_MINUTES=5*60*1000;
  const entries=value=>Object.entries(value||{}).map(([id,row])=>({id,...row}));
  function visibleRuns(value,sessionId,now=Date.now()){
    if(!sessionId)return [];
    return entries(value).filter(run=>run.sessionId===sessionId&&Number(run.lastSeen||0)>now-HOUR).sort((a,b)=>String(a.studentName||'').localeCompare(String(b.studentName||'')));
  }
  function normalizeSessions(sessionValue,runValue,now=Date.now()){
    const runs=entries(runValue).filter(run=>Number(run.lastSeen||0)>now-HOUR);
    const result=[];const freeCount=runs.filter(run=>run.sessionId==='free').length;
    if(freeCount)result.push({sessionId:'free',sessionType:'free',setNumber:null,studentCount:freeCount,createdAt:Math.min(...runs.filter(run=>run.sessionId==='free').map(run=>Number(run.startedAt||run.lastSeen||now))),label:`Free Mode · ${freeCount} student${freeCount===1?'':'s'}`});
    entries(sessionValue).filter(session=>session.status==='open').sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)).forEach(session=>{
      const count=runs.filter(run=>run.sessionId===session.id).length;
      result.push({...session,sessionId:session.id,sessionType:'assigned',studentCount:count,label:`Set ${session.setNumber} · ${count} student${count===1?'':'s'} · ${new Date(Number(session.createdAt||now)).toLocaleString()}`});
    });
    return result;
  }
  function resetForRedirect(run,target,now=Date.now()){
    return {...run,sessionId:target.sessionId,setNumber:Number(target.setNumber),storyOrder:[1,2,3,4,5,6,7,8],storyProgress:1,currentStory:Number(target.setNumber)*10+1,phase:'redirected',lastAction:'Moved to the correct teacher session',liveFeeling:null,liveExpression:null,latestResult:'waiting',attempt:1,score:0,supportMeter:0,streak:0,status:'online',completedAt:null,lastSeen:now,redirectGeneration:Number(run.redirectGeneration||0)+1,redirectReason:'You joined the wrong session. Your teacher moved you to the correct activity. Your previous progress was cleared.'};
  }
  function retentionDecision(run,now=Date.now()){
    if(run.sessionId!=='free')return 'keep';
    if(run.completedAt&&Number(run.completedAt)<=now-FIVE_MINUTES)return 'delete';
    if(!run.completedAt&&Number(run.lastSeen||0)<=now-DAY)return 'delete';
    return 'keep';
  }
  return {normalizeSessions,visibleRuns,resetForRedirect,retentionDecision,HOUR,DAY,FIVE_MINUTES};
});
