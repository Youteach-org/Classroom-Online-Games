let speakerRuntime = null;

function vector(value) {
  if (!Array.isArray(value) && !(value instanceof Float32Array)) return null;
  const out = Array.from(value, Number);
  if (!out.length || out.some(v => !Number.isFinite(v))) return null;
  return out;
}

function cosineSimilarity(a, b) {
  const va = vector(a);
  const vb = vector(b);
  if (!va || !vb || va.length !== vb.length) return -1;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < va.length; i += 1) {
    dot += va[i] * vb[i];
    normA += va[i] * va[i];
    normB += vb[i] * vb[i];
  }
  if (!normA || !normB) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function configureSpeakerEmbeddingRuntime(runtime) {
  if (!runtime || runtime.kind !== "local" || typeof runtime.embed !== "function") {
    throw new Error("Talk Talk speaker embedding runtime must be local.");
  }
  speakerRuntime = runtime;
  return true;
}

export async function createTemporaryVoiceReference(samples) {
  if (!speakerRuntime) {
    throw new Error("No approved local speaker embedding runtime is configured.");
  }
  const embedding = vector(await speakerRuntime.embed(samples));
  if (!embedding) throw new Error("Speaker embedding runtime returned invalid data.");
  return embedding;
}

export function attributeSegments({
  segments = [],
  references = {},
  threshold = 0.8,
  ambiguityMargin = 0.05
} = {}) {
  const cleanThreshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 0.8;
  const margin = Math.max(0, Number(ambiguityMargin) || 0);

  return segments.map(segment => {
    if (segment?.overlap === true) {
      return {
        ...segment,
        studentKey: null,
        speakerConfidence: 0,
        eligibleForIndividualScore: false,
        attributionReason: "overlap"
      };
    }

    const embedding = vector(segment?.embedding);
    if (!embedding) {
      return {
        ...segment,
        studentKey: null,
        speakerConfidence: 0,
        eligibleForIndividualScore: false,
        attributionReason: "missing-embedding"
      };
    }

    const ranked = Object.entries(references || {})
      .map(([studentKey, reference]) => ({
        studentKey,
        score: cosineSimilarity(embedding, reference)
      }))
      .filter(item => item.score >= -1)
      .sort((a, b) => b.score - a.score || a.studentKey.localeCompare(b.studentKey));

    const best = ranked[0] || null;
    const second = ranked[1] || null;
    const ambiguous = Boolean(
      best &&
      second &&
      best.score - second.score < margin
    );

    if (!best || best.score < cleanThreshold || ambiguous) {
      return {
        ...segment,
        studentKey: null,
        speakerConfidence: best?.score ?? 0,
        eligibleForIndividualScore: false,
        attributionReason: ambiguous ? "ambiguous" : "below-threshold"
      };
    }

    return {
      ...segment,
      studentKey: best.studentKey,
      speakerConfidence: best.score,
      eligibleForIndividualScore: true,
      attributionReason: "matched"
    };
  });
}

export async function cleanupTeamCapture({
  store,
  cogSessionId,
  teamKey
} = {}) {
  if (!store?.entries || !store?.remove) {
    throw new Error("Capture cleanup requires a local store.");
  }
  const session = String(cogSessionId || "");
  const team = String(teamKey || "");
  const prefixes = [
    `voice-ref:${session}:${team}:`,
    `audio-cache:${session}:${team}:`
  ];

  let removed = 0;
  for (const [key] of await store.entries()) {
    if (prefixes.some(prefix => String(key).startsWith(prefix))) {
      await store.remove(key);
      removed += 1;
    }
  }
  return { removed };
}

export { cosineSimilarity };
