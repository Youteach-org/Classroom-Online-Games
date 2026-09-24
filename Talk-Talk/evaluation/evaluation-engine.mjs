import { analyzeInteraction } from "./interaction-engine.mjs";

const DIMENSIONS = [
  "pronunciation",
  "fluency",
  "grammarVocabulary",
  "interaction",
  "taskCompletion"
];

const DEFAULT_WEIGHTS = Object.freeze({
  pronunciation: 20,
  fluency: 20,
  grammarVocabulary: 20,
  interaction: 20,
  taskCompletion: 20
});

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function confidence(value) {
  return ["high","medium","low"].includes(value) ? value : "medium";
}

function dimension(raw, scoreField = "score") {
  if (!raw) return { value: null, confidence: "low", evidence: [] };
  const level = confidence(raw.confidence);
  if (level === "low") {
    return {
      value: null,
      confidence: "low",
      evidence: Array.isArray(raw.evidence) ? raw.evidence : Array.isArray(raw.errors) ? raw.errors : []
    };
  }
  return {
    value: clampScore(raw[scoreField]),
    confidence: level,
    evidence: Array.isArray(raw.evidence) ? raw.evidence : Array.isArray(raw.errors) ? raw.errors : []
  };
}

function weightedOverall(dimensions, weights) {
  let total = 0;
  let weightTotal = 0;
  for (const key of DIMENSIONS) {
    const value = dimensions[key].value;
    if (value == null) continue;
    const weight = Math.max(0, Number(weights[key]) || 0);
    if (!weight) continue;
    total += value * weight;
    weightTotal += weight;
  }
  return weightTotal ? Math.round(total / weightTotal) : null;
}

function pastEdFocus(task, phonemes) {
  const error = (phonemes?.errors || []).find(item =>
    item?.type === "extra-syllable" || item?.type === "substitution" || item?.type === "omission"
  );
  const skillId = String(task?.targetSkill || "");
  if (!error || !skillId.startsWith("past-ed-")) return null;

  return {
    skillId,
    action: error.type === "extra-syllable"
      ? "practice-final-ed-without-extra-syllable"
      : "practice-final-ed-contrast",
    word: String(error.word || ""),
    evidence: error
  };
}

function genericFocus(dimensions) {
  const labels = {
    pronunciation: "pronunciation",
    fluency: "fluency",
    grammarVocabulary: "grammar-vocabulary",
    interaction: "interaction",
    taskCompletion: "task-completion"
  };

  const available = DIMENSIONS
    .filter(key => dimensions[key].value != null)
    .sort((a, b) => dimensions[a].value - dimensions[b].value);

  if (!available.length) return null;
  const key = available[0];
  return {
    skillId: labels[key],
    action: `practice-${labels[key]}`,
    evidence: dimensions[key].evidence[0] || null
  };
}

function strongest(dimensions) {
  const available = DIMENSIONS
    .filter(key => dimensions[key].value != null)
    .sort((a, b) => dimensions[b].value - dimensions[a].value);
  if (!available.length) return null;
  return {
    dimension: available[0],
    value: dimensions[available[0]].value
  };
}

export function evaluateAttempt({
  task = {},
  transcript = null,
  phonemes = null,
  prosody = null,
  languageEvidence = null,
  interactionEvidence = null,
  taskCompletionEvidence = null,
  timeline = null,
  studentKey = ""
} = {}) {
  const derivedInteraction = interactionEvidence || (
    Array.isArray(timeline) && studentKey
      ? analyzeInteraction(timeline, studentKey, task)
      : null
  );

  const dimensions = {
    pronunciation: dimension(phonemes),
    fluency: dimension(prosody, "fluencyScore"),
    grammarVocabulary: dimension(languageEvidence),
    interaction: dimension(derivedInteraction),
    taskCompletion: dimension(taskCompletionEvidence)
  };

  const weights = { ...DEFAULT_WEIGHTS, ...(task.weights || {}) };
  const pronunciationRequired = task.kind === "pronunciation";
  const technicalRetry = Boolean(
    pronunciationRequired &&
    phonemes &&
    confidence(phonemes.confidence) === "low"
  );

  const primaryFocus = pastEdFocus(task, phonemes) || genericFocus(dimensions);
  const overall = technicalRetry ? null : weightedOverall(dimensions, weights);

  return {
    dimensions,
    overall,
    strength: strongest(dimensions),
    primaryFocus,
    technicalRetry,
    transcript: transcript ? {
      text: String(transcript.text || "").trim(),
      confidence: confidence(transcript.confidence)
    } : null,
    interactionSummary: derivedInteraction ? {
      studentKey: String(derivedInteraction.studentKey || studentKey || ""),
      respondedTurns: Number(derivedInteraction.respondedTurns || 0),
      relevantFollowUps: Number(derivedInteraction.relevantFollowUps || 0),
      clarificationMoves: Number(derivedInteraction.clarificationMoves || 0),
      repairMoves: Number(derivedInteraction.repairMoves || 0),
      initiatedTurns: Number(derivedInteraction.initiatedTurns || 0),
      sustainedExchange: derivedInteraction.sustainedExchange === true
    } : null
  };
}
