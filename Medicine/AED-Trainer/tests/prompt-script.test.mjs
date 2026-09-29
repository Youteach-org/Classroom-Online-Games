import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { PROMPTS } from "../prompt-catalog.js";
import { SCENE_TWISTS } from "../scene-twists.js";
import { CLINICAL_CASES } from "../clinical-cases.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const script = JSON.parse(readFileSync(join(root, "audio", "prompt-script.json"), "utf8"));
const rows = script.prompts;
const byId = new Map(rows.map((row) => [row.id, row]));

test("every prompt catalog ID has exactly one script row", () => {
  assert.equal(rows.length, Object.keys(PROMPTS).length);
  assert.equal(byId.size, rows.length);
  for (const id of Object.keys(PROMPTS)) assert.ok(byId.has(id), id);
});

test("voice roles use the approved base profiles plus the two CPR exceptions", () => {
  const aedExceptions = new Map([
    ["AED_BEGIN_CPR", "aed-cpr-lucia"],
    ["AED_CONTINUE_CPR", "aed-continue-hybrid"]
  ]);

  for (const row of rows) {
    const prompt = PROMPTS[row.id];
    assert.equal(row.role, prompt.role);
    assert.equal(row.text, prompt.text);
    assert.equal(row.filename, prompt.audioAsset);

    if (row.role === "aed") {
      assert.equal(
        row.voiceProfile,
        aedExceptions.get(row.id) ?? "aed-female-latam",
        row.id
      );
    }
    if (row.role === "paramedic") {
      assert.equal(row.voiceProfile, "paramedic-male-latam");
    }
  }
});

test("paramedic hints sound like a teammate and do not duplicate context", () => {
  for (const row of rows.filter((x) => x.id.startsWith("PARAMEDIC_HINT_"))) {
    assert.match(row.text, /^Compañero,/);
    const suffix = row.id.slice("PARAMEDIC_HINT_".length);
    const context = byId.get("PARAMEDIC_CONTEXT_" + suffix);
    if (context) assert.notEqual(row.text, context.text);
  }
});

test("all hintable twists and clinical cases have scriptable hints", () => {
  for (const entry of [...SCENE_TWISTS.slice(1), ...CLINICAL_CASES.slice(1)]) {
    assert.ok(byId.has(entry.contextPromptId), entry.contextPromptId);
    for (const hintId of entry.hintPromptIds) assert.ok(byId.has(hintId), hintId);
  }
});

test("development medical dialogue remains flagged for release review", () => {
  for (const row of rows) assert.equal(row.releaseReviewRequired, true, row.id);
});

test("script declares base profiles and approved CPR exceptions", () => {
  assert.equal(script.voiceProfiles["aed-female-latam"].gender, "female");
  assert.equal(script.voiceProfiles["aed-female-latam"].locale, "es-MX");
  assert.equal(script.voiceProfiles["paramedic-male-latam"].gender, "male");
  assert.equal(script.voiceProfiles["paramedic-male-latam"].locale, "es-MX");
  assert.equal(script.voiceProfiles["aed-cpr-lucia"].locale, "es-MX");
  assert.equal(script.voiceProfiles["aed-continue-hybrid"].locale, "es-MX");
});
