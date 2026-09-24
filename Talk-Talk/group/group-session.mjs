const TIER_RANK = Object.freeze({
  basic: 1,
  standard: 2,
  enhanced: 3
});

function cleanTier(value) {
  const tier = String(value || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(TIER_RANK, tier) ? tier : "basic";
}

function storageBytes(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function confirmTeamMember(session, studentContext, capabilityProfile = {}) {
  const studentKey = String(studentContext?.identity?.studentKey || "").trim();
  const cogSessionId = String(studentContext?.liveContext?.cogSessionId || "").trim();
  const team = studentContext?.teamContext || null;

  if (!studentKey) throw new Error("Team confirmation requires a student identity.");
  if (String(studentContext?.liveContext?.gameId || "") !== "talk-talk") {
    throw new Error("Team confirmation requires a Talk Talk live context.");
  }
  if (!cogSessionId || cogSessionId !== String(session?.cogSessionId || "")) {
    throw new Error("Team confirmation requires the active Talk Talk session.");
  }
  if (!team?.teamKey || !Array.isArray(team?.memberKeys) || !team.memberKeys.includes(studentKey)) {
    throw new Error("Student must be a member of the canonical YouTeach team.");
  }

  return Object.freeze({
    studentKey,
    nickname: String(studentContext?.identity?.nickname || studentKey),
    teamKey: String(team.teamKey),
    teamLabel: String(team.teamLabel || team.teamKey),
    teamRevision: String(team.teamRevision || ""),
    microphoneUsable: capabilityProfile.microphoneUsable === true,
    tier: cleanTier(capabilityProfile.tier),
    storageAvailableBytes: storageBytes(capabilityProfile.storageAvailableBytes),
    confirmedAt: Number(capabilityProfile.confirmedAt || Date.now())
  });
}

function compareCandidates(a, b) {
  const micDelta = Number(Boolean(b.microphoneUsable)) - Number(Boolean(a.microphoneUsable));
  if (micDelta) return micDelta;

  const tierDelta = TIER_RANK[cleanTier(b.tier)] - TIER_RANK[cleanTier(a.tier)];
  if (tierDelta) return tierDelta;

  const storageDelta = storageBytes(b.storageAvailableBytes) - storageBytes(a.storageAvailableBytes);
  if (storageDelta) return storageDelta;

  return String(a.studentKey || "").localeCompare(String(b.studentKey || ""));
}

export function chooseHost(teamConfirmations) {
  const values = Array.isArray(teamConfirmations)
    ? teamConfirmations
    : Object.values(teamConfirmations || {});

  const eligible = values
    .filter(item => item?.studentKey)
    .map(item => ({ ...item, tier: cleanTier(item.tier) }))
    .sort(compareCandidates);

  return eligible[0]?.studentKey || null;
}

export function buildTeamRuntimeState(confirmations) {
  const values = Array.isArray(confirmations)
    ? confirmations
    : Object.values(confirmations || {});
  const hostStudentKey = chooseHost(values);
  return {
    confirmations: Object.fromEntries(values.filter(x => x?.studentKey).map(x => [x.studentKey, x])),
    hostStudentKey,
    status: hostStudentKey ? "ready" : "waiting",
    captureMode: hostStudentKey ? "host-recorder" : null,
    speakerAttributionStatus: "model-gated",
    turnEvents: {}
  };
}

export function captureModeForEnvironment({ coLocated = true, hostStudentKey = "" } = {}) {
  if (!coLocated) return "per-device";
  return String(hostStudentKey || "").trim() ? "host-recorder" : "waiting-for-host";
}
