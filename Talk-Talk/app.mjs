import { createAudioCapture } from "./speech/audio-capture.mjs";

const views=[...document.querySelectorAll(".student-view")];
const recordingState=document.getElementById("recordingState");
const recordButton=document.getElementById("recordButton");
let capture=null;
let micOpen=false;

export function showStudentView(id){
  for(const view of views){
    const active=view.id===id;
    view.hidden=!active;
    view.classList.toggle("is-active",active);
  }
  window.scrollTo({top:0,behavior:"smooth"});
}

document.getElementById("continueAction")?.addEventListener("click",()=>showStudentView("studentRecordingView"));
document.getElementById("finishRecordingBtn")?.addEventListener("click",()=>showStudentView("studentConversationView"));
document.getElementById("showPracticeResultBtn")?.addEventListener("click",()=>showStudentView("studentPracticeResultView"));
document.getElementById("tryAgainBtn")?.addEventListener("click",()=>showStudentView("studentRecordingView"));
document.getElementById("studentFullTranscriptBtn")?.addEventListener("click",()=>showStudentView("studentConversationView"));

recordButton?.addEventListener("click",async()=>{
  if(!micOpen){
    try{
      capture=createAudioCapture();
      await capture.open();
      micOpen=true;
      recordButton.dataset.active="true";
      recordingState.textContent="Listening…";
    }catch(error){
      recordingState.textContent=error?.message||"Microphone unavailable.";
    }
  }else{
    capture?.close();
    capture=null;
    micOpen=false;
    recordButton.dataset.active="false";
    recordingState.textContent="Recording paused.";
  }
});

showStudentView("studentHomeView");
