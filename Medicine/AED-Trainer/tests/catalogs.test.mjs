import test from "node:test";
import assert from "node:assert/strict";

import { AED_SCENARIOS } from "../aed-scenarios.js";
import { SCENE_TWISTS } from "../scene-twists.js";
import { CLINICAL_CASES } from "../clinical-cases.js";
import { PROMPTS } from "../prompt-catalog.js";

test("catalog IDs are complete and unique", () => {
  assert.deepEqual(AED_SCENARIOS.map(x => x.id), ["A1","A2","A3","A4","A5","A6","A7","A8"]);
  assert.deepEqual(SCENE_TWISTS.map(x => x.id), ["T0","T1","T2","T3","T4","T5","T6","T7","T8"]);
  assert.deepEqual(CLINICAL_CASES.map(x => x.id), ["C0","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","C11","C12","C13","C14","C15","C16"]);
  assert.equal(new Set(AED_SCENARIOS.map(x => x.id)).size, AED_SCENARIOS.length);
  assert.equal(new Set(SCENE_TWISTS.map(x => x.id)).size, SCENE_TWISTS.length);
  assert.equal(new Set(CLINICAL_CASES.map(x => x.id)).size, CLINICAL_CASES.length);
});

test("every AED scenario exposes an ordered analysis sequence", () => {
  for (const scenario of AED_SCENARIOS) {
    assert.ok(Array.isArray(scenario.analysisSequence));
    assert.ok(scenario.analysisSequence.length > 0);
    for (const outcome of scenario.analysisSequence) {
      assert.ok(["SHOCK","NO_SHOCK","CONTACT_FAULT"].includes(outcome));
    }
  }
});

test("all nonzero twists and clinical cases map to paramedic context and hints", () => {
  for (const entry of [...SCENE_TWISTS.slice(1), ...CLINICAL_CASES.slice(1)]) {
    assert.match(entry.contextPromptId, /^PARAMEDIC_CONTEXT_/);
    assert.ok(Array.isArray(entry.hintPromptIds));
    assert.ok(entry.hintPromptIds.length >= 1);
    assert.ok(PROMPTS[entry.contextPromptId], entry.contextPromptId);
    for (const hintId of entry.hintPromptIds) {
      assert.match(hintId, /^PARAMEDIC_HINT_/);
      assert.ok(PROMPTS[hintId], hintId);
    }
  }
});

test("prompt role and ID prefix can never disagree", () => {
  for (const prompt of Object.values(PROMPTS)) {
    if (prompt.id.startsWith("AED_")) assert.equal(prompt.role, "aed");
    if (prompt.id.startsWith("PARAMEDIC_")) assert.equal(prompt.role, "paramedic");
    if (prompt.role === "aed") assert.match(prompt.id, /^AED_/);
    if (prompt.role === "paramedic") assert.match(prompt.id, /^PARAMEDIC_(CONTEXT|HINT)_/);
  }
});
