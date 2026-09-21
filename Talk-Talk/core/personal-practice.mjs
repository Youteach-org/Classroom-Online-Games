const PAST_ED_SKILLS = new Set(["past-ed-t", "past-ed-d", "past-ed-id"]);

export function buildPersonalPractice(profile) {
  const focus = String(profile?.currentFocus || "");
  const skill = profile?.skills?.[focus];
  if (!focus || skill?.state !== "recurring") return [];

  if (PAST_ED_SKILLS.has(focus)) {
    return [{
      id: "past-ed-clinic",
      title: "Past -ed Clinic",
      skillId: focus,
      estimatedMinutes: 3,
      stages: ["notice", "hear", "compare", "say", "use", "transfer"]
    }];
  }

  return [{
    id: `focus-${focus}`,
    title: "Your Focus",
    skillId: focus,
    estimatedMinutes: 3,
    stages: ["notice", "hear", "compare", "say", "use", "transfer"]
  }];
}
