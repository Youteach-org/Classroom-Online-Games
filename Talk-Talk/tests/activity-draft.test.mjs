import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TELL_ME_WHAT_HAPPENED } from "../curriculum/tell-me-what-happened.mjs";
import {
  duplicateActivity,
  validateDraft
} from "../core/activity-draft.mjs";

test("creator duplicates an activity without mutating the source", () => {
  const draft=duplicateActivity(TELL_ME_WHAT_HAPPENED);
  draft.title="My Version";
  draft.cefr=["B1"];

  assert.equal(TELL_ME_WHAT_HAPPENED.title,"Tell Me What Happened");
  assert.equal(draft.title,"My Version");
  assert.deepEqual(draft.cefr,["B1"]);
});

test("creator validates editable vertical-slice fields", () => {
  const draft=duplicateActivity(TELL_ME_WHAT_HAPPENED);
  Object.assign(draft,{
    situation:"A student explains a strange event after class.",
    instructions:"Tell the story, react to your partner, and add one new detail.",
    roles:[
      { id:"a", label:"Storyteller", privateInformation:"You saw a bicycle fall." },
      { id:"b", label:"Listener", privateInformation:"Ask what happened next." }
    ],
    prompts:["What happened next?"],
    twist:{ id:"remember-detail", text:"You remember one more detail." },
    durationMinutes:8,
    practiceMode:"assessment"
  });

  const result=validateDraft(draft);
  assert.equal(result.valid,true);
  assert.equal(result.activity.practiceMode,"assessment");
  assert.equal(result.activity.durationMinutes,8);
  assert.equal(result.activity.roles.length,2);
});

test("creator rejects missing situation and invalid mode", () => {
  const draft=duplicateActivity(TELL_ME_WHAT_HAPPENED);
  draft.situation="";
  draft.practiceMode="graded-ish";
  const result=validateDraft(draft);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(error=>/situation/i.test(error)));
  assert.ok(result.errors.some(error=>/mode/i.test(error)));
});

test("creator shell exposes Test as Student without publish action", async () => {
  const html=await readFile(new URL("../creator.html",import.meta.url),"utf8");
  assert.match(html,/id="testAsStudentBtn"/);
  assert.doesNotMatch(html,/id="publishBtn"/);
});
