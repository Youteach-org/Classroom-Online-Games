const VALID_STATES = new Set(["observed", "recurring", "mastered"]);
const VALID_OUTCOMES = new Set(["hit", "miss"]);

function cloneProfile(profile) {
  return {
    schemaVersion: 1,
    studentKey: String(profile?.studentKey || ""),
    currentFocus: profile?.currentFocus || null,
    skills: Object.fromEntries(
      Object.entries(profile?.skills || {}).map(([key, value]) => [
        key,
        {
          state: VALID_STATES.has(value?.state) ? value.state : "observed",
          hits: Number(value?.hits || 0),
          misses: Number(value?.misses || 0),
          transferHits: Number(value?.transferHits || 0),
          regressionMisses: Number(value?.regressionMisses || 0),
          contexts: { ...(value?.contexts || {}) },
          lastEvidenceAt: Number(value?.lastEvidenceAt || 0),
          trend: String(value?.trend || "stable")
        }
      ])
    )
  };
}

export function createEmptyProfile(studentKey = "") {
  return {
    schemaVersion: 1,
    studentKey: String(studentKey || ""),
    currentFocus: null,
    skills: {}
  };
}

function isTransferContext(context) {
  return /transfer/i.test(String(context || ""));
}

function chooseRecurringFocus(skills) {
  const recurring = Object.entries(skills)
    .filter(([, skill]) => skill.state === "recurring")
    .sort(([, a], [, b]) =>
      (b.misses - b.hits) - (a.misses - a.hits) ||
      b.lastEvidenceAt - a.lastEvidenceAt
    );
  return recurring[0]?.[0] || null;
}

export function recordSkillEvidence(profile, evidence = {}) {
  if (evidence.confidence === "low") return profile;

  const skillId = String(evidence.skillId || "").trim();
  const outcome = String(evidence.outcome || "").trim();
  const context = String(evidence.context || "unknown").trim();
  if (!skillId) throw new Error("Skill evidence requires skillId.");
  if (!VALID_OUTCOMES.has(outcome)) throw new Error("Skill evidence outcome must be hit or miss.");

  const next = cloneProfile(profile || createEmptyProfile());
  const current = next.skills[skillId] || {
    state: "observed",
    hits: 0,
    misses: 0,
    transferHits: 0,
    regressionMisses: 0,
    contexts: {},
    lastEvidenceAt: 0,
    trend: "stable"
  };

  current.contexts[context] = Number(current.contexts[context] || 0) + 1;
  current.lastEvidenceAt = Number(evidence.at || Date.now());

  if (outcome === "hit") {
    current.hits += 1;
    current.regressionMisses = 0;
    current.trend = "improving";
    if (isTransferContext(context)) current.transferHits += 1;

    if (current.state === "recurring" && current.transferHits >= 2) {
      current.state = "mastered";
    }
  } else {
    current.misses += 1;
    current.trend = "needs-practice";

    if (current.state === "mastered") {
      current.regressionMisses += 1;
      if (current.regressionMisses >= 2) {
        current.state = "recurring";
        current.transferHits = 0;
      }
    } else {
      const distinctContexts = Object.keys(current.contexts).length;
      if (current.misses >= 3 && distinctContexts >= 2) current.state = "recurring";
      else current.state = "observed";
    }
  }

  next.skills[skillId] = current;
  next.currentFocus = chooseRecurringFocus(next.skills);
  return next;
}
