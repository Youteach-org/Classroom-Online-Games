import { TELL_ME_WHAT_HAPPENED } from "./curriculum/tell-me-what-happened.mjs";
import { duplicateActivity, validateDraft } from "./core/activity-draft.mjs";

const draft=duplicateActivity(TELL_ME_WHAT_HAPPENED);
const $=id=>document.getElementById(id);
const status=$("creatorStatus");

function linesToRoles(value) {
  return String(value||"").split(/\n+/).map((line,index)=>{
    const [label,...rest]=line.split("|");
    return { id:`role-${index+1}`, label:String(label||"").trim(), privateInformation:rest.join("|").trim() };
  }).filter(role=>role.label);
}

function fill() {
  $("titleField").value=draft.title;
  $("levelField").value=draft.cefr?.[0] || "A2";
  $("modeField").value=draft.practiceMode;
  $("durationField").value=draft.durationMinutes;
  $("situationField").value=draft.situation;
  $("instructionsField").value=draft.instructions;
  $("rolesField").value=draft.roles.map(role=>`${role.label} | ${role.privateInformation}`).join("\n");
  $("promptsField").value=draft.prompts.join("\n");
  $("twistField").value=draft.twist?.text || "";
  $("pronunciationField").value=draft.pronunciationTargets.join(", ");
  $("languageField").value=draft.languageTargets.join(", ");
  $("interactionField").value=draft.interactionTargets.join(", ");
}

function read() {
  return {
    ...draft,
    title:$("titleField").value,
    cefr:[$("levelField").value],
    practiceMode:$("modeField").value,
    durationMinutes:Number($("durationField").value),
    situation:$("situationField").value,
    instructions:$("instructionsField").value,
    roles:linesToRoles($("rolesField").value),
    prompts:$("promptsField").value.split(/\n+/).map(x=>x.trim()).filter(Boolean),
    twist:{ id:"remember-detail", text:$("twistField").value },
    pronunciationTargets:$("pronunciationField").value,
    languageTargets:$("languageField").value,
    interactionTargets:$("interactionField").value
  };
}

$("testAsStudentBtn").addEventListener("click",()=>{
  const result=validateDraft(read());
  if(!result.valid){
    status.textContent=result.errors.join(" ");
    return;
  }
  sessionStorage.setItem("talkTalk.previewDraft",JSON.stringify(result.activity));
  location.href="./?draft=preview";
});

fill();
status.textContent="Edit the activity, then test it locally as a student. Nothing is published.";
