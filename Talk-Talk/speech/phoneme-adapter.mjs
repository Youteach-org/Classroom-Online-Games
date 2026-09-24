function confidenceLabel(value) {
  if (typeof value === "string" && ["high","medium","low"].includes(value)) return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return "medium";
  if (n >= 0.75) return "high";
  if (n >= 0.5) return "medium";
  return "low";
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function createLocalPhonemeAdapter(runtime) {
  if (!runtime || runtime.kind !== "local" || typeof runtime.analyze !== "function") {
    throw new Error("Talk Talk phoneme analysis requires a local runtime.");
  }

  return Object.freeze({
    async analyze(audio, target = {}, options = {}) {
      const result = await runtime.analyze(audio, target, options);
      return {
        score: clampScore(result?.score),
        confidence: confidenceLabel(result?.confidence),
        phonemes: Array.isArray(result?.phonemes) ? result.phonemes : [],
        errors: Array.isArray(result?.errors) ? result.errors : [],
        expected: Array.isArray(target?.expected) ? target.expected : []
      };
    }
  });
}

export async function analyzePhonemes(audio, target, { runtime, ...options } = {}) {
  return createLocalPhonemeAdapter(runtime).analyze(audio, target, options);
}
