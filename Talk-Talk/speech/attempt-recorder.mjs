function mixToMono(audioBuffer) {
  const channels = Number(audioBuffer?.numberOfChannels || 0);
  const length = Number(audioBuffer?.length || 0);
  if (!channels || !length) return new Float32Array();

  const mono = new Float32Array(length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) mono[i] += data[i] / channels;
  }
  return mono;
}

export function resamplePcm(samples, sourceRate, targetRate = 16000) {
  const input = samples instanceof Float32Array ? samples : Float32Array.from(samples || []);
  const from = Number(sourceRate);
  const to = Number(targetRate);

  if (!input.length) return new Float32Array();
  if (!Number.isFinite(from) || from <= 0 || !Number.isFinite(to) || to <= 0) {
    throw new Error("PCM resampling requires valid sample rates.");
  }
  if (from === to) return new Float32Array(input);

  const outputLength = Math.max(1, Math.round(input.length * to / from));
  const output = new Float32Array(outputLength);
  const ratio = from / to;

  for (let i = 0; i < outputLength; i += 1) {
    const position = i * ratio;
    const left = Math.min(input.length - 1, Math.floor(position));
    const right = Math.min(input.length - 1, left + 1);
    const fraction = position - left;
    output[i] = input[left] + (input[right] - input[left]) * fraction;
  }
  return output;
}

export async function decodeAudioBlobToPcm(blob, {
  AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext,
  targetSampleRate = 16000
} = {}) {
  if (!AudioContextClass) throw new Error("AudioContext is unavailable.");
  const context = new AudioContextClass();
  try {
    const bytes = await blob.arrayBuffer();
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const mono = mixToMono(buffer);
    return {
      samples:resamplePcm(mono,buffer.sampleRate,targetSampleRate),
      sampleRate:targetSampleRate,
      durationMs:Math.round(buffer.duration * 1000)
    };
  } finally {
    await context.close?.();
  }
}

export function createAttemptRecorder({
  stream,
  MediaRecorderClass = globalThis.MediaRecorder,
  decodeBlob = blob => decodeAudioBlobToPcm(blob)
} = {}) {
  if (!stream) throw new Error("Attempt recorder requires a microphone stream.");
  if (!MediaRecorderClass) throw new Error("MediaRecorder is unavailable.");
  if (typeof decodeBlob !== "function") throw new Error("Attempt recorder requires a decoder.");

  const recorder = new MediaRecorderClass(stream);
  const chunks = [];
  let started = false;
  let stopPromise = null;

  recorder.addEventListener("dataavailable", event => {
    if (event?.data && Number(event.data.size || 0) > 0) chunks.push(event.data);
  });

  return Object.freeze({
    start() {
      if (started) return;
      chunks.length = 0;
      recorder.start();
      started = true;
    },

    async stop() {
      if (!started) throw new Error("Attempt recorder is not recording.");
      if (stopPromise) return stopPromise;

      stopPromise = new Promise((resolve,reject) => {
        recorder.addEventListener("error", event => {
          reject(event?.error || new Error("MediaRecorder failed."));
        }, { once:true });

        recorder.addEventListener("stop", async () => {
          try {
            const mimeType = String(recorder.mimeType || chunks[0]?.type || "audio/webm");
            const blob = new Blob(chunks,{type:mimeType});
            const decoded = await decodeBlob(blob);
            resolve({
              blob,
              samples:decoded.samples instanceof Float32Array
                ? decoded.samples
                : Float32Array.from(decoded.samples || []),
              sampleRate:Number(decoded.sampleRate || 16000),
              durationMs:Number(decoded.durationMs || 0)
            });
          } catch (error) {
            reject(error);
          }
        }, { once:true });

        recorder.stop();
      }).finally(() => {
        started = false;
        stopPromise = null;
      });

      return stopPromise;
    },

    get recording() {
      return started;
    }
  });
}
