import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";
import {
  createStandaloneAttemptStore,
  updateStandaloneTeacherReview,
  publishStandaloneAttempt
} from "./standalone-session.mjs";

const session=requireStandaloneRole("teacher");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const store=createStandaloneAttemptStore();
const ids=["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);
const teacherAudio=document.getElementById("teacherAudioElement");

let current=0;
let attempt=null;
let audioBlob=null;
let audioUrl="";

function formatDuration(ms){
  const total=Math.max(0,Math.round(Number(ms||0)/1000));
  return String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");
}
function setText(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=String(value ?? "");
}
function setBar(id,score){
  const el=document.getElementById(id);
  if(el) el.style.width=score==null ? "0%" : Math.max(0,Math.min(100,Number(score)*12.5))+"%";
}
function localFluencyScore(){
  const value=attempt?.evaluation?.dimensions?.fluency?.value;
  return value==null ? null : Math.max(0,Math.min(8,Math.round(value*8/100)));
}
function currentScores(){
  const manual=attempt?.teacher?.scores || {};
  return {
    fluency:manual.fluency ?? localFluencyScore(),
    coherence:manual.coherence ?? null,
    grammarVocabulary:manual.grammarVocabulary ?? null,
    pronunciation:manual.pronunciation ?? null,
    interaction:manual.interaction ?? null
  };
}
function setAudioBlob(blob){
  if(audioUrl){
    URL.revokeObjectURL?.(audioUrl);
    audioUrl="";
  }
  audioBlob=blob||null;
  if(teacherAudio){
    teacherAudio.removeAttribute("src");
    if(audioBlob && globalThis.URL?.createObjectURL){
      audioUrl=URL.createObjectURL(audioBlob);
      teacherAudio.src=audioUrl;
    }
  }
  for(const id of ["teacherPlayButton","teacherAssessmentPlayButton"]){
    document.getElementById(id)?.toggleAttribute("disabled",!audioBlob);
  }
}
function renderAttempt(){
  const hasAttempt=attempt?.status==="recorded";
  const duration=Number(attempt?.durationMs||0);
  const statusEl=document.getElementById("teacherAttemptState");
  if(statusEl){
    statusEl.textContent=hasAttempt ? (attempt?.teacher?.published ? "● Published" : "● Finished") : "● No attempt";
    statusEl.className="team-status "+(hasAttempt ? "finished" : "ready");
  }
  setText("teacherDetailStatus",hasAttempt ? (attempt?.teacher?.published ? "● Published" : "● Finished") : "● Waiting");
  setText("teacherParticipantState",hasAttempt ? "Completed" : "Waiting");
  setText("teacherParticipantDuration",formatDuration(duration));
  setText("teacherPlayerTime","00:00 / "+formatDuration(duration));
  setText(
    "sessionState",
    hasAttempt
      ? (attempt.activityTitle||"Tell me what happened")+" · Standalone · 1 recorded attempt"
      : "Standalone · waiting for a student attempt"
  );
  setText(
    "teacherTranscriptStatus",
    attempt?.transcript?.heardText?.trim() || "Transcript pending — Oral-Grader is not connected yet."
  );
  setText("teacherEvidenceTime",duration ? formatDuration(duration) : "--:--");
  setText(
    "teacherAudioEvidence",
    hasAttempt ? "Recorded audio available for playback ("+formatDuration(duration)+")." : "No recording loaded."
  );
  const localFluency=attempt?.evaluation?.dimensions?.fluency?.value;
  setText(
    "teacherFluencyEvidence",
    localFluency==null ? "Pending a usable recorded attempt." : "Local prosody estimate: "+localFluency+"%."
  );

  const scores=currentScores();
  const rows=[
    ["Fluency",scores.fluency,"teacherFluencyScore","teacherFluencyBar"],
    ["Coherence",scores.coherence,"teacherCoherenceScore","teacherCoherenceBar"],
    ["Grammar & Vocabulary",scores.grammarVocabulary,"teacherGrammarScore","teacherGrammarBar"],
    ["Pronunciation",scores.pronunciation,"teacherPronunciationScore","teacherPronunciationBar"],
    ["Interaction",scores.interaction,"teacherInteractionScore","teacherInteractionBar"]
  ];
  for(const [,score,labelId,barId] of rows){
    setText(labelId,score==null ? "Pending" : score+" / 8");
    setBar(barId,score);
  }
  const complete=Object.values(scores).every(value=>value!=null);
  setText("teacherOverallScore",complete ? Object.values(scores).reduce((a,b)=>a+b,0)+" / 40" : "Partial evidence");

  const published=attempt?.teacher?.published===true;
  const publishBtn=document.getElementById("teacherPublishBtn");
  if(publishBtn) publishBtn.textContent=published ? "Published ✓" : "Publish result";
}

export function showTeacherView(id,{push=true}={}){
  const next=ids.indexOf(id);
  if(next<0) return;
  current=next;
  for(const view of views){
    const active=view.id===id;
    view.hidden=!active;
    view.classList.toggle("is-active",active);
  }
  document.getElementById("previewPrevBtn")?.toggleAttribute("disabled",current===0);
  document.getElementById("previewNextBtn")?.toggleAttribute("disabled",current===ids.length-1);
  if(push) history.pushState({talkTalkView:id},"","#"+id);
  window.scrollTo({top:0,behavior:"instant"});
}

document.querySelectorAll("[data-target]").forEach(control=>{
  control.addEventListener("click",()=>showTeacherView(control.dataset.target));
});

document.getElementById("previewPrevBtn")?.addEventListener("click",()=>{
  if(current>0) showTeacherView(ids[current-1]);
});
document.getElementById("previewNextBtn")?.addEventListener("click",()=>{
  if(current<ids.length-1) showTeacherView(ids[current+1]);
});

async function toggleAudio(){
  if(!teacherAudio?.src) return;
  if(teacherAudio.paused) await teacherAudio.play();
  else teacherAudio.pause();
}
document.getElementById("teacherPlayButton")?.addEventListener("click",toggleAudio);
document.getElementById("teacherAssessmentPlayButton")?.addEventListener("click",toggleAudio);
teacherAudio?.addEventListener("timeupdate",()=>{
  setText(
    "teacherPlayerTime",
    formatDuration(teacherAudio.currentTime*1000)+" / "+formatDuration((teacherAudio.duration||attempt?.durationMs/1000||0)*1000)
  );
});

document.getElementById("teacherEditScoresBtn")?.addEventListener("click",async()=>{
  if(!attempt){
    alert("No student attempt is available yet.");
    return;
  }
  const existing=currentScores();
  const fields=[
    ["fluency","Fluency"],
    ["coherence","Coherence"],
    ["grammarVocabulary","Grammar & Vocabulary"],
    ["pronunciation","Pronunciation"],
    ["interaction","Interaction"]
  ];
  const scores={};
  for(const [key,label] of fields){
    const raw=prompt(label+" score (0–8)",existing[key]??"");
    if(raw===null) return;
    if(raw.trim()==="") continue;
    const value=Number(raw);
    if(!Number.isFinite(value)||value<0||value>8){
      alert(label+" must be between 0 and 8.");
      return;
    }
    scores[key]=Math.round(value);
  }
  const comments=prompt("Teacher comments",attempt?.teacher?.comments||"");
  if(comments===null) return;
  attempt=updateStandaloneTeacherReview(attempt,{scores,comments});
  await store.save(attempt,{audioBlob});
  renderAttempt();
});

document.getElementById("teacherPublishBtn")?.addEventListener("click",async()=>{
  if(!attempt){
    alert("No student attempt is available yet.");
    return;
  }
  attempt=publishStandaloneAttempt(attempt,{comments:attempt?.teacher?.comments||""});
  await store.save(attempt,{audioBlob});
  renderAttempt();
  setText("sessionState","Standalone · result published locally for testing");
});

document.getElementById("teacherReportBtn")?.addEventListener("click",()=>{
  if(!attempt){
    alert("No student attempt is available yet.");
    return;
  }
  const scores=currentScores();
  const lines=[
    "TALK-TALK — Standalone Oral Review",
    "",
    "Student: "+(attempt.studentName||"Paul"),
    "Activity: "+(attempt.activityTitle||"Tell me what happened"),
    "Recorded duration: "+formatDuration(attempt.durationMs),
    "Transcript: "+(attempt.transcript?.heardText||"Pending Oral-Grader"),
    "",
    "Fluency: "+(scores.fluency==null?"Pending":scores.fluency+"/8"),
    "Coherence: "+(scores.coherence==null?"Pending":scores.coherence+"/8"),
    "Grammar & Vocabulary: "+(scores.grammarVocabulary==null?"Pending":scores.grammarVocabulary+"/8"),
    "Pronunciation: "+(scores.pronunciation==null?"Pending":scores.pronunciation+"/8"),
    "Interaction: "+(scores.interaction==null?"Pending":scores.interaction+"/8"),
    "",
    "Teacher comments: "+(attempt.teacher?.comments||"")
  ];
  const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="talk-talk-standalone-review.txt";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("sendTwistBtn")?.addEventListener("click",()=>{
  const twist=document.getElementById("twistSelect")?.value||"Remember a detail";
  localStorage.setItem("talkTalkStandaloneTwist",twist);
  setText("sessionState","Standalone · twist queued for next attempt: "+twist);
});

document.getElementById("endActivityBtn")?.addEventListener("click",()=>{
  localStorage.setItem("talkTalkStandaloneEnded","true");
  setText("sessionState","Standalone activity ended locally.");
});

document.getElementById("standaloneLogoutBtn")?.addEventListener("click",()=>{
  clearStandaloneSession();
  location.href="./login.html";
});

window.addEventListener("popstate",event=>{
  const id=event.state?.talkTalkView;
  if(ids.includes(id)) showTeacherView(id,{push:false});
});

async function bootstrap(){
  const loaded=await store.load();
  attempt=loaded.attempt;
  setAudioBlob(loaded.audioBlob);
  renderAttempt();
  const initial=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
  history.replaceState({talkTalkView:initial},"","#"+initial);
  showTeacherView(initial,{push:false});
}

bootstrap().catch(()=>{
  renderAttempt();
  showTeacherView(ids[0],{push:false});
});
