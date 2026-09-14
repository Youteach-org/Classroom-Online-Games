import {createSession,subscribeSession,closeSession} from './session-sync.js';

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
let activeCode='';
let unsubscribe=null;
let currentStudents=[];
let focusId=null;
let hideOffline=false;

function difficulty(){
  return document.querySelector('input[name="difficulty"]:checked')?.value||'medium';
}

function readSettings(){
  const d=difficulty();
  const defaults={
    easy:{preview:false,answerSpacing:820,distractors:2,speedScale:.90,penalty:0},
    medium:{preview:false,answerSpacing:820,distractors:3,speedScale:1.00,penalty:1},
    hard:{preview:false,answerSpacing:820,distractors:4,speedScale:1.15,penalty:2}
  }[d];

  const previewChoice=$('previewEnabled').value;
  return {
    difficulty:d,
    challengeCount:Number($('challengeCount').value)||20,
    preview:previewChoice==='auto'?defaults.preview:previewChoice==='yes',
    initialSpeed:Number($('initialSpeed').value)||18,
    maxSpeed:Number($('maxSpeed').value)||31,
    answerSpacing:(Number($('answerSpacing').value)||defaults.answerSpacing)/1000,
    distractors:Number($('distractors').value)||defaults.distractors,
    obstacleFrequency:Number($('obstacleFrequency').value)||45,
    momentumCorrect:Number($('momentumCorrect').value)||8,
    penalty:defaults.penalty,
    speedScale:defaults.speedScale
  };
}

function openSettings(open){
  $('settingsMenu').hidden=!open;
  $('settingsToggle').setAttribute('aria-expanded',String(open));
  $('settingsToggle').textContent=open?'GAME SETTINGS ▴':'GAME SETTINGS ▾';
}

function setFrozen(frozen){
  document.querySelectorAll('#settingsMenu input,#settingsMenu select').forEach(el=>el.disabled=frozen);
  $('createSession').hidden=frozen;
  $('closeSession').hidden=!frozen;
  if(frozen)openSettings(false);
}

function displayName(student){
  return student.studentName||student.nickname||student.name||student.id||'Runner';
}

function isOnline(student){
  return student.online!==false;
}

function accuracyFor(student){
  if(Number.isFinite(Number(student.accuracy))&&student.status==='finished')return Math.round(Number(student.accuracy));
  const attempts=(Number(student.correct)||0)+(Number(student.grammarErrors)||0);
  return attempts?Math.round((Number(student.correct)||0)/attempts*100):0;
}

function statusLabel(student){
  const status=String(student.status||'waiting').toLowerCase();
  if(status==='finished'||status==='victory')return 'COMPLETED';
  if(status==='paused')return 'PAUSED';
  if(status==='offline'||student.online===false)return 'OFFLINE';
  if(status==='running')return 'RUNNING';
  return status.toUpperCase();
}

function studentCard(student){
  const node=document.createElement('article');
  const id=String(student.id||displayName(student));
  const online=isOnline(student);
  const total=Number(student.total)||20;
  const progress=Number(student.progress)||0;
  const challenge=Number(student.challenge)||Math.min(progress+1,total);
  const level=Number(student.level)||1;
  const status=String(student.status||'waiting').toLowerCase();
  const mode=student.mode?String(student.mode).replace(/[-_]/g,' '):'Race';
  node.className='student-card'+(online?'':' offline');
  node.tabIndex=0;
  node.dataset.id=id;
  node.setAttribute('role','button');
  node.setAttribute('aria-label',displayName(student)+', '+statusLabel(student));
  node.innerHTML=`<div class="student-top"><div class="student-name">${esc(displayName(student))}</div><span class="${online?'online-badge':'offline-badge'}">${online?'● LIVE':statusLabel(student)}</span></div>
    <div class="activity-title">Level ${level} · Challenge ${Math.min(challenge,total)} / ${total}</div>
    <div class="activity-summary">${esc(student.challengeLabel||'Waiting for the next challenge')}</div>
    <div class="live-grid">
      <div class="live-item">Mode<strong>${esc(mode)}</strong></div>
      <div class="live-item">Status<strong class="result-${esc(status)}">${esc(statusLabel(student))}</strong></div>
      <div class="live-item">Progress<strong>${progress} / ${total}</strong></div>
      <div class="live-item">Momentum<strong>${Math.round(Number(student.momentum) || 0)}%</strong></div>
    </div>
    <div class="stats">
      <div><small>Accuracy</small><strong>${accuracyFor(student)}%</strong></div>
      <div><small>Streak</small><strong>${Number(student.bestStreak??student.streak)||0}</strong></div>
    </div>`;

  const activate=()=>{focusId=focusId===id?null:id;renderStudents();};
  node.addEventListener('click',activate);
  node.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}
  });
  return node;
}

function renderStudents(){
  const visible=hideOffline?currentStudents.filter(isOnline):currentStudents;
  $('studentGrid').innerHTML='';
  $('focusedStudent').innerHTML='';
  $('thumbnailRail').innerHTML='';

  if(focusId&&!visible.some(student=>String(student.id||displayName(student))===focusId))focusId=null;

  if(focusId){
    const focused=visible.find(student=>String(student.id||displayName(student))===focusId);
    if(focused)$('focusedStudent').appendChild(studentCard(focused));
    visible.filter(student=>String(student.id||displayName(student))!==focusId).forEach(student=>$('thumbnailRail').appendChild(studentCard(student)));
  }else{
    visible.forEach(student=>$('studentGrid').appendChild(studentCard(student)));
  }

  $('studentGrid').hidden=Boolean(focusId);
  $('focusStage').hidden=!focusId;
  $('emptyMonitor').hidden=visible.length>0;
  if(!visible.length)$('emptyMonitor').textContent=activeCode?'Waiting for runners to join.':'Create a session to begin.';

  $('studentCount').textContent=`${currentStudents.length} runner${currentStudents.length===1?'':'s'}`;
  $('onlineCount').textContent=`${currentStudents.filter(isOnline).length} online`;
}

function renderSession(data){
  currentStudents=Object.values(data?.students||{});
  renderStudents();
}

$('settingsToggle').addEventListener('click',()=>openSettings($('settingsMenu').hidden));
$('settingsClose').addEventListener('click',()=>openSettings(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape')openSettings(false);});

$('hideOffline').addEventListener('click',()=>{
  hideOffline=!hideOffline;
  $('hideOffline').textContent=hideOffline?'Show offline':'Hide offline';
  renderStudents();
});

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
    $('monitorDot').classList.add('live');
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
  unsubscribe?.();
  unsubscribe=null;
  $('connectionState').textContent='CLOSED';
  $('monitorDot').classList.remove('live');
  $('teacherNotice').textContent='Session closed. Create a new session to continue.';
  setFrozen(false);
});

$('copyLink').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText($('studentLink').value);
    $('copyLink').textContent='COPIED!';
    setTimeout(()=>$('copyLink').textContent='COPY LINK',1000);
  }catch{
    $('studentLink').select();
  }
});

renderStudents();
