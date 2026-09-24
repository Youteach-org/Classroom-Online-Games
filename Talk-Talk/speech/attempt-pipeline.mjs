import { transcribeLocal } from "./stt-adapter.mjs";
import { analyzePhonemes } from "./phoneme-adapter.mjs";
import { analyzeProsody } from "./prosody.mjs";
import { evaluateAttempt } from "../evaluation/evaluation-engine.mjs";

function normalizeSamples(samples) {
  return samples instanceof Float32Array
    ? samples
    : Float32Array.from(samples || []);
}

function confidenceRank(value) {
  return ({ low:0, medium:1, high:2 })[String(value || "").toLowerCase()] ?? 0;
}

function lowestConfidence(...values) {
  const labels=["low","medium","high"];
  const rank=Math.min(...values.map(confidenceRank));
  return labels[Math.max(0,rank)];
}

export async function evaluateRecordedAttempt({
  samples,
  sampleRate = 16000,
  task = {},
  sttRuntime,
  phonemeRuntime,
  languageEvidence = null,
  interactionEvidence = null,
  taskCompletionEvidence = null
} = {}) {
  const pcm=normalizeSamples(samples);
  if (!pcm.length) {
    return {
      technicalRetry:true,
      technicalReason:"empty-audio",
      transcript:{ text:"", confidence:"low", words:[], evidence:[] },
      phonemes:null,
      prosody:analyzeProsody(pcm,sampleRate),
      evaluation:evaluateAttempt({
        task,
        transcript:{ text:"", confidence:"low" },
        phonemes:{ score:null, confidence:"low", errors:[] },
        prosody:analyzeProsody(pcm,sampleRate),
        languageEvidence,
        interactionEvidence,
        taskCompletionEvidence
      })
    };
  }

  const [transcript, phonemes] = await Promise.all([
    transcribeLocal(pcm,{ runtime:sttRuntime }),
    analyzePhonemes(
      pcm,
      {
        skillId:String(task?.targetSkill || ""),
        word:String(task?.targetWord || ""),
        expected:Array.isArray(task?.expectedPhonemes) ? task.expectedPhonemes : []
      },
      { runtime:phonemeRuntime }
    )
  ]);
  const prosody=analyzeProsody(pcm,sampleRate);

  const evaluation=evaluateAttempt({
    task,
    transcript,
    phonemes,
    prosody,
    languageEvidence,
    interactionEvidence,
    taskCompletionEvidence
  });

  const technicalRetry = evaluation.technicalRetry === true ||
    lowestConfidence(transcript.confidence,phonemes.confidence,prosody.confidence) === "low";

  return {
    technicalRetry,
    technicalReason:technicalRetry ? "low-confidence-speech-evidence" : null,
    transcript,
    phonemes,
    prosody,
    evaluation
  };
}
