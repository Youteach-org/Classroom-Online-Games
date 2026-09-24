import { syncSessionClock } from "../group/remote-timeline.mjs";
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

export function createRemoteClockContext({
  serverNow,
  clientNow = Date.now()
} = {}) {
  return Object.freeze({
    serverNow: Number(serverNow),
    clientNow: Number(clientNow),
    offsetMs: syncSessionClock(serverNow, clientNow)
  });
}

export function createRemoteTalkTalkContext(studentContext, clockContext) {
  const live = createTalkTalkLiveContext(studentContext);
  return Object.freeze({
    ...live,
    captureMode: "per-device",
    clockOffsetMs: Number(clockContext?.offsetMs || 0)
  });
}


const TALK_TALK_FOCUS = new Set([
  "past-ed-t",
  "past-ed-d",
  "past-ed-id",
  "follow-up-question",
  "fluency"
]);

function metricValue(raw) {
  if (raw == null) return null;
  const value=Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(0,Math.min(100,Math.round(value)));
}

function cleanId(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]+/g,"_").slice(0,120);
}

export function buildTalkTalkResultPayload({
  liveContext,
  evaluation,
  evidenceConfidence = null,
  unitId = "tell-me-what-happened",
  cefr = "B1",
  attemptId,
  completedAt = Date.now(),
  resultId = ""
} = {}) {
  if (!liveContext?.studentKey || !liveContext?.cogSessionId) {
    throw new Error("Talk Talk result requires an active live context.");
  }
  const cleanAttempt=cleanId(attemptId);
  if (!cleanAttempt) throw new Error("Talk Talk result requires attemptId.");

  const percentage=metricValue(evaluation?.overall);
  if (percentage == null) throw new Error("Talk Talk result requires a reportable overall score.");
  if (unitId !== "tell-me-what-happened") throw new Error("Unsupported Talk Talk unit.");
  if (!["A2","B1"].includes(String(cefr))) throw new Error("Unsupported Talk Talk CEFR.");
  const focus=String(evaluation?.primaryFocus?.skillId || "");
  if (!TALK_TALK_FOCUS.has(focus)) throw new Error("Unsupported Talk Talk primary focus.");

  const generatedId=cleanId(`tt_${liveContext.cogSessionId}_${liveContext.studentKey}_${cleanAttempt}`);
  return Object.freeze({
    schemaVersion:1,
    resultId:cleanId(resultId) || generatedId,
    attemptId:cleanAttempt,
    resultType:"individual",
    completedAt:Number(completedAt),
    percentage,
    points:null,
    metrics:Object.freeze({
      pronunciation:metricValue(evaluation?.dimensions?.pronunciation?.value),
      fluency:metricValue(evaluation?.dimensions?.fluency?.value),
      grammarVocabulary:metricValue(evaluation?.dimensions?.grammarVocabulary?.value),
      interaction:metricValue(evaluation?.dimensions?.interaction?.value),
      taskCompletion:metricValue(evaluation?.dimensions?.taskCompletion?.value),
      evidenceConfidence:metricValue(evidenceConfidence),
      unitId,
      cefr:String(cefr),
      primaryFocus:focus
    })
  });
}

export async function submitTalkTalkResult({
  liveContext,
  payload,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!liveContext?.bridgeToken) throw new Error("Talk Talk result submit requires bridgeToken.");
  if (!payload || payload.resultType !== "individual") throw new Error("Talk Talk result submit requires an individual payload.");
  if (typeof fetchImpl !== "function") throw new Error("Talk Talk result submit requires fetch.");

  const issuer=String(liveContext.issuer || "").replace(/\/$/,"");
  if (!issuer) throw new Error("Talk Talk result submit requires YouTeach issuer.");

  const response=await fetchImpl(`${issuer}/api/cog-live-result-submit`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:`Bearer ${liveContext.bridgeToken}`
    },
    body:JSON.stringify({ result:payload })
  });

  let body={};
  try { body=await response.json(); } catch {}
  if (!response.ok || body?.ok !== true) {
    throw new Error(body?.error || `Talk Talk result submit failed: ${response.status}`);
  }
  return body;
}
