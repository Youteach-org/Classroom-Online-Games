const ALLOWED_COMMANDS = new Set([
  "analyze-level",
  "transcribe",
  "analyze-phonemes",
  "analyze-prosody",
  "speaker-embedding",
  "speaker-diarization",
  "cleanup-speaker-session"
]);

export function normalizeAudioWorkerMessage(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const type = String(raw.type || "");
  if (!ALLOWED_COMMANDS.has(type)) return null;
  return { ...raw, type };
}

if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.addEventListener?.("message", event => {
    const request = normalizeAudioWorkerMessage(event.data);
    if (!request) {
      self.postMessage({ ok: false, error: "unsupported-audio-command" });
      return;
    }

    self.postMessage({
      ok: true,
      type: request.type,
      status: "accepted",
      localOnly: request.type.startsWith("speaker-") || request.type === "cleanup-speaker-session"
    });
  });
}
