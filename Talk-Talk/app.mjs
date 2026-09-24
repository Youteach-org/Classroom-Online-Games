import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";

const session=requireStandaloneRole("student");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const ids=["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);
let current=0;

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

document.querySelectorAll("[data-target]").forEach(control=>{
  control.addEventListener("click",()=>showStudentView(control.dataset.target));
});
document.getElementById("previewPrevBtn")?.addEventListener("click",()=>{
  if(current>0) showStudentView(ids[current-1]);
});
document.getElementById("previewNextBtn")?.addEventListener("click",()=>{
  if(current<ids.length-1) showStudentView(ids[current+1]);
});
document.getElementById("recordButton")?.addEventListener("click",()=>{
  const state=document.getElementById("recordingState");
  if(state) state.textContent=state.textContent==="Listening…"?"Ready":"Listening…";
});
document.getElementById("standaloneLogoutBtn")?.addEventListener("click",()=>{
  clearStandaloneSession();
  location.href="./login.html";
});
window.addEventListener("popstate",event=>{
  const id=event.state?.talkTalkView;
  if(ids.includes(id)) showStudentView(id,{push:false});
});
const initial=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
history.replaceState({talkTalkView:initial},"","#"+initial);
showStudentView(initial,{push:false});
