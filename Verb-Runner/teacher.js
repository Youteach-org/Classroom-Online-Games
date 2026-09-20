import {createSession,subscribeSessions,subscribeFreeRunners,closeSession} from './session-sync.js?v=live-cog-session-20260920';
import {
  loadTeacherContext,
  registerLiveGameSession,
  endLiveGameSession
} from '../shared/youteach-live-bridge.mjs';

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const ONLINE_MS=50000;

let sessions={};
let freeRunners={};
let active='all';
let focusId=null;
let hideOffline=false;

function currentYouTeachContext(){
  return loadTeacherContext();
}

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
    initialSpeed:Number($('initialSpeed').value)||12,
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

function isOnline(student){
  if(student.online===false)return false;
  const seen=Number(student.lastSeen)||0;
  return !seen||Date.now()-seen<ONLINE_MS;
}

function activeCatalog(){
  return Object.entries(sessions)
    .filter(([,session])=>session&&session.status==='active')
    .map(([code,session])=>({code,...session}))
    .sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
}

function studentsFor(code,session){
  return Object.values(session?.students||{}).map(student=>({
    ...student,
    _sessionCode:code,
    _key:code+'::'+String(student.id||student.studentName||'runner')
  }));
}

function studentsForFree(){
  return Object.values(freeRunners||{}).map(student=>({
    ...student,
    _sessionCode:'FREE MODE',
    _key:'free::'+String(student.id||student.studentName||'runner')
  }));
}

function visibleStudents(){
  const catalog=activeCatalog();
  const allSessionStudents=catalog.flatMap(item=>studentsFor(item.code,item));
  let students=active==='all'
    ?allSessionStudents.concat(studentsForFree())
    :(active==='free'?studentsForFree():studentsFor(active,sessions[active]));
  if(hideOffline)students=students.filter(isOnline);
  return students;
}

function displayName(student){
  return student.nickname||student.studentName||student.fullName||student.name||student.id||'Runner';
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
  if(!isOnline(student)||status==='offline')return 'OFFLINE';
  if(status==='running')return 'RUNNING';
  return status.toUpperCase();
}

function resultLabel(student){
  const result=String(student.latestResult||'waiting').toLowerCase();
  if(result==='correct')return 'CORRECT';
  if(result==='incorrect'||result==='wrong')return 'INCORRECT';
  if(result==='missed')return 'MISSED';
  if(result==='obstacle')return 'OBSTACLE';
  if(result==='completed')return 'COMPLETED';
  return result.toUpperCase();
}

function sessionCard(item){
  const students=studentsFor(item.code,item);
  const online=students.filter(isOnline).length;
  const selected=item.code===active;
  const difficulty=String(item.settings?.difficulty||'medium').toUpperCase();
  return `<button class="session-card${selected?' selected':''}" type="button" data-session-id="${esc(item.code)}">
    <strong>SESSION ${esc(item.code)}</strong>
    <span>${students.length} runner${students.length===1?'':'s'} · <span class="session-live">${online} LIVE</span></span>
    <small>${difficulty} · ${Number(item.settings?.challengeCount)||20} challenges</small>
  </button>`;
}

function refreshSessionList(){
  const catalog=activeCatalog();
  if(active!=='all'&&active!=='free'&&!catalog.some(item=>item.code===active))active='all';

  const allSessionStudents=catalog.flatMap(item=>studentsFor(item.code,item));
  const freeStudents=studentsForFree();
  const allStudents=allSessionStudents.concat(studentsForFree());
  const allOnline=allStudents.filter(isOnline).length;
  const allSelected=active==='all'?' selected':'';
  const allCard=`<button class="session-card${allSelected}" type="button" data-session-id="all">
    <strong>ALL RUNNERS</strong>
    <span>${allStudents.length} runners · <span class="session-live">${allOnline} LIVE</span></span>
    <small>${catalog.length} active session${catalog.length===1?'':'s'} + free mode</small>
  </button>`;

  const freeSelected=active==='free'?' selected':'';
  const freeOnline=freeStudents.filter(isOnline).length;
  const freeCard=`<button class="session-card${freeSelected}" type="button" data-session-id="free">
    <strong>FREE MODE</strong>
    <span>${freeStudents.length} runner${freeStudents.length===1?'':'s'} · <span class="session-live">${freeOnline} LIVE</span></span>
    <small>Players who opened Verb Runner without a class session</small>
  </button>`;

  $('sessionList').innerHTML=allCard+freeCard+catalog.map(sessionCard).join('');

  const selected=(active==='all'||active==='free')?null:sessions[active];
  $('shareBox').hidden=!selected||selected.status!=='active';
  $('closeSession').hidden=!selected||selected.status!=='active';
  if(selected){
    const link=new URL('../',location.href);
    link.searchParams.set('session',active);
    $('studentLink').value=link.href;
  }
}

function studentCard(student){
  const node=document.createElement('article');
  const key=student._key;
  const online=isOnline(student);
  const total=Number(student.total)||20;
  const progress=Number(student.progress)||0;
  const challenge=Number(student.challenge)||Math.min(progress+1,total);
  const level=Number(student.level)||1;
  const mode=student.mode?String(student.mode).replace(/[-_]/g,' '):'Race';
  const status=String(student.status||'waiting').toLowerCase();
  const result=String(student.latestResult||'waiting').toLowerCase();
  const choice=student.latestChoice||'—';
  const correct=student.correctAnswer||'—';

  node.className='student-card'+(online?'':' offline');
  node.tabIndex=0;
  node.dataset.id=key;
  node.setAttribute('role','button');
  node.setAttribute('aria-label',displayName(student)+', '+statusLabel(student));

  node.innerHTML=`<div class="student-top">
      <div class="student-name">${esc(displayName(student))}
        ${student.identitySource==='youteach'?'<span class="identity-chip">YOUTEACH</span>':''}
        ${active==='all'?'<span class="session-chip">'+esc(student._sessionCode)+'</span>':''}
      </div>
      <span class="${online?'online-badge':'offline-badge'}">${online?'● LIVE':statusLabel(student)}</span>
    </div>
    <div class="activity-title">Level ${level} · Challenge ${Math.min(challenge,total)} / ${total} · ${esc(mode)}${student.groupName?' · '+esc(student.groupName):''}</div>
    <div class="activity-summary">${esc(student.challengeLabel||'Waiting for the next challenge')}</div>
    <div class="last-action">${esc(student.lastAction||'Waiting for activity')}</div>
    <div class="live-grid">
      <div class="live-item">Selected<strong>${esc(choice)}</strong></div>
      <div class="live-item">Result<strong class="result-${esc(result)}">${esc(resultLabel(student))}</strong></div>
      <div class="live-item">Correct<strong>${esc(correct)}</strong></div>
      <div class="live-item">Attempt<strong>${Number(student.attempt)||1}</strong></div>
    </div>
    <div class="stats">
      <div><small>Progress</small><strong>${progress}/${total}</strong></div>
      <div><small>Momentum</small><strong>${Math.round(Number(student.momentum)||0)}%</strong></div>
      <div><small>Accuracy</small><strong>${accuracyFor(student)}%</strong></div>
      <div><small>Streak</small><strong>${Number(student.bestStreak??student.streak)||0}</strong></div>
    </div>`;

  const activate=()=>{focusId=focusId===key?null:key;renderStudents();};
  node.addEventListener('click',activate);
  node.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();activate();}
  });
  return node;
}

function renderStudents(){
  const allSessionStudents=activeCatalog().flatMap(item=>studentsFor(item.code,item));
  const all=active==='all'
    ?allSessionStudents.concat(studentsForFree())
    :(active==='free'?studentsForFree():studentsFor(active,sessions[active]));
  const visible=hideOffline?all.filter(isOnline):all;

  $('studentGrid').innerHTML='';
  $('focusedStudent').innerHTML='';
  $('thumbnailRail').innerHTML='';

  if(focusId&&!visible.some(student=>student._key===focusId))focusId=null;

  if(focusId){
    const focused=visible.find(student=>student._key===focusId);
    if(focused)$('focusedStudent').appendChild(studentCard(focused));
    visible.filter(student=>student._key!==focusId).forEach(student=>$('thumbnailRail').appendChild(studentCard(student)));
  }else{
    visible.forEach(student=>$('studentGrid').appendChild(studentCard(student)));
  }

  $('studentGrid').hidden=Boolean(focusId);
  $('focusStage').hidden=!focusId;
  $('emptyMonitor').hidden=visible.length>0;
  if(!visible.length)$('emptyMonitor').textContent=active==='all'?'No runners are visible yet.':(active==='free'?'No free-mode runners are visible yet.':'No runners have joined this session yet.');

  $('studentCount').textContent=`${all.length} runner${all.length===1?'':'s'}`;
  $('onlineCount').textContent=`${all.filter(isOnline).length} online`;
}

function refresh(){
  refreshSessionList();
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

$('sessionList').addEventListener('click',event=>{
  const button=event.target.closest('[data-session-id]');
  if(!button)return;
  active=button.dataset.sessionId;
  focusId=null;
  refresh();
});

$('createSession').addEventListener('click',async()=>{
  $('teacherNotice').textContent='';
  $('createSession').disabled=true;
  let code='';
  try{
    const teacherContext=currentYouTeachContext();
    code=await createSession(readSettings(),teacherContext);

    if(teacherContext){
      try{
        await registerLiveGameSession({
          teacherContext,
          gameId:'verb-runner',
          gameName:'Verb Runner',
          cogSessionId:code
        });
      }catch(error){
        await closeSession(code).catch(()=>{});
        throw error;
      }
    }

    active=code;
    focusId=null;
    openSettings(false);
    $('teacherNotice').textContent=teacherContext
      ?'Session '+code+' created for YouTeach group '+teacherContext.liveContext.groupName+'.'
      :'Session '+code+' created in standalone mode.';
  }catch(err){
    console.error(err);
    $('teacherNotice').textContent=err?.message||'Could not create the session.';
  }finally{
    $('createSession').disabled=false;
  }
});

$('closeSession').addEventListener('click',async()=>{
  if(active==='all'||active==='free'||!sessions[active])return;
  const code=active;
  const session=sessions[code]||{};
  const isYouTeachLive=session?.integration?.source==='youteach-buzzer';

  if(isYouTeachLive){
    const confirmed=confirm('End this activity for the group? Students will no longer be able to enter.');
    if(!confirmed)return;
  }

  try{
    if(isYouTeachLive){
      const teacherContext=currentYouTeachContext();
      if(!teacherContext){
        throw new Error('Reopen Classroom Online Games from YouTeach Buzzer before ending this group activity.');
      }
      await endLiveGameSession({teacherContext,cogSessionId:code});
    }

    await closeSession(code);
    active='all';
    focusId=null;
    $('teacherNotice').textContent='Session '+code+' ended.';
  }catch(err){
    console.error(err);
    $('teacherNotice').textContent=err?.message||'Could not end the selected session.';
  }
});

$('copyLink').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText($('studentLink').value);
    $('copyLink').textContent='COPIED!';
    setTimeout(()=>$('copyLink').textContent='COPY STUDENT LINK',1100);
  }catch{
    $('studentLink').select();
  }
});

subscribeSessions(
  data=>{
    sessions=data||{};
    $('monitorDot').classList.add('live');
    $('connectionState').textContent='Firebase Live';
    refresh();
  },
  error=>{
    console.error('Verb Runner Firebase monitor error',error);
    $('monitorDot').classList.remove('live');
    $('connectionState').textContent='Firebase Error';
    $('teacherNotice').textContent='Firebase connection failed or database rules do not allow Verb Runner sessions.';
  }
);

subscribeFreeRunners(
  data=>{
    freeRunners=data||{};
    $('monitorDot').classList.add('live');
    $('connectionState').textContent='Firebase Live';
    refresh();
  },
  error=>{
    console.error('Verb Runner free-mode monitor error',error);
    $('monitorDot').classList.remove('live');
    $('connectionState').textContent='Firebase Error';
    $('teacherNotice').textContent='Firebase connection failed or database rules do not allow Verb Runner free mode.';
  }
);

setInterval(()=>renderStudents(),15000);
refresh();
