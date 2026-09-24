const TEAM_STATES = new Set(["ready","speaking","finished","offline","technical-problem"]);

function cleanDimensions(member) {
  if (member?.reportableEvidence !== true) return null;
  const source = member?.dimensions && typeof member.dimensions === "object"
    ? member.dimensions
    : {};
  const allowed = {};
  for (const key of ["pronunciation","fluency","grammarVocabulary","interaction","taskCompletion"]) {
    const value = Number(source[key]);
    if (Number.isFinite(value)) allowed[key] = Math.max(0,Math.min(100,Math.round(value)));
  }
  return Object.keys(allowed).length ? allowed : null;
}

function inferTeamState(team) {
  const explicit=String(team?.state || "");
  if (TEAM_STATES.has(explicit)) return explicit;

  const members=Array.isArray(team?.members) ? team.members : [];
  if (members.some(member => member?.technicalProblem === true)) return "technical-problem";
  if (members.length && members.every(member => member?.online === false)) return "offline";
  if (members.length && members.every(member => member?.finished === true || member?.phase === "results" || member?.phase === "adapt")) return "finished";
  if (members.some(member => ["say","use","react","speak","challenge"].includes(String(member?.phase || "")))) return "speaking";
  return "ready";
}

export function buildAssessmentPolicy(mode="practice") {
  const assessment=String(mode || "").toLowerCase() === "assessment";
  return Object.freeze({
    mode: assessment ? "assessment" : "practice",
    hintsAllowed: !assessment,
    retriesAllowed: !assessment,
    midTaskCorrectiveFeedback: !assessment,
    showFeedbackAtEnd: true,
    minimumScoredConfidence: assessment ? 0.8 : 0.5
  });
}

export function buildMonitorSnapshot(sessionState = {}) {
  const teams=(Array.isArray(sessionState.teams) ? sessionState.teams : []).map((team,index) => {
    const members=(Array.isArray(team?.members) ? team.members : []).map(member => ({
      studentKey:String(member?.studentKey || ""),
      nickname:String(member?.nickname || member?.studentKey || "Student"),
      online:member?.online !== false,
      phase:String(member?.phase || ""),
      technicalProblem:member?.technicalProblem === true,
      reportableEvidence:member?.reportableEvidence === true,
      dimensions:cleanDimensions(member)
    }));

    return {
      teamId:String(team?.teamId || team?.teamKey || `team-${index+1}`),
      label:String(team?.label || team?.teamLabel || `Team ${index+1}`),
      state:inferTeamState({ ...team, members }),
      members
    };
  });

  return Object.freeze({
    sessionId:String(sessionState.sessionId || sessionState.cogSessionId || ""),
    mode:buildAssessmentPolicy(sessionState.mode).mode,
    activityTitle:String(sessionState.activityTitle || "Tell Me What Happened"),
    teams
  });
}

function required(value,label) {
  const clean=String(value || "").trim();
  if (!clean) throw new Error(`${label} is required.`);
  return clean;
}

export function buildTwistCommand({ cogSessionId, teamId, twistId } = {}) {
  return Object.freeze({
    type:"talk-talk-twist",
    cogSessionId:required(cogSessionId,"cogSessionId"),
    teamId:required(teamId,"teamId"),
    twistId:required(twistId,"twistId")
  });
}

export function buildEndActivityCommand({ cogSessionId } = {}) {
  return Object.freeze({
    type:"talk-talk-end-activity",
    cogSessionId:required(cogSessionId,"cogSessionId")
  });
}
