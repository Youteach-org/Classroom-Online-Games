const DEFAULT_AUDIO_CONSTRAINTS = Object.freeze({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false
  },
  video: false
});

export function analyzeInputLevel(samples, {
  lowRmsThreshold = 0.01,
  clippingThreshold = 0.98,
  maxClippedFraction = 0.05
} = {}) {
  const data = samples || [];
  if (!data.length) {
    return {
      usable: false,
      reason: "input-too-low",
      rms: 0,
      clippedFraction: 0,
      academicFailure: false
    };
  }

  let sumSquares = 0;
  let clipped = 0;

  for (const raw of data) {
    const sample = Number(raw) || 0;
    sumSquares += sample * sample;
    if (Math.abs(sample) >= clippingThreshold) clipped += 1;
  }

  const rms = Math.sqrt(sumSquares / data.length);
  const clippedFraction = clipped / data.length;

  if (rms < lowRmsThreshold) {
    return {
      usable: false,
      reason: "input-too-low",
      rms,
      clippedFraction,
      academicFailure: false
    };
  }

  if (clippedFraction > maxClippedFraction) {
    return {
      usable: false,
      reason: "input-clipping",
      rms,
      clippedFraction,
      academicFailure: false
    };
  }

  return {
    usable: true,
    reason: null,
    rms,
    clippedFraction,
    academicFailure: false
  };
}

export function classifyMicrophoneError(error) {
  const name = String(error?.name || "");
  if (name === "NotAllowedError" || name === "SecurityError") return "microphone-denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "microphone-unavailable";
  if (name === "NotReadableError" || name === "TrackStartError") return "microphone-busy";
  return "microphone-error";
}

export function createAudioCapture({ mediaDevices = globalThis.navigator?.mediaDevices } = {}) {
  let stream = null;

  return Object.freeze({
    async open() {
      if (!mediaDevices?.getUserMedia) {
        const error = new Error("Microphone API is unavailable.");
        error.code = "microphone-unavailable";
        throw error;
      }
      try {
        stream = await mediaDevices.getUserMedia(DEFAULT_AUDIO_CONSTRAINTS);
        return stream;
      } catch (error) {
        error.talkTalkReason = classifyMicrophoneError(error);
        throw error;
      }
    },

    close() {
      if (!stream) return;
      for (const track of stream.getTracks?.() || []) {
        track.stop?.();
      }
      stream = null;
    },

    get stream() {
      return stream;
    }
  });
}
