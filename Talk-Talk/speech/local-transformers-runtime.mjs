const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0";

let libraryPromise = null;

async function defaultTransformersLoader() {
  if (!libraryPromise) {
    libraryPromise = import(TRANSFORMERS_CDN).then(module => {
      if (module?.env) {
        module.env.allowLocalModels = false;
        module.env.allowRemoteModels = true;
        module.env.useBrowserCache = true;
      }
      return module;
    });
  }
  return libraryPromise;
}

function cleanPhoneme(value) {
  return String(value || "")
    .replace(/[ˈˌ]/g, "")
    .trim();
}

function phonemeTokens(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .map(cleanPhoneme)
    .filter(Boolean);
}

function editDistance(a, b) {
  const left = Array.isArray(a) ? a : [];
  const right = Array.isArray(b) ? b : [];
  const row = Array.from({ length:right.length + 1 }, (_,i) => i);

  for (let i = 1; i <= left.length; i += 1) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
      prev = saved;
    }
  }
  return row[right.length];
}

export function scorePastEdEnding(phonemeText, {
  skillId = "",
  word = "",
  expectedPhonemes = []
} = {}) {
  const tokens = phonemeTokens(phonemeText);
  const last = tokens.at(-1) || "";
  const previous = tokens.at(-2) || "";
  const cleanSkill = String(skillId || "");
  const errors = [];

  if (cleanSkill === "past-ed-t") {
    if (last === "t") return { score:94, errors, phonemes:tokens };
    if (last === "d" && ["ɪ","ə"].includes(previous)) {
      errors.push({ type:"extra-syllable", word:String(word || ""), expected:"t", heard:`${previous} d` });
      return { score:42, errors, phonemes:tokens };
    }
    errors.push({ type:"substitution", word:String(word || ""), expected:"t", heard:last || "missing" });
    return { score:last ? 55 : 25, errors, phonemes:tokens };
  }

  if (cleanSkill === "past-ed-d") {
    if (last === "d" && !["ɪ","ə"].includes(previous)) return { score:94, errors, phonemes:tokens };
    if (last === "d" && ["ɪ","ə"].includes(previous)) {
      errors.push({ type:"extra-syllable", word:String(word || ""), expected:"d", heard:`${previous} d` });
      return { score:45, errors, phonemes:tokens };
    }
    errors.push({ type:"substitution", word:String(word || ""), expected:"d", heard:last || "missing" });
    return { score:last ? 55 : 25, errors, phonemes:tokens };
  }

  if (cleanSkill === "past-ed-id") {
    if (last === "d" && ["ɪ","ə"].includes(previous)) return { score:94, errors, phonemes:tokens };
    if (last === "d") {
      errors.push({ type:"omission", word:String(word || ""), expected:"ɪ d", heard:"d" });
      return { score:58, errors, phonemes:tokens };
    }
    errors.push({ type:"substitution", word:String(word || ""), expected:"ɪ d", heard:last || "missing" });
    return { score:last ? 45 : 25, errors, phonemes:tokens };
  }

  const expected = expectedPhonemes.map(cleanPhoneme).filter(Boolean);
  if (!expected.length || !tokens.length) {
    return { score:null, errors:[], phonemes:tokens };
  }
  const distance = editDistance(tokens, expected);
  const denominator = Math.max(tokens.length, expected.length, 1);
  const score = Math.max(0, Math.round(100 * (1 - distance / denominator)));
  if (distance) {
    errors.push({ type:"phoneme-distance", expected:expected.join(" "), heard:tokens.join(" "), word:String(word || "") });
  }
  return { score, errors, phonemes:tokens };
}

export function createTransformersSpeechRuntimes({
  pipelineFactory = null,
  transformersLoader = defaultTransformersLoader,
  capabilityProfile = {}
} = {}) {
  const device = capabilityProfile.webgpu ? "webgpu" : "wasm";
  const dtype = capabilityProfile.webgpu ? "q4f16" : "q8";

  let sttPipelinePromise = null;
  let phonemePipelinePromise = null;

  async function factory() {
    if (pipelineFactory) return pipelineFactory;
    const library = await transformersLoader();
    if (typeof library?.pipeline !== "function") {
      throw new Error("Transformers.js pipeline is unavailable.");
    }
    return library.pipeline;
  }

  async function sttPipeline() {
    if (!sttPipelinePromise) {
      sttPipelinePromise = factory().then(pipeline =>
        pipeline(
          "automatic-speech-recognition",
          "onnx-community/whisper-tiny.en",
          { device, dtype }
        )
      );
    }
    return sttPipelinePromise;
  }

  async function phonemePipeline() {
    if (!phonemePipelinePromise) {
      phonemePipelinePromise = factory().then(pipeline =>
        pipeline(
          "automatic-speech-recognition",
          "onnx-community/wav2vec2-ljspeech-gruut-ONNX",
          { device, dtype }
        )
      );
    }
    return phonemePipelinePromise;
  }

  return Object.freeze({
    stt:Object.freeze({
      kind:"local",
      async transcribe(samples) {
        const pipe=await sttPipeline();
        const output=await pipe(samples);
        const text=String(output?.text || "").trim();
        return {
          text,
          confidence:text ? 0.85 : 0.2,
          words:Array.isArray(output?.chunks) ? output.chunks : []
        };
      }
    }),
    phoneme:Object.freeze({
      kind:"local",
      async analyze(samples,target={}) {
        const pipe=await phonemePipeline();
        const output=await pipe(samples);
        const scored=scorePastEdEnding(output?.text || "",target);
        return {
          score:scored.score,
          confidence:scored.score == null ? 0.45 : 0.85,
          phonemes:scored.phonemes,
          errors:scored.errors
        };
      }
    }),
    device,
    dtype
  });
}

export { TRANSFORMERS_CDN };
