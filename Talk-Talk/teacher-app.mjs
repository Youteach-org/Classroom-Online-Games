import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";

const session=requireStandaloneRole("teacher");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const ids=["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);
let current=0;

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
document.getElementById("standaloneLogoutBtn")?.addEventListener("click",()=>{
  clearStandaloneSession();
  location.href="./login.html";
});
window.addEventListener("popstate",event=>{
  const id=event.state?.talkTalkView;
  if(ids.includes(id)) showTeacherView(id,{push:false});
});
const initial=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
history.replaceState({talkTalkView:initial},"","#"+initial);
showTeacherView(initial,{push:false});
