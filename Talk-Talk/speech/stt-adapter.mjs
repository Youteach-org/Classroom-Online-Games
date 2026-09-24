function confidenceLabel(value) {
  if (typeof value === "string" && ["high","medium","low"].includes(value)) return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return "medium";
  if (n >= 0.75) return "high";
  if (n >= 0.5) return "medium";
  return "low";
}

export function createLocalSttAdapter(runtime) {
  if (!runtime || runtime.kind !== "local" || typeof runtime.transcribe !== "function") {
    throw new Error("Talk Talk STT requires a local runtime.");
  }

  return Object.freeze({
    async transcribe(audio, options = {}) {
      const result = await runtime.transcribe(audio, options);
      return {
        text: String(result?.text || "").trim(),
        confidence: confidenceLabel(result?.confidence),
        words: Array.isArray(result?.words) ? result.words : [],
        evidence: Array.isArray(result?.evidence) ? result.evidence : []
      };
    }
  });
}

export async function transcribeLocal(audio, { runtime, ...options } = {}) {
  return createLocalSttAdapter(runtime).transcribe(audio, options);
}
