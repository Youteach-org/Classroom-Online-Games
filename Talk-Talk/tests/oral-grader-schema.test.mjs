import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeOralGraderJob,
  normalizeOralGraderResult
} from "../evaluation/oral-grader-schema.mjs";

function validJob(){
  return {
    jobId:"job-123",
    attemptId:"attempt-123",
    sessionId:"session-123",
    activityId:"activity-123",
    groupId:"group-1",
    teamId:"team-1",
    students:[
      {studentId:"student-1",name:"Paul"},
      {studentId:"student-2",name:"Paulina"}
    ],
    mode:"assessment",
    rubricId:"e6c-units-1-4-v1",
    language:"en",
    promptContext:"Tell me what happened.",
    audio:{mimeType:"audio/webm"},
    clientCreatedAt:"2026-09-28T21:30:00-06:00",
    idempotencyKey:"attempt-123:grade"
  };
}

function completedResult(){
  return {
    jobId:"job-123",
    status:"completed",
    transcript:{
      heard_text:"I have went to the park.",
      speakers:["Paul"],
      segments:[
        {speaker:"Paul",heard_text:"I have went to the park.",start_ms:0,end_ms:1800}
      ]
    },
    analysis:{
      intended_text:[],
      pronunciation:[],
      grammar:[],
      vocabulary:[],
      fluency:[],
      coherence:[],
      interaction:[],
      evidence:[]
    },
    students:[
      {
        studentId:"student-1",
        name:"Paul",
        rubric_scores:{
          fluency:7,
          coherence_and_organization:6,
          grammar_and_vocabulary:6,
          pronunciation_and_intelligibility:7,
          communicative_interaction:7
        },
        total:33,
        comments:["Good sustained communication."],
        confidence:"high",
        review_required:false
      }
    ],
    report:{status:"ready"}
  };
}

test("normalizes a complete Oral Grader submission job",()=>{
  const out=normalizeOralGraderJob(validJob());
  assert.equal(out.mode,"assessment");
  assert.equal(out.audio.mimeType,"audio/webm");
  assert.equal(out.students.length,2);
  assert.equal(out.idempotencyKey,"attempt-123:grade");
});

test("submission job rejects missing idempotency and identity fields",()=>{
  const job=validJob();
  delete job.idempotencyKey;
  assert.throws(()=>normalizeOralGraderJob(job),/idempotencyKey/);

  const job2=validJob();
  job2.students[0].studentId="";
  assert.throws(()=>normalizeOralGraderJob(job2),/studentId/);
});

test("submission job accepts only supported modes",()=>{
  const job=validJob();
  job.mode="demo";
  assert.throws(()=>normalizeOralGraderJob(job),/mode/);
});

test("processing result can exist without fabricated scores",()=>{
  const out=normalizeOralGraderResult({
    jobId:"job-123",
    status:"analyzing"
  });
  assert.equal(out.status,"analyzing");
  assert.equal(out.students,undefined);
});

test("completed result preserves literal heard_text exactly",()=>{
  const payload=completedResult();
  const out=normalizeOralGraderResult(payload);
  assert.equal(out.transcript.heard_text,"I have went to the park.");
  assert.equal(out.transcript.segments[0].heard_text,"I have went to the park.");
});

test("completed result requires all five 0-8 rubric dimensions and exact total",()=>{
  const payload=completedResult();
  payload.students[0].rubric_scores.fluency=9;
  assert.throws(()=>normalizeOralGraderResult(payload),/0..8/);

  const payload2=completedResult();
  delete payload2.students[0].rubric_scores.communicative_interaction;
  assert.throws(()=>normalizeOralGraderResult(payload2),/five/);

  const payload3=completedResult();
  payload3.students[0].total=40;
  assert.throws(()=>normalizeOralGraderResult(payload3),/total/);
});

test("review-required result may carry complete evidence and scores without pretending completion",()=>{
  const payload=completedResult();
  payload.status="review_required";
  payload.students[0].review_required=true;
  const out=normalizeOralGraderResult(payload);
  assert.equal(out.status,"review_required");
  assert.equal(out.students[0].review_required,true);
  assert.equal(out.students[0].total,33);
});


test("submission job does not require a client-assigned jobId",()=>{
  const job=validJob();
  delete job.jobId;
  const out=normalizeOralGraderJob(job);
  assert.equal(out.jobId,undefined);
  assert.equal(out.attemptId,"attempt-123");
});
