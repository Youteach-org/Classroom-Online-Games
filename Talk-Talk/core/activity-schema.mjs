export const TALK_TALK_PHASES = Object.freeze([
  "hear",
  "notice",
  "say",
  "use",
  "react",
  "speak",
  "challenge",
  "results",
  "adapt"
]);

const PHASE_SET = new Set(TALK_TALK_PHASES);

function requiredText(value, field) {
  const text = String(value || "").trim();
  if (!text) throw new Error(`Talk Talk activity requires ${field}.`);
  return text;
}

function stringList(value) {
  return Array.isArray(value)
    ? value.map(item => String(item || "").trim()).filter(Boolean)
    : [];
}

export function normalizeActivity(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Talk Talk activity must be an object.");
  }

  const phases = stringList(raw.phases);
  if (!phases.length) {
    throw new Error("Talk Talk activity requires phases.");
  }

  for (const phase of phases) {
    if (!PHASE_SET.has(phase)) {
      throw new Error(`Unknown Talk Talk phase: ${phase}`);
    }
  }

  return Object.freeze({
    id: requiredText(raw.id, "id"),
    title: requiredText(raw.title, "title"),
    cefr: stringList(raw.cefr),
    practiceMode: raw.practiceMode === "assessment" ? "assessment" : "practice",
    languageTargets: stringList(raw.languageTargets),
    pronunciationTargets: stringList(raw.pronunciationTargets),
    speakingTargets: stringList(raw.speakingTargets),
    interactionTargets: stringList(raw.interactionTargets),
    phases: Object.freeze([...phases]),
    pairGroup: Object.freeze({
      modes: stringList(raw.pairGroup?.modes),
      twistEnabled: raw.pairGroup?.twistEnabled === true
    })
  });
}
