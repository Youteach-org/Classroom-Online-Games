const RAW_MEDIA_KEYS = new Set([
  "rawAudio",
  "audioBlob",
  "audioBuffer",
  "pcm",
  "samples",
  "recording"
]);

function finiteTime(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Remote turn requires finite ${label}.`);
  return n;
}

export function syncSessionClock(serverNow, clientNow) {
  return finiteTime(serverNow, "serverNow") - finiteTime(clientNow, "clientNow");
}

export function normalizeTurn(turn = {}, offsetMs = 0) {
  const offset = Number(offsetMs);
  if (!Number.isFinite(offset)) throw new Error("Remote turn requires a finite clock offset.");

  const startedAt = Number.isFinite(Number(turn.startedAt))
    ? Number(turn.startedAt)
    : finiteTime(turn.startedAtClient, "startedAtClient") + offset;
  const endedAt = Number.isFinite(Number(turn.endedAt))
    ? Number(turn.endedAt)
    : finiteTime(turn.endedAtClient, "endedAtClient") + offset;

  const normalized = {
    turnId: String(turn.turnId || ""),
    studentKey: String(turn.studentKey || ""),
    startedAt,
    endedAt,
    transcript: String(turn.transcript || "").trim(),
    evidence: Array.isArray(turn.evidence)
      ? JSON.parse(JSON.stringify(turn.evidence))
      : [],
    evaluation: turn.evaluation ? JSON.parse(JSON.stringify(turn.evaluation)) : null
  };

  for (const key of RAW_MEDIA_KEYS) delete normalized[key];
  return normalized;
}

export function mergeRemoteTurns(turns = []) {
  return turns
    .map(turn => normalizeTurn(turn, 0))
    .sort((a, b) =>
      a.startedAt - b.startedAt ||
      a.endedAt - b.endedAt ||
      a.studentKey.localeCompare(b.studentKey) ||
      a.turnId.localeCompare(b.turnId)
    );
}
