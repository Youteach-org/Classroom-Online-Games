import { getAedScenario } from "./aed-scenarios.js";
import { getSceneTwist } from "./scene-twists.js";
import { getClinicalCase } from "./clinical-cases.js";

function copySession(session, patch = {}) {
  return {
    ...session,
    flags: { ...session.flags },
    usedHintIds: [...session.usedHintIds],
    usedEventSeqs: [...session.usedEventSeqs],
    eventLog: [...session.eventLog],
    ...patch
  };
}

export function createSession({ scenarioId = "A1", twistId = "T0", clinicalId = "C0" } = {}) {
  const scenario = getAedScenario(scenarioId);
  const twist = getSceneTwist(twistId);
  const clinical = getClinicalCase(clinicalId);
  if (!scenario) throw new Error(`Unknown AED scenario: ${scenarioId}`);
  if (!twist) throw new Error(`Unknown scene twist: ${twistId}`);
  if (!clinical) throw new Error(`Unknown clinical case: ${clinicalId}`);

  return {
    scenarioId,
    twistId,
    clinicalId,
    analysisIndex: 0,
    nextAnalysisOverride: null,
    hintsUsed: 0,
    usedHintIds: [],
    usedEventSeqs: [],
    eventLog: [],
    paused: false,
    ended: false,
    flags: {
      padFault: false,
      movement: false,
      standClearViolation: false
    },
    contextPromptIds: [twist.contextPromptId, clinical.contextPromptId].filter(Boolean)
  };
}

export function consumeNextAnalysis(session) {
  if (session.ended) return { accepted: false, reason: "ended", outcome: null, session };
  if (session.paused) return { accepted: false, reason: "paused", outcome: null, session };

  const scenario = getAedScenario(session.scenarioId);
  if (!scenario) return { accepted: false, reason: "invalid_scenario", outcome: null, session };

  if (session.analysisIndex >= scenario.analysisSequence.length && !session.nextAnalysisOverride) {
    return { accepted: false, reason: "sequence_exhausted", outcome: null, session };
  }

  const outcome = session.nextAnalysisOverride ?? scenario.analysisSequence[session.analysisIndex] ?? null;
  if (!outcome) return { accepted: false, reason: "sequence_exhausted", outcome: null, session };

  const next = copySession(session, {
    analysisIndex: session.analysisIndex + 1,
    nextAnalysisOverride: null
  });
  next.eventLog.push({
    kind: "analysis",
    index: session.analysisIndex,
    outcome
  });

  return { accepted: true, outcome, session: next };
}

const EVENT_HANDLERS = Object.freeze({
  FORCE_SHOCK(session) {
    return copySession(session, { nextAnalysisOverride: "SHOCK" });
  },
  FORCE_NO_SHOCK(session) {
    return copySession(session, { nextAnalysisOverride: "NO_SHOCK" });
  },
  REFIBRILLATION(session) {
    return copySession(session, { nextAnalysisOverride: "SHOCK" });
  },
  PAD_FAULT(session) {
    const next = copySession(session);
    next.flags.padFault = true;
    return next;
  },
  CLEAR_PAD_FAULT(session) {
    const next = copySession(session);
    next.flags.padFault = false;
    return next;
  },
  MOVEMENT(session) {
    const next = copySession(session);
    next.flags.movement = true;
    return next;
  },
  CLEAR_MOVEMENT(session) {
    const next = copySession(session);
    next.flags.movement = false;
    return next;
  },
  STAND_CLEAR_VIOLATION(session) {
    const next = copySession(session);
    next.flags.standClearViolation = true;
    return next;
  },
  CLEAR_STAND_CLEAR_VIOLATION(session) {
    const next = copySession(session);
    next.flags.standClearViolation = false;
    return next;
  },
  PAUSE(session) {
    return copySession(session, { paused: true });
  },
  RESUME(session) {
    return copySession(session, { paused: false });
  },
  END(session) {
    return copySession(session, { ended: true });
  },
  RESTART(session) {
    return createSession({
      scenarioId: session.scenarioId,
      twistId: session.twistId,
      clinicalId: session.clinicalId
    });
  }
});

export function applyInstructorEvent(session, event) {
  if (!event || event.seq === undefined || event.seq === null) {
    return { accepted: false, reason: "missing_seq", session };
  }
  if (session.usedEventSeqs.includes(event.seq)) {
    return { accepted: false, reason: "duplicate_seq", session };
  }

  const handler = EVENT_HANDLERS[event.type];
  if (!handler) return { accepted: false, reason: "invalid_event", session };

  if (session.ended && event.type !== "RESTART") {
    return { accepted: false, reason: "invalid_state", session };
  }

  let next = handler(session);
  next.usedEventSeqs = [...next.usedEventSeqs, event.seq];
  next.eventLog = [
    ...next.eventLog,
    { kind: "instructor", seq: event.seq, type: event.type }
  ];
  return { accepted: true, reason: null, session: next };
}

export function consumeHint(session) {
  const twist = getSceneTwist(session.twistId);
  const clinical = getClinicalCase(session.clinicalId);
  const candidates = [
    ...(twist?.hintPromptIds ?? []),
    ...(clinical?.hintPromptIds ?? [])
  ];
  const promptId = candidates.find((id) => !session.usedHintIds.includes(id));
  if (!promptId) return { accepted: false, reason: "no_hint", promptId: null, session };

  const next = copySession(session, {
    hintsUsed: session.hintsUsed + 1,
    usedHintIds: [...session.usedHintIds, promptId]
  });
  next.eventLog.push({
    kind: "hint",
    promptId,
    hintsUsed: next.hintsUsed
  });

  return { accepted: true, reason: null, promptId, session: next };
}

export function serializeCaseConfig(session) {
  return {
    scenario: session.scenarioId,
    twist: session.twistId,
    clinical: session.clinicalId
  };
}
