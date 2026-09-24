export function createActivitySession(activity, learner = {}) {
  if (!activity?.id || !Array.isArray(activity.phases) || !activity.phases.length) {
    throw new Error("A normalized Talk Talk activity is required.");
  }

  return {
    activityId: activity.id,
    studentKey: String(learner.studentKey || ""),
    phaseIndex: 0,
    phase: activity.phases[0],
    phases: [...activity.phases],
    status: "active"
  };
}

export function advanceActivity(session, event) {
  if (!session || session.status !== "active") return session;
  if (event?.type !== "PHASE_COMPLETE") return session;

  const nextIndex = session.phaseIndex + 1;
  if (nextIndex >= session.phases.length) {
    return {
      ...session,
      phaseIndex: session.phases.length,
      phase: null,
      status: "complete"
    };
  }

  return {
    ...session,
    phaseIndex: nextIndex,
    phase: session.phases[nextIndex]
  };
}
