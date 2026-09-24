import {
  loadOsascompTeacherContext,
  roomForTeacherContext,
  registerOsascompSession,
  endOsascompSession,
  heartbeatOsascompTeacher
} from '../live-session.js';

const client=window.supabase.createClient("https://syvfxcqceyijofkgxviu.supabase.co","sb_publishable_YJTIsrjGHqua-1n5-T0Zhw_7S7sFAPB"),$=x=>document.getElementById(x);
let channel=null,students={},errorCount=0;
let youTeachTeacherContext=loadOsascompTeacherContext();
let liveActivityActive=false;
let liveHeartbeatBusy=false;
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function ensure(id){if(!students[id])students[id]={answers:[],arrangement:[],present:false,errorPatterns:{},wrongStreak:0,correctStreak:0};return students[id]}
async function disconnectRoom(){
  if(!channel)return;
  const currentChannel=channel;
  channel=null;
  try{await client.removeChannel(currentChannel);}catch{}
}

async function connectRoom(roomOverride=""){
  const room=String(roomOverride||$("room").value||"").trim().toUpperCase();
  if(!room)throw new Error("Missing OSASCOMP room.");

  await disconnectRoom();
  students={};
  errorCount=0;
  render();

  return new Promise((resolve,reject)=>{
    let settled=false;
    const timeout=setTimeout(()=>{
      if(settled)return;
      settled=true;
      reject(new Error("Could not connect to the OSASCOMP live room."));
    },10000);

    channel=client.channel("osascomp:"+room,{config:{presence:{key:"teacher-"+crypto.randomUUID()}}});
    channel
      .on("broadcast",{event:"game_event"},({payload})=>handle(payload))
      .on("presence",{event:"sync"},sync)
      .subscribe(async st=>{
        if(st==="SUBSCRIBED"){
          $("status").className="status online";
          $("status").innerHTML='<span class="dot"></span><span>En vivo: '+esc(room)+'</span>';
          try{await channel.track({role:"teacher"});}catch{}
          if(!settled){
            settled=true;
            clearTimeout(timeout);
            resolve(room);
          }
          return;
        }
        if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(st)&&!settled){
          settled=true;
          clearTimeout(timeout);
          reject(new Error("Could not connect to the OSASCOMP live room."));
        }
      });
  });
}

function renderLiveControls(){
  const button=$("connect");
  const end=$("endLiveActivity");
  if(!youTeachTeacherContext){
    button.textContent="CONECTAR";
    button.disabled=false;
    end.hidden=true;
    $("room").readOnly=false;
    return;
  }

  const room=roomForTeacherContext(youTeachTeacherContext);
  $("room").value=room;
  $("room").readOnly=true;
  button.textContent=liveActivityActive?"LIVE ACTIVITY ACTIVE":"START LIVE ACTIVITY";
  button.disabled=liveActivityActive;
  end.hidden=!liveActivityActive;
  end.disabled=false;
}

async function sendTeacherHeartbeat(){
  if(liveHeartbeatBusy||!liveActivityActive||!youTeachTeacherContext)return;
  const room=roomForTeacherContext(youTeachTeacherContext);
  if(!room)return;

  liveHeartbeatBusy=true;
  try{
    await heartbeatOsascompTeacher({
      teacherContext:youTeachTeacherContext,
      room
    });
  }catch(error){
    console.error("OSASCOMP teacher heartbeat failed",error);
    if(Number(error?.status)===410||Number(error?.status)===409){
      liveActivityActive=false;
      await disconnectRoom();
      $("status").className="status";
      $("status").innerHTML='<span class="dot"></span><span>Actividad live no disponible</span>';
      renderLiveControls();
    }
  }finally{
    liveHeartbeatBusy=false;
  }
}

async function initializeYouTeachLive(){
  youTeachTeacherContext=youTeachTeacherContext||loadOsascompTeacherContext();
  if(!youTeachTeacherContext){
    renderLiveControls();
    await connectRoom();
    return;
  }

  const room=roomForTeacherContext(youTeachTeacherContext);
  renderLiveControls();

  try{
    await heartbeatOsascompTeacher({
      teacherContext:youTeachTeacherContext,
      room
    });
    await connectRoom(room);
    liveActivityActive=true;
    renderLiveControls();
  }catch(error){
    if(![403,409,410].includes(Number(error?.status))){
      console.error("Could not resume OSASCOMP live activity",error);
      $("status").innerHTML='<span class="dot"></span><span>No se pudo verificar la actividad live</span>';
    }else{
      $("status").className="status";
      $("status").innerHTML='<span class="dot"></span><span>Lista para iniciar</span>';
    }
    liveActivityActive=false;
    renderLiveControls();
  }
}

async function startLiveActivity(){
  youTeachTeacherContext=youTeachTeacherContext||loadOsascompTeacherContext();
  if(!youTeachTeacherContext)throw new Error("Open OSASCOMP from YouTeach first.");

  const room=roomForTeacherContext(youTeachTeacherContext);
  $("connect").disabled=true;
  $("status").innerHTML='<span class="dot"></span><span>Iniciando actividad…</span>';

  await connectRoom(room);
  try{
    await registerOsascompSession({
      teacherContext:youTeachTeacherContext,
      room
    });
    liveActivityActive=true;
    await heartbeatOsascompTeacher({
      teacherContext:youTeachTeacherContext,
      room
    });
  }catch(error){
    await disconnectRoom();
    liveActivityActive=false;
    throw error;
  }finally{
    renderLiveControls();
  }
}

async function endLiveActivity(){
  if(!youTeachTeacherContext||!liveActivityActive)return;
  if(!confirm("End this activity for the group? Students will no longer be able to enter."))return;

  const room=roomForTeacherContext(youTeachTeacherContext);
  $("endLiveActivity").disabled=true;
  try{
    await endOsascompSession({
      teacherContext:youTeachTeacherContext,
      room
    });
    liveActivityActive=false;
    await disconnectRoom();
    students={};
    errorCount=0;
    render();
    $("status").className="status";
    $("status").innerHTML='<span class="dot"></span><span>Actividad terminada</span>';
  }catch(error){
    console.error(error);
    $("status").innerHTML='<span class="dot"></span><span>'+esc(error?.message||"No se pudo terminar")+'</span>';
  }finally{
    renderLiveControls();
  }
}

$("connect").addEventListener("click",()=>{
  const action=youTeachTeacherContext?startLiveActivity():connectRoom();
  Promise.resolve(action).catch(error=>{
    console.error(error);
    $("status").className="status";
    $("status").innerHTML='<span class="dot"></span><span>'+esc(error?.message||"No se pudo conectar")+'</span>';
    renderLiveControls();
  });
});
$("endLiveActivity").addEventListener("click",()=>endLiveActivity().catch(console.error));
function sync(){const state=channel.presenceState(),ids=new Set();Object.values(state).flat().forEach(p=>{if(p.role==="student"&&p.playerId){ids.add(p.playerId);const s=ensure(p.playerId);Object.assign(s,p,{present:true});if(Array.isArray(p.arrangement))s.arrangement=p.arrangement}});Object.keys(students).forEach(id=>students[id].present=ids.has(id));render()}
function handle(p){if(!p||!p.playerId)return;const s=ensure(p.playerId);Object.assign(s,p,{present:true,lastType:p.type,lastTs:p.ts});if(Array.isArray(p.arrangement))s.arrangement=p.arrangement;s.latestAction=p.actionLabel||p.type;
if(p.type==="wrong"||p.type==="timeout"){errorCount++;s.wrongStreak=(s.wrongStreak||0)+1;s.correctStreak=0;const key=p.errorKey||"general",label=p.errorLabel||"General OSASCOMP order";if(!s.errorPatterns[key])s.errorPatterns[key]={count:0,label};s.errorPatterns[key].count++;s.errorPatterns[key].label=label}
else if(p.type==="correct"){s.correctStreak=(s.correctStreak||0)+1;s.wrongStreak=0}
if(["correct","wrong","timeout"].includes(p.type)){s.answers.push({type:p.type,ts:p.ts,round:p.round,noun:p.noun,attemptedOrder:Array.isArray(p.attemptedOrder)?[...p.attemptedOrder]:[],correctOrder:Array.isArray(p.correctOrder)?[...p.correctOrder]:[],explanation:p.explanation||""});if(s.answers.length>40)s.answers=s.answers.slice(-40)}
render()}
function patterns(s){return Object.values(s.errorPatterns||{}).sort((a,b)=>b.count-a.count)}
function mastery(s){const acc=Number.isFinite(Number(s.accuracy))?Number(s.accuracy):100,p=patterns(s),rep=p[0]?.count||0,w=s.wrongStreak||0,n=s.answers?.length||0;if(n<2)return{key:"yellow",label:"OBSERVANDO",reason:"Aún hay pocos reactivos para estimar dominio."};if(acc<60||w>=3||rep>=3)return{key:"red",label:"INTERVENIR",reason:rep>=3?`Repite: ${p[0].label} (${rep} veces).`:w>=3?`${w} errores consecutivos.`:`Precisión actual: ${Math.round(acc)}%.`};if(acc<80||w>=2||rep>=2)return{key:"yellow",label:"EN PROCESO",reason:rep>=2?`Patrón repetido: ${p[0].label} (${rep} veces).`:w>=2?`${w} errores consecutivos.`:`Precisión actual: ${Math.round(acc)}%.`};return{key:"green",label:"BUEN DOMINIO",reason:`Precisión ${Math.round(acc)}% y sin patrón crítico.`}}
function render(){const arr=Object.values(students),active=arr.filter(s=>s.present),accs=arr.map(s=>Number(s.accuracy)).filter(Number.isFinite);$("online").textContent=active.length;$("playing").textContent=active.filter(s=>s.status!=="finished").length;$("finished").textContent=arr.filter(s=>s.status==="finished"||s.lastType==="finish").length;$("avg").textContent=accs.length?Math.round(accs.reduce((a,b)=>a+b,0)/accs.length)+"%":"—";$("errors").textContent=errorCount;$("attention").textContent=arr.filter(s=>mastery(s).key==="red").length;
const box=$("students");if(!arr.length){box.innerHTML='<div class="empty">Aún no hay alumnos conectados.</div>';return}
box.innerHTML=arr.sort((a,b)=>(b.present?1:0)-(a.present?1:0)).map(s=>{const m=mastery(s),round=Math.max(1,Math.min(10,Number(s.round)||1)),acc=Number.isFinite(Number(s.accuracy))?Math.round(Number(s.accuracy)):null,arrg=Array.isArray(s.arrangement)?s.arrangement:[],noun=s.noun||"",ans=[...(s.answers||[])].reverse(),cls=s.lastType==="correct"?"ok":(["wrong","timeout"].includes(s.lastType)?"bad":"idle");return `<article class="student ${m.key}"><div class="shead"><div class="name">${esc(s.name||"Alumno")}</div><div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end"><span class="mastery ${m.key}">${m.label}</span><span class="badge">${s.present?"● EN LÍNEA":"○ DESCONECTADO"}</span></div></div><div class="muted" style="font-size:12px;margin-top:3px">${esc((s.mode||"").toUpperCase())} · Ronda ${round}/10</div><div class="bar"><div style="width:${round*10}%"></div></div><div class="metrics"><div class="metric"><small>Puntaje</small><b>${Number(s.score)||0}</b></div><div class="metric"><small>Vidas</small><b>${Number.isFinite(Number(s.lives))?Number(s.lives):3}</b></div><div class="metric"><small>Combo</small><b>x${Number(s.combo)||1}</b></div><div class="metric"><small>Acierto</small><b>${acc===null?"—":acc+"%"}</b></div></div>
<div class="livework"><div class="livework-label">Acomodo en este momento</div><div class="live-noun">Reactivo actual: <b>${esc(noun||"—")}</b></div><div class="arrangement">${arrg.length?arrg.map(w=>`<span class="word">${esc(w)}</span>`).join(""):'<span class="arr-empty">Todavía no ha colocado adjetivos.</span>'}${noun?`<span class="word nounword">${esc(noun)}</span>`:""}</div><div class="latest ${cls}"><strong>Último movimiento</strong>${esc(s.latestAction||"Conectado")}</div></div>
<div class="diagnosis"><strong>Diagnóstico automático</strong><div>${esc(m.reason)}</div>${patterns(s).length?`<div class="patterns">${patterns(s).slice(0,3).map(p=>`<span class="pattern">${esc(p.label)} ×${p.count}</span>`).join("")}</div>`:'<div class="muted">Sin patrón repetido todavía.</div>'}</div>
<details><summary><span>Historial de respuestas</span><span>${ans.length}</span></summary><div class="answer-list">${ans.length?ans.map(h=>{const ok=h.type==="correct",given=(h.attemptedOrder||[]).join(" → "),right=(h.correctOrder||[]).join(" → "),status=ok?"✓ CORRECTA":h.type==="timeout"?"⌛ TIEMPO":"✗ INCORRECTA";return `<div class="answer-row"><b class="${ok?"ok":"bad"}">Ronda ${h.round||"—"} · ${status}</b><div><b>Respuesta:</b> ${given?esc(given):"<i>Sin respuesta completa</i>"}${h.noun?" → "+esc(h.noun):""}</div>${!ok&&right?`<div><b>Correcta:</b> ${esc(right)}${h.noun?" → "+esc(h.noun):""}</div>`:""}${h.explanation?`<div class="${ok?"muted":"bad"}">${esc(h.explanation)}</div>`:""}<time>${h.ts?new Date(h.ts).toLocaleTimeString():""}</time></div>`}).join(""):'<div class="muted">Sin respuestas evaluadas todavía.</div>'}</div></details></article>`}).join("")}
setInterval(()=>{sendTeacherHeartbeat().catch(()=>{});},25000);
initializeYouTeachLive().catch(error=>{
  console.error(error);
  renderLiveControls();
});
