import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getDatabase,ref,set,get,onValue,runTransaction,update} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig={
  apiKey:'AIzaSyCpKL-4eHrqFiUntViiUB2BPs60XumC1K4',
  authDomain:'youteach-d9a79.firebaseapp.com',
  databaseURL:'https://youteach-d9a79-default-rtdb.firebaseio.com',
  projectId:'youteach-d9a79',
  storageBucket:'youteach-d9a79.firebasestorage.app',
  messagingSenderId:'302548732789',
  appId:'1:302548732789:web:b230b7f74366488d45a13c'
};

const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const root='classroomGames/supportMeter/rumorImpostor';

const scenarios={
  phobias:[
    {
      id:'elevator',
      vocabulary:'claustrophobia',
      situation:'You have to enter a crowded elevator on the 20th floor.',
      general:['intense anxiety','avoiding certain places','feeling trapped or unsafe'],
      specific:['choosing the stairs','a small crowded space','closed doors']
    },
    {
      id:'plane',
      vocabulary:'aerophobia',
      situation:'You have to board a plane for a five-hour flight.',
      general:['intense anxiety','avoiding certain trips','feeling unsafe while traveling'],
      specific:['choosing another way to travel','takeoff and landing','being inside an aircraft']
    },
    {
      id:'balcony',
      vocabulary:'acrophobia',
      situation:'You step onto a balcony on the 30th floor and look down.',
      general:['intense anxiety','avoiding certain places','feeling unsafe'],
      specific:['high floors','looking down','balconies or mountains']
    },
    {
      id:'spider',
      vocabulary:'arachnophobia',
      situation:'You find a large spider next to your bed at night.',
      general:['a very strong fear reaction','avoiding certain places','something that may be harmless'],
      specific:['corners and webs','a small animal','eight legs']
    },
    {
      id:'snake',
      vocabulary:'ophidiophobia',
      situation:'You see a snake moving across the garden path.',
      general:['a very strong fear reaction','avoiding certain places','something that may be harmless'],
      specific:['gardens and trails','a long animal','moving close to the ground']
    },
    {
      id:'square',
      vocabulary:'agoraphobia',
      situation:'You are alone in a huge crowded public square far from home.',
      general:['intense anxiety','avoiding certain places','wanting to return somewhere safe'],
      specific:['public spaces','being away from home','large open or crowded places']
    }
  ],
  superstitions:[
    {
      id:'mirror',
      vocabulary:'superstition · bad luck',
      situation:'You accidentally break a mirror at home.',
      general:['expecting something bad','an old belief','changing behavior because of a belief'],
      specific:['a household object','something breaks','bad luck lasting for years']
    },
    {
      id:'ladder',
      vocabulary:'superstition · bad luck',
      situation:'You are about to walk under a ladder on the sidewalk.',
      general:['expecting something bad','avoiding an action','an old belief'],
      specific:['changing your path','something above you','walking underneath it']
    },
    {
      id:'black-cat',
      vocabulary:'superstition · bad luck',
      situation:'A black cat crosses the street directly in front of you.',
      general:['expecting something bad','an old belief','an animal connected with luck'],
      specific:['crossing your path','a dark-colored animal','changing direction']
    },
    {
      id:'salt',
      vocabulary:'superstition · bad luck',
      situation:'You spill salt at dinner and immediately throw some over your shoulder.',
      general:['an old belief','a small action to prevent bad luck','changing behavior because of a belief'],
      specific:['at the dinner table','something is spilled','throwing a little behind you']
    },
    {
      id:'horseshoe',
      vocabulary:'good luck charm',
      situation:'You hang a horseshoe near the door because you believe it brings luck.',
      general:['trying to attract good luck','an object with symbolic power','keeping something for protection'],
      specific:['hanging an object','near a door','a curved metal object']
    },
    {
      id:'clover',
      vocabulary:'good luck charm',
      situation:'You find a four-leaf clover and keep it in your wallet.',
      general:['trying to attract good luck','keeping a special object','an unusual symbol'],
      specific:['a plant','four leaves','keeping it with you']
    },
    {
      id:'bracelet',
      vocabulary:'good luck charm',
      situation:'You wear the same charm bracelet every time you take an important exam.',
      general:['trying to attract good luck','wearing something special','repeating a ritual'],
      specific:['jewelry','an important test','wearing it every time']
    },
    {
      id:'curse',
      vocabulary:'curse',
      situation:'You believe someone wished misfortune on you after an argument.',
      general:['expecting something bad','believing another person caused it','a negative belief'],
      specific:['another person is involved','a wish for misfortune','something bad happening afterward']
    },
    {
      id:'friday-13',
      vocabulary:'superstition · bad luck',
      situation:'You refuse to travel because the date is Friday the 13th.',
      general:['expecting something bad','changing plans because of a belief','a traditional idea'],
      specific:['a date on the calendar','the number 13','canceling plans']
    }
  ]
};

const phaseText={
  teams:{
    title:'Teams ready',
    description:'Students move into their teams and privately reveal their cards.',
    button:'Start general clues'
  },
  clue1:{
    title:'General clue',
    description:'Each student gives one general clue using a reporting-belief structure.',
    button:'Start specific clues'
  },
  clue2:{
    title:'More specific clue',
    description:'Each student gives a more specific clue. Do not say the situation directly.',
    button:'Open voting'
  },
  vote:{
    title:'Vote',
    description:'Students vote on their phones for the impostor in their own team.',
    button:'Reveal'
  },
  reveal:{
    title:'Reveal',
    description:'The impostor, crew situation and Unit 7 vocabulary are revealed.',
    button:''
  }
};

const teamNames=['Comet','Vinyl','Neon','Disco','Groove','Nova','Starlight','Rocket','Electric','Cosmic'];

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const initialTeacher=params.get('teacher')==='1';
const initialSession=(params.get('session')||'').trim().toUpperCase();

let currentMode=initialTeacher?'teacher':'student';
let currentSession=initialSession||null;
let teacherToken=null;
let unsubscribe=null;

const clientId=getClientId();

function getClientId(){
  const key='rumor-impostor-client-id';
  let id=localStorage.getItem(key);
  if(!id){
    id=crypto.randomUUID();
    localStorage.setItem(key,id);
  }
  return id;
}

function randomCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
}

function randomToken(){
  return crypto.randomUUID().replaceAll('-','');
}

function randomIndex(max){
  if(max<=1)return 0;
  return crypto.getRandomValues(new Uint32Array(1))[0]%max;
}

function shuffle(items){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){
    const j=randomIndex(i+1);
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function showStatus(message,tone='good'){
  const node=$('status');
  node.textContent=message;
  node.className='status show '+tone;
  clearTimeout(showStatus.timer);
  showStatus.timer=setTimeout(()=>node.classList.remove('show'),3200);
}

function setMode(mode){
  currentMode=mode;
  $('teacherView').style.display=mode==='teacher'?'block':'none';
  $('studentView').style.display=mode==='student'?'block':'none';
  $('teacherModeBtn').className='btn '+(mode==='teacher'?'primary':'');
  $('studentModeBtn').className='btn '+(mode==='student'?'primary':'');
}

function studentUrl(sessionId){
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('session',sessionId);
  return url.toString();
}

function teacherUrl(sessionId,token){
  const url=new URL(location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('teacher','1');
  url.searchParams.set('session',sessionId);
  url.searchParams.set('token',token);
  return url.toString();
}

function scenarioById(category,id){
  return scenarios[category]?.find(item=>item.id===id)||null;
}

async function createSession(){
  const target=Math.max(4,Math.min(60,Number($('studentCount').value)||18));
  const teamCount=Math.max(1,Math.min(10,Number($('teamCount').value)||3));

  if(target<teamCount*3){
    showStatus('Use at least 3 students per team.','warn');
    return;
  }

  $('createGameBtn').disabled=true;

  try{
    let sessionId=null;
    for(let attempt=0;attempt<8;attempt++){
      const candidate=randomCode();
      const snap=await get(ref(db,root+'/sessions/'+candidate));
      if(!snap.exists()){
        sessionId=candidate;
        break;
      }
    }
    if(!sessionId)throw new Error('Could not create a unique room.');

    const token=randomToken();

    await set(ref(db,root+'/sessions/'+sessionId),{
      title:$('activityName').value.trim()||'Unit 7 · Rumor Impostor',
      target,
      teamCount,
      status:'open',
      phase:'lobby',
      joinOpen:true,
      createdAt:Date.now(),
      teacherToken:token,
      round:0,
      participants:{},
      teams:{},
      assignments:{},
      votes:{}
    });

    currentSession=sessionId;
    teacherToken=token;
    localStorage.setItem('rumor-impostor-teacher-session',sessionId);
    localStorage.setItem('rumor-impostor-teacher-token',token);
    history.replaceState({},'',teacherUrl(sessionId,token));
    subscribe(sessionId);
    showStatus('Game ready.');
  }catch(error){
    console.error(error);
    showStatus('Could not create the game.','bad');
  }finally{
    $('createGameBtn').disabled=false;
  }
}

async function joinSession(){
  const sessionId=($('studentRoomCode').value||'').trim().toUpperCase();
  const name=($('studentName').value||'').trim();
  const label=($('studentLabel').value||'').trim();

  if(!sessionId||!name){
    showStatus('Enter your name and room code.','warn');
    return;
  }

  try{
    const sessionRef=ref(db,root+'/sessions/'+sessionId);
    const initial=await get(sessionRef);

    if(!initial.exists()){
      showStatus('That room does not exist.','bad');
      return;
    }

    const result=await runTransaction(sessionRef,current=>{
      if(!current||current.status!=='open'||!current.joinOpen||current.phase!=='lobby')return current;

      current.participants=current.participants||{};

      if(current.participants[clientId]){
        current.participants[clientId].name=name;
        current.participants[clientId].label=label;
        return current;
      }

      if(Object.keys(current.participants).length>=Number(current.target||0))return current;

      current.participants[clientId]={
        name,
        label,
        joinedAt:Date.now()
      };

      return current;
    });

    const data=result.snapshot.val();

    if(!data?.participants?.[clientId]){
      showStatus('The room is full or joining is closed.','bad');
      return;
    }

    currentSession=sessionId;
    localStorage.setItem('rumor-impostor-student-session',sessionId);
    localStorage.setItem('rumor-impostor-student-name',name);
    localStorage.setItem('rumor-impostor-student-label',label);
    history.replaceState({},'',studentUrl(sessionId));
    subscribe(sessionId);
    showStatus('You joined the game.');
  }catch(error){
    console.error(error);
    showStatus('Could not join the game.','bad');
  }
}

function selectRoundScenario(teamIndex,round,usedCrew){
  const category=(teamIndex+round)%2===0?'phobias':'superstitions';
  const pool=scenarios[category];

  let crewOptions=pool.filter(item=>!usedCrew.has(category+':'+item.id));
  if(!crewOptions.length)crewOptions=pool;

  const crew=crewOptions[randomIndex(crewOptions.length)];
  usedCrew.add(category+':'+crew.id);

  const impostorOptions=pool.filter(item=>item.id!==crew.id);
  const impostor=impostorOptions[randomIndex(impostorOptions.length)];

  return {category,crew,impostor};
}

async function formTeams(firstRound=true){
  const snap=await get(ref(db,root+'/sessions/'+currentSession));
  const data=snap.val();

  if(!data||data.teacherToken!==teacherToken)return;

  const ids=Object.keys(data.participants||{});
  if(firstRound&&ids.length!==Number(data.target)){
    showStatus('Wait until all '+data.target+' students have joined.','warn');
    return;
  }

  const teamCount=Number(data.teamCount);
  const round=Number(data.round||0)+1;
  const participants={...data.participants};
  const teams={};
  const assignments={};
  const usedCrew=new Set();

  if(firstRound){
    shuffle(ids).forEach((id,index)=>{
      participants[id]={...participants[id],teamIndex:(index%teamCount)+1};
    });
  }

  for(let teamIndex=1;teamIndex<=teamCount;teamIndex++){
    const members=ids.filter(id=>Number(participants[id].teamIndex)===teamIndex);
    if(!members.length)continue;

    const setup=selectRoundScenario(teamIndex,round,usedCrew);
    const impostorId=members[randomIndex(members.length)];

    teams[teamIndex]={
      name:'Team '+teamNames[(teamIndex-1)%teamNames.length],
      category:setup.category,
      crewScenarioId:setup.crew.id,
      impostorScenarioId:setup.impostor.id,
      impostorId
    };

    members.forEach(id=>{
      assignments[id]={
        teamIndex,
        role:id===impostorId?'impostor':'crew',
        category:setup.category,
        scenarioId:id===impostorId?setup.impostor.id:setup.crew.id
      };
    });
  }

  await update(ref(db,root+'/sessions/'+currentSession),{
    participants,
    teams,
    assignments,
    votes:{},
    phase:'teams',
    joinOpen:false,
    round
  });
}

async function nextPhase(){
  const snap=await get(ref(db,root+'/sessions/'+currentSession));
  const data=snap.val();

  if(!data||data.teacherToken!==teacherToken)return;

  const next={
    teams:'clue1',
    clue1:'clue2',
    clue2:'vote',
    vote:'reveal'
  }[data.phase];

  if(!next)return;

  const payload={phase:next};
  if(next==='vote')payload.votes={};

  await update(ref(db,root+'/sessions/'+currentSession),payload);
}

async function toggleJoining(){
  const snap=await get(ref(db,root+'/sessions/'+currentSession));
  const data=snap.val();
  if(!data||data.teacherToken!==teacherToken)return;

  await update(ref(db,root+'/sessions/'+currentSession),{
    joinOpen:!data.joinOpen
  });
}

async function closeGame(){
  const snap=await get(ref(db,root+'/sessions/'+currentSession));
  const data=snap.val();
  if(!data||data.teacherToken!==teacherToken)return;

  await update(ref(db,root+'/sessions/'+currentSession),{
    status:'closed',
    joinOpen:false,
    closedAt:Date.now()
  });

  showStatus('Game closed.');
}

async function voteFor(targetId){
  if(!currentSession)return;
  await set(ref(db,root+'/sessions/'+currentSession+'/votes/'+clientId),{
    targetId,
    votedAt:Date.now()
  });
  showStatus('Vote saved.');
}

function renderTeacherTeams(data){
  const participants=data.participants||{};

  if(data.phase==='lobby'){
    const waiting=Object.values(participants);
    $('teacherTeams').innerHTML=waiting.length
      ? '<div class="team" style="grid-column:1/-1"><h3>Waiting room · '+waiting.length+'</h3>'+
        waiting.map(p=>'<div class="member">'+esc(p.name)+(p.label?'<small>'+esc(p.label)+'</small>':'')+'</div>').join('')+
        '</div>'
      : '<p class="note">Waiting for students.</p>';
    return;
  }

  $('teacherTeams').innerHTML=Object.entries(data.teams||{}).map(([teamIndex,team])=>{
    const members=Object.entries(participants)
      .filter(([,participant])=>Number(participant.teamIndex)===Number(teamIndex));

    const voteCount=members.filter(([id])=>data.votes?.[id]).length;

    return '<div class="team">'+
      '<h3>'+esc(team.name)+' · '+members.length+'</h3>'+
      members.map(([,participant])=>'<div class="member">'+esc(participant.name)+(participant.label?'<small>'+esc(participant.label)+'</small>':'')+'</div>').join('')+
      (data.phase==='vote'?'<div class="member"><small>Votes received: '+voteCount+'/'+members.length+'</small></div>':'')+
      (data.phase==='reveal'?'<div class="member"><strong>Impostor:</strong> '+esc(participants[team.impostorId]?.name||'—')+'</div>':'')+
      '</div>';
  }).join('');
}

function renderTeacher(data){
  $('teacherSetup').classList.add('hidden');
  $('teacherRoom').classList.remove('hidden');

  const joined=Object.keys(data.participants||{}).length;
  $('roomCode').textContent=currentSession;
  $('joinedPill').textContent=joined+' / '+data.target+' students';
  $('teamsPill').textContent=data.teamCount+' teams';
  $('phasePill').textContent=data.phase;
  $('joinProgress').style.width=Math.min(100,(joined/Number(data.target))*100)+'%';

  $('formTeamsBtn').disabled=data.phase!=='lobby'||joined!==Number(data.target);
  $('toggleJoiningBtn').textContent=data.joinOpen?'Close joining':'Open joining';
  $('toggleJoiningBtn').disabled=data.phase!=='lobby';

  const link=studentUrl(currentSession);
  $('studentLink').textContent=link;
  $('qrImage').src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(link);

  if(data.phase==='lobby'){
    $('phaseControls').classList.add('hidden');
  }else{
    $('phaseControls').classList.remove('hidden');
    const copy=phaseText[data.phase];
    $('phaseTitle').textContent=copy.title;
    $('phaseDescription').textContent=copy.description;
    $('nextPhaseBtn').textContent=copy.button;
    $('nextPhaseBtn').classList.toggle('hidden',data.phase==='reveal');
    $('newRoundBtn').classList.toggle('hidden',data.phase!=='reveal');
  }

  renderTeacherTeams(data);
}

function teamMemberHtml(data,me){
  if(!me?.teamIndex)return '<p class="note">Teams have not been formed yet.</p>';

  const team=data.teams?.[me.teamIndex];
  const members=Object.entries(data.participants||{})
    .filter(([,participant])=>Number(participant.teamIndex)===Number(me.teamIndex));

  return '<div class="team"><h3>'+esc(team?.name||('Team '+me.teamIndex))+'</h3>'+
    members.map(([id,participant])=>'<div class="member">'+esc(participant.name)+(id===clientId?' <strong>(you)</strong>':'')+(participant.label?'<small>'+esc(participant.label)+'</small>':'')+'</div>').join('')+
    '</div>';
}

function renderStudent(data){
  const me=data.participants?.[clientId];

  if(!me){
    $('studentJoin').classList.remove('hidden');
    $('studentGame').classList.add('hidden');
    return;
  }

  $('studentJoin').classList.add('hidden');
  $('studentGame').classList.remove('hidden');
  $('studentTeam').innerHTML=teamMemberHtml(data,me);

  if(data.status==='closed'){
    $('studentGame').innerHTML='<div class="waiting"><h2>Game closed</h2><p class="note">Your teacher has closed this game.</p></div>';
    return;
  }

  if(data.phase==='lobby'){
    $('studentGame').innerHTML='<div class="waiting"><span class="badge">YOU ARE IN</span><h2>'+esc(me.name)+'</h2><p class="note">Waiting for the teacher to form random teams.</p></div>';
    return;
  }

  const assignment=data.assignments?.[clientId];
  const team=data.teams?.[me.teamIndex];

  if(!assignment||!team){
    $('studentGame').innerHTML='<div class="waiting"><h2>Preparing your card...</h2></div>';
    return;
  }

  const own=scenarioById(assignment.category,assignment.scenarioId);

  if(data.phase==='vote'){
    const teammates=Object.entries(data.participants||{})
      .filter(([id,participant])=>id!==clientId&&Number(participant.teamIndex)===Number(me.teamIndex));
    const selected=data.votes?.[clientId]?.targetId||'';

    $('studentGame').innerHTML=
      '<div class="studentCard">'+
      '<span class="badge">'+esc(team.name)+'</span>'+
      '<h2 style="margin-top:14px">Who is the impostor?</h2>'+
      '<div class="vote">'+
      teammates.map(([id,participant])=>'<button data-vote="'+esc(id)+'" class="'+(selected===id?'selected':'')+'">'+esc(participant.name)+'</button>').join('')+
      '</div></div>';

    document.querySelectorAll('[data-vote]').forEach(button=>{
      button.addEventListener('click',()=>voteFor(button.dataset.vote));
    });
    return;
  }

  if(data.phase==='reveal'){
    const crew=scenarioById(team.category,team.crewScenarioId);
    const impostorScenario=scenarioById(team.category,team.impostorScenarioId);
    const teamVotes=Object.entries(data.votes||{})
      .filter(([voterId])=>Number(data.participants?.[voterId]?.teamIndex)===Number(me.teamIndex));
    const counts={};

    teamVotes.forEach(([,vote])=>{
      counts[vote.targetId]=(counts[vote.targetId]||0)+1;
    });

    const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const top=ranked[0]||null;
    const caught=top&&top[0]===team.impostorId;

    $('studentGame').innerHTML=
      '<div class="reveal">'+
      '<span class="badge">'+esc(team.name)+'</span>'+
      '<h2 style="margin-top:14px">Reveal</h2>'+
      '<p><strong>Impostor</strong></p><div class="answer">'+esc(data.participants[team.impostorId]?.name||'—')+'</div>'+
      (top?'<p><strong>Team vote:</strong> '+esc(data.participants[top[0]]?.name||'—')+' · '+top[1]+' vote'+(top[1]===1?'':'s')+'</p>':'')+
      '<p><strong>Result:</strong> '+(caught?'Crew found the impostor.':'The impostor survived.')+'</p>'+
      '<p><strong>Crew situation</strong></p><div class="answer">'+esc(crew?.situation||'—')+'</div>'+
      '<span class="vocab">'+esc(crew?.vocabulary||'—')+'</span>'+
      '<p style="margin-top:16px"><strong>Impostor situation</strong></p><div class="answer">'+esc(impostorScenario?.situation||'—')+'</div>'+
      '<span class="vocab">'+esc(impostorScenario?.vocabulary||'—')+'</span>'+
      '</div>';
    return;
  }

  const specific=data.phase==='clue2';
  const ideas=specific?own.specific:own.general;
  const instruction=data.phase==='teams'
    ? 'Keep your card private.'
    : specific
      ? 'Give one more specific clue.'
      : 'Give one general clue.';

  $('studentGame').innerHTML=
    '<div class="studentCard">'+
    '<span class="badge">'+esc(team.name)+'</span>'+
    '<div class="role '+(assignment.role==='impostor'?'impostor':'crew')+'">'+(assignment.role==='impostor'?'YOU ARE THE IMPOSTOR':'CREW MEMBER')+'</div>'+
    '<p class="note">'+instruction+'</p>'+
    '<button id="revealCardBtn" class="btn '+(assignment.role==='impostor'?'danger':'teal')+'">Reveal secret card</button>'+
    '<div id="secretCard" class="secret">'+
      '<div class="category">'+esc(assignment.category.toUpperCase())+'</div>'+
      '<div class="situation">'+esc(own.situation)+'</div>'+
      (assignment.role==='impostor'
        ? '<div class="warning">Defend this situation. The crew has a different situation, but you are not told what it is.</div>'
        : '')+
      '<div class="ideas"><strong>'+(specific?'More specific ideas':'Ideas you may use')+'</strong><ul>'+
      ideas.map(idea=>'<li>'+esc(idea)+'</li>').join('')+
      '</ul></div>'+
      '<p><strong>Start with one:</strong></p>'+
      '<div class="starters">'+
        '<span class="starter">It is said that...</span>'+
        '<span class="starter">It is believed that...</span>'+
        '<span class="starter">It is thought that...</span>'+
        '<span class="starter">It is claimed that...</span>'+
      '</div>'+
      '<button id="hideCardBtn" class="btn" style="margin-top:10px">Hide card</button>'+
    '</div></div>';

  $('revealCardBtn')?.addEventListener('click',()=>{
    $('secretCard').classList.add('show');
    $('revealCardBtn').classList.add('hidden');
  });

  $('hideCardBtn')?.addEventListener('click',()=>{
    $('secretCard').classList.remove('show');
    $('revealCardBtn').classList.remove('hidden');
  });
}

function subscribe(sessionId){
  if(unsubscribe)unsubscribe();

  currentSession=sessionId;

  unsubscribe=onValue(ref(db,root+'/sessions/'+sessionId),snap=>{
    const data=snap.val();

    if(!data){
      showStatus('This game is no longer available.','bad');
      return;
    }

    if(currentMode==='teacher'&&data.teacherToken===teacherToken){
      renderTeacher(data);
    }

    if(currentMode==='student'){
      renderStudent(data);
    }
  });
}

async function restoreTeacher(){
  const sessionId=(params.get('session')||localStorage.getItem('rumor-impostor-teacher-session')||'').trim().toUpperCase();
  const token=params.get('token')||localStorage.getItem('rumor-impostor-teacher-token');

  if(!sessionId||!token)return;

  const snap=await get(ref(db,root+'/sessions/'+sessionId));
  const data=snap.val();

  if(data?.teacherToken===token&&data.status==='open'){
    currentSession=sessionId;
    teacherToken=token;
    subscribe(sessionId);
  }
}

async function restoreStudent(){
  const sessionId=(initialSession||localStorage.getItem('rumor-impostor-student-session')||'').trim().toUpperCase();

  $('studentName').value=localStorage.getItem('rumor-impostor-student-name')||'';
  $('studentLabel').value=localStorage.getItem('rumor-impostor-student-label')||'';

  if(initialSession)$('studentRoomCode').value=initialSession;

  if(!sessionId)return;

  const snap=await get(ref(db,root+'/sessions/'+sessionId));
  const data=snap.val();

  if(data?.participants?.[clientId]&&data.status==='open'){
    currentSession=sessionId;
    subscribe(sessionId);
  }
}

$('teacherModeBtn').addEventListener('click',()=>{
  setMode('teacher');
  restoreTeacher().catch(console.error);
});

$('studentModeBtn').addEventListener('click',()=>{
  setMode('student');
  restoreStudent().catch(console.error);
});

$('createGameBtn').addEventListener('click',createSession);
$('joinGameBtn').addEventListener('click',joinSession);
$('formTeamsBtn').addEventListener('click',()=>formTeams(true));
$('newRoundBtn').addEventListener('click',()=>formTeams(false));
$('nextPhaseBtn').addEventListener('click',nextPhase);
$('toggleJoiningBtn').addEventListener('click',toggleJoining);
$('closeGameBtn').addEventListener('click',closeGame);

$('copyLinkBtn').addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(studentUrl(currentSession));
    showStatus('Student link copied.');
  }catch{
    showStatus('Copy the student link shown below the QR code.','warn');
  }
});

setMode(currentMode);

if(initialTeacher){
  restoreTeacher().catch(error=>{
    console.error(error);
    showStatus('Could not restore the teacher game.','bad');
  });
}else{
  restoreStudent().catch(error=>{
    console.error(error);
    showStatus('Could not restore the student game.','bad');
  });
}
