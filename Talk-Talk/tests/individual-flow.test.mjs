import test from "node:test";
import assert from "node:assert/strict";
import { normalizeActivity } from "../core/activity-schema.mjs";
import { TELL_ME_WHAT_HAPPENED } from "../curriculum/tell-me-what-happened.mjs";
import {
  createIndividualFlow,
  addLearnerTurn,
  completeCurrentPhase,
  recordingStateForTechnicalReason
} from "../ui/lesson-view.mjs";
import { buildResultsModel } from "../ui/results-view.mjs";
import { buildConversationReplay } from "../ui/conversation-replay.mjs";

const EVALUATION = {
  overall: 72,
  strength: { dimension: "taskCompletion", value: 90 },
  primaryFocus: {
    skillId: "past-ed-t",
    action: "practice-final-ed-without-extra-syllable",
    word: "worked"
  },
  dimensions: {
    pronunciation: { value: 68, confidence:"high", evidence:[] },
    fluency: { value: 75, confidence:"high", evidence:[] },
    grammarVocabulary: { value: 72, confidence:"high", evidence:[] },
    interaction: { value:null, confidence:"low", evidence:[] },
    taskCompletion: { value:90, confidence:"high", evidence:[] }
  },
  technicalRetry: false
};

test("individual flow reaches Results with one actionable priority and replayable turn", () => {
  const activity = normalizeActivity(TELL_ME_WHAT_HAPPENED);
  let flow = createIndividualFlow(activity, { studentKey:"s1" });

  for (let i = 0; i < 6; i += 1) flow = completeCurrentPhase(flow);
  flow = addLearnerTurn(flow, {
    turnId:"turn-1",
    transcript:"I worked yesterday.",
    understood:"I worked yesterday.",
    evaluation:EVALUATION,
    rawAudio:new Blob(["must not persist"])
  });
  flow = completeCurrentPhase(flow); // challenge -> results

  assert.equal(flow.session.phase, "results");

  const results = buildResultsModel(EVALUATION, flow.turns);
  assert.ok(results.strength);
  assert.equal(results.primaryFocus.skillId, "past-ed-t");
  assert.equal(Array.isArray(results.primaryFocus), false);

  const replay = buildConversationReplay(flow.turns);
  assert.equal(replay.length, 1);
  assert.equal(replay[0].turnId, "turn-1");
  assert.equal(replay[0].transcript, "I worked yesterday.");
  assert.equal(replay[0].rawAudio, undefined);
  assert.doesNotMatch(JSON.stringify(results), /must not persist/);
});

test("technical microphone states request retry without academic failure", () => {
  for (const reason of ["microphone-denied","input-too-low","input-clipping","model-unavailable"]) {
    const state = recordingStateForTechnicalReason(reason);
    assert.equal(state.academicFailure, false);
    assert.equal(state.canRetry, true);
  }
});
