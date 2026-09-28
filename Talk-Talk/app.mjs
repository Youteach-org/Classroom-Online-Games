import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";
import { createAudioCapture } from "./speech/audio-capture.mjs";
import { createAttemptRecorder } from "./speech/attempt-recorder.mjs";
import {
  createStandaloneAttempt,
  completeStandaloneAttempt,
  buildLocalStandaloneEvaluation,
  createStandaloneAttemptStore
} from "./standalone-session.mjs";

const session=requireStandaloneRole("student");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const store=createStandaloneAttemptStore();
const ids=["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);

const recordButton=document.getElementById("recordButton");
const finishButton=document.getElementById("finishRecordingBtn");
const studentAudio=document.getElementById("studentAudioElement");
const studentPlayButton=document.getElementById("studentPlayButton");

let current=0;
let attempt=createStandaloneAttempt();
let audioBlob=null;
let audioUrl="";
let capture=null;
let recorder=null;
let isRecording=false;
let recordingStartedAt=0;
let timerId=null;
const MAX_RECORDING_MS=180000;

function formatDuration(ms){
  const total=Math.max(0,Math.round(Number(ms||0)/1000));
  const minutes=Math.floor(total/60);
  const seconds=total%60;
  return String(minutes).padStart(2,"0")+":"+String(seconds).padStart(2,"0");
}

function setText(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=String(value ?? "");
}

function setAudioBlob(blob){
  if(audioUrl){
    URL.revokeObjectURL?.(audioUrl);
    audioUrl="";
  }
  audioBlob=blob||null;
  if(studentAudio){
    studentAudio.removeAttribute("src");
    if(audioBlob && globalThis.URL?.createObjectURL){
      audioUrl=URL.createObjectURL(audioBlob);
      studentAudio.src=audioUrl;
    }
  }
  if(studentPlayButton) studentPlayButton.disabled=!audioBlob;
}

function renderAttempt(){
  const duration=Number(attempt?.durationMs||0);
  setText("recordingDuration",formatDuration(duration));
  setText("conversationDuration",formatDuration(duration));
  setText("studentAttemptTime",duration ? formatDuration(duration) : "--:--");
  setText("studentPlayerTime","00:00 / "+formatDuration(duration));

  const transcript=attempt?.transcript?.heardText?.trim();
  setText(
    "transcriptStatus",
    transcript || "Transcript pending — Oral-Grader is not connected yet."
  );

  const fluency=attempt?.evaluation?.dimensions?.fluency?.value;
  const task=attempt?.evaluation?.dimensions?.taskCompletion?.value;
  setText(
    "recordingCapturedFeedback",
    attempt?.status==="recorded"
      ? "Recording captured and saved for teacher review."
      : "Record an attempt to create evidence."
  );
  setText(
    "studentFluencyValue",
    fluency==null ? "Fluency: pending usable audio" : "Fluency from local audio: "+fluency+"%"
  );
  setText(
    "studentTaskValue",
    task==null ? "Task completion: pending recording" : "Task completion from recorded duration: "+task+"%"
  );
}

function updateRecordingClock(){
  if(!isRecording) return;
  const elapsed=Math.min(MAX_RECORDING_MS,Date.now()-recordingStartedAt);
  setText("recordingDuration",formatDuration(elapsed));
  setText("recordingCountdown",formatDuration(MAX_RECORDING_MS-elapsed));
  if(elapsed>=MAX_RECORDING_MS) stopRecording({navigate:true});
}

function setRecordingUi(active,message=""){
  isRecording=active;
  recordButton?.toggleAttribute("data-recording",active);
  document.getElementById("recordDot")?.classList.toggle("is-idle",!active);
  setText("recordingLabelText",active ? "Recording..." : attempt?.status==="recorded" ? "Recorded" : "Ready");
  setText("studentSpeakerState",active ? "Speaking..." : "Ready");
  if(message) setText("microphoneMessage",message);
}

export function showStudentView(id,{push=true}={}){
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

async function startRecording(){
  if(isRecording) return;
  try{
    if(attempt?.status==="recorded"){
      await store.clear();
      attempt=createStandaloneAttempt();
      setAudioBlob(null);
      renderAttempt();
    }

    capture=createAudioCapture();
    const stream=await capture.open();
    recorder=createAttemptRecorder({stream});
    recorder.start();
    recordingStartedAt=Date.now();
    setText("recordingCountdown","03:00");
    setText("recordingDuration","00:00");
    setRecordingUi(true,"Recording now. Tap the microphone again to stop, or use Finish.");
    clearInterval(timerId);
    timerId=setInterval(updateRecordingClock,250);
  }catch(error){
    capture?.close?.();
    capture=null;
    recorder=null;
    const reason=error?.talkTalkReason || error?.code || "microphone-error";
    const messages={
      "microphone-denied":"Microphone permission was denied. Allow microphone access and try again.",
      "microphone-unavailable":"No microphone is available on this device.",
      "microphone-busy":"The microphone is being used by another app.",
      "microphone-error":"The microphone could not be opened."
    };
    setRecordingUi(false,messages[reason]||messages["microphone-error"]);
  }
}

async function stopRecording({navigate=false}={}){
  if(!isRecording || !recorder) return false;
  clearInterval(timerId);
  timerId=null;
  try{
    const recorded=await recorder.stop();
    capture?.close?.();
    capture=null;
    recorder=null;

    const evaluation=buildLocalStandaloneEvaluation({
      samples:recorded.samples,
      sampleRate:recorded.sampleRate,
      durationMs:recorded.durationMs
    });

    attempt=completeStandaloneAttempt(attempt,{
      durationMs:recorded.durationMs,
      audioKey:"standalone-latest-audio",
      evaluation
    });
    setAudioBlob(recorded.blob);
    await store.save(attempt,{audioBlob:recorded.blob});
    setRecordingUi(false,"Recording saved. You can review it now or record again.");
    setText("recordingCountdown","03:00");
    renderAttempt();
    if(navigate) showStudentView("studentConversationView");
    return true;
  }catch(error){
    capture?.close?.();
    capture=null;
    recorder=null;
    setRecordingUi(false,"The recording could not be saved. This is a technical retry, not a learner error.");
    return false;
  }
}

recordButton?.addEventListener("click",async()=>{
  if(isRecording) await stopRecording({navigate:false});
  else await startRecording();
});

finishButton?.addEventListener("click",async()=>{
  if(isRecording){
    await stopRecording({navigate:true});
    return;
  }
  if(attempt?.status==="recorded"){
    showStudentView("studentConversationView");
  }else{
    setText("microphoneMessage","Record an attempt before finishing.");
  }
});

document.querySelectorAll("[data-target]").forEach(control=>{
  if(control===finishButton) return;
  control.addEventListener("click",()=>showStudentView(control.dataset.target));
});

document.getElementById("tryAgainBtn")?.addEventListener("click",async()=>{
  if(isRecording) await stopRecording({navigate:false});
  await store.clear();
  attempt=createStandaloneAttempt();
  setAudioBlob(null);
  setRecordingUi(false,"Tap the microphone to start a new attempt.");
  renderAttempt();
  showStudentView("studentRecordingView");
});

document.getElementById("previewPrevBtn")?.addEventListener("click",()=>{
  if(current>0) showStudentView(ids[current-1]);
});
document.getElementById("previewNextBtn")?.addEventListener("click",()=>{
  if(current<ids.length-1) showStudentView(ids[current+1]);
});

studentPlayButton?.addEventListener("click",async()=>{
  if(!studentAudio?.src) return;
  if(studentAudio.paused){
    await studentAudio.play();
    studentPlayButton.textContent="❚❚";
  }else{
    studentAudio.pause();
    studentPlayButton.textContent="▶";
  }
});
studentAudio?.addEventListener("timeupdate",()=>{
  setText(
    "studentPlayerTime",
    formatDuration(studentAudio.currentTime*1000)+" / "+formatDuration((studentAudio.duration||attempt?.durationMs/1000||0)*1000)
  );
});
studentAudio?.addEventListener("ended",()=>{
  if(studentPlayButton) studentPlayButton.textContent="▶";
});

document.getElementById("standaloneLogoutBtn")?.addEventListener("click",()=>{
  if(isRecording){
    clearInterval(timerId);
    capture?.close?.();
  }
  clearStandaloneSession();
  location.href="./login.html";
});

window.addEventListener("popstate",event=>{
  const id=event.state?.talkTalkView;
  if(ids.includes(id)) showStudentView(id,{push:false});
});

async function bootstrap(){
  const loaded=await store.load();
  if(loaded.attempt) attempt=loaded.attempt;
  setAudioBlob(loaded.audioBlob);
  renderAttempt();

  const initial=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
  history.replaceState({talkTalkView:initial},"","#"+initial);
  showStudentView(initial,{push:false});
}

bootstrap().catch(()=>{
  renderAttempt();
  showStudentView(ids[0],{push:false});
});
