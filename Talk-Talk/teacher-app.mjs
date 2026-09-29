import { clearStandaloneSession, requireStandaloneRole } from "./standalone-auth.mjs";
import { createOralGraderClient } from "./evaluation/oral-grader-client.mjs";
import { mapOralGraderResultToTalkTalk } from "./evaluation/oral-grader-mapper.mjs";
import { ORAL_GRADER_ENDPOINTS } from "./evaluation/oral-grader-config.mjs";

const session=requireStandaloneRole("teacher");
if(session) document.documentElement.dataset.standaloneRole=session.role;

const oralGrader=createOralGraderClient({
  endpoints:ORAL_GRADER_ENDPOINTS,
  token:session?.onlineToken||""
});

const ids=["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"];
const views=ids.map(id=>document.getElementById(id)).filter(Boolean);
const teacherAudio=document.getElementById("teacherAudioElement");
const teacherStudentSelect=document.getElementById("teacherStudentSelect");

const RUBRIC_KEYS=[
  ["fluency","teacherFluencyScore","teacherFluencyBar"],
  ["coherence_and_organization","teacherCoherenceScore","teacherCoherenceBar"],
  ["grammar_and_vocabulary","teacherGrammarScore","teacherGrammarBar"],
  ["pronunciation_and_intelligibility","teacherPronunciationScore","teacherPronunciationBar"],
  ["communicative_interaction","teacherInteractionScore","teacherInteractionBar"]
];

let current=0;
let jobs=[];
let selectedJob=null;
let selectedMapped=null;
let selectedStudentId="";
let audioBlob=null;
let audioUrl="";
let refreshTimer=null;

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
function avatarForIndex(index){
  return index%2===1 ? "./assets/paulina-head.webp" : "./assets/paul-head.webp";
}
function statusLabel(status){
  const labels={
    submitted:"Submitted",
    transcribing:"Transcribing",
    analyzing:"Analyzing",
    scoring:"Scoring",
    completed:"Finished",
    review_required:"Review required",
    failed_retryable:"Retry required",
    failed_terminal:"Failed"
  };
  return labels[status]||String(status||"Waiting");
}
function statusClass(status){
  if(status==="completed") return "finished";
  if(status==="review_required" || String(status||"").startsWith("failed")) return "problem";
  if(["transcribing","analyzing","scoring"].includes(status)) return "speaking";
  return "ready";
}

function setAudioBlob(blob){
  if(audioUrl){
    URL.revokeObjectURL?.(audioUrl);
    audioUrl="";
  }
  audioBlob=blob||null;
  teacherAudio?.removeAttribute("src");
  if(audioBlob && globalThis.URL?.createObjectURL){
    audioUrl=URL.createObjectURL(audioBlob);
    if(teacherAudio) teacherAudio.src=audioUrl;
  }
  for(const id of ["teacherPlayButton","teacherAssessmentPlayButton"]){
    document.getElementById(id)?.toggleAttribute("disabled",!audioBlob);
  }
}

function resultStudent(){
  const rows=selectedJob?.result?.students||[];
  return rows.find(row=>row.studentId===selectedStudentId) || rows[0] || null;
}

function finalScores(){
  const review=selectedJob?.teacherReview;
  if(review?.scores && typeof review.scores==="object") return review.scores;
  return resultStudent()?.rubric_scores || null;
}

function finalTotal(){
  const review=selectedJob?.teacherReview;
  if(Number.isInteger(review?.total)) return review.total;
  const row=resultStudent();
  return Number.isInteger(row?.total) ? row.total : null;
}

function renderJobGrid(){
  const grid=document.getElementById("teamGrid");
  if(!grid) return;
  grid.replaceChildren();

  if(!jobs.length){
    for(let index=0;index<4;index+=1){
      const card=document.createElement("button");
      card.className="team-card is-placeholder";
      card.disabled=true;
      card.type="button";
      card.innerHTML="<strong>Team "+(index+1)+"</strong><small>Online slot</small><span class=\"team-status ready\">● Waiting</span>";
      grid.append(card);
    }
    setText("teacherJobListStatus","No submitted online jobs yet.");
    return;
  }

  jobs.forEach((job,index)=>{
    const card=document.createElement("button");
    card.className="team-card"+(selectedJob?.jobId===job.jobId?" selected":"");
    card.type="button";
    card.dataset.jobId=job.jobId;

    const strong=document.createElement("strong");
    strong.textContent=job.teamId || "Attempt "+(index+1);

    const small=document.createElement("small");
    const names=(job.students||[]).map(row=>row.name).filter(Boolean);
    small.textContent=names.join(" · ") || "Student attempt";

    const status=document.createElement("span");
    status.className="team-status "+statusClass(job.status);
    status.textContent="● "+statusLabel(job.status);

    const bottom=document.createElement("div");
    bottom.className="team-bottom";
    const avatars=document.createElement("span");
    avatars.className="stacked-avatars";
    (job.students||[]).slice(0,3).forEach((student,studentIndex)=>{
      const img=document.createElement("img");
      img.src=avatarForIndex(studentIndex);
      img.alt=student.name||"Student";
      avatars.append(img);
    });
    const tool=document.createElement("span");
    tool.className="round-tool";
    tool.textContent=job.status==="completed" ? "▤" : "…";
    bottom.append(avatars,tool);

    card.append(strong,small,status,bottom);
    card.addEventListener("click",()=>selectJob(job.jobId,{open:true}));
    grid.append(card);
  });

  setText("teacherJobListStatus",jobs.length+" shared online job"+(jobs.length===1?"":"s")+" loaded.");
}

function renderParticipants(){
  const container=document.getElementById("teacherParticipants");
  if(!container) return;
  container.replaceChildren();
  const students=selectedJob?.students||[];

  if(!students.length){
    const row=document.createElement("article");
    row.className="participant";
    row.textContent="No participant data.";
    container.append(row);
    return;
  }

  students.forEach((student,index)=>{
    const row=document.createElement("article");
    row.className="participant";

    const img=document.createElement("img");
    img.src=avatarForIndex(index);
    img.alt=student.name||"Student";

    const info=document.createElement("div");
    const strong=document.createElement("strong");
    strong.textContent=student.name||student.studentId||"Student";
    const span=document.createElement("span");
    span.textContent=statusLabel(selectedJob?.status);
    info.append(strong,span);

    const time=document.createElement("time");
    const duration=Number(selectedJob?.promptContext?.durationMs||0);
    time.textContent=duration ? formatDuration(duration) : "online";

    row.append(img,info,time);
    row.addEventListener("dblclick",()=>{
      selectedStudentId=student.studentId;
      renderSelectedJob();
      showTeacherView("teacherAssessmentView");
    });
    container.append(row);
  });
}

function renderStudentSelect(){
  if(!teacherStudentSelect) return;
  teacherStudentSelect.replaceChildren();
  const students=selectedJob?.students||[];
  for(const student of students){
    const option=document.createElement("option");
    option.value=student.studentId;
    option.textContent=student.name||student.studentId;
    teacherStudentSelect.append(option);
  }
  if(!selectedStudentId && students[0]) selectedStudentId=students[0].studentId;
  teacherStudentSelect.value=selectedStudentId;
  teacherStudentSelect.disabled=students.length<2;
}

function renderTranscript(){
  const thread=document.getElementById("teacherTranscriptThread");
  if(!thread) return;
  thread.replaceChildren();
  const segments=selectedMapped?.transcript?.segments||[];

  if(!segments.length){
    const row=document.createElement("article");
    row.className="evidence-message";
    const img=document.createElement("img");
    img.src="./assets/paul-head.webp";
    img.alt="Oral-Grader";
    const div=document.createElement("div");
    const strong=document.createElement("strong");
    strong.textContent="Oral-Grader";
    const p=document.createElement("p");
    p.id="teacherTranscriptStatus";
    p.textContent=selectedJob
      ? "Literal transcript is not available yet. Status: "+statusLabel(selectedJob.status)+"."
      : "Select an online job to inspect the literal transcript.";
    div.append(strong,p);
    const time=document.createElement("time");
    time.textContent="--:--";
    row.append(img,div,time);
    thread.append(row);
    return;
  }

  segments.forEach((segment,index)=>{
    const row=document.createElement("article");
    row.className="evidence-message";
    const img=document.createElement("img");
    img.src=avatarForIndex(index);
    img.alt=segment.speaker||"Speaker";
    const div=document.createElement("div");
    const strong=document.createElement("strong");
    strong.textContent=segment.speaker||"Speaker";
    const p=document.createElement("p");
    p.textContent=segment.heardText??segment.heard_text??"";
    div.append(strong,p);
    const time=document.createElement("time");
    time.textContent=formatDuration(Number(segment.start_ms||0));
    row.append(img,div,time);
    thread.append(row);
  });
}

function evidenceText(item){
  return String(
    item?.grammar_note ||
    item?.vocabulary_note ||
    item?.pronunciation_note ||
    item?.intended ||
    item?.reviewed_heard ||
    item?.stage1_heard ||
    item?.heard ||
    ""
  );
}

function renderEvidence(){
  const list=document.getElementById("teacherEvidenceList");
  if(!list) return;
  list.replaceChildren();
  const evidence=selectedMapped?.analysis?.evidence||[];

  if(!evidence.length){
    const row=document.createElement("div");
    row.className="issue-row";
    row.innerHTML="<span class=\"issue-tag interaction\">Status</span><p>"+statusLabel(selectedJob?.status)+"</p><time>online</time>";
    list.append(row);
    return;
  }

  evidence.slice(0,6).forEach(item=>{
    const row=document.createElement("div");
    row.className="issue-row";
    const tag=document.createElement("span");
    tag.className="issue-tag "+(item.grammar_note?"grammar":item.pronunciation?"pronunciation":"interaction");
    tag.textContent=item.grammar_note?"Grammar":item.pronunciation?"Pronunciation":"Evidence";
    const p=document.createElement("p");
    p.textContent=evidenceText(item)||"Evidence item";
    const time=document.createElement("time");
    time.textContent=item.speaker||"OG";
    row.append(tag,p,time);
    list.append(row);
  });
}

function renderRubric(){
  const scores=finalScores();
  for(const [key,labelId,barId] of RUBRIC_KEYS){
    const score=scores?.[key];
    setText(labelId,Number.isInteger(score)?score+" / 8":"Pending");
    setBar(barId,Number.isInteger(score)?score:null);
  }
  const total=finalTotal();
  setText("teacherOverallScore",Number.isInteger(total)?total+" / 40":"Pending");
  const student=resultStudent();
  setText(
    "teacherAssessmentStudent",
    student ? (student.name+" · "+(selectedJob?.teacherReview?.published?"Published teacher result":"Oral-Grader result")) : "Online Oral-Grader result"
  );
}

function renderSelectedJob(){
  const hasJob=Boolean(selectedJob);
  const names=(selectedJob?.students||[]).map(row=>row.name).filter(Boolean);
  const duration=Number(selectedJob?.promptContext?.durationMs||0);
  const status=statusLabel(selectedJob?.status);

  setText("teacherTeamTitle",selectedJob?.teamId || (hasJob?"Online attempt":"Team"));
  setText("teacherTeamNames",names.join(" · ") || "No online job selected");
  setText("teacherDetailStatus","● "+status);
  setText("teacherParticipantState",status);
  setText("teacherParticipantDuration",duration?formatDuration(duration):"online");
  setText(
    "sessionState",
    hasJob
      ? "Online Oral-Grader · "+status+" · "+(selectedJob?.activityId||"Talk Talk")
      : "Online Oral-Grader · waiting for a submitted job"
  );

  const state=document.getElementById("teacherAttemptState");
  if(state){
    state.textContent="● "+status;
    state.className="team-status "+statusClass(selectedJob?.status);
  }

  renderParticipants();
  renderStudentSelect();
  renderTranscript();
  renderEvidence();
  renderRubric();

  const published=selectedJob?.teacherReview?.published===true;
  const publish=document.getElementById("teacherPublishBtn");
  if(publish){
    publish.textContent=published?"Published ✓":"Publish result";
    publish.disabled=!hasJob || !finalScores() || published;
  }
  document.getElementById("teacherEditScoresBtn")?.toggleAttribute("disabled",!hasJob || !resultStudent());
  document.getElementById("teacherReportBtn")?.toggleAttribute("disabled",!hasJob || !resultStudent());

  setText(
    "teacherAudioEvidence",
    audioBlob ? "Submitted source audio is available for authenticated playback." :
      published ? "Source audio was deleted after publish." : "Audio not loaded or unavailable."
  );
  setText(
    "teacherFluencyEvidence",
    selectedMapped?.analysis?.fluency?.[0] || (hasJob?"Waiting for complete evidence.":"No result selected.")
  );
}

async function loadSelectedAudio(){
  setAudioBlob(null);
  if(!selectedJob?.jobId || selectedJob?.teacherReview?.published) return;
  try{
    const blob=await oralGrader.getAudioBlob(selectedJob.jobId);
    setAudioBlob(blob);
  }catch{
    setAudioBlob(null);
  }
  renderSelectedJob();
}

async function selectJob(jobId,{open=false}={}){
  const clean=String(jobId||"").trim();
  if(!clean) return;
  selectedJob=await oralGrader.getJobRecord(clean);
  selectedMapped=selectedJob?.result?.transcript
    ? mapOralGraderResultToTalkTalk(selectedJob.result)
    : null;
  const students=selectedJob?.students||[];
  if(!students.some(row=>row.studentId===selectedStudentId)){
    selectedStudentId=students[0]?.studentId||"";
  }
  await loadSelectedAudio();
  renderJobGrid();
  renderSelectedJob();
  if(open) showTeacherView("teacherTeamView");
}

async function refreshJobs(){
  try{
    jobs=await oralGrader.listJobs({limit:50});
    if(selectedJob?.jobId){
      const listed=jobs.find(row=>row.jobId===selectedJob.jobId);
      if(listed){
        selectedJob=await oralGrader.getJobRecord(selectedJob.jobId);
        selectedMapped=selectedJob?.result?.transcript
          ? mapOralGraderResultToTalkTalk(selectedJob.result)
          : null;
      }
    }
    renderJobGrid();
    renderSelectedJob();
  }catch(error){
    setText("teacherJobListStatus","Online job list unavailable: "+(error?.message||"connection error"));
  }
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

teacherStudentSelect?.addEventListener("change",()=>{
  selectedStudentId=teacherStudentSelect.value;
  renderSelectedJob();
});

async function toggleAudio(){
  if(!teacherAudio?.src) return;
  if(teacherAudio.paused) await teacherAudio.play();
  else teacherAudio.pause();
}
document.getElementById("teacherPlayButton")?.addEventListener("click",toggleAudio);
document.getElementById("teacherAssessmentPlayButton")?.addEventListener("click",toggleAudio);
teacherAudio?.addEventListener("timeupdate",()=>{
  const duration=Number(selectedJob?.promptContext?.durationMs||0);
  setText(
    "teacherPlayerTime",
    formatDuration(teacherAudio.currentTime*1000)+" / "+formatDuration((teacherAudio.duration||duration/1000||0)*1000)
  );
});

document.getElementById("teacherEditScoresBtn")?.addEventListener("click",async()=>{
  if(!selectedJob || !resultStudent()){
    alert("Select a completed Oral-Grader result first.");
    return;
  }
  const existing=finalScores()||{};
  const labels={
    fluency:"Fluency",
    coherence_and_organization:"Coherence & Organization",
    grammar_and_vocabulary:"Grammar & Vocabulary",
    pronunciation_and_intelligibility:"Pronunciation & Intelligibility",
    communicative_interaction:"Communicative Interaction"
  };
  const scores={};
  for(const key of Object.keys(labels)){
    const raw=prompt(labels[key]+" score (0–8)",existing[key]??"");
    if(raw===null) return;
    const value=Number(raw);
    if(!Number.isInteger(value)||value<0||value>8){
      alert(labels[key]+" must be an integer between 0 and 8.");
      return;
    }
    scores[key]=value;
  }
  const comments=prompt("Teacher comments",selectedJob?.teacherReview?.comments||"");
  if(comments===null) return;

  selectedJob=await oralGrader.saveTeacherReview(selectedJob.jobId,{
    scores,
    comments,
    publish:false
  });
  renderSelectedJob();
  await refreshJobs();
});

document.getElementById("teacherPublishBtn")?.addEventListener("click",async()=>{
  if(!selectedJob || !finalScores()){
    alert("A complete automatic result or teacher review is required before publishing.");
    return;
  }
  const scores=finalScores();
  const comments=selectedJob?.teacherReview?.comments || resultStudent()?.comments?.join(" ") || "";
  selectedJob=await oralGrader.saveTeacherReview(selectedJob.jobId,{
    scores,
    comments,
    publish:true
  });
  setAudioBlob(null);
  renderSelectedJob();
  await refreshJobs();
});

document.getElementById("teacherReportBtn")?.addEventListener("click",()=>{
  if(!selectedJob || !resultStudent()) return;
  const student=resultStudent();
  const scores=finalScores()||student.rubric_scores;
  const transcript=selectedJob?.result?.transcript?.heard_text||"";
  const lines=[
    "TALK-TALK — Oral-Grader Review",
    "",
    "Job: "+selectedJob.jobId,
    "Student: "+student.name,
    "Literal transcript: "+transcript,
    "",
    "Fluency: "+scores.fluency+"/8",
    "Coherence & Organization: "+scores.coherence_and_organization+"/8",
    "Grammar & Vocabulary: "+scores.grammar_and_vocabulary+"/8",
    "Pronunciation & Intelligibility: "+scores.pronunciation_and_intelligibility+"/8",
    "Communicative Interaction: "+scores.communicative_interaction+"/8",
    "Total: "+finalTotal()+"/40",
    "",
    "Teacher comments: "+(selectedJob?.teacherReview?.comments||"")
  ];
  const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="talk-talk-oral-grader-review.txt";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("sendTwistBtn")?.addEventListener("click",()=>{
  const twist=document.getElementById("twistSelect")?.value||"Remember a detail";
  setText("sessionState","Preview control · next activity twist: "+twist);
});

document.getElementById("endActivityBtn")?.addEventListener("click",()=>{
  setText("sessionState","Preview control · activity ended. Existing Oral-Grader jobs remain reviewable.");
});

document.getElementById("standaloneLogoutBtn")?.addEventListener("click",()=>{
  clearInterval(refreshTimer);
  clearStandaloneSession();
  location.href="./login.html";
});

window.addEventListener("popstate",event=>{
  const id=event.state?.talkTalkView;
  if(ids.includes(id)) showTeacherView(id,{push:false});
});

async function bootstrap(){
  const initial=ids.includes(location.hash.slice(1))?location.hash.slice(1):ids[0];
  history.replaceState({talkTalkView:initial},"","#"+initial);
  showTeacherView(initial,{push:false});
  renderSelectedJob();
  await refreshJobs();

  if(jobs[0]){
    await selectJob(jobs[0].jobId,{open:false});
  }

  refreshTimer=setInterval(refreshJobs,3000);
}

bootstrap().catch(error=>{
  setText("teacherJobListStatus","Teacher Monitor could not load online jobs: "+(error?.message||"connection error"));
  renderJobGrid();
  renderSelectedJob();
});
