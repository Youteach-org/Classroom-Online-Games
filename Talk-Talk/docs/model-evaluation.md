# Talk Talk local model evaluation gate

Status: candidate evaluation only. No model in this file is automatically approved for production.

## Hard rule

Essential Talk Talk speech features must run locally after model download and must not require an API key, a paid service, per-minute billing, token billing, or raw-audio upload.

## Candidate set

### Speech-to-text

- Candidate: `onnx-community/whisper-tiny.en`
- Runtime target: Transformers.js / ONNX in the browser.
- Upstream Whisper code and weights are MIT licensed.
- The ONNX repository is a web-compatible conversion of `openai/whisper-tiny.en`.
- Shipping status: candidate; device measurements still required.

### Phoneme recognition

- Candidate: `onnx-community/wav2vec2-ljspeech-gruut-ONNX`
- Preferred first asset to test: `onnx/model_q4f16.onnx`.
- Model card license: Apache-2.0.
- The published q4f16 asset is about 66.4 MB; the manifest uses a 70 MB safety cap.
- Shipping status: candidate; phoneme quality on learner English still needs classroom-oriented validation.

### Speaker identification / diarization

- Runtime candidate: sherpa-onnx WASM.
- Embedding candidate: `wespeaker_en_voxceleb_resnet34.onnx`.
- sherpa-onnx and the WeSpeaker toolkit use Apache-2.0 licensing.
- The exact downloadable embedding model artifact must have its source/license recorded before it is enabled in a production manifest.
- Shipping status: candidate-license-review; not required for individual/remote core flow.

## Approval checklist

A candidate can move from `candidate` to `approved` only after all of these are recorded:

1. exact source URL and exact model/weight asset;
2. model and runtime licenses permit the intended use and redistribution strategy;
3. no API key and no paid remote inference;
4. raw audio remains local;
5. cold-start, download size, memory use, and inference time measured on at least one modest Android device;
6. core lesson remains completable through Basic fallback when the model cannot run;
7. accuracy is good enough for the evidence type it supplies;
8. failure produces technical retry or a lower capability tier, never an academic penalty.

## Measurement record template

For each tested device record:

- device/browser;
- WebGPU availability;
- RAM class;
- model asset;
- downloaded bytes;
- first-load seconds;
- cached-load seconds;
- inference seconds per 10 seconds of audio;
- peak observed memory if available;
- result quality notes;
- pass/fail decision.

No local LLM is required for V1 core acceptance. Talk Engine Lite remains the mandatory fallback.
