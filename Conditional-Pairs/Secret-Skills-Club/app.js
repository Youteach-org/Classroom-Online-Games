// Use the existing Firebase Realtime Database REST interface directly.
// This avoids third-party module loading failures on school browsers.
const root="classroomGames/supportMeter/secretSkills/rooms";
const db={};
const ref=(_db,path)=>path;
const endpoint=path=>"https://youteach-d9a79-default-rtdb.firebaseio.com/"+path+".json";
const snapshot=value=>({val:()=>value,exists:()=>value!==null&&value!==undefined});
async function request(path,method="GET",data,headers={}){
 const response=await fetch(endpoint(path),{
  method,headers:{...(data!==undefined?{"Content-Type":"application/json"}:{}),...headers},
  ...(data!==undefined?{body:JSON.stringify(data)}:{}),
  signal:AbortSignal.timeout(12000),cache:"no-store"
 });
 const body=await response.text();
 if(!response.ok){
  const detail=body.slice(0,250);
  throw Error("Database "+method+" failed ("+response.status+"): "+detail);
 }
 if(!body)return null;
 try{return JSON.parse(body);}catch{return null;}
}
const get=async path=>snapshot(await request(path));
const set=(path,value)=>request(path,"PUT",value);
const update=(path,changes)=>request(path,"PATCH",changes);
async function runTransaction(path,apply){
 // The randomly generated six-hex-digit room code is checked before writing.
 // Existing sessions are never overwritten.
 const existing=(await get(path)).val();
 const next=apply(existing);
 if(next===undefined)return {committed:false};
 await set(path,next);
 return {committed:true};
}
function onValue(path,callback,onError){
 let cancelled=false,inFlight=false;
 const poll=async()=>{
  if(cancelled||inFlight)return;
  inFlight=true;
  try{
   const value=await get(path);
   if(!cancelled)callback(value);
  }catch(error){if(!cancelled&&onError)onError(error);}
  finally{inFlight=false;}
 };
 poll();
 const interval=setInterval(poll,1250);
 return ()=>{cancelled=true;clearInterval(interval);};
}
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const random=(n=16)=>Array.from(crypto.getRandomValues(new Uint8Array(n))).map(v=>v.toString(16).padStart(2,"0")).join("");
const roomRef=code=>ref(db,root+"/"+code);
const playerRef=(code,id)=>ref(db,root+"/"+code+"/players/"+id);
const questions=[
 {q:"Do you have a knack for learning languages?",verb:"have a knack for learning languages",third:"has a knack for learning languages",category:"TALENTS",tense:"present"},
 {q:"Do you have an ear for music?",verb:"have an ear for music",third:"has an ear for music",category:"TALENTS",tense:"present"},
 {q:"Do you have a head for figures?",verb:"have a head for figures",third:"has a head for figures",category:"TALENTS",tense:"present"},
 {q:"Do you have an eye for detail?",verb:"have an eye for detail",third:"has an eye for detail",category:"TALENTS",tense:"present"},
 {q:"Do you enjoy making things with your hands?",verb:"enjoy making things with your hands",third:"enjoys making things with their hands",category:"TALENTS",tense:"present"},
 {q:"Did you help build an ofrenda last year?",verb:"help build an ofrenda last year",third:"helped build an ofrenda last year",category:"HALLOWEEN & DÍA DE MUERTOS",tense:"past"},
 {q:"Did you wear a costume last Halloween?",verb:"wear a costume last Halloween",third:"wore a costume last Halloween",category:"HALLOWEEN & DÍA DE MUERTOS",tense:"past"},
 {q:"Did you repair or build something recently?",verb:"repair or build something recently",third:"repaired or built something recently",category:"SKILLS IN ACTION",tense:"past"},
 {q:"Did you help organize a celebration last year?",verb:"help organize a celebration last year",third:"helped organize a celebration last year",category:"SKILLS IN ACTION",tense:"past"},
 {q:"Did you sing or perform music in public last year?",verb:"sing or perform music in public last year",third:"sang or performed music in public last year",category:"SKILLS IN ACTION",tense:"past"}
];
const TEAM_NAMES=["MIDNIGHT","PHANTOMS","NEON","MARIGOLD","ECLIPSE","SPECTERS","LANTERN","SHADOWS","MYSTERY","ORACLE"];
const params=new URLSearchParams(location.search);
let state={role:"",code:"",teacherKey:"",playerId:"",playerName:"",data:null,off:null,lastView:"",draft:Array(10).fill(null),busy:false};
const feedback=(id,message)=>{$(id).textContent=message||"";};
function show(role){$("landing").classList.toggle("hidden",!!role);$("teacherPanel").classList.toggle("hidden",role!=="teacher");$("studentPanel").classList.toggle("hidden",role!=="student");state.role=role;}
const gamePath=location.pathname.replace(/\/teacher(?:\/index\.html)?\/?$/i,"/").replace(/\/index\.html$/i,"/");
function shareUrl(code,teacherKey=""){const url=new URL(gamePath+(teacherKey?"teacher/":""),location.origin);url.searchParams.set("code",code);if(teacherKey)url.searchParams.set("teacher",teacherKey);return url.toString();}
function setupRoomListener(){
 if(state.off)state.off();
 state.off=onValue(roomRef(state.code),snap=>{
   state.data=snap.val();
   if(!state.data){show("");feedback("joinFeedback","This room does not exist.");return;}
   if(state.role==="teacher")renderTeacher(); else if(state.role==="student")renderStudent();
 },error=>{const target=state.role==="teacher"?"teacherFeedback":"studentFeedback";feedback(target,"Connection error: "+error.message);});
}
function attachTeacher(code,key){
 state.code=code;state.teacherKey=key;state.lastView="";
 history.replaceState(null,"",location.pathname+"?code="+encodeURIComponent(code)+"&teacher="+encodeURIComponent(key));
 show("teacher");setupRoomListener();
}
function attachPlayer(code,id,name){
 state.code=code;state.playerId=id;state.playerName=name;state.lastView="";
 localStorage.setItem("ssc:player:"+code,id);
 history.replaceState(null,"",location.pathname+"?code="+encodeURIComponent(code));
 show("student");setupRoomListener();
}
function activePlayers(){return Object.entries(state.data?.players||{}).map(([id,p])=>({id,...p}));}
function playersByTeam(team){return activePlayers().filter(p=>p.team===team);}
const submitted=p=>Array.isArray(p.answers)&&p.answers.length===10&&p.answers.every(v=>typeof v==="boolean");
function chooseClues(target,others){
 let ids=[0,1,2,3,4,5,6,7,8,9],chosen=[],remaining=[...others].filter(p=>p.id!==target.id);
 while(chosen.length<7&&ids.length){
   ids.sort((a,b)=>remaining.filter(p=>p.answers?.[a]!==target.answers?.[a]).length-remaining.filter(p=>p.answers?.[b]!==target.answers?.[b]).length||b-a);
   const pick=ids.pop();chosen.push(pick);
   remaining=remaining.filter(p=>p.answers?.[pick]===target.answers?.[pick]);
 }
 if(!chosen.some(i=>i>=5))chosen.push(5);
 if(!chosen.some(i=>i<5))chosen.push(0);
 return [...new Set(chosen)].sort((a,b)=>a-b);
}
function createTeams(players){
 const groups=players.length/4;
 const ranked=[...players].sort((a,b)=>{
  const score=x=>x.answers.slice(0,5).filter(Boolean).length;
  return score(b)-score(a)||Math.random()-.5;
 });
 const teams=Array.from({length:groups},()=>[]);
 ranked.forEach((p,i)=>{const row=Math.floor(i/groups),col=i%groups;teams[row%2===0?col:groups-1-col].push(p);});
 const result={};
 teams.forEach((team,idx)=>{
   const members=[...team].sort(()=>Math.random()-.5);
   members.forEach((p,i)=>{const target=members[(i+1)%4];result[p.id]={team:idx+1,target:target.id,clueIds:chooseClues(target,players)};});
 });
 return result;
}
async function createRoom(){
 if(state.busy)return;state.busy=true;$("createBtn").disabled=true;feedback("createFeedback","Opening classroom...");
 try{
  const title=$("classTitle").value.trim().slice(0,52)||"Secret Skills Club";
  const key=random(22);
  for(let n=0;n<5;n++){
    const code=random(3).toUpperCase();
    const data={title,key,created:Date.now(),status:"lobby",players:{}};
    const res=await runTransaction(roomRef(code),v=>v===null?data:undefined,{applyLocally:false});
    if(res.committed){attachTeacher(code,key);return;}
  }
  throw Error("Could not create a unique room. Please retry.");
 }catch(e){feedback("createFeedback",e.message);}finally{state.busy=false;$("createBtn").disabled=false;}
}
async function joinRoom(){
 if(state.busy)return;state.busy=true;$("joinBtn").disabled=true;feedback("joinFeedback","Joining...");
 try{
  const code=$("joinCode").value.trim().toUpperCase(),name=$("studentName").value.trim().replace(/\s+/g," ");
  if(!/^[A-F0-9]{6}$/.test(code))throw Error("Enter the six-character class code.");
  if(name.length<2||name.length>30)throw Error("Enter a first name or nickname (2–30 characters).");
  const snapshot=await get(roomRef(code)),room=snapshot.val();
  if(!room||room.status!=="lobby")throw Error("This room is closed or has already started.");
  const players=Object.values(room.players||{});
  if(players.length>=40)throw Error("This session is full.");
  if(players.some(p=>String(p.name).toLowerCase()===name.toLowerCase()))throw Error("That name is already in the room. Use a distinctive nickname.");
  const id=random(12),badge=random(3).toUpperCase();
  await set(playerRef(code,id),{name,badge,joined:Date.now(),answers:null,found:false,witnessDone:false,attempts:0});
  attachPlayer(code,id,name);
 }catch(e){feedback("joinFeedback",e.message);}finally{state.busy=false;$("joinBtn").disabled=false;}
}
function renderTeacher(){
 const room=state.data;
 if(room.key!==state.teacherKey){show("");feedback("createFeedback","Teacher link is invalid.");return;}
 const players=activePlayers(),ready=players.filter(submitted).length,matched=players.filter(p=>p.found).length;
 $("teacherTitle").textContent=room.title||"LIVE SESSION";
 $("teacherCode").textContent=state.code;
 $("totalCount").textContent=players.length;$("readyCount").textContent=ready;$("matchCount").textContent=matched;
 $("teacherProgress").style.width=(players.length?100*ready/players.length:0)+"%";
 const studentLink=shareUrl(state.code);$("shareLink").textContent=studentLink;
 $("qr").src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(studentLink);
 const monitorOpen=$("openTeacher");if(monitorOpen){monitorOpen.href=shareUrl(state.code,state.teacherKey);monitorOpen.style.display=location.pathname.includes("/teacher/")?"none":"inline-flex";}
 $("teacherStudents").innerHTML=players.length?players.map(p=>'<span class="chip '+(submitted(p)?"done":"pending")+'">'+esc(p.name)+' '+(p.found?"★":submitted(p)?"✓":"·")+'</span>').join(""):'<span class="small">Waiting for students to join…</span>';

 const roster=$("teacherRoster");
 if(roster) roster.innerHTML=players.length?players.map(p=>{
   const status=room.status==="closed"?"SESSION CLOSED":!submitted(p)?"QUESTIONNAIRE PENDING":room.status==="lobby"?"READY — WAITING":!p.found?"SEARCHING FOR MATCH":!p.witnessDone?"DOES STATEMENT PENDING":"MISSION COMPLETED";
   const answers=Array.isArray(p.answers)?questions.map((q,i)=>'<div class="small" style="padding:4px 0;border-bottom:1px solid #ffffff16">'+(i+1)+'. '+esc(q.q)+' <b style="color:var(--gold)">'+(p.answers[i]?"YES":"NO")+'</b></div>').join(""):"No answers submitted yet.";
   return '<article class="team"><div class="statusline" style="justify-content:space-between"><b>'+esc(p.name)+'</b><span class="badge">'+esc(status)+'</span></div><p class="small" style="margin:6px 0">Badge: '+esc(p.badge)+' · Team: '+(p.team||"Not assigned")+' · Match attempts: '+(p.attempts||0)+'</p><details><summary style="cursor:pointer;color:var(--ice)">Review questionnaire</summary>'+answers+'</details></article>';
 }).join(""):'<p class="small">Waiting for players.</p>';
 const eligible=room.status==="lobby"&&players.length>=4&&players.length%4===0&&ready===players.length;
 $("startBtn").disabled=!eligible;$("startBtn").classList.toggle("hidden",room.status!=="lobby");
 $("endBtn").disabled=room.status==="closed";
 $("teacherHint").textContent=room.status==="lobby"?(eligible?"Everyone is ready. Start the investigation!":"Start requires 4, 8, 12, 16, 20… students, with every questionnaire submitted."):(room.status==="active"?"Investigation in progress · "+matched+" of "+players.length+" matches verified.":"Session closed.");
 const teams=[...new Set(players.map(p=>p.team).filter(Boolean))].sort((a,b)=>a-b);
 $("teacherTeams").innerHTML=teams.map(t=>{const pp=playersByTeam(t);return '<div class="team"><b>TEAM '+(TEAM_NAMES[t-1]||t)+'</b><p>'+pp.map(p=>esc(p.name)+(p.found?" ✓":" ·")).join(" · ")+'</p><span class="small">'+pp.filter(p=>p.found).length+'/4 matches · '+pp.filter(p=>p.witnessDone).length+'/4 witness statements</span></div>';}).join("");
}
async function startGame(){
 const room=state.data,players=activePlayers();
 if(room?.key!==state.teacherKey||room.status!=="lobby"||players.length<4||players.length%4!==0||players.some(p=>!submitted(p))){feedback("teacherFeedback","All students must submit; teams require multiples of four.");return;}
 $("startBtn").disabled=true;feedback("teacherFeedback","Assigning secret matches...");
 try{
 const teams=createTeams(players),patch={status:"active",started:Date.now()};
 for(const [id,assign] of Object.entries(teams)){
   for(const [key,val] of Object.entries(assign))patch["players/"+id+"/"+key]=val;
 }
 await update(roomRef(state.code),patch);feedback("teacherFeedback","Mission active! Students can now find their partners.");
 }catch(e){feedback("teacherFeedback",e.message);}
}
async function endGame(){
 if(!confirm("End this live session for all students?"))return;
 if(state.data?.key!==state.teacherKey)return;
 try{await update(roomRef(state.code),{status:"closed",closed:Date.now()});}catch(e){feedback("teacherFeedback",e.message);}
}
function renderStudent(){
 const room=state.data,p=room.players?.[state.playerId];
 if(!p){show("");feedback("joinFeedback","Your player profile is no longer available.");return;}
 const view=room.status==="closed"?"closed":!submitted(p)?"quiz":room.status==="lobby"?"waiting":!p.found?"clues":!p.witnessDone?"witness":"finished";
 $("studentCode").textContent="Room "+state.code+" · "+p.name;
 if(state.lastView===view&&view==="quiz")return;
 if(state.lastView===view&&view==="clues"&&state.lastAttempts===(p.attempts||0))return;
 if(state.lastView===view&&view==="witness")return;
 state.lastView=view;state.lastAttempts=p.attempts||0;feedback("studentFeedback","");
 if(view==="quiz")renderQuiz(p);
 if(view==="waiting"){
 $("studentStage").textContent="READY FOR MISSION";$("studentTitle").textContent="YOUR ANSWERS ARE SAVED";
 $("studentIntro").textContent="The teacher is collecting everyone's answers. Your secret mission appears when the game begins.";
 $("studentBody").innerHTML='<div class="stat"><b>✓</b><span>YOUR QUESTIONNAIRE IS COMPLETE</span></div><div class="dialog">Keep this tab open. Your responses will be used to generate another student’s secret file.</div>';
 }
 if(view==="clues")renderClues(p);
 if(view==="witness")renderWitness(p);
 if(view==="finished")renderFinished(p);
 if(view==="closed"){$("studentStage").textContent="SESSION ENDED";$("studentTitle").textContent="INVESTIGATION CLOSED";$("studentIntro").textContent="Thank you for participating.";$("studentBody").innerHTML='<p class="small">You can close this tab.</p>';}
}
function renderQuiz(p){
 $("studentStage").textContent="PHASE 1 / SECRET QUESTIONNAIRE";$("studentTitle").textContent="WHO ARE YOU, REALLY?";
 $("studentIntro").textContent="Answer all ten YES / NO questions honestly. Your answers become clues for another investigator.";
 const body=$("studentBody");
 body.innerHTML=questions.map((q,i)=>'<div class="qcard"><div><small>'+String(i+1).padStart(2,"0")+' / '+q.category+'</small><b>'+esc(q.q)+'</b></div><div class="options"><button data-q="'+i+'" data-answer="yes" class="option '+(state.draft[i]===true?"active":"")+'">YES</button><button data-q="'+i+'" data-answer="no" class="option '+(state.draft[i]===false?"active":"")+'">NO</button></div></div>').join("")+'<div class="actions"><button class="btn gold" id="submitAnswers" '+(state.draft.some(v=>v===null)?"disabled":"")+'>SUBMIT SECRET PROFILE →</button></div><p class="small" id="answerProgress">'+state.draft.filter(v=>v!==null).length+'/10 answered</p>';
 body.querySelectorAll("[data-q]").forEach(btn=>btn.addEventListener("click",()=>{
  const i=Number(btn.dataset.q);state.draft[i]=btn.dataset.answer==="yes";
  const parent=btn.parentElement;parent.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===btn));
  $("submitAnswers").disabled=state.draft.some(v=>v===null);
  $("answerProgress").textContent=state.draft.filter(v=>v!==null).length+"/10 answered";
 }));
 $("submitAnswers").addEventListener("click",async()=>{
  if(state.draft.some(v=>typeof v!=="boolean"))return;
  $("submitAnswers").disabled=true;feedback("studentFeedback","Saving profile...");
  try{const live=(await get(roomRef(state.code))).val();if(live.status!=="lobby")throw Error("The questionnaire has closed.");await update(playerRef(state.code,state.playerId),{answers:[...state.draft],submittedAt:Date.now()});}catch(e){feedback("studentFeedback",e.message);$("submitAnswers").disabled=false;}
 });
}
function assumption(q,yes,subject){
 const verb=subject==="I"?q.verb:q.third;
 if(q.tense==="past"){return yes?('You did NOT '+q.verb+'.'):('You '+q.third+'.');}
 return yes?('You do NOT '+q.verb+'.'):('You '+q.verb+'.');
}
function response(q,yes,subject){
 if(q.tense==="past")return subject+" "+(yes?"DID ":"DIDN’T ")+q.verb+".";
 return subject+" "+(yes?"DO ":"DON’T ")+q.verb+".";
}
function renderClues(p){
 const others=activePlayers(),target=roomPlayer(p.target);
 if(!target||!submitted(target)){$("studentTitle").textContent="Preparing your target…";return;}
 const ids=Array.isArray(p.clueIds)&&p.clueIds.length?p.clueIds:[0,1,2,3,5,6,8];
 $("studentStage").textContent="PHASE 2 / FIND YOUR MATCH";
 $("studentTitle").textContent="FIND THE MYSTERY STUDENT";
 $("studentIntro").textContent="Talk to classmates. These are real answers from ONE person. Challenge their claims, listen for emphatic DO or DID, then ask for their personal badge.";
 $("studentBody").innerHTML='<div class="badge">YOUR BADGE: '+esc(p.badge)+'</div><p class="small">Show this badge only when someone has correctly interviewed you.</p>'+
 ids.map(i=>'<div class="clue"><small>'+(questions[i].tense==="past"?"PAST EXPERIENCE":"PRESENT TALENT")+' · FILE '+String(i+1).padStart(2,"0")+'</small><b>'+esc(target.answers[i]?"YES":"NO")+' — '+esc(questions[i].q)+'</b><small>Say: '+esc(assumption(questions[i],target.answers[i],"I"))+'</small></div>').join("")+
 '<div class="dialog"><strong>REQUIRED SPOKEN CHALLENGE</strong><p>Correct at least one assumption about present skills with <b>DO / DON’T</b> and one about past activities with <b>DID / DIDN’T</b>.</p><p class="small">Example: “You didn’t make an ofrenda!” → “I DID help build an ofrenda!”</p></div><label for="guessBadge" style="display:block;margin:14px 0 5px;color:var(--gold);font-size:12px;font-weight:900">ENTER YOUR MATCH'S BADGE</label><input class="field" id="guessBadge" maxlength="6" placeholder="Badge shown by your match" style="text-transform:uppercase"><div class="actions"><button class="btn" id="verifyBtn">VERIFY MATCH →</button></div><p class="small">Verifications remaining: '+Math.max(0,5-(p.attempts||0))+'</p>';
 $("verifyBtn").disabled=(p.attempts||0)>=5;
 $("verifyBtn").addEventListener("click",async()=>{
  const guess=$("guessBadge").value.trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(guess)){feedback("studentFeedback","Enter a six-character student badge.");return;}
  if(guess===p.badge){feedback("studentFeedback","You cannot match yourself.");return;}
  const latest=(await get(playerRef(state.code,state.playerId))).val();
  if(latest.found)return;
  if((latest.attempts||0)>=5){feedback("studentFeedback","No verifications left. Ask your teacher.");return;}
  $("verifyBtn").disabled=true;
  const success=guess===target.badge;
  try{await update(playerRef(state.code,state.playerId),{found:success,matchedWith:success?target.id:null,attempts:(latest.attempts||0)+1});if(!success){feedback("studentFeedback","Not your match! Compare the clues and interview someone else.");$("verifyBtn").disabled=false;}}catch(e){feedback("studentFeedback",e.message);$("verifyBtn").disabled=false;}
 });
}
function roomPlayer(id){const p=state.data?.players?.[id];return p?{id,...p}:null;}
function renderWitness(p){
 const target=roomPlayer(p.target);if(!target)return;
 const id=[0,1,2,3,4].find(i=>target.answers[i]===true)??0,q=questions[id],yes=target.answers[id],name=target.name;
 const claim=yes?name+" doesn't "+(q.verb.startsWith("have ")?"have "+q.verb.slice(5):q.verb)+".":name+" "+q.third+".";
 const thirdPersonBase=q.verb.replace("your hands","their hands");
 const correction=name+" "+(yes?"DOES ":"DOESN’T ")+thirdPersonBase+".";
 $("studentStage").textContent="PHASE 3 / WITNESS STATEMENT";
 $("studentTitle").textContent="MATCH CONFIRMED!";
 $("studentIntro").textContent="You found "+name+". Now speak about this student to a THIRD classmate using emphatic DOES.";
 $("studentBody").innerHTML='<div class="badge">VERIFIED MATCH: '+esc(name)+'</div><div class="dialog"><strong>ANOTHER STUDENT SAYS:</strong><p>'+esc(claim)+'</p><strong>YOU CORRECT THEM:</strong><p style="font-size:20px">'+esc(correction)+'</p></div><p class="small">Say the corrective sentence out loud to another classmate. The verb must be in its base form after DOES.</p><div class="actions"><button class="btn gold" id="witnessDone">I GAVE MY WITNESS STATEMENT →</button></div>';
 $("witnessDone").addEventListener("click",async()=>{try{$("witnessDone").disabled=true;await update(playerRef(state.code,state.playerId),{witnessDone:true});}catch(e){feedback("studentFeedback",e.message);$("witnessDone").disabled=false;}});
}
function renderFinished(p){
 const peers=playersByTeam(p.team),complete=peers.length===4&&peers.every(x=>x.found&&x.witnessDone);
 $("studentStage").textContent="PHASE 4 / SECRET TEAM";
 $("studentTitle").textContent=complete?"TEAM ASSEMBLED!":"WAIT FOR YOUR TEAM";
 $("studentIntro").textContent=complete?"Your team has completed every Emphatic DO mission.":"Your team is forming. Find and help classmates who are still investigating.";
 $("studentBody").innerHTML='<div class="team"><b>TEAM '+(TEAM_NAMES[p.team-1]||p.team)+'</b><p>'+peers.map(x=>esc(x.name)+(x.found&&x.witnessDone?" ✓":" ·")).join("<br>")+'</p><span class="small">'+peers.filter(x=>x.found&&x.witnessDone).length+'/4 students ready</span></div><div class="dialog"><strong>FINAL TEAM CHALLENGE</strong><p>Make one true statement using <b>DO</b>, one using <b>DOES</b>, and one using <b>DID</b> about members of your new team.</p><p class="small">Example: “We DO have different talents. Eva DOES have an ear for music. Sam DID help build an ofrenda.”</p></div>';
}
$("createBtn").addEventListener("click",createRoom);
$("joinBtn").addEventListener("click",joinRoom);
$("startBtn").addEventListener("click",startGame);
$("endBtn").addEventListener("click",endGame);
$("copyStudent").addEventListener("click",()=>navigator.clipboard.writeText(shareUrl(state.code)).then(()=>feedback("teacherFeedback","Student link copied.")));
$("copyTeacher").addEventListener("click",()=>navigator.clipboard.writeText(shareUrl(state.code,state.teacherKey)).then(()=>feedback("teacherFeedback","Teacher monitor link copied. Keep it private.")));
$("joinCode").value=(params.get("code")||"").toUpperCase().slice(0,6);
(async()=>{
 const code=$("joinCode").value,key=params.get("teacher");
 if(code&&key){const snap=await get(roomRef(code));const room=snap.val();if(room?.key===key){attachTeacher(code,key);return;}}
 const id=code&&localStorage.getItem("ssc:player:"+code);
 if(id){const snap=await get(playerRef(code,id));if(snap.exists()){attachPlayer(code,id,snap.val().name);return;}}
})().catch(e=>feedback("joinFeedback",e.message));
