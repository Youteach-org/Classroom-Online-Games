import test from "node:test";
import assert from "node:assert/strict";

import {
  createSession,
  applyInstructorEvent,
  consumeNextAnalysis,
  consumeHint,
  serializeCaseConfig
} from "../trainer-engine.js";

const expected = {
  A1: ["SHOCK","NO_SHOCK"],
  A2: ["SHOCK","SHOCK","NO_SHOCK"],
  A3: ["CONTACT_FAULT","SHOCK","NO_SHOCK"],
  A4: ["SHOCK","NO_SHOCK","SHOCK","NO_SHOCK"],
  A5: ["NO_SHOCK","NO_SHOCK"],
  A6: ["SHOCK","SHOCK","NO_SHOCK"],
  A7: ["SHOCK","SHOCK","NO_SHOCK","SHOCK","NO_SHOCK"],
  A8: ["CONTACT_FAULT","SHOCK","SHOCK","NO_SHOCK"]
};

test("A1-A8 consume their cataloged analysis order exactly", () => {
  for (const [scenarioId, outcomes] of Object.entries(expected)) {
    let session = createSession({ scenarioId, twistId: "T0", clinicalId: "C0" });
    const actual = [];
    for (let i = 0; i < outcomes.length; i++) {
      const result = consumeNextAnalysis(session);
      assert.equal(result.accepted, true);
      actual.push(result.outcome);
      session = result.session;
    }
    assert.deepEqual(actual, outcomes, scenarioId);
    assert.equal(consumeNextAnalysis(session).accepted, false);
  }
});

test("next-analysis override applies once and then clears", () => {
  let session = createSession({ scenarioId: "A5", twistId: "T0", clinicalId: "C0" });
  ({ session } = applyInstructorEvent(session, { seq: 10, type: "FORCE_SHOCK" }));
  let result = consumeNextAnalysis(session);
  assert.equal(result.outcome, "SHOCK");
  assert.equal(result.session.nextAnalysisOverride, null);
  result = consumeNextAnalysis(result.session);
  assert.equal(result.outcome, "NO_SHOCK");
});

test("refibrillation forces the next reassessment to SHOCK", () => {
  let session = createSession({ scenarioId: "A5", twistId: "T0", clinicalId: "C0" });
  ({ session } = applyInstructorEvent(session, { seq: 11, type: "REFIBRILLATION" }));
  const result = consumeNextAnalysis(session);
  assert.equal(result.outcome, "SHOCK");
});

test("duplicate instructor sequence IDs do not execute twice", () => {
  const start = createSession({ scenarioId: "A1", twistId: "T0", clinicalId: "C0" });
  const first = applyInstructorEvent(start, { seq: 20, type: "FORCE_NO_SHOCK" });
  assert.equal(first.accepted, true);
  const duplicate = applyInstructorEvent(first.session, { seq: 20, type: "FORCE_SHOCK" });
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, "duplicate_seq");
  assert.equal(duplicate.session.nextAnalysisOverride, "NO_SHOCK");
});

test("DAR PISTA consumes each available hint once and records usage", () => {
  let session = createSession({ scenarioId: "A1", twistId: "T1", clinicalId: "C1" });
  const first = consumeHint(session);
  assert.equal(first.accepted, true);
  assert.equal(first.promptId, "PARAMEDIC_HINT_WET_CHEST");
  assert.equal(first.session.hintsUsed, 1);
  session = first.session;

  const second = consumeHint(session);
  assert.equal(second.accepted, true);
  assert.equal(second.promptId, "PARAMEDIC_HINT_PREGNANCY");
  assert.equal(second.session.hintsUsed, 2);

  const exhausted = consumeHint(second.session);
  assert.equal(exhausted.accepted, false);
  assert.equal(exhausted.reason, "no_hint");
  assert.equal(exhausted.session.hintsUsed, 2);
});

test("invalid instructor event leaves the session unchanged", () => {
  const start = createSession({ scenarioId: "A1", twistId: "T0", clinicalId: "C0" });
  const result = applyInstructorEvent(start, { seq: 99, type: "NOT_A_REAL_EVENT" });
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "invalid_event");
  assert.deepEqual(result.session, start);
});

test("case serialization is compact and stable", () => {
  const session = createSession({ scenarioId: "A8", twistId: "T4", clinicalId: "C12" });
  assert.deepEqual(serializeCaseConfig(session), { scenario: "A8", twist: "T4", clinical: "C12" });
});
