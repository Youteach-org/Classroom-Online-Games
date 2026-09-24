import test from "node:test";
import assert from "node:assert/strict";

import { normalizeActivity } from "../core/activity-schema.mjs";
import { createActivitySession, advanceActivity } from "../core/activity-engine.mjs";
import { TELL_ME_WHAT_HAPPENED } from "../curriculum/tell-me-what-happened.mjs";

test("Tell Me What Happened carries the approved A2-B1 targets", () => {
  const activity = normalizeActivity(TELL_ME_WHAT_HAPPENED);
  assert.equal(activity.id, "tell-me-what-happened");
  assert.deepEqual(activity.cefr, ["A2", "B1"]);
  assert.deepEqual(activity.pronunciationTargets, ["past-ed-t", "past-ed-d", "past-ed-id"]);
  assert.ok(activity.interactionTargets.includes("follow-up-question"));
});

test("activity advances through the canonical Talk Talk phase order", () => {
  let session = createActivitySession(
    normalizeActivity(TELL_ME_WHAT_HAPPENED),
    { studentKey: "s1" }
  );

  for (const phase of [
    "hear",
    "notice",
    "say",
    "use",
    "react",
    "speak",
    "challenge",
    "results",
    "adapt"
  ]) {
    assert.equal(session.phase, phase);
    session = advanceActivity(session, { type: "PHASE_COMPLETE" });
  }

  assert.equal(session.status, "complete");
});

test("activity schema rejects an unknown phase", () => {
  assert.throws(
    () => normalizeActivity({
      ...TELL_ME_WHAT_HAPPENED,
      phases: ["hear", "invented-phase"]
    }),
    /Unknown Talk Talk phase/
  );
});
