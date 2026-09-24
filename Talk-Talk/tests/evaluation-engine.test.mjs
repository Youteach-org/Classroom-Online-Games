import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAttempt } from "../evaluation/evaluation-engine.mjs";

test("low-confidence phoneme evidence cannot lower pronunciation", () => {
  const result = evaluateAttempt({
    task: { kind: "pronunciation", targetSkill: "past-ed-t" },
    phonemes: {
      confidence: "low",
      score: 25,
      errors: [{ type: "extra-syllable", word: "worked" }]
    },
    transcript: { confidence: "high", text: "worked" }
  });

  assert.equal(result.technicalRetry, true);
  assert.equal(result.dimensions.pronunciation.value, null);
  assert.equal(result.overall, null);
});

test("feedback names one actionable past-ed focus", () => {
  const result = evaluateAttempt({
    task: { kind: "pronunciation", targetSkill: "past-ed-t" },
    phonemes: {
      confidence: "high",
      score: 68,
      errors: [{ type: "extra-syllable", word: "worked" }]
    }
  });

  assert.equal(result.primaryFocus.skillId, "past-ed-t");
  assert.equal(result.primaryFocus.action, "practice-final-ed-without-extra-syllable");
  assert.equal(result.primaryFocus.word, "worked");
});

test("missing dimensions are null and remaining weights renormalize", () => {
  const result = evaluateAttempt({
    task: {
      kind: "conversation",
      weights: {
        pronunciation: 20,
        fluency: 20,
        grammarVocabulary: 20,
        interaction: 20,
        taskCompletion: 20
      }
    },
    phonemes: { confidence: "high", score: 80, errors: [] },
    prosody: { confidence: "high", fluencyScore: 60, evidence: [] },
    languageEvidence: { confidence: "high", score: 100, evidence: [] },
    taskCompletionEvidence: { confidence: "high", score: 60, evidence: [] }
  });

  assert.equal(result.dimensions.interaction.value, null);
  assert.equal(result.overall, 75);
});

test("one primary focus is returned even when several dimensions are weak", () => {
  const result = evaluateAttempt({
    task: { kind: "conversation", targetSkill: "past-ed-t" },
    phonemes: { confidence: "high", score: 55, errors: [{ type: "extra-syllable", word: "helped" }] },
    prosody: { confidence: "high", fluencyScore: 50, evidence: [{ type: "long-pauses" }] },
    languageEvidence: { confidence: "high", score: 45, evidence: [{ type: "tense-selection" }] },
    interactionEvidence: { confidence: "high", score: 40, evidence: [{ type: "no-follow-ups" }] },
    taskCompletionEvidence: { confidence: "high", score: 90, evidence: [] }
  });

  assert.ok(result.primaryFocus);
  assert.equal(Array.isArray(result.primaryFocus), false);
});
