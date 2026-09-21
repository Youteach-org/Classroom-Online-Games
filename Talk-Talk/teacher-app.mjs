import { TALK_TALK_GAME_NAME } from "./config.mjs";
import {
  buildAssessmentPolicy,
  buildMonitorSnapshot,
  buildTwistCommand,
  buildEndActivityCommand
} from "./teacher/monitor-model.mjs";

document.documentElement.dataset.app = "talk-talk-teacher";
document.title = `${TALK_TALK_GAME_NAME} Teacher Monitor`;

const sessionStateEl=document.getElementById("sessionState");
const teamGrid=document.getElementById("teamGrid");
const teamDetail=document.getElementById("teamDetail");
const modeSelect=document.getElementById("activityMode");
const twistSelect=document.getElementById("twistSelect");
const sendTwistBtn=document.getElementById("sendTwistBtn");
const endActivityBtn=document.getElementById("endActivityBtn");

let currentState=null;
let currentSnapshot=buildMonitorSnapshot({});
let selectedTeamId="";

function sendTeacherCommand(command) {
  const transport=window.__TALK_TALK_TEACHER_TRANSPORT__;
  if (transport && typeof transport.send === "function") {
    transport.send(command);
  }
  window.dispatchEvent(new CustomEvent("talktalk:teacher-command",{ detail:command }));
}

function stateLabel(state) {
  return {
    ready:"Ready",
    speaking:"Speaking",
    finished:"Finished",
    offline:"Offline",
    "technical-problem":"Technical problem"
  }[state] || "Ready";
}

function renderDetail(team) {
  teamDetail.innerHTML="";
  if (!team) {
    teamDetail.hidden=true;
    return;
  }
  teamDetail.hidden=false;
  const title=document.createElement("h2");
  title.textContent=team.label;
  const state=document.createElement("p");
  state.textContent=`State: ${stateLabel(team.state)}`;
  teamDetail.append(title,state);

  for (const member of team.members) {
    const row=document.createElement("article");
    row.className="teacher-member-detail";
    const name=document.createElement("strong");
    name.textContent=member.nickname;
    row.append(name);

    const status=document.createElement("span");
    status.textContent=member.technicalProblem ? "Technical problem" : member.online ? "Online" : "Offline";
    row.append(status);

    if (member.dimensions) {
      const metrics=document.createElement("p");
      metrics.textContent=Object.entries(member.dimensions)
        .map(([key,value]) => `${key}: ${value}%`)
        .join(" · ");
      row.append(metrics);
    }
    teamDetail.append(row);
  }
}

function render(rawState) {
  currentState=rawState || {};
  currentSnapshot=buildMonitorSnapshot(currentState);
  const policy=buildAssessmentPolicy(modeSelect.value || currentSnapshot.mode);
  modeSelect.value=policy.mode;

  const active=Boolean(currentSnapshot.sessionId);
  endActivityBtn.disabled=!active;
  sendTwistBtn.disabled=!active || !selectedTeamId;

  sessionStateEl.textContent=active
    ? `${currentSnapshot.activityTitle} · ${policy.mode === "assessment" ? "Assessment" : "Practice"} · ${currentSnapshot.teams.length} team(s)`
    : "No active Talk Talk session.";

  teamGrid.innerHTML="";
  for (const team of currentSnapshot.teams) {
    const card=document.createElement("button");
    card.type="button";
    card.className="panel teacher-team-card";
    card.dataset.state=team.state;
    card.dataset.teamId=team.teamId;

    const title=document.createElement("strong");
    title.textContent=team.label;
    const state=document.createElement("span");
    state.className="team-state";
    state.textContent=stateLabel(team.state);
    const members=document.createElement("small");
    members.textContent=team.members.map(member => member.nickname).join(" · ");

    card.append(title,state,members);
    card.addEventListener("click",() => {
      selectedTeamId=team.teamId;
      sendTwistBtn.disabled=!currentSnapshot.sessionId;
      renderDetail(team);
    });
    teamGrid.append(card);
  }

  const selected=currentSnapshot.teams.find(team => team.teamId === selectedTeamId) || null;
  renderDetail(selected);
}

modeSelect.addEventListener("change",() => {
  if (!currentState) return;
  currentState={ ...currentState, mode:modeSelect.value };
  render(currentState);
});

sendTwistBtn.addEventListener("click",() => {
  if (!currentSnapshot.sessionId || !selectedTeamId) return;
  sendTeacherCommand(buildTwistCommand({
    cogSessionId:currentSnapshot.sessionId,
    teamId:selectedTeamId,
    twistId:twistSelect.value
  }));
});

endActivityBtn.addEventListener("click",() => {
  if (!currentSnapshot.sessionId) return;
  sendTeacherCommand(buildEndActivityCommand({ cogSessionId:currentSnapshot.sessionId }));
});

window.addEventListener("talktalk:session-state",event => render(event.detail || {}));
render(window.__TALK_TALK_TEACHER_SESSION__ || {});
