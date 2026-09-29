import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const app=await readFile(new URL("../app.mjs",import.meta.url),"utf8");
const teacherApp=await readFile(new URL("../teacher-app.mjs",import.meta.url),"utf8");

test("student UI exposes real recording and stored-attempt surfaces",()=>{
  for(const id of [
    "recordButton","finishRecordingBtn","recordingDuration","microphoneMessage",
    "studentAudioElement","transcriptStatus","studentFluencyValue","studentTaskValue"
  ]){
    assert.match(student,new RegExp('id="'+id+'"'));
  }
  assert.match(app,/createAudioCapture/);
  assert.match(app,/createAttemptRecorder/);
  assert.match(app,/createStandaloneAttemptStore/);
  assert.match(app,/buildLocalStandaloneEvaluation/);
});

test("student UI does not ship fake transcript or fake linguistic feedback",()=>{
  assert.doesNotMatch(student,/I have went to the park/i);
  assert.doesNotMatch(student,/Your partner understood your ideas/i);
  assert.match(student,/Transcript pending/i);
  assert.match(student,/Oral-Grader/i);
});

test("teacher UI reads shared online Oral Grader jobs instead of hard-coded/local attempts",()=>{
  for(const id of [
    "teacherAttemptState","teacherAudioElement","teacherTranscriptThread",
    "teacherFluencyScore","teacherPublishBtn","teacherEditScoresBtn","teacherReportBtn"
  ]){
    assert.match(teacher,new RegExp('id="'+id+'"'));
  }
  assert.doesNotMatch(teacher,/28\s*\/\s*40/);
  assert.doesNotMatch(teacher,/I have went to the park/i);
  assert.match(teacherApp,/createOralGraderClient/);
  assert.match(teacherApp,/listJobs/);
  assert.doesNotMatch(teacherApp,/createStandaloneAttemptStore/);
  assert.doesNotMatch(teacherApp,/publishStandaloneAttempt/);
});


test("student can review audio or record again before finishing",()=>{
  assert.match(student,/id="studentReviewAudioBtn"/);
  assert.match(student,/id="studentRecordAgainBtn"/);
  assert.match(student,/id="recordingReviewAudio"/);
  assert.match(app,/studentReviewAudioBtn/);
  assert.match(app,/studentRecordAgainBtn/);
  assert.match(app,/startFreshRecording/);
});
