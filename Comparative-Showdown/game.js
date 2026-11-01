"use strict";
// Comparative Showdown — real-time one-student, one-teacher COG game.
// Uses the same public Firebase RTDB room space as existing COG activities.
// Never enter private information; a classroom nickname is sufficient.
const DB="https://youteach-d9a79-default-rtdb.firebaseio.com/";
const ROOT="classroomGames/supportMeter/comparativeShowdown/rooms";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const isTeacherPage=/\/Comparative-Showdown\/teacher\/?(?:index\.html)?$/i.test(location.pathname);
const state={role:"",code:"",secret:"",id:"",name:"",room:null,poll:null,inFlight:false,busy:false,renderKey:"",tileOrder:[],picked:[],tick:null};
const questions=[];
function form(prompt,answer,tip,explanation,mission){
  questions.push({kind:"form",mission:mission||"ADJECTIVE FORGE",prompt:prompt,answer:answer,tip:tip,explanation:explanation});
}
function tiles(prompt,answer,tip,mission,explanation){
  questions.push({kind:"tiles",mission:mission,prompt:prompt,answer:answer,tip:tip,explanation:explanation});
}
form("My teacher is friendly, but my sister's teacher is…","friendlier","For adjectives ending in a consonant + y, change y to -ier.","friendly → friendlier");
form("My bike is big, but my brother's bike is…","bigger","Double the final consonant in big before -er.","big → bigger");
form("This biscuit tastes nice, but those cakes taste…","nicer","Adjectives ending in -e add only -r.","nice → nicer");
form("Geography is interesting, but history is…","more interesting","Long adjectives usually use more + adjective.","interesting → more interesting");
form("I felt nervous, but my friend felt…","more nervous","Use more with longer adjectives.","nervous → more nervous");
form("Tim is rich, but John is…","richer","Short adjectives usually take -er.","rich → richer");
form("This exercise is easy, but the next one is…","easier","Replace consonant + y with -ier.","easy → easier");
form("Madrid is hot, but Bangkok is…","hotter","Double the final consonant in hot before -er.","hot → hotter");
const bases=[
 ["Football / exciting / volleyball","Football is more exciting than volleyball.","Use more + exciting + than."],
 ["Golf / safe / horse-riding","Golf is safer than horse-riding.","Safe ends in -e: add -r, then than."],
 ["Water-skiing / difficult / swimming","Water-skiing is more difficult than swimming.","Difficult is a long adjective: more difficult than."],
 ["Motorcycling / noisy / cycling","Motorcycling is noisier than cycling.","Noisy changes to noisier (y → ier)."],
 ["Rugby balls / heavy / tennis balls","Rugby balls are heavier than tennis balls.","Plural balls use are; heavy changes to heavier."]
];
bases.forEach(x=>tiles("Build the comparison: "+x[0],x[1],x[2],"COMPARISON ARENA","Use the comparative adjective followed by than."));
const mirrors=[
 ["Volleyball isn't as exciting as football.","Volleyball is less exciting than football.","exciting"],
 ["Horse-riding isn't as safe as golf.","Horse-riding is less safe than golf.","safe"],
 ["Swimming isn't as difficult as water-skiing.","Swimming is less difficult than water-skiing.","difficult"],
 ["Cycling isn't as noisy as motorcycling.","Cycling is less noisy than motorcycling.","noisy"],
 ["Tennis balls aren't as heavy as rugby balls.","Tennis balls are less heavy than rugby balls.","heavy"]
];
mirrors.forEach((x,i)=>{
  tiles("Reverse the comparison. Use NOT AS ... AS: "+bases[i][1],x[0],"Start with the second thing and use isn't/aren't as + adjective + as.","MIRROR CHALLENGE","not as + adjective + as shows a lower degree.");
  tiles("Reverse the comparison. Use LESS ... THAN: "+bases[i][1],x[1],"Start with the second thing and use less + adjective + than.","MIRROR CHALLENGE","less + adjective + than reverses the comparison.");
});
form("She designed the clothes (careful). Change the adjective into an adverb.","carefully","Most adjectives take -ly to become an adverb.","careful → carefully","ADVERB LAB");
form("She coloured the drawings (neat). Change the adjective into an adverb.","neatly","Most adjectives take -ly to become an adverb.","neat → neatly","ADVERB LAB");
form("She explained her designs (good). Change the adjective into an adverb.","well","Good has an irregular adverb form.","good → well (not goodly)","ADVERB LAB");
form("She sewed her clothes (beautiful). Change the adjective into an adverb.","beautifully","The adverb describes how an action is done.","beautiful → beautifully","ADVERB LAB");
const fashion=[
 ["Who designed her clothes more carefully: Daisy or Jill? Write a comparison.","Daisy designed her clothes more carefully than Jill.","Check the stars for the designing row.","more carefully + than"],
 ["Who designed her clothes the most carefully?","Daisy designed her clothes the most carefully.","Three stars represent the strongest performance.","the most carefully"],
 ["Who coloured her drawings more neatly: Paola or Jill? Write a comparison.","Paola coloured her drawings more neatly than Jill.","Look at the colouring row.","more neatly + than"],
 ["Who coloured her drawings the most neatly?","Paola coloured her drawings the most neatly.","Paola has three stars for colouring.","the most neatly"],
 ["Who explained her designs better: Jill or Paola? Write a comparison.","Jill explained her designs better than Paola.","The comparative of well is better, not more well.","well → better"],
 ["Who explained her designs the best?","Jill explained her designs the best.","The superlative of well is best, not most well.","well → best"],
 ["Who sewed her clothes more beautifully: Jill or Daisy? Write a comparison.","Jill sewed her clothes more beautifully than Daisy.","Look at the sewing row.","more beautifully + than"],
 ["Who sewed her clothes the most beautifully?","Jill sewed her clothes the most beautifully.","Three stars represent the strongest sewing.","the most beautifully"]
];
fashion.forEach(x=>tiles(x[0],x[1],x[2],"FASHION FINALS",x[3]));
const QUICK=[0,2,3,7,8,9,12,13,15,20,23,25,27,30];
const getDeck=room=>room&&room.mode==="full"?questions.map((_,i)=>i):QUICK;
const path=(code,tail)=>ROOT+"/"+code+(tail?"/"+tail:"");
const url=path=>DB+path+".json";
async function request(path,method,data,ifMatch){
  const headers={};if(data!==undefined)headers["Content-Type"]="application/json";
  if(ifMatch)headers["If-Match"]=ifMatch;
  const controller=new AbortController(),tid=setTimeout(()=>controller.abort(),13000);
  try{
    const response=await fetch(url(path),{method:method||"GET",headers:headers,body:data===undefined?undefined:JSON.stringify(data),cache:"no-store",signal:controller.signal});
    if(response.status===412)throw Error("This seat or room is already occupied.");
    if(!response.ok)throw Error("Live database error ("+response.status+").");
    const body=await response.text();
    return body?JSON.parse(body):null;
  }finally{clearTimeout(tid);}
}
const read=p=>request(p,"GET");
const put=(p,val,ifMatch)=>request(p,"PUT",val,ifMatch);
const patch=(p,val)=>request(p,"PATCH",val);
const escapeText=x=>String(x===undefined||x===null?"":x).trim();
const randomHex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,"0")).join("");
async function hash(value){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,"0")).join("");
}
function showError(id,message){$(id).textContent=message||"";}
function cleanName(value){return String(value||"").trim().replace(/\s+/g," ").slice(0,30);}
function studentLink(){const u=new URL(location.origin+"/Comparative-Showdown/");u.searchParams.set("room",state.code);return u.toString();}
function hostLink(){const u=new URL("/Comparative-Showdown/teacher/",location.origin);u.searchParams.set("room",state.code);u.searchParams.set("host",state.secret);return u.toString();}
function show(role){
  state.role=role;
  $("landing").hidden=!!role;if($("host"))$("host").hidden=role!=="teacher";if($("student"))$("student").hidden=role!=="student";
  $("activity").hidden=true;$("endScreen").hidden=true;
}
function lockForms(locked){if($("create"))$("create").disabled=locked;if($("join"))$("join").disabled=locked;}
async function createRoom(){
  if(!isTeacherPage)return;
  if(state.busy)return;state.busy=true;lockForms(true);showError("hostError","Creating room…");
  try{
    const name=cleanName($("hostName").value)||"Teacher",mode=$("mode").value==="full"?"full":"quick";
    const secret=randomHex(24),hostHash=await hash(secret);
    for(let i=0;i<8;i++){
      const code=randomHex(3).toUpperCase();
      try{
        const room={hostHash:hostHash,teacherName:name,createdAt:Date.now(),status:"lobby",mode:mode,round:0,roundStartedAt:0,student:null,answers:{student:{},teacher:{}}};
        await put(path(code),room,"null_etag");
        state.secret=secret;state.name=name;state.code=code;
        localStorage.setItem("cmp:teacher:"+code,secret);
        history.replaceState(null,"",hostLink());
        show("teacher");startPolling();return;
      }catch(e){if(!/occupied/i.test(String(e.message)))throw e;}
    }
    throw Error("Could not find an available room code. Please retry.");
  }catch(e){showError("hostError",e.message);}finally{state.busy=false;lockForms(false);}
}
async function joinRoom(codeOverride){
  if(isTeacherPage)return;
  if(state.busy)return;state.busy=true;lockForms(true);showError("joinError","Checking room…");
  try{
    const code=String(codeOverride||$("joinCode").value||"").trim().toUpperCase();
    const name=cleanName($("playerName").value);
    if(!/^[A-F0-9]{6}$/.test(code))throw Error("Enter the six-character room code.");
    if(name.length<2)throw Error("Enter a name or nickname (at least two characters).");
    const room=await read(path(code));
    if(!room)throw Error("Room not found. Check the code.");
    if(room.status==="closed"||room.status==="finished")throw Error("This room has already ended.");
    const remembered=localStorage.getItem("cmp:student:"+code)||"";
    if(room.student){
      if(room.student.id!==remembered)throw Error("This room already has its one student. Ask the teacher for a new room.");
      state.id=remembered;state.name=room.student.name;
    }else{
      if(room.status!=="lobby")throw Error("The match has already started.");
      const id=randomHex(12);
      await put(path(code,"student"),{id:id,name:name,joinedAt:Date.now(),lastSeen:Date.now()},"null_etag");
      localStorage.setItem("cmp:student:"+code,id);state.id=id;state.name=name;
    }
    state.code=code;
    history.replaceState(null,"",studentLink());
    show("student");startPolling();
  }catch(e){showError("joinError",e.message);}finally{state.busy=false;lockForms(false);}
}
async function resumeRoom(){
  const code=String(params.get("room")||"").trim().toUpperCase();
  const host=String(params.get("host")||"");
  if(!/^[A-F0-9]{6}$/.test(code))return;
  if($("joinCode"))$("joinCode").value=code;
  const room=await read(path(code));
  if(!room)return;
  if(isTeacherPage&&host&&await hash(host)===room.hostHash){
    state.secret=host;state.code=code;state.name=room.teacherName;
    show("teacher");startPolling();return;
  }
  if(isTeacherPage){showError("hostError","Open the monitor using the teacher link from your original room.");return;}
  const known=localStorage.getItem("cmp:student:"+code)||"";
  if(room.student&&known&&room.student.id===known){
    state.code=code;state.id=known;state.name=room.student.name;show("student");startPolling();return;
  }
  showError("joinError","Enter your name and join this room.");
}
function results(role){
  const ans=state.room?.answers?.[role]||{};
  const a=Object.values(ans);
  return {score:a.reduce((s,x)=>s+(Number(x.points)||0),0),correct:a.filter(x=>x.correct).length,complete:a.filter(x=>x.complete).length,attempts:a.reduce((s,x)=>s+(Number(x.tries)||0),0)};
}
function currentEntry(){return state.room?.answers?.[state.role==="teacher"?"teacher":"student"]?.[state.room.round]||null;}
function nameOfMission(q){return q.mission.charAt(0)+q.mission.slice(1).toLowerCase();}
function label(n){return (n+1).toString().padStart(2,"0");}
function liveStudent(){
 const r=state.room;return r?.student&&Date.now()-Number(r.student.lastSeen||0)<45000;
}
function monitor(){
  if(state.role!=="teacher"||!state.room)return;
  const r=state.room,s=results("student"),t=results("teacher");
  const deck=getDeck(r),entry=r.answers?.student?.[r.round];
  $("roomCode").textContent=state.code;
  $("shareUrl").textContent=studentLink();
  $("hostConnection").textContent=(r.mode==="full"?"35":"14")+" preguntas · "+(r.status==="lobby"?"esperando al alumno":r.status==="playing"?"en juego":r.status==="revealed"?"respuesta visible":r.status==="finished"?"finalizada":"cerrada");
  $("studentBadge").textContent=r.student?(liveStudent()?"● CONECTADO":"● SIN CONEXIÓN"):"ESPERANDO";
  $("studentBadge").classList.toggle("offline",!liveStudent());
  $("monitorStudent").textContent=r.student?.name||"El alumno aún no entra";
  $("monitorProgress").textContent=s.complete+" / "+deck.length;
  $("monitorAttempts").textContent=s.attempts;
  $("monitorAccuracy").textContent=s.complete?Math.round(s.correct/s.complete*100)+"%":"—";
  $("teacherPoints").textContent=t.score;
  $("studentPoints").textContent=s.score;
  $("teacherLabel").textContent=r.teacherName||"Teacher";
  $("studentLabel").textContent=r.student?.name||"Student";
  $("seatInfo").textContent="Alumnos: "+(r.student?"1":"0")+"/1 · Tú participas como profesor.";
  document.getElementById("shareUrl")?.setAttribute("title","Copia este enlace y envíalo al alumno; no incluye controles de profesor.");
  $("hostRound").textContent=r.status==="lobby"?"—":Math.min(r.round+1,deck.length)+" / "+deck.length;
  $("hostMission").textContent=r.status==="lobby"?"Sala abierta":nameOfMission(questions[deck[Math.min(r.round,deck.length-1)]]);
  $("sessionStatus").textContent=r.status==="lobby"?(r.student?"¡Alumno dentro! Pulsa «Iniciar partida».":"Copia el enlace para que entre el alumno. Después podrás iniciar."):r.status==="playing"?"Ambos están resolviendo. Tú también puedes responder abajo. Pulsa «Mostrar respuesta» cuando quieras cerrar el reto.":r.status==="revealed"?"La respuesta ya está visible para ambos. Pulsa «Siguiente pregunta».":r.status==="finished"?"Partida terminada. Revisa la puntuación final.":r.status==="closed"?"Has cerrado la sala.":"Sala disponible.";
  $("start").disabled=!(r.status==="lobby"&&r.student);
  $("reveal").disabled=r.status!=="playing";
  $("next").disabled=r.status!=="revealed";
  $("next").textContent=r.round>=deck.length-1?"3 · FINALIZAR PARTIDA →":"3 · SIGUIENTE PREGUNTA →";
  if(!r.student)$("monitorAction").textContent="En cuanto el alumno entre, aquí verás sus intentos y resultados.";
  else if(r.status==="lobby")$("monitorAction").textContent="Alumno conectado. Pulsa «Iniciar partida».";
  else if(entry)$("monitorAction").textContent=entry.correct?"✓ Correcto en el intento "+entry.tries:entry.complete?"✕ Terminó los "+entry.tries+" intentos sin acertar":"↻ Intento "+entry.tries+": todavía no es correcto";
  else $("monitorAction").textContent="Alumno trabajando en la pregunta actual.";
  const canSee=Boolean(r.status==="revealed"||r.status==="finished"||r.answers?.teacher?.[r.round]?.complete);
  $("monitorAnswer").textContent=entry&&canSee?"Student's latest answer: "+entry.answer:entry?"Answer hidden until you submit or reveal.":"";
}
function renderStudentHeader(){
 const r=state.room;if(state.role!=="student"||!r)return;
 $("studentRoom").textContent=state.code;
 $("studentConnection").textContent=r.status==="lobby"?"Teacher is preparing the duel.":r.status==="revealed"?"Teacher has revealed the answer.":r.status==="playing"?"Challenge in progress — good luck!":r.status==="finished"?"The match has ended.":"The classroom has closed.";
 $("myScore").textContent=results("student").score;
 $("myRound").textContent=Math.min(r.round+1,getDeck(r).length)+" / "+getDeck(r).length;
}
function shuffledTokens(answer,seed){
 const parts=answer.replace(/[.!?]$/,"").split(/\s+/).map((word,i)=>({word:word,id:i}));
 // Reproducible shuffle for repeat attempts and for the teacher/student.
 let x=(seed+1)*2654435761>>>0;
 for(let i=parts.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[parts[i],parts[j]]=[parts[j],parts[i]];}
 if(parts.every((part,i)=>part.id===i))parts.reverse();
 return parts;
}
function starBoard(container){
 const table=document.createElement("table");table.className="star-board";
 const rows=[["","Daisy","Jill","Paola"],["Designed clothes","★★★","★★","★"],["Coloured drawings","★","★★","★★★"],["Explained designs","★","★★★","★★"],["Sewed clothes","★★","★★★","★"]];
 rows.forEach((cells,idx)=>{const tr=table.insertRow();cells.forEach((v,i)=>{const c=document.createElement(idx===0?"th":"td");c.textContent=v;tr.appendChild(c);});});
 container.appendChild(table);
}
function renderSlots(){
 const target=$("answerSlots");if(!target)return;
 target.replaceChildren();
 if(!state.picked.length){const b=document.createElement("strong");b.textContent="Tap words in the correct order…";target.appendChild(b);}
 else state.picked.forEach(i=>{const sp=document.createElement("span");sp.className="word";sp.textContent=state.tileOrder[i].word;target.appendChild(sp);});
 const tokens=$("tokens");if(tokens)Array.from(tokens.children).forEach((b,i)=>{b.disabled=state.picked.includes(i);b.classList.toggle("used",state.picked.includes(i));});
}
function buildChallenge(q,round){
 const box=$("challengeInput");box.replaceChildren();
 if(q.mission==="FASHION FINALS")starBoard(box);
 if(q.kind==="form"){
   const input=document.createElement("input");input.id="wordAnswer";input.autocomplete="off";input.spellcheck=false;input.placeholder="Type the missing word(s)…";input.setAttribute("aria-label","Your answer");input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();if(!$("check").disabled)submitAnswer();}});box.appendChild(input);
   $("undo").hidden=true;$("clear").hidden=true;
 }else{
   const slots=document.createElement("div");slots.id="answerSlots";slots.className="answer-slots";slots.setAttribute("aria-label","Sentence you are building");
   const tokens=document.createElement("div");tokens.id="tokens";tokens.className="tokens";tokens.setAttribute("aria-label","Available words");
   state.tileOrder=shuffledTokens(q.answer,round+13);state.picked=[];
   state.tileOrder.forEach((part,i)=>{const button=document.createElement("button");button.type="button";button.className="token";button.textContent=part.word;button.addEventListener("click",()=>{if(state.picked.includes(i))return;state.picked.push(i);renderSlots();});tokens.appendChild(button);});
   box.append(slots,tokens);renderSlots();$("undo").hidden=false;$("clear").hidden=false;
 }
}
function displayFeedback(entry,q){
 const target=$("feedback");target.className="feedback-box";
 if(!entry){target.textContent="Up to 3 tries. First-attempt accuracy earns maximum points.";return;}
 if(entry.correct){
   target.textContent="✓ Correct! +"+entry.points+" points. "+(state.room.status==="revealed"?q.explanation:"Wait for the teacher to reveal the answer.");
   target.classList.add("correct");
 }else if(entry.complete){
   target.textContent="No attempts remaining. The correct answer appears when your teacher reveals it.";
   target.classList.add("wrong");
 }else{
   target.textContent="Not quite — try again ("+entry.tries+"/3). Hint: "+q.tip;
   target.classList.add("wrong");
 }
}
function renderStage(){
 const r=state.room;if(!r)return;
 const deck=getDeck(r),entry=currentEntry();
 if(r.status==="lobby"){$("activity").hidden=true;$("endScreen").hidden=true;state.renderKey="lobby";return;}
 if(r.status==="finished"||r.status==="closed"){
   $("activity").hidden=true;$("endScreen").hidden=false;
   const s=results("student"),t=results("teacher");
   $("endTitle").textContent=r.status==="closed"?"Session ended":"Comparative Showdown complete!";
   $("endScores").textContent=(r.teacherName||"Teacher")+" "+t.score+" · "+s.score+" "+(r.student?.name||"Student");
   $("endMessage").textContent=r.status==="closed"?"The teacher ended this classroom.":t.score===s.score?"It's a tie! Both players matched each other.":t.score>s.score?"Teacher wins this round. Try a rematch!":"Student wins! Great language skills!";
   state.renderKey=r.status;return;
 }
 $("endScreen").hidden=true;$("activity").hidden=false;
 const idx=deck[r.round],q=questions[idx];
 const key=r.status+"|"+r.round+"|"+(entry?.tries||0)+"|"+(entry?.complete?"1":"0");
 if(state.renderKey!==key){
   state.renderKey=key;
   $("levelTag").textContent="MISSION "+label(r.round)+" / "+label(deck.length);
   $("missionName").textContent=q.mission;
   $("challengePrompt").textContent=q.prompt;
   $("challengeInstruction").textContent=q.kind==="form"?"Write the correct comparative adjective or adverb.":"Tap the words to build a grammatically correct sentence.";
   $("progressFill").style.width=Math.round((r.round+1)/deck.length*100)+"%";
   buildChallenge(q,idx);
   displayFeedback(entry,q);
 }
 const locked=r.status!=="playing"||Boolean(entry?.complete)||state.busy;
 $("check").disabled=locked;
 $("undo").disabled=locked;$("clear").disabled=locked;
 const tokens=$("tokens");if(tokens)tokens.querySelectorAll("button").forEach((btn,i)=>{btn.disabled=locked||state.picked.includes(i);});
 $("waiting").hidden=!(entry?.complete&&r.status==="playing");
 $("solution").hidden=r.status!=="revealed";
 if(r.status==="revealed"){
   $("solutionText").textContent=q.answer;
   $("solutionExplanation").textContent=q.explanation;
   $("feedback").textContent=entry?.correct?"✓ You solved it. "+entry.points+" points!":entry?.complete?"Look at the correct structure, then try it aloud.":"Round closed before you submitted. Study the solution.";
   $("feedback").className="feedback-box"+(entry?.correct?" correct":"");
 }
}
function timer(){
 const r=state.room;if(!r||!["playing","revealed"].includes(r.status))return;
 const seconds=Math.max(0,Math.floor((Date.now()-Number(r.roundStartedAt||Date.now()))/1000));
 $("timeLabel").textContent="⏱ "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0")+(r.status==="revealed"?" · REVEALED":"");
}
async function refresh(){
 if(state.inFlight||!state.code)return;
 state.inFlight=true;
 try{
   const room=await read(path(state.code));
   if(!room){$("activity").hidden=true;showError(state.role==="teacher"?"controlError":"joinError","This room no longer exists.");return;}
   if(state.role==="teacher"&&room.hostHash!==await hash(state.secret))throw Error("Monitor link is not valid.");
   if(state.role==="student"&&room.student?.id!==state.id)throw Error("This student seat is no longer yours.");
   state.room=room;
   monitor();renderStudentHeader();renderStage();timer();
   if(state.role==="student"&&Date.now()-Number(room.student.lastSeen||0)>10000){
     patch(path(state.code,"student"),{lastSeen:Date.now()}).catch(()=>{});
   }
 }catch(e){
   if(state.role==="teacher")showError("controlError","Connection issue: "+e.message);
   else $("studentConnection").textContent="Connection issue: "+e.message;
 }finally{state.inFlight=false;}
}
function startPolling(){
 if(state.poll)clearInterval(state.poll);
 if(state.tick)clearInterval(state.tick);
 state.renderKey="";refresh();
 state.poll=setInterval(refresh,1250);
 state.tick=setInterval(timer,1000);
}
function normalize(value){
 return String(value||"").normalize("NFKC").toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9' -]/g,"").replace(/\s+/g," ").trim().replace(/\.$/,"");
}
async function submitAnswer(){
 const r=state.room;if(!r||r.status!=="playing"||state.busy)return;
 const q=questions[getDeck(r)[r.round]],role=state.role==="teacher"?"teacher":"student";
 const current=currentEntry();if(current?.complete)return;
 let answer="";
 if(q.kind==="form")answer=escapeText($("wordAnswer")?.value);
 else answer=state.picked.map(i=>state.tileOrder[i].word).join(" ");
 if(!answer){$("feedback").textContent="Build or type an answer first.";return;}
 state.busy=true;$("check").disabled=true;
 try{
   // Re-read round state so a late submission cannot overwrite a new round.
   const fresh=await read(path(state.code));
   if(!fresh||fresh.round!==r.round||fresh.status!=="playing")throw Error("This mission has already ended.");
   const previous=fresh.answers?.[role]?.[r.round];
   if(previous?.complete)throw Error("This mission is already completed.");
   const tries=Math.min(3,(Number(previous?.tries)||0)+1);
   const correct=normalize(answer)===normalize(q.answer);
   const elapsed=Math.max(0,Date.now()-Number(r.roundStartedAt||Date.now()));
   const points=correct?(tries===1?100:tries===2?65:35)+(elapsed<=25000?20:0):0;
   const record={answer:answer,tries:tries,correct:correct,complete:correct||tries>=3,points:points,at:Date.now(),lastAction:correct?"correct":tries>=3?"failed":"retry"};
   await put(path(state.code,"answers/"+role+"/"+r.round),record);
   state.room.answers=state.room.answers||{};state.room.answers[role]=state.room.answers[role]||{};state.room.answers[role][r.round]=record;
   state.renderKey="";
   monitor();renderStudentHeader();renderStage();
 }catch(e){$("feedback").textContent="Could not submit answer: "+e.message;}
 finally{state.busy=false; if(state.room)renderStage();}
}
async function move(action){
 if(state.busy||state.role!=="teacher"||!state.room)return;
 state.busy=true;showError("controlError","");
 try{
  const fresh=await read(path(state.code));if(!fresh)throw Error("Room no longer exists.");
  const deck=getDeck(fresh);
  if(action==="start"){
    if(fresh.status!=="lobby"||!fresh.student)throw Error("Wait for your student to join.");
    await patch(path(state.code),{status:"playing",round:0,roundStartedAt:Date.now()});
  }else if(action==="reveal"){
    if(fresh.status!=="playing")throw Error("This round is no longer active.");
    await patch(path(state.code),{status:"revealed"});
  }else if(action==="next"){
    if(fresh.status!=="revealed")throw Error("Reveal the answer first.");
    if(fresh.round>=deck.length-1)await patch(path(state.code),{status:"finished"});
    else await patch(path(state.code),{status:"playing",round:fresh.round+1,roundStartedAt:Date.now()});
  }else if(action==="close"){
    if(!confirm("¿Terminar la sala para ti y el alumno?"))return;
    await patch(path(state.code),{status:"closed"});
  }
  await refresh();
 }catch(e){showError("controlError",e.message);}
 finally{state.busy=false;}
}
async function copyLink(value){
 try{
   if(!navigator.clipboard?.writeText)throw Error("Clipboard not supported.");
   await navigator.clipboard.writeText(value);showError("controlError","Enlace copiado. Envíalo al alumno.");
 }catch{showError("controlError","No se pudo copiar automáticamente. Selecciona el enlace visible arriba: "+value);}
}
$("create")?.addEventListener("click",createRoom);
$("join")?.addEventListener("click",()=>joinRoom());
$("start")?.addEventListener("click",()=>move("start"));
$("reveal")?.addEventListener("click",()=>move("reveal"));
$("next")?.addEventListener("click",()=>move("next"));
$("close")?.addEventListener("click",()=>move("close"));
$("copyJoin")?.addEventListener("click",()=>copyLink(studentLink()));
$("copyHost")?.addEventListener("click",()=>copyLink(hostLink()));
$("check").addEventListener("click",submitAnswer);
$("undo").addEventListener("click",()=>{state.picked.pop();renderSlots();});
$("clear").addEventListener("click",()=>{state.picked=[];renderSlots();});
$("joinCode")?.addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom();});
$("playerName")?.addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom();});
resumeRoom().catch(e=>showError(isTeacherPage?"hostError":"joinError","Unable to restore room: "+e.message));
