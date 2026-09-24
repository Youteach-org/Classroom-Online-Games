import {
  resolveOsascompStudentLaunch,
  heartbeatOsascompStudent,
  submitOsascompLiveResult
} from './live-session.js';

const client=window.supabase.createClient("https://syvfxcqceyijofkgxviu.supabase.co","sb_publishable_YJTIsrjGHqua-1n5-T0Zhw_7S7sFAPB");
const ORDER={opinion:0,size:1,age:2,shape:3,color:4,origin:5,material:6,purpose:7};
const LABEL={opinion:"Opinion",size:"Size",age:"Age",shape:"Shape",color:"Color",origin:"Origin",material:"Material",purpose:"Purpose"};
const LETTER={opinion:"O",size:"S",age:"A",shape:"S",color:"C",origin:"O",material:"M",purpose:"P"};
const Q=[
{noun:"car",a:[["beautiful","opinion"],["small","size"],["old","age"],["red","color"],["Italian","origin"]]},
{noun:"table",a:[["lovely","opinion"],["large","size"],["old","age"],["round","shape"],["brown","color"],["French","origin"],["wooden","material"]]},
{noun:"bag",a:[["stylish","opinion"],["small","size"],["new","age"],["black","color"],["Italian","origin"],["leather","material"]]},
{noun:"knife",a:[["excellent","opinion"],["long","size"],["new","age"],["silver","color"],["German","origin"],["steel","material"],["cooking","purpose"]]},
{noun:"chair",a:[["comfortable","opinion"],["big","size"],["old","age"],["square","shape"],["green","color"],["English","origin"],["wooden","material"]]},
{noun:"boat",a:[["amazing","opinion"],["small","size"],["new","age"],["white","color"],["Japanese","origin"],["fiberglass","material"],["racing","purpose"]]},
{noun:"box",a:[["useful","opinion"],["tiny","size"],["old","age"],["square","shape"],["blue","color"],["Chinese","origin"],["metal","material"]]},
{noun:"coat",a:[["elegant","opinion"],["long","size"],["new","age"],["black","color"],["British","origin"],["wool","material"]]},
{noun:"clock",a:[["beautiful","opinion"],["small","size"],["antique","age"],["round","shape"],["gold","color"],["Swiss","origin"],["metal","material"]]},
{noun:"shoes",a:[["fantastic","opinion"],["small","size"],["new","age"],["red","color"],["Spanish","origin"],["leather","material"],["running","purpose"]]},
{noun:"lamp",a:[["strange","opinion"],["large","size"],["modern","age"],["round","shape"],["white","color"],["Danish","origin"],["glass","material"]]},
{noun:"bowl",a:[["beautiful","opinion"],["small","size"],["old","age"],["round","shape"],["blue","color"],["Japanese","origin"],["ceramic","material"],["serving","purpose"]]},
{noun:"jacket",a:[["cool","opinion"],["large","size"],["new","age"],["blue","color"],["American","origin"],["denim","material"]]},
{noun:"vase",a:[["gorgeous","opinion"],["tall","size"],["old","age"],["oval","shape"],["white","color"],["Greek","origin"],["ceramic","material"]]},
{noun:"desk",a:[["practical","opinion"],["large","size"],["new","age"],["rectangular","shape"],["black","color"],["Swedish","origin"],["wooden","material"]]},
{noun:"boots",a:[["expensive","opinion"],["big","size"],["new","age"],["brown","color"],["Mexican","origin"],["leather","material"],["riding","purpose"]]}
];
const MODES={training:{seconds:null,guide:true},practice:{seconds:60,guide:true},challenge:{seconds:45,guide:false},expert:{seconds:30,guide:false}};
const $=x=>document.getElementById(x),shuffle=a=>[...a].sort(()=>Math.random()-.5);
let room="",name="",mode="training",playerId=crypto.randomUUID(),channel=null,connected=false,deck=[],idx=0,score=0,lives=3,combo=1,best=1,selected=[],timer=null,timeLeft=null,locked=false,attempts=0,correct=0,results=[];
const liveStudentToken=String(new URLSearchParams(location.search).get("ytLiveStudent")||"").trim();
let youTeachLiveStudentContext=null;
let youTeachHeartbeatTimer=null;
let youTeachHeartbeatBusy=false;
let youTeachAttemptId="";

function newYouTeachAttemptId(){
  const randomPart=globalThis.crypto?.randomUUID
    ?globalThis.crypto.randomUUID().replace(/-/g,"").slice(0,20)
    :Math.random().toString(36).slice(2,14);
  return "a"+Date.now().toString(36)+"_"+randomPart;
}

function cleanYouTeachLaunchFromUrl(){
  const clean=new URL(location.href);
  clean.searchParams.delete("ytLiveStudent");
  clean.searchParams.delete("issuer");
  history.replaceState(null,"",clean.pathname+clean.search+clean.hash);
}

async function sendYouTeachHeartbeat(){
  if(youTeachHeartbeatBusy||!youTeachLiveStudentContext)return;
  youTeachHeartbeatBusy=true;
  try{
    await heartbeatOsascompStudent({studentContext:youTeachLiveStudentContext});
  }catch(error){
    console.error("OSASCOMP YouTeach heartbeat failed",error);
    if(Number(error?.status)===410){
      if(youTeachHeartbeatTimer){
        clearInterval(youTeachHeartbeatTimer);
        youTeachHeartbeatTimer=null;
      }
      $("joinMsg").textContent="This YouTeach live activity expired. Return to Student Buzzer.";
    }
  }finally{
    youTeachHeartbeatBusy=false;
  }
}

function startYouTeachHeartbeat(){
  if(!youTeachLiveStudentContext)return;
  if(youTeachHeartbeatTimer)clearInterval(youTeachHeartbeatTimer);
  sendYouTeachHeartbeat().catch(()=>{});
  youTeachHeartbeatTimer=setInterval(()=>{
    sendYouTeachHeartbeat().catch(()=>{});
  },25000);
}

async function prepareYouTeachStudentLaunch(){
  if(!liveStudentToken)return null;
  $("startBtn").disabled=true;
  $("joinMsg").textContent="Verifying YouTeach activity…";

  try{
    const context=await resolveOsascompStudentLaunch({search:location.search});
    if(!context)throw new Error("Missing YouTeach activity credential.");

    youTeachLiveStudentContext=context;
    const canonical=context.identity||{};
    name=String(canonical.nickname||canonical.fullName||"Student").slice(0,50);
    room=String(context.liveContext?.cogSessionId||"").trim().toUpperCase();
    playerId="YT-"+String(canonical.studentKey||"student").replace(/[^A-Za-z0-9_-]/g,"_").slice(0,90);

    $("name").value=name;
    $("name").readOnly=true;
    $("room").value=room;
    $("room").readOnly=true;
    $("joinMsg").textContent="YouTeach verified · "+name;
    $("startBtn").textContent="START GAME";
    $("startBtn").disabled=false;
    cleanYouTeachLaunchFromUrl();
    return context;
  }catch(error){
    console.error(error);
    $("joinMsg").textContent=error?.message||"Could not verify this YouTeach activity.";
    $("startBtn").disabled=true;
    throw error;
  }
}

const youTeachLaunchPromise=liveStudentToken
  ?prepareYouTeachStudentLaunch()
  :Promise.resolve(null);

function currentArrangement(){return selected.map(x=>x.w)} function correctA(){return [...deck[idx].a].sort((a,b)=>ORDER[a[1]]-ORDER[b[1]])}
async function updatePresence(status="playing",latestAction=""){if(!channel||!connected)return;await channel.track({role:"student",playerId,name,mode,round:Math.min(idx+1,10),score,lives,combo,status,accuracy:attempts?Math.round(correct/attempts*100):100,noun:deck[idx]?.noun||null,arrangement:currentArrangement(),latestAction,updatedAt:new Date().toISOString()})}
async function sendEvent(type,extra={}){if(!channel||!connected)return;const payload={type,playerId,name,mode,round:idx+1,score,lives,combo,timeLeft,noun:deck[idx]?.noun||null,arrangement:currentArrangement(),ts:new Date().toISOString(),...extra};await channel.send({type:"broadcast",event:"game_event",payload});await updatePresence(type==="finish"?"finished":"playing",extra.actionLabel||type)}
async function connectRoom(){if(channel)await client.removeChannel(channel);channel=client.channel("osascomp:"+room,{config:{presence:{key:playerId},broadcast:{ack:true}}});channel.subscribe(async status=>{if(status==="SUBSCRIBED"){connected=true;$("liveStatus").className="status online";$("liveStatus").innerHTML='<span class="dot"></span><span>Live with teacher</span>';await updatePresence("playing","Connected");sendEvent("join",{actionLabel:"Joined the live session"});if(youTeachLiveStudentContext)startYouTeachHeartbeat()}})}

$("startBtn").addEventListener("click",async()=>{
  if(liveStudentToken){
    try{await youTeachLaunchPromise;}catch{return;}
    const canonical=youTeachLiveStudentContext?.identity||{};
    name=String(canonical.nickname||canonical.fullName||"Student").slice(0,50);
    room=String(youTeachLiveStudentContext?.liveContext?.cogSessionId||"").trim().toUpperCase();
    playerId="YT-"+String(canonical.studentKey||"student").replace(/[^A-Za-z0-9_-]/g,"_").slice(0,90);
  }else{
    name=$("name").value.trim();
    room=$("room").value.trim().toUpperCase();
  }

  mode=document.querySelector('input[name="mode"]:checked').value;
  if(!name||!room){
    $("joinMsg").textContent="Enter your name and class code.";
    return;
  }

  $("joinMsg").textContent="Connecting to live class…";
  await connectRoom();
  setTimeout(()=>{
    $("start").style.display="none";
    $("play").style.display="block";
    startGame();
  },450);
});

function startGame(){if(youTeachLiveStudentContext)youTeachAttemptId=newYouTeachAttemptId();deck=shuffle(Q).slice(0,10);idx=0;score=0;lives=3;combo=1;best=1;attempts=0;correct=0;results=[];renderStudentHistory();load()}
function load(){clearInterval(timer);if(idx>=10||lives<=0){finish();return}locked=false;selected=[];timeLeft=MODES[mode].seconds;$("hudName").textContent=name;$("modeLabel").textContent=mode.toUpperCase();$("legend").style.display=MODES[mode].guide?"grid":"none";$("noun").textContent=deck[idx].noun;$("feedback").className="feedback";$("feedback").innerHTML="";$("answer").innerHTML='<span class="muted"><i>Your phrase appears here…</i></span>';setDisabled(false);const c=$("choices");c.innerHTML="";shuffle(deck[idx].a).forEach(([w,cat])=>{const b=document.createElement("button");b.className="chip";b.textContent=w;b.addEventListener("click",()=>{if(locked||b.classList.contains("used"))return;selected.push({w,cat,b});b.classList.add("used");renderAnswer();sendEvent("move_add",{word:w,category:cat,actionLabel:"Added "+w})});c.appendChild(b)});update();sendEvent("round_start",{actionLabel:"Started round "+(idx+1)});if(timeLeft!==null)timer=setInterval(()=>{timeLeft--;update();if(timeLeft<=0){clearInterval(timer);timeout()}},1000)}
function renderAnswer(){const z=$("answer");z.innerHTML="";selected.forEach((x,i)=>{const b=document.createElement("button");b.className="chip answerchip";b.textContent=x.w;b.addEventListener("click",()=>{if(locked)return;const r=selected[i];r.b.classList.remove("used");selected.splice(i,1);selected.length?renderAnswer():$("answer").innerHTML='<span class="muted"><i>Your phrase appears here…</i></span>';sendEvent("move_remove",{word:r.w,category:r.cat,actionLabel:"Removed "+r.w})});z.appendChild(b)});const n=document.createElement("span");n.className="chip nounchip";n.textContent=deck[idx].noun;z.appendChild(n)}
$("undoBtn").addEventListener("click",()=>{if(locked||!selected.length)return;const r=selected.pop();r.b.classList.remove("used");selected.length?renderAnswer():$("answer").innerHTML='<span class="muted"><i>Your phrase appears here…</i></span>';sendEvent("move_remove",{word:r.w,category:r.cat,actionLabel:"Undid "+r.w})});$("resetBtn").addEventListener("click",()=>{if(locked)return;selected.forEach(x=>x.b.classList.remove("used"));selected=[];$("answer").innerHTML='<span class="muted"><i>Your phrase appears here…</i></span>';sendEvent("move_reset",{actionLabel:"Reset current arrangement"})});

function setDisabled(v){$("checkBtn").disabled=v;$("undoBtn").disabled=v;$("resetBtn").disabled=v;document.querySelectorAll("#choices .chip").forEach(b=>b.disabled=v)}
function analyzeWrong(items,expected){for(let i=0;i<items.length-1;i++){const a=items[i],b=items[i+1];if(ORDER[a.cat]>ORDER[b.cat])return{explanation:`<b>${a.w}</b> is ${LABEL[a.cat]} (${LETTER[a.cat]}), but <b>${b.w}</b> is ${LABEL[b.cat]} (${LETTER[b.cat]}). ${LABEL[b.cat]} comes before ${LABEL[a.cat]} in OSASCOMP.`,plain:`${a.w} is ${LABEL[a.cat]}, but ${b.w} is ${LABEL[b.cat]}. ${LABEL[b.cat]} comes before ${LABEL[a.cat]} in OSASCOMP.`,errorKey:`${b.cat}>${a.cat}`,errorLabel:`${LABEL[b.cat]} before ${LABEL[a.cat]}`}}return{explanation:"Review the OSASCOMP order: Opinion → Size → Age → Shape → Color → Origin → Material → Purpose.",plain:"Review the OSASCOMP order.",errorKey:"general",errorLabel:"General OSASCOMP order"}}
function feedback(ok,title,phrase,why,correctOrder,entry){locked=true;setDisabled(true);const f=$("feedback");f.className="feedback "+(ok?"ok":"no");f.innerHTML=`<div class="feedback-title">${title}</div><div class="feedback-phrase">${phrase}</div><div class="feedback-why"><b>Why:</b> ${why}</div><div class="feedback-rule"><b>Correct OSASCOMP order:</b><br>${correctOrder}</div><button id="continueBtn" class="continue-btn">ACCEPT & CONTINUE</button>`;$("continueBtn").addEventListener("click",()=>{sendEvent("accepted_feedback",{actionLabel:"Accepted feedback"});idx++;load()});results.push(entry);renderStudentHistory();f.scrollIntoView({behavior:"smooth",block:"center"})}
$("checkBtn").addEventListener("click",()=>{if(locked)return;const exp=correctA(),right=exp.map(x=>x[0]),given=selected.map(x=>x.w);if(given.length!==right.length){$("feedback").className="feedback info";$("feedback").innerHTML='<div class="feedback-title" style="font-size:22px">Not finished yet</div><div class="feedback-why">Use every adjective before checking.</div>';return}attempts++;if(JSON.stringify(given)===JSON.stringify(right)){clearInterval(timer);correct++;const bonus=timeLeft===null?0:Math.max(0,timeLeft)*2;const earned=100*combo+bonus;score+=earned;combo=Math.min(5,combo+1);best=Math.max(best,combo);update();const why="The adjectives follow the OSASCOMP sequence from the earliest category to the latest category.";sendEvent("correct",{attemptedOrder:given,correctOrder:right,explanation:"The adjectives follow the correct OSASCOMP sequence.",earned,errorKey:null,errorLabel:null,actionLabel:"Correct answer"});feedback(true,"✓ CORRECT!",right.join(" ")+" "+deck[idx].noun,why,exp.map(([w,c])=>`${w} (${LETTER[c]}: ${LABEL[c]})`).join(" → "),{round:idx+1,correct:true,noun:deck[idx].noun,answer:right.join(" ")+" "+deck[idx].noun,why:"Correct OSASCOMP sequence."})}else{clearInterval(timer);lives--;combo=1;update();const e=analyzeWrong(selected,exp);sendEvent("wrong",{attemptedOrder:given,correctOrder:right,explanation:e.plain,errorKey:e.errorKey,errorLabel:e.errorLabel,actionLabel:"Incorrect answer"});feedback(false,"✗ NOT QUITE",given.join(" ")+" "+deck[idx].noun,e.explanation,exp.map(([w,c])=>`${w} (${LETTER[c]}: ${LABEL[c]})`).join(" → "),{round:idx+1,correct:false,noun:deck[idx].noun,answer:given.join(" ")+" "+deck[idx].noun,correctAnswer:right.join(" ")+" "+deck[idx].noun,why:e.plain})}});
function timeout(){if(locked)return;attempts++;lives--;combo=1;update();const exp=correctA(),right=exp.map(x=>x[0]),given=selected.map(x=>x.w),why="Time ended before you confirmed a complete correct phrase.";sendEvent("timeout",{attemptedOrder:given,correctOrder:right,explanation:why,errorKey:"timeout",errorLabel:"Time management / incomplete response",actionLabel:"Time expired"});feedback(false,"⌛ TIME'S UP",(given.join(" ")||"No complete answer")+" "+deck[idx].noun,why,exp.map(([w,c])=>`${w} (${LETTER[c]}: ${LABEL[c]})`).join(" → "),{round:idx+1,correct:false,noun:deck[idx].noun,answer:(given.join(" ")||"No complete answer")+" "+deck[idx].noun,correctAnswer:right.join(" ")+" "+deck[idx].noun,why})}
function renderStudentHistory(){const box=$("studentHistory");if(!results.length){box.innerHTML='<div class="history-empty">No completed items yet.</div>';return}box.innerHTML=[...results].reverse().map(r=>`<div class="history-item ${r.correct?"good":"bad"}"><div class="history-head"><span>Round ${r.round}: ${r.noun}</span><span>${r.correct?"✓ Correct":"✗ Incorrect"}</span></div><p><b>Your answer:</b> ${r.answer}</p>${r.correct?"":`<p><b>Correct:</b> ${r.correctAnswer}</p>`}<p><b>Why:</b> ${r.why}</p></div>`).join("")}
function update(){$("score").textContent=score;$("combo").textContent="x"+combo;$("lives").textContent="❤".repeat(lives)+"♡".repeat(3-lives);$("round").textContent=Math.min(idx+1,10)+"/10";$("time").textContent=timeLeft===null?"∞":timeLeft+"s";$("progress").style.width=(idx*10)+"%"}
function finish(){
  clearInterval(timer);
  $("play").style.display="none";
  $("end").style.display="block";
  const acc=attempts?Math.round(correct/attempts*100):0;
  const completedAt=Date.now();
  $("finalName").textContent=name+" — "+mode;
  $("finalScore").textContent=score;
  $("accuracy").textContent=acc+"%";
  $("correct").textContent=correct+"/"+attempts;
  $("best").textContent="x"+best;
  sendEvent("finish",{accuracy:acc,correct,attempts,bestCombo:best,actionLabel:"Finished the game"});

  if(youTeachLiveStudentContext){
    submitOsascompLiveResult({
      studentContext:youTeachLiveStudentContext,
      attemptId:youTeachAttemptId||newYouTeachAttemptId(),
      completedAt,
      score,
      accuracy:acc,
      correct,
      attempts,
      bestCombo:best,
      mode
    }).catch(error=>{
      console.error("Could not return OSASCOMP result to YouTeach",error);
    });
  }
}$("againBtn").addEventListener("click",()=>{$("end").style.display="none";$("play").style.display="block";startGame()});
