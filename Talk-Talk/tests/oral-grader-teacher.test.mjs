import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const app=await readFile(new URL("../teacher-app.mjs",import.meta.url),"utf8");

test("teacher monitor exposes shared online job result surfaces",()=>{
  for(const id of [
    "teamGrid",
    "teacherJobListStatus",
    "teacherTeamTitle",
    "teacherTeamNames",
    "teacherTranscriptThread",
    "teacherEvidenceList",
    "teacherOverallScore",
    "teacherEditScoresBtn",
    "teacherPublishBtn"
  ]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});

test("teacher app reads online Oral Grader jobs instead of student local storage",()=>{
  assert.match(app,/createOralGraderClient/);
  assert.match(app,/listJobs/);
  assert.match(app,/getJobRecord/);
  assert.match(app,/getAudioBlob/);
  assert.match(app,/saveTeacherReview/);
  assert.match(app,/mapOralGraderResultToTalkTalk/);
  assert.doesNotMatch(app,/createStandaloneAttemptStore/);
  assert.doesNotMatch(app,/updateStandaloneTeacherReview/);
  assert.doesNotMatch(app,/publishStandaloneAttempt/);
});

test("teacher app preserves automatic result and layers teacher override separately",()=>{
  assert.match(app,/teacherReview/);
  assert.match(app,/rubric_scores/);
  assert.match(app,/heardText|heard_text/);
  assert.doesNotMatch(app,/Local prosody estimate/);
});
