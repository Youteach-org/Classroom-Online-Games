import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";
import { createAudioCapture } from "./speech/audio-capture.mjs";
import { createAttemptRecorder } from "./speech/attempt-recorder.mjs";
import {
  createStandaloneAttempt,
  completeStandaloneAttempt,
  buildLocalStandaloneEvaluation,
  createStandaloneAttemptStore
} from "./standalone-session.mjs";
import { createOralGraderClient } from "./evaluation/oral-grader-client.mjs";
import {
  buildOralGraderSubmission,
  markAttemptUploading,
  markAttemptSubmitted,
  markAttemptSubmissionError
} from "./evaluation/oral-grader-submission.mjs";
import {
  ORAL_GRADER_ENDPOINTS,
  TALK_TALK_ONLINE_DEFAULTS
} from "./evaluation/oral-grader-config.mjs";

const session=requireStandaloneRole("student");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const store=createStandaloneAttemptStore();
const oralGrader=createOralGraderClient({
  endpoints:ORAL_GRADER_ENDPOINTS,
  token:session?.onlineToken||""
});
const ids=["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);

const recordButton=document.getElementById("recordButton");
const finishButton=document.getElementById("finishRecordingBtn");
const studentGradeBtn=document.getElementById("studentGradeBtn");
const studentAudio=document.getElementById("studentAudioElement");
const recordingReviewAudio=document.getElementById("recordingReviewAudio");
const studentPlayButton=document.getElementById("studentPlayButton");
const studentReviewAudioBtn=document.getElementById("studentReviewAudioBtn");
const studentRecordAgainBtn=document.getElementById("studentRecordAgainBtn");
const recordingReviewActions=document.getElementById("recordingReviewActions");

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

function gradingMessage(){
  const grading=attempt?.grading;
  if(!grading) return "Review the recording, record again, or send the accepted take to Oral-Grader.";
  if(grading.status==="uploading") return "Uploading the accepted recording to Oral-Grader...";
  if(grading.status==="submitted" || grading.status==="transcribing" || grading.status==="analyzing" || grading.status==="scoring"){
    return "Sent to Oral-Grader. Online job "+(grading.jobId||"")+" is processing.";
  }
  if(grading.status==="failed_retryable") return "The upload did not finish. Your recording is still here; tap Reintentar Califica.";
  if(grading.status==="failed_terminal") return "Oral-Grader rejected this submission. The local recording has been kept for review.";
  if(grading.status==="completed") return "Oral-Grader completed this attempt.";
  if(grading.status==="review_required") return "Oral-Grader needs teacher review for this attempt.";
  return "Review the recording, record again, or send the accepted take to Oral-Grader.";
}

function renderGradingState(){
  const status=attempt?.grading?.status||"";
  setText("gradingStatus",gradingMessage());
  if(studentGradeBtn){
    const unavailable=!audioBlob || isRecording || status==="uploading" || status==="submitted" ||
      status==="transcribing" || status==="analyzing" || status==="scoring" || status==="completed";
    studentGradeBtn.disabled=unavailable;
    studentGradeBtn.textContent=status==="failed_retryable" ? "Reintentar Califica" : "Califica";
  }
}

function setAudioBlob(blob){
  if(audioUrl){
    URL.revokeObjectURL?.(audioUrl);
    audioUrl="";
  }
  audioBlob=blob||null;
  for(const audio of [studentAudio,recordingReviewAudio]){
    audio?.removeAttribute("src");
  }
  if(audioBlob && globalThis.URL?.createObjectURL){
    audioUrl=URL.createObjectURL(audioBlob);
    if(studentAudio) studentAudio.src=audioUrl;
    if(recordingReviewAudio) recordingReviewAudio.src=audioUrl;
  }
  if(studentPlayButton) studentPlayButton.disabled=!audioBlob;
  if(studentReviewAudioBtn) studentReviewAudioBtn.disabled=!audioBlob;
  if(recordingReviewActions) recordingReviewActions.hidden=!audioBlob;
  renderGradingState();
}

function renderAttempt(){
  const duration=Number(attempt?.durationMs||0);
  setText("recordingDuration",formatDuration(duration));
  setText("conversationDuration",formatDuration(duration));
  setText("studentAttemptTime",duration ? formatDuration(duration) : "--:--");
  setText("studentPlayerTime","00:00 / "+formatDuration(duration));

  const transcript=attempt?.transcript?.heardText?.trim();
  const gradingStatus=attempt?.grading?.status;
  const transcriptPending=gradingStatus
    ? "Submitted to Oral-Grader. Literal transcript will appear when online processing completes."
    : "Transcript pending — submit the accepted take with Califica.";
  setText("transcriptStatus",transcript || transcriptPending);

  const fluency=attempt?.evaluation?.dimensions?.fluency?.value;
  const task=attempt?.evaluation?.dimensions?.taskCompletion?.value;
  setText(
    "recordingCapturedFeedback",
    attempt?.status==="recorded"
      ? "Recording captured and kept locally until online submission is acknowledged."
      : "Record an attempt to create evidence."
  );
  setText(
    "studentFluencyValue",
    fluency==null ? "Local diagnostic fluency: pending usable audio" : "Local diagnostic fluency: "+fluency+"%"
  );
  setText(
    "studentTaskValue",
    task==null ? "Recorded duration: pending" : "Local duration diagnostic: "+task+"%"
  );
  renderGradingState();
}

function updateRecordingClock(){
  if(!isRecording) return;
  const elapsed=Math.min(MAX_RECORDING_MS,Date.now()-recordingStartedAt);
  setText("recordingDuration",formatDuration(elapsed));
  setText("recordingCountdown",formatDuration(MAX_RECORDING_MS-elapsed));
  if(elapsed>=MAX_RECORDING_MS) stopRecording({navigate:false});
}

function setRecordingUi(active,message=""){
  isRecording=active;
  recordButton?.toggleAttribute("data-recording",active);
  document.getElementById("recordDot")?.classList.toggle("is-idle",!active);
  setText("recordingLabelText",active ? "Recording..." : attempt?.status==="recorded" ? "Recorded" : "Ready");
  setText("studentSpeakerState",active ? "Speaking..." : "Ready");
  if(message) setText("microphoneMessage",message);
  renderGradingState();
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
    setRecordingUi(true,"Recording now. Tap the microphone again or Finish to stop.");
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
    setRecordingUi(false,"Recording saved locally. Review it, record again, or press Califica.");
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

async function startFreshRecording(){
  if(isRecording) return;
  recordingReviewAudio?.pause?.();
  studentAudio?.pause?.();
  await store.clear();
  attempt=createStandaloneAttempt();
  setAudioBlob(null);
  renderAttempt();
  setRecordingUi(false,"Starting a new recording...");
  await startRecording();
}

async function submitForGrading(){
  if(isRecording || attempt?.status!=="recorded" || !audioBlob) return;
  const {metadata,idempotencyKey}=buildOralGraderSubmission(
    attempt,
    audioBlob,
    TALK_TALK_ONLINE_DEFAULTS
  );

  attempt=markAttemptUploading(attempt);
  await store.save(attempt,{audioBlob});
  renderAttempt();

  try{
    const acknowledgement=await oralGrader.submitAttempt(audioBlob,metadata,idempotencyKey);
    attempt=markAttemptSubmitted(attempt,acknowledgement);
    await store.save(attempt,{audioBlob});
    renderAttempt();
    showStudentView("studentConversationView");
  }catch(error){
    attempt=markAttemptSubmissionError(attempt,{
      message:error?.message||"Online grading submission failed.",
      retryable:error?.retryable!==false
    });
    await store.save(attempt,{audioBlob});
    renderAttempt();
  }
}

recordButton?.addEventListener("click",async()=>{
  if(isRecording) await stopRecording({navigate:false});
  else await startRecording();
});

studentReviewAudioBtn?.addEventListener("click",async()=>{
  if(!recordingReviewAudio?.src) return;
  if(recordingReviewAudio.paused){
    await recordingReviewAudio.play();
    studentReviewAudioBtn.textContent="❚❚ Pause review";
  }else{
    recordingReviewAudio.pause();
    studentReviewAudioBtn.textContent="▶ Review audio";
  }
});

recordingReviewAudio?.addEventListener("ended",()=>{
  if(studentReviewAudioBtn) studentReviewAudioBtn.textContent="▶ Review audio";
});

studentRecordAgainBtn?.addEventListener("click",startFreshRecording);
studentGradeBtn?.addEventListener("click",submitForGrading);

finishButton?.addEventListener("click",async()=>{
  if(isRecording){
    await stopRecording({navigate:false});
    return;
  }
  if(attempt?.status==="recorded"){
    setText("microphoneMessage","Take accepted locally. Review it, record again, or press Califica.");
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
  showStudentView("studentRecordingView");
  await startFreshRecording();
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
