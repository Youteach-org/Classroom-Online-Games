import test from "node:test";
import assert from "node:assert/strict";

import { analyzeInteraction } from "../evaluation/interaction-engine.mjs";
import { evaluateAttempt } from "../evaluation/evaluation-engine.mjs";
import { buildResultsModel } from "../ui/results-view.mjs";

const task={ kind:"conversation", interactionTargets:["follow-up-question","clarification"] };

test("learner can earn strong interaction evidence with short but meaningful turns", () => {
  const timeline=[
    { turnId:"b1", studentKey:"b", startedAt:0, endedAt:8000, transcript:"What happened yesterday?" },
    { turnId:"a1", studentKey:"a", startedAt:8100, endedAt:9800, transcript:"I walked home. Did you see it too?", respondsToTurnId:"b1", interactionMoves:["follow-up"], relevant:true },
    { turnId:"b2", studentKey:"b", startedAt:10000, endedAt:18000, transcript:"Yes, near the park." },
    { turnId:"a2", studentKey:"a", startedAt:18100, endedAt:19400, transcript:"Do you mean Central Park?", respondsToTurnId:"b2", interactionMoves:["clarification"], relevant:true }
  ];

  const out=analyzeInteraction(timeline,"a",task);
  assert.ok(out.score >= 80);
  assert.equal(out.respondedTurns,2);
  assert.equal(out.relevantFollowUps,1);
  assert.equal(out.clarificationMoves,1);
  assert.equal(out.sustainedExchange,true);
});

test("silent or weak partner does not lower the learner's pronunciation or grammar dimensions", () => {
  const timeline=[
    { turnId:"a1", studentKey:"a", startedAt:0, endedAt:2000, transcript:"Yesterday I worked late.", relevant:true }
  ];

  const result=evaluateAttempt({
    task,
    studentKey:"a",
    timeline,
    phonemes:{ confidence:"high", score:88, errors:[] },
    languageEvidence:{ confidence:"high", score:92, evidence:[] },
    taskCompletionEvidence:{ confidence:"high", score:85, evidence:[] }
  });

  assert.equal(result.dimensions.pronunciation.value,88);
  assert.equal(result.dimensions.grammarVocabulary.value,92);
  assert.ok(result.dimensions.interaction.value === null || result.dimensions.interaction.value >= 0);
});

test("group timeline maps interaction to the requested learner only", () => {
  const timeline=[
    { turnId:"a1", studentKey:"a", startedAt:0, endedAt:1000, transcript:"What happened?", interactionMoves:["follow-up"], relevant:true },
    { turnId:"b1", studentKey:"b", startedAt:1100, endedAt:6000, transcript:"A long story.", respondsToTurnId:"a1", relevant:true },
    { turnId:"b2", studentKey:"b", startedAt:6100, endedAt:9000, transcript:"What about you?", interactionMoves:["follow-up"], relevant:true },
    { turnId:"a2", studentKey:"a", startedAt:9100, endedAt:10000, transcript:"Do you mean at home all evening?", respondsToTurnId:"b2", interactionMoves:["clarification"], relevant:true }
  ];

  const a=analyzeInteraction(timeline,"a",task);
  const b=analyzeInteraction(timeline,"b",task);
  assert.equal(a.respondedTurns,1);
  assert.equal(b.respondedTurns,1);
  assert.equal(a.relevantFollowUps,1);
  assert.equal(b.relevantFollowUps,1);
  assert.equal(a.clarificationMoves,1);
  assert.equal(b.clarificationMoves,0);
});

test("results model exposes interaction summary without partner data leakage", () => {
  const evaluation=evaluateAttempt({
    task,
    studentKey:"a",
    timeline:[
      { turnId:"b1", studentKey:"b", startedAt:0, endedAt:1000, transcript:"What happened?" },
      { turnId:"a1", studentKey:"a", startedAt:1100, endedAt:2200, transcript:"I worked.", respondsToTurnId:"b1", interactionMoves:["repair"], relevant:true }
    ],
    phonemes:{ confidence:"high", score:80, errors:[] }
  });
  const model=buildResultsModel(evaluation,[]);
  assert.equal(model.interactionSummary.studentKey,"a");
  assert.equal(model.interactionSummary.repairMoves,1);
  assert.equal(JSON.stringify(model.interactionSummary).includes("What happened?"),false);
});
