function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function list(value) {
  if (Array.isArray(value)) return value.map(item=>String(item||"").trim()).filter(Boolean);
  return String(value||"").split(",").map(item=>item.trim()).filter(Boolean);
}

export function duplicateActivity(activity) {
  if (!activity || typeof activity !== "object") throw new Error("Activity is required.");
  const draft=clone(activity);
  return {
    ...draft,
    draftVersion:1,
    situation:String(draft.situation || "Tell a partner about something that happened."),
    instructions:String(draft.instructions || "Tell the story, react naturally, and add useful detail."),
    roles:Array.isArray(draft.roles) ? draft.roles : [],
    prompts:Array.isArray(draft.prompts) ? draft.prompts : ["What happened next?"],
    twist:draft.twist || { id:"remember-detail", text:"You remember one more important detail." },
    durationMinutes:Number(draft.durationMinutes || 8),
    practiceMode:draft.practiceMode === "assessment" ? "assessment" : "practice"
  };
}

export function validateDraft(raw) {
  const draft=clone(raw || {});
  const errors=[];

  draft.id=String(draft.id || "").trim();
  draft.title=String(draft.title || "").trim();
  draft.situation=String(draft.situation || "").trim();
  draft.instructions=String(draft.instructions || "").trim();
  draft.cefr=list(draft.cefr);
  draft.languageTargets=list(draft.languageTargets);
  draft.pronunciationTargets=list(draft.pronunciationTargets);
  draft.speakingTargets=list(draft.speakingTargets);
  draft.interactionTargets=list(draft.interactionTargets);
  draft.prompts=list(draft.prompts);
  draft.durationMinutes=Number(draft.durationMinutes);
  draft.roles=(Array.isArray(draft.roles) ? draft.roles : []).map((role,index)=>({
    id:String(role?.id || `role-${index+1}`).trim(),
    label:String(role?.label || `Role ${index+1}`).trim(),
    privateInformation:String(role?.privateInformation || "").trim()
  })).filter(role=>role.label);

  if (!draft.id) errors.push("Activity id is required.");
  if (!draft.title) errors.push("Title is required.");
  if (!draft.situation) errors.push("Situation is required.");
  if (!draft.instructions) errors.push("Instructions are required.");
  if (!draft.cefr.length || draft.cefr.some(level=>!["A1","A2","B1","B2","C1"].includes(level))) errors.push("Valid CEFR level is required.");
  if (!["practice","assessment"].includes(String(draft.practiceMode || ""))) errors.push("Mode must be Practice or Assessment.");
  if (!Number.isFinite(draft.durationMinutes) || draft.durationMinutes < 1 || draft.durationMinutes > 60) errors.push("Duration must be between 1 and 60 minutes.");
  if (!draft.pronunciationTargets.length) errors.push("At least one pronunciation target is required.");
  if (!draft.languageTargets.length) errors.push("At least one language target is required.");
  if (!draft.interactionTargets.length) errors.push("At least one interaction target is required.");

  if (draft.twist) {
    draft.twist={
      id:String(draft.twist.id || "").trim(),
      text:String(draft.twist.text || "").trim()
    };
    if (!draft.twist.id || !draft.twist.text) errors.push("Twist requires id and text.");
  }

  return {
    valid:errors.length===0,
    errors,
    activity:draft
  };
}
