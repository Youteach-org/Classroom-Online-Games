import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  monitorOralGraderJob,
  applyOralGraderJobState
} from "../evaluation/oral-grader-monitor.mjs";
import { normalizeOralGraderResult } from "../evaluation/oral-grader-schema.mjs";

function attempt(){
  return {
    attemptId:"standalone-1000",
    status:"recorded",
    audioKey:"standalone-latest-audio",
    grading:{
      idempotencyKey:"standalone-1000:grade",
      jobId:"job-123",
      status:"submitted"
    },
    transcript:{status:"pending",heardText:"",source:"oral-grader"}
  };
}

function completed(){
  return {
    jobId:"job-123",
    status:"completed",
    transcript:{
      heard_text:"I have went to the park.",
      speakers:["Paul"],
      segments:[
        {speaker:"Paul",heard_text:"I have went to the park.",start_ms:0,end_ms:1200}
      ]
    },
    analysis:{
      intended_text:[],
      pronunciation:[],
      grammar:[{speaker:"Paul",grammar_note:"Subject-verb agreement evidence."}],
      vocabulary:[],
      fluency:["Paul: steady pace."],
      coherence:[],
      interaction:[],
      evidence:[]
    },
    students:[{
      studentId:"student",
      name:"Paul",
      rubric_scores:{
        fluency:7,
        coherence_and_organization:6,
        grammar_and_vocabulary:6,
        pronunciation_and_intelligibility:7,
        communicative_interaction:7
      },
      total:33,
      comments:["Maintains extended responses."],
      confidence:"high",
      review_required:false
    }],
    report:{status:"ready"}
  };
}

test("monitor follows shared online job until completed",async()=>{
  const states=[
    {jobId:"job-123",status:"submitted"},
    {jobId:"job-123",status:"transcribing"},
    {jobId:"job-123",status:"analyzing"},
    {jobId:"job-123",status:"scoring"},
    completed()
  ];
  const seen=[];
  const client={
    async getJob(){
      return states.shift();
    }
  };
  const out=await monitorOralGraderJob({
    client,
    jobId:"job-123",
    onUpdate:value=>seen.push(value.status),
    sleep:async()=>{},
    intervalMs:0,
    maxPolls:10
  });
  assert.equal(out.status,"completed");
  assert.deepEqual(seen,["submitted","transcribing","analyzing","scoring","completed"]);
});

test("completed job updates attempt with immutable literal transcript and OG result",()=>{
  const source=attempt();
  const out=applyOralGraderJobState(source,completed());
  assert.equal(out.grading.status,"completed");
  assert.equal(out.transcript.status,"ready");
  assert.equal(out.transcript.heardText,"I have went to the park.");
  assert.equal(out.transcript.source,"oral-grader");
  assert.equal(out.oralGraderResult.students[0].total,33);
  assert.equal(source.transcript.heardText,"");
});

test("review_required may be a terminal job state before a full result exists",()=>{
  const normalized=normalizeOralGraderResult({
    jobId:"job-123",
    status:"review_required"
  });
  assert.deepEqual(normalized,{jobId:"job-123",status:"review_required"});

  const out=applyOralGraderJobState(attempt(),normalized);
  assert.equal(out.grading.status,"review_required");
  assert.equal(out.transcript.heardText,"");
  assert.equal(out.oralGraderResult,undefined);
});

test("monitor stops on retryable failure instead of fabricating a result",async()=>{
  const client={
    async getJob(){
      return {jobId:"job-123",status:"failed_retryable"};
    }
  };
  const out=await monitorOralGraderJob({
    client,jobId:"job-123",sleep:async()=>{},intervalMs:0
  });
  assert.equal(out.status,"failed_retryable");
  assert.equal(out.students,undefined);
});

test("student UI has dynamic Oral Grader transcript and result surfaces",async()=>{
  const html=await readFile(new URL("../index.html",import.meta.url),"utf8");
  const app=await readFile(new URL("../app.mjs",import.meta.url),"utf8");

  for(const id of [
    "studentTranscriptThread",
    "studentResultStatus",
    "studentFeedbackGood",
    "studentFeedbackWork"
  ]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(app,/monitorOralGraderJob/);
  assert.match(app,/applyOralGraderJobState/);
  assert.match(app,/mapOralGraderResultToTalkTalk/);
  assert.doesNotMatch(html,/Local evidence available/);
  assert.doesNotMatch(html,/Local diagnostic fluency/);
});
