import {db,root,ref,set,get,onValue,runTransaction,esc,scenarioById} from './core.js';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const initialSession=(params.get('session')||'').trim().toUpperCase();
const demoMode=params.get('demo')==='1';
const clientId=getClientId();
let currentSession=initialSession||localStorage.getItem('rumor-impostor-student-session')||null;
let unsubscribe=null;

function getClientId(){
  const key='rumor-impostor-client-id';
  let id=localStorage.getItem(key);
  if(!id){
    id=crypto.randomUUID();
    localStorage.setItem(key,id);
  }
  return id;
}

function showStatus(message,tone='good'){
  const node=$('status');
  node.textContent=message;
  node.className='status show '+tone;
  clearTimeout(showStatus.timer);
  showStatus.timer=setTimeout(()=>node.classList.remove('show'),3200);
}



function bindHoldReveal(buttonId,cardId){
  const button=$(buttonId);
  const card=$(cardId);
  if(!button||!card)return;

  const show=event=>{
    event?.preventDefault?.();
    card.classList.add('show');
    button.classList.add('holding');
  };

  const hide=event=>{
    event?.preventDefault?.();
    card.classList.remove('show');
    button.classList.remove('holding');
  };

  button.addEventListener('pointerdown',show);
  button.addEventListener('pointerup',hide);
  button.addEventListener('pointercancel',hide);
  button.addEventListener('pointerleave',hide);
  button.addEventListener('contextmenu',event=>event.preventDefault());

  button.addEventListener('keydown',event=>{
    if(event.code==='Space'||event.code==='Enter')show(event);
  });
  button.addEventListener('keyup',event=>{
    if(event.code==='Space'||event.code==='Enter')hide(event);
  });

  window.addEventListener('blur',hide,{once:true});
}

function renderDemo(){
  $('joinView').classList.add('hidden');
  $('gameView').classList.remove('hidden');

  const own=scenarioById('phobias','elevator');

  $('teamView').innerHTML=
    '<div class="team"><h3>Team Neon</h3>'+
    '<div class="member">Alex <strong>(you)</strong></div>'+
    '<div class="member">Mia</div>'+
    '<div class="member">Leo</div>'+
    '<div class="member">Sofia</div></div>';

  $('gameView').innerHTML=
    '<div class="studentCard">'+
    '<span class="badge">Team Neon</span>'+
    '<p class="note">Keep your card private.</p>'+
    '<button id="demoRevealBtn" class="btn primary holdReveal">PRESS AND HOLD TO REVEAL</button>'+
    '<div id="demoSecretCard" class="secret">'+
      '<div class="role crew">CREW MEMBER</div>'+
      '<div class="category">PHOBIAS</div>'+
      '<div class="situation">'+esc(own.situation)+'</div>'+
      '<div class="ideas"><strong>Ideas you may use</strong><ul>'+
        own.general.map(idea=>'<li>'+esc(idea)+'</li>').join('')+
      '</ul></div>'+
      '<p><strong>Start with one:</strong></p>'+
      '<div class="starters">'+
        '<span class="starter">It is said that...</span>'+
        '<span class="starter">It is believed that...</span>'+
        '<span class="starter">It is thought that...</span>'+
        '<span class="starter">It is claimed that...</span>'+
      '</div>'+
    '</div></div>';

  bindHoldReveal('demoRevealBtn','demoSecretCard');
}

async function joinSession(){
  const sessionId=(initialSession||$('roomCode').value||'').trim().toUpperCase();
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
    history.replaceState({},'',location.pathname+'?session='+encodeURIComponent(sessionId));
    subscribe(sessionId);
    showStatus('You joined the game.');
  }catch(error){
    console.error(error);
    showStatus('Could not join the game.','bad');
  }
}

async function voteFor(targetId){
  await set(ref(db,root+'/sessions/'+currentSession+'/votes/'+clientId),{
    targetId,
    votedAt:Date.now()
  });
  showStatus('Vote saved.');
}

function teamHtml(data,me){
  if(!me?.teamIndex)return '<p class="note">Your team will appear after the teacher forms teams.</p>';

  const team=data.teams?.[me.teamIndex];
  const members=Object.entries(data.participants||{})
    .filter(([,p])=>Number(p.teamIndex)===Number(me.teamIndex));

  return '<div class="team"><h3>'+esc(team?.name||('Team '+me.teamIndex))+'</h3>'+
    members.map(([id,p])=>'<div class="member">'+esc(p.name)+(id===clientId?' <strong>(you)</strong>':'')+(p.label?'<small>'+esc(p.label)+'</small>':'')+'</div>').join('')+
    '</div>';
}

function renderStudent(data){
  const me=data.participants?.[clientId];

  if(!me){
    $('joinView').classList.remove('hidden');
    $('gameView').classList.add('hidden');
    return;
  }

  $('joinView').classList.add('hidden');
  $('gameView').classList.remove('hidden');
  $('teamView').innerHTML=teamHtml(data,me);

  if(data.status==='closed'){
    $('gameView').innerHTML='<div class="waiting"><h2>Game closed</h2><p class="note">Your teacher has closed this game.</p></div>';
    return;
  }

  if(data.phase==='lobby'){
    $('gameView').innerHTML='<div class="waiting"><span class="badge">YOU ARE IN</span><h2>'+esc(me.name)+'</h2><p class="note">Waiting for the teacher to form random teams.</p></div>';
    return;
  }

  const assignment=data.assignments?.[clientId];
  const team=data.teams?.[me.teamIndex];

  if(!assignment||!team){
    $('gameView').innerHTML='<div class="waiting"><h2>Preparing your card...</h2></div>';
    return;
  }

  const own=scenarioById(assignment.category,assignment.scenarioId);
  const teamMembers=Object.entries(data.participants||{})
    .filter(([,p])=>Number(p.teamIndex)===Number(me.teamIndex));

  const teamBanner=
    '<div class="yourTeamBanner">'+
      '<div class="yourTeamLabel">YOUR TEAM</div>'+
      '<div class="yourTeamName">'+esc(team.name)+'</div>'+
      '<div class="yourTeamMembers">'+
        teamMembers.map(([id,p])=>'<span>'+esc(p.name)+(id===clientId?' (you)':'')+'</span>').join('')+
      '</div>'+
    '</div>';

  if(data.phase==='vote'){
    const teammates=Object.entries(data.participants||{})
      .filter(([id,p])=>id!==clientId&&Number(p.teamIndex)===Number(me.teamIndex));
    const selected=data.votes?.[clientId]?.targetId||'';

    $('gameView').innerHTML=
      teamBanner+
      '<div class="studentCard">'+
      '<span class="badge">'+esc(team.name)+'</span>'+
      '<h2 style="margin-top:14px">Who is the impostor?</h2>'+
      '<div class="vote">'+
      teammates.map(([id,p])=>'<button data-vote="'+esc(id)+'" class="'+(selected===id?'selected':'')+'">'+esc(p.name)+'</button>').join('')+
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

    $('gameView').innerHTML=
      teamBanner+
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

  $('gameView').innerHTML=
    teamBanner+
    '<div class="studentCard">'+
    '<span class="badge">'+esc(team.name)+'</span>'+
    '<p class="note">'+instruction+'</p>'+
    '<button id="revealCardBtn" class="btn primary holdReveal">PRESS AND HOLD TO REVEAL</button>'+
    '<div id="secretCard" class="secret">'+
      '<div class="role '+(assignment.role==='impostor'?'impostor':'crew')+'">'+(assignment.role==='impostor'?'YOU ARE THE IMPOSTOR':'CREW MEMBER')+'</div>'+
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
    '</div></div>';

  bindHoldReveal('revealCardBtn','secretCard');
}

function subscribe(sessionId){
  if(unsubscribe)unsubscribe();

  unsubscribe=onValue(ref(db,root+'/sessions/'+sessionId),snap=>{
    const data=snap.val();

    if(!data){
      showStatus('This game is no longer available.','bad');
      return;
    }

    renderStudent(data);
  });
}

$('joinBtn').addEventListener('click',joinSession);

$('studentName').value=localStorage.getItem('rumor-impostor-student-name')||'';
$('studentLabel').value=localStorage.getItem('rumor-impostor-student-label')||'';

if(initialSession){
  $('roomCode').value=initialSession;
  $('roomCodeLabel')?.classList.add('hidden');
}

$('studentName').addEventListener('keydown',event=>{
  if(event.key==='Enter'){
    event.preventDefault();
    joinSession();
  }
});

$('studentLabel').addEventListener('keydown',event=>{
  if(event.key==='Enter'){
    event.preventDefault();
    joinSession();
  }
});

if(demoMode){
  renderDemo();
}else if(currentSession){
  get(ref(db,root+'/sessions/'+currentSession)).then(async snap=>{
    const data=snap.val();

    if(data?.participants?.[clientId]&&data.status==='open'){
      subscribe(currentSession);
      return;
    }

    const savedName=(localStorage.getItem('rumor-impostor-student-name')||'').trim();
    if(initialSession&&savedName&&data?.status==='open'&&data?.joinOpen&&data?.phase==='lobby'){
      await joinSession();
    }
  }).catch(console.error);
}
