import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildOralGraderSubmission,
  markAttemptUploading,
  markAttemptSubmitted,
  markAttemptSubmissionError
} from "../evaluation/oral-grader-submission.mjs";

function attempt(){
  return {
    attemptId:"standalone-1000",
    studentKey:"student",
    studentName:"Paul",
    partnerName:"Paulina",
    activityTitle:"Tell me what happened",
    mode:"practice",
    createdAt:1000,
    durationMs:42000,
    audioKey:"standalone-latest-audio",
    status:"recorded"
  };
}

test("builds one canonical submission from the accepted take",()=>{
  const blob=new Blob(["audio"],{type:"audio/webm"});
  const out=buildOralGraderSubmission(attempt(),blob,{
    sessionId:"standalone-session",
    activityId:"tell-me-what-happened",
    rubricId:"talk-talk-oral-v1"
  });

  assert.equal(out.idempotencyKey,"standalone-1000:grade");
  assert.equal(out.metadata.attemptId,"standalone-1000");
  assert.equal(out.metadata.jobId,undefined);
  assert.equal(out.metadata.students.length,1);
  assert.deepEqual(out.metadata.students[0],{studentId:"student",name:"Paul"});
  assert.equal(out.metadata.audio.mimeType,"audio/webm");
  assert.equal(out.metadata.promptContext.activityTitle,"Tell me what happened");
});

test("uploading and server acknowledgement keep local recovery metadata",()=>{
  const uploading=markAttemptUploading(attempt());
  assert.equal(uploading.grading.status,"uploading");
  assert.equal(uploading.audioKey,"standalone-latest-audio");

  const submitted=markAttemptSubmitted(uploading,{
    jobId:"job-123",
    status:"submitted"
  });
  assert.equal(submitted.grading.jobId,"job-123");
  assert.equal(submitted.grading.status,"submitted");
  assert.equal(submitted.grading.idempotencyKey,"standalone-1000:grade");
  assert.equal(submitted.audioKey,"standalone-latest-audio");
});

test("retryable upload failure preserves same idempotency key and local audio",()=>{
  const failed=markAttemptSubmissionError(
    markAttemptUploading(attempt()),
    {message:"temporary",retryable:true}
  );
  assert.equal(failed.grading.status,"failed_retryable");
  assert.equal(failed.grading.idempotencyKey,"standalone-1000:grade");
  assert.equal(failed.audioKey,"standalone-latest-audio");
});

test("student screen exposes Califica after recording review controls",async()=>{
  const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
  const app=await readFile(new URL("../app.mjs",import.meta.url),"utf8");

  assert.match(html,/id="studentGradeBtn"/);
  assert.match(html,/>Califica</);
  assert.match(html,/id="gradingStatus"/);
  assert.match(html,/id="studentReviewAudioBtn"/);
  assert.match(html,/id="studentRecordAgainBtn"/);

  assert.match(app,/createOralGraderClient/);
  assert.match(app,/buildOralGraderSubmission/);
  assert.match(app,/submitAttempt/);
  assert.match(app,/idempotencyKey/);
});

test("preview login obtains and stores server token for online grading",async()=>{
  const login=await readFile(new URL("../login.mjs",import.meta.url),"utf8");
  const auth=await readFile(new URL("../standalone-auth.mjs",import.meta.url),"utf8");

  assert.match(login,/loginPreview/);
  assert.match(login,/onlineToken/);
  assert.match(auth,/onlineToken/);
});
