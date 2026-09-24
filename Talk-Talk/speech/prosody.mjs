function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function analyzeProsody(samples, sampleRate, {
  silenceThreshold = 0.015,
  minPauseMs = 180
} = {}) {
  const data = samples || [];
  const rate = Number(sampleRate) || 16000;
  if (!data.length) {
    return {
      confidence: "low",
      fluencyScore: null,
      evidence: [],
      durationMs: 0,
      speechRatio: 0
    };
  }

  const minPauseSamples = Math.max(1, Math.floor(rate * minPauseMs / 1000));
  const evidence = [];
  let silentRunStart = null;
  let speechSamples = 0;

  for (let i = 0; i < data.length; i += 1) {
    const silent = Math.abs(Number(data[i]) || 0) < silenceThreshold;
    if (!silent) {
      speechSamples += 1;
      if (silentRunStart != null) {
        const count = i - silentRunStart;
        if (count >= minPauseSamples) {
          evidence.push({
            type: "pause",
            startMs: Math.round(silentRunStart / rate * 1000),
            durationMs: Math.round(count / rate * 1000)
          });
        }
        silentRunStart = null;
      }
    } else if (silentRunStart == null) {
      silentRunStart = i;
    }
  }

  if (silentRunStart != null) {
    const count = data.length - silentRunStart;
    if (count >= minPauseSamples && silentRunStart > 0) {
      evidence.push({
        type: "pause",
        startMs: Math.round(silentRunStart / rate * 1000),
        durationMs: Math.round(count / rate * 1000)
      });
    }
  }

  const speechRatio = speechSamples / data.length;
  const longPausePenalty = evidence.reduce(
    (sum, item) => sum + Math.max(0, item.durationMs - minPauseMs) / 100,
    0
  );
  const fluencyScore = Math.round(clamp(100 - longPausePenalty * 3, 0, 100));

  return {
    confidence: speechRatio > 0.05 ? "high" : "low",
    fluencyScore,
    evidence,
    durationMs: Math.round(data.length / rate * 1000),
    speechRatio
  };
}
