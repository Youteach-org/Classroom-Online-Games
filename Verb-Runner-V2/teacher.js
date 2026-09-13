import {createSession,subscribeSession,closeSession} from './session-sync.js';

const $=id=>document.getElementById(id);
let activeCode='';
let unsubscribe=null;

function difficulty(){
  return document.querySelector('input[name="difficulty"]:checked')?.value||'medium';
}

function readSettings(){
  const d=difficulty();
  const defaults={
    easy:{preview:true,answerSpacing:1080,distractors:2,speedScale:.88},
    medium:{preview:false,answerSpacing:820,distractors:3,speedScale:1},
    hard:{preview:false,answerSpacing:640,distractors:4,speedScale:1.18}
  }[d];

  const previewChoice=$('previewEnabled').value;
  return {
    difficulty:d,
    challengeCount:Number($('challengeCount').value)||12,
    preview:previewChoice==='auto'?defaults.preview:previewChoice==='yes',
    initialSpeed:Number($('initialSpeed').value)||18,
    maxSpeed:Number($('maxSpeed').value)||31,
    answerSpacing:(Number($('answerSpacing').value)||defaults.answerSpacing)/1000,
    distractors:Number($('distractors').value)||defaults.distractors,
    obstacleFrequency:Number($('obstacleFrequency').value)||45,
    momentumCorrect:Number($('momentumCorrect').value)||8,
    momentumGrammarLoss:Number($('momentumGrammarLoss').value)||15,
    momentumObstacleLoss:Number($('momentumObstacleLoss').value)||5,
    speedScale:defaults.speedScale
  };
}

function setFrozen(frozen){
  document.querySelectorAll('.setup-panel input,.setup-panel select').forEach(el=>el.disabled=frozen);
  $('createSession').hidden=frozen;
  $('closeSession').hidden=!frozen;
}

function runnerCard(student){
  const attempts=(student.correct||0)+(student.grammarErrors||0);
  const accuracy=attempts?Math.round((student.correct||0)/attempts*100):0;
  return `<article class="student-card ${student.online===false?'offline':''}">
    <div class="student-head"><strong>${student.id||'Runner'}</strong><span class="status-dot"></span></div>
    <div class="student-meta">
      <div><span>PROGRESS</span><b>${student.progress||0} / ${student.total||12}</b></div>
      <div><span>MOMENTUM</span><b>${student.momentum??75}%</b></div>
      <div><span>STREAK</span><b>${student.streak||0}</b></div>
      <div><span>ACCURACY</span><b>${accuracy}%</b></div>
    </div>
    <div class="challenge-line">${student.status==='finished'?'Finished':(student.challengeLabel||'Waiting for challenge')}</div>
  </article>`;
}

function renderSession(data){
  const students=Object.values(data?.students||{});
  $('studentCount').textContent=`${students.length} runner${students.length===1?'':'s'}`;
  $('onlineCount').textContent=`${students.filter(s=>s.online!==false).length} online`;
  $('studentGrid').innerHTML=students.map(runnerCard).join('');
  $('emptyMonitor').hidden=students.length>0;
  if(!students.length)$('emptyMonitor').textContent='Waiting for runners to join.';
}

$('createSession').addEventListener('click',async()=>{
  $('teacherNotice').textContent='';
  try{
    const settings=readSettings();
    activeCode=await createSession(settings);
    const link=new URL('./',location.href);
    link.searchParams.set('session',activeCode);
    $('sessionCode').textContent=activeCode;
    $('studentLink').value=link.href;
    $('sessionBox').hidden=false;
    $('connectionState').textContent='LIVE · '+activeCode;
    setFrozen(true);
    unsubscribe?.();
    unsubscribe=subscribeSession(activeCode,renderSession);
  }catch(err){
    console.error(err);
    $('teacherNotice').textContent='Could not create the session. Check Firebase connectivity.';
  }
});

$('closeSession').addEventListener('click',async()=>{
  if(!activeCode)return;
  await closeSession(activeCode);
  unsubscribe?.();unsubscribe=null;
  $('connectionState').textContent='CLOSED';
  $('teacherNotice').textContent='Session closed. Create a new session to continue.';
  setFrozen(false);
});

$('copyLink').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText($('studentLink').value);
    $('copyLink').textContent='COPIED';
    setTimeout(()=>$('copyLink').textContent='COPY LINK',900);
  }catch{
    $('studentLink').select();
  }
});
