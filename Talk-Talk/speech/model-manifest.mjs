export const MODEL_CANDIDATES = Object.freeze([
  Object.freeze({
    id: "onnx-community/whisper-tiny.en",
    purpose: "stt",
    source: "https://huggingface.co/onnx-community/whisper-tiny.en",
    license: "MIT (base Whisper code and model weights)",
    runtime: "local-browser",
    browserRuntime: "@huggingface/transformers + ONNX/WebGPU/WASM",
    maxDownloadBytes: 300_000_000,
    requiredForCore: true,
    status: "candidate"
  }),
  Object.freeze({
    id: "onnx-community/wav2vec2-ljspeech-gruut-ONNX",
    purpose: "phoneme",
    source: "https://huggingface.co/onnx-community/wav2vec2-ljspeech-gruut-ONNX",
    license: "Apache-2.0",
    runtime: "local-browser",
    browserRuntime: "@huggingface/transformers + ONNX/WebGPU/WASM",
    preferredAsset: "onnx/model_q4f16.onnx",
    maxDownloadBytes: 70_000_000,
    requiredForCore: true,
    status: "candidate"
  }),
  Object.freeze({
    id: "sherpa-onnx/wespeaker-en-voxceleb-resnet34",
    purpose: "speaker",
    source: "https://github.com/k2-fsa/sherpa-onnx",
    license: "Apache-2.0 runtime/toolkit; exact redistributed model asset must be re-verified before shipping",
    runtime: "local-browser",
    browserRuntime: "sherpa-onnx WASM",
    preferredAsset: "wespeaker_en_voxceleb_resnet34.onnx",
    maxDownloadBytes: 50_000_000,
    requiredForCore: false,
    status: "candidate-license-review"
  })
]);

function assertHttps(value, label) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    throw new Error(`${label} must be an HTTPS source.`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`${label} must be an HTTPS source.`);
  }
}

export function assertModelManifest(manifest) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error("Model manifest must contain at least one candidate.");
  }

  const ids = new Set();
  for (const asset of manifest) {
    const id = String(asset?.id || "").trim();
    const purpose = String(asset?.purpose || "").trim();
    const license = String(asset?.license || "").trim();
    const runtime = String(asset?.runtime || "").trim();
    const browserRuntime = String(asset?.browserRuntime || "").trim();
    const maxDownloadBytes = Number(asset?.maxDownloadBytes);

    if (!id || ids.has(id)) {
      throw new Error(id ? `Duplicate model id: ${id}` : "Model id is required.");
    }
    ids.add(id);

    if (!purpose) throw new Error(`${id}: purpose is required.`);
    assertHttps(asset?.source, `${id}: source`);
    if (!license) throw new Error(`${id}: license is required.`);
    if (runtime === "paid-api") throw new Error(`${id}: paid-api runtimes are prohibited.`);
    if (!runtime || !runtime.startsWith("local")) {
      throw new Error(`${id}: runtime must be local.`);
    }
    if (!browserRuntime) throw new Error(`${id}: browserRuntime is required.`);
    if (!Number.isFinite(maxDownloadBytes) || maxDownloadBytes <= 0) {
      throw new Error(`${id}: maxDownloadBytes must be a positive finite number.`);
    }
  }

  return true;
}
