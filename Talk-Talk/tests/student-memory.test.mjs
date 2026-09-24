import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyProfile,
  recordSkillEvidence
} from "../core/student-memory.mjs";
import { buildPersonalPractice } from "../core/personal-practice.mjs";

function recurringPastEdProfile() {
  let profile = createEmptyProfile("s1");
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "word",
    confidence: "high",
    at: 1
  });
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "sentence",
    confidence: "high",
    at: 2
  });
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "conversation",
    confidence: "high",
    at: 3
  });
  return profile;
}

test("one failure is observed, repeated cross-context evidence becomes recurring", () => {
  let profile = createEmptyProfile("s1");
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "word",
    confidence: "high",
    at: 1
  });
  assert.equal(profile.skills["past-ed-t"].state, "observed");

  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "sentence",
    confidence: "high",
    at: 2
  });
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "conversation",
    confidence: "high",
    at: 3
  });

  assert.equal(profile.skills["past-ed-t"].state, "recurring");
  assert.equal(profile.currentFocus, "past-ed-t");
});

test("low-confidence evidence does not change learner memory", () => {
  const profile = createEmptyProfile("s1");
  const next = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "miss",
    context: "word",
    confidence: "low",
    at: 1
  });
  assert.deepEqual(next, profile);
});

test("later successful transfer can master a recurring skill", () => {
  let profile = recurringPastEdProfile();
  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "hit",
    context: "conversation-transfer",
    confidence: "high",
    at: 4
  });
  assert.equal(profile.skills["past-ed-t"].transferHits, 1);
  assert.equal(profile.skills["past-ed-t"].state, "recurring");

  profile = recordSkillEvidence(profile, {
    skillId: "past-ed-t",
    outcome: "hit",
    context: "new-conversation-transfer",
    confidence: "high",
    at: 5
  });
  assert.equal(profile.skills["past-ed-t"].state, "mastered");
  assert.equal(profile.currentFocus, null);
});

test("one miss does not immediately demote a mastered skill", () => {
  let profile = recurringPastEdProfile();
  profile = recordSkillEvidence(profile, { skillId:"past-ed-t", outcome:"hit", context:"conversation-transfer", confidence:"high", at:4 });
  profile = recordSkillEvidence(profile, { skillId:"past-ed-t", outcome:"hit", context:"new-conversation-transfer", confidence:"high", at:5 });
  profile = recordSkillEvidence(profile, { skillId:"past-ed-t", outcome:"miss", context:"conversation", confidence:"high", at:6 });
  assert.equal(profile.skills["past-ed-t"].state, "mastered");
});

test("Past -ed Clinic is generated only for recurring past-ed focus", () => {
  const profile = recurringPastEdProfile();
  const missions = buildPersonalPractice(profile);
  assert.equal(missions.length, 1);
  assert.equal(missions[0].id, "past-ed-clinic");
  assert.equal(missions[0].skillId, "past-ed-t");
  assert.deepEqual(missions[0].stages, ["notice","hear","compare","say","use","transfer"]);
});
