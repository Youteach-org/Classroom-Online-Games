const teacherViews=[...document.querySelectorAll(".teacher-view")];

export function showTeacherView(id){
  for(const view of teacherViews){
    const active=view.id===id;
    view.hidden=!active;
    view.classList.toggle("is-active",active);
  }
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll("[data-teacher-view]").forEach(control=>{
  control.addEventListener("click",()=>showTeacherView(control.dataset.teacherView));
});

document.querySelectorAll("[data-team]").forEach(card=>{
  card.addEventListener("dblclick",()=>showTeacherView("teacherTeamView"));
  card.addEventListener("click",()=>{
    document.querySelectorAll("[data-team]").forEach(x=>x.classList.remove("selected"));
    card.classList.add("selected");
  });
});

document.getElementById("sendTwistBtn")?.addEventListener("click",()=>{
  const selected=document.querySelector("[data-team].selected");
  if(selected) selected.classList.add("twist-sent");
});

document.getElementById("endActivityBtn")?.addEventListener("click",()=>{
  document.getElementById("sessionState").textContent="Activity ended · Results ready for review";
});

showTeacherView("teacherMonitorView");
