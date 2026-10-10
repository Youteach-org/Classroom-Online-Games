import {
  db,root,ref,get,onValue,update,
  scenarios,phaseText,teamNames,randomCode,randomToken,randomIndex,shuffle,esc,
  studentUrl,teacherUrl
} from '../core.js';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
let currentSession=(params.get('session')||'').trim().toUpperCase()||null;
let teacherToken=params.get('token')||null;
let unsubscribe=null;


function updateTeamSizePreview(){
  const students=Number($('studentCount').value);
  const teams=Number($('teamCount').value);

  if(!Number.isInteger(students)||!Number.isInteger(teams)||students<1||teams<1){
    $('teamSizePreview').textContent='Enter the number of students and teams.';
    return;
  }

  if(teams>students){
    $('teamSizePreview').textContent='Teams cannot be greater than students.';
    return;
  }

  const base=Math.floor(students/teams);
  const extra=students%teams;
  const parts=[];

  if(extra){
    parts.push(extra+' team'+(extra===1?'':'s')+' of '+(base+1));
  }
  if(teams-extra){
    parts.push((teams-extra)+' team'+((teams-extra)===1?'':'s')+' of '+base);
  }

  $('teamSizePreview').textContent=parts.join(' · ');
}

function showStatus(message,tone='good'){
  const node=$('status');
  node.textContent=message;
  node.className='status show '+tone;
  clearTimeout(showStatus.timer);
  showStatus.timer=setTimeout(()=>node.classList.remove('show'),3200);
}

async function uniqueCode(){
  for(let attempt=0;attempt<8;attempt++){
    const candidate=randomCode();
    const snap=await get(ref(db,root+'/sessions/'+candidate));
    if(!snap.exists())return candidate;
  }
  throw new Error('Could not create a unique room.');
}

async function createSession(){
  const target=Number($('studentCount').value);
  const teamCount=Number($('teamCount').value);

  if(!Number.isInteger(target)||target<1||target>60){
    showStatus('Enter how many students you have.','warn');
    return;
  }

  if(!Number.isInteger(teamCount)||teamCount<1||teamCount>60){
    showStatus('Enter how many teams you want.','warn');
    return;
  }

  if(teamCount>target){
    showStatus('The number of teams cannot be greater than the number of students.','warn');
    return;
  }

  $('createGameBtn').disabled=true;

  try{
    const sessionId=await uniqueCode();
    const token=randomToken();

    await update(ref(db,root+'/sessions/'+sessionId),{
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

function chooseRoundScenario(teamIndex,round,usedCrew){
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

    const setup=chooseRoundScenario(teamIndex,round,usedCrew);
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

  await update(ref(db,root+'/sessions/'+currentSession),{
    phase:next,
    ...(next==='vote'?{votes:{}}:{})
  });
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

function renderTeams(data){
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
      .filter(([,p])=>Number(p.teamIndex)===Number(teamIndex));

    const voteCount=members.filter(([id])=>data.votes?.[id]).length;

    return '<div class="team">'+
      '<h3>'+esc(team.name)+' · '+members.length+'</h3>'+
      members.map(([,p])=>'<div class="member">'+esc(p.name)+(p.label?'<small>'+esc(p.label)+'</small>':'')+'</div>').join('')+
      (data.phase==='vote'?'<div class="member"><small>Votes received: '+voteCount+'/'+members.length+'</small></div>':'')+
      (data.phase==='reveal'?'<div class="member"><strong>Impostor:</strong> '+esc(participants[team.impostorId]?.name||'—')+'</div>':'')+
      '</div>';
  }).join('');
}

function renderTeacher(data){
  $('setupView').classList.add('hidden');
  $('roomView').classList.remove('hidden');

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

  renderTeams(data);
}

function subscribe(sessionId){
  if(unsubscribe)unsubscribe();

  unsubscribe=onValue(ref(db,root+'/sessions/'+sessionId),snap=>{
    const data=snap.val();

    if(!data){
      showStatus('This game is no longer available.','bad');
      return;
    }

    if(data.teacherToken!==teacherToken){
      showStatus('Teacher access is not valid for this room.','bad');
      return;
    }

    renderTeacher(data);
  });
}

async function restoreTeacher(){
  const sessionId=(params.get('session')||'').trim().toUpperCase();
  const token=params.get('token')||'';

  if(!sessionId||!token){
    currentSession=null;
    teacherToken=null;
    $('setupView').classList.remove('hidden');
    $('roomView').classList.add('hidden');
    return;
  }

  const snap=await get(ref(db,root+'/sessions/'+sessionId));
  const data=snap.val();

  if(data?.teacherToken===token&&data.status==='open'){
    currentSession=sessionId;
    teacherToken=token;
    subscribe(sessionId);
    return;
  }

  currentSession=null;
  teacherToken=null;
  $('setupView').classList.remove('hidden');
  $('roomView').classList.add('hidden');
  showStatus('That previous game is no longer active. Create a new one.','warn');
}

$('studentCount').addEventListener('input',updateTeamSizePreview);
$('teamCount').addEventListener('input',updateTeamSizePreview);
updateTeamSizePreview();

$('createGameBtn').addEventListener('click',createSession);
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

restoreTeacher().catch(error=>{
  console.error(error);
  showStatus('Could not restore the teacher game.','bad');
});
