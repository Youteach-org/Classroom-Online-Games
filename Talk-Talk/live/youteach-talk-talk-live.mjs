import { normalizeYouTeachTeamContext } from "../../shared/youteach-live-bridge.mjs";

export function normalizeTalkTalkTeamContext(raw) {
  return normalizeYouTeachTeamContext(raw);
}

export function createTalkTalkLiveContext(studentContext) {
  if (!studentContext?.identity?.studentKey) {
    throw new Error("Talk Talk live context requires a student identity.");
  }
  if (String(studentContext?.liveContext?.gameId || "") !== "talk-talk") {
    throw new Error("Talk Talk live context requires the talk-talk game.");
  }
  const cogSessionId = String(studentContext?.liveContext?.cogSessionId || "").trim();
  if (!cogSessionId) {
    throw new Error("Talk Talk live context requires a COG session.");
  }

  const teamContext = normalizeTalkTalkTeamContext(studentContext.teamContext);
  if (!teamContext) {
    throw new Error("Talk Talk live context requires canonical YouTeach team context.");
  }
  const studentKey = String(studentContext.identity.studentKey);
  if (!teamContext.memberKeys.includes(studentKey)) {
    throw new Error("Student is not a member of the resolved Talk Talk team context.");
  }

  return Object.freeze({
    studentKey,
    identity: { ...studentContext.identity },
    cogSessionId,
    youTeachSessionId: String(studentContext.liveContext.youTeachSessionId || ""),
    groupName: String(studentContext.liveContext.groupName || ""),
    teamContext: Object.freeze({
      ...teamContext,
      memberKeys: Object.freeze([...teamContext.memberKeys]),
      memberNames: Object.freeze([...teamContext.memberNames])
    }),
    bridgeToken: String(studentContext.bridgeToken || ""),
    issuer: String(studentContext.issuer || "")
  });
}
