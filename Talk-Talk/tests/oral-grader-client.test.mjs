import test from "node:test";
import assert from "node:assert/strict";

import { createOralGraderClient } from "../evaluation/oral-grader-client.mjs";

const endpoints={
  login:"https://functions.example/talk_talk_preview_login",
  submit:"https://functions.example/oral_grader_submit",
  status:"https://functions.example/oral_grader_job_status"
};

function metadata(){
  return {
    attemptId:"attempt-123",
    sessionId:"session-123",
    activityId:"activity-123",
    students:[{studentId:"student-1",name:"Paul"}],
    mode:"assessment",
    rubricId:"e6c-units-1-4-v1",
    language:"en",
    promptContext:"Tell me what happened.",
    audio:{mimeType:"audio/webm"},
    clientCreatedAt:"2026-09-28T21:30:00-06:00",
    idempotencyKey:"old-value"
  };
}

test("preview login obtains a server-signed token and stores it only in the client",async()=>{
  const calls=[];
  const client=createOralGraderClient({
    endpoints,
    fetchImpl:async(url,options)=>{
      calls.push({url,options});
      return new Response(JSON.stringify({
        ok:true,
        token:"signed-token",
        role:"student",
        subject:"student"
      }),{status:200,headers:{"Content-Type":"application/json"}});
    }
  });

  const session=await client.loginPreview("student","talktalk");

  assert.equal(session.token,"signed-token");
  assert.equal(client.getToken(),"signed-token");
  assert.equal(calls[0].url,endpoints.login);
  assert.equal(calls[0].options.method,"POST");
  assert.equal(calls[0].options.headers["Content-Type"],"application/json");
  assert.deepEqual(JSON.parse(calls[0].options.body),{
    username:"student",
    password:"talktalk"
  });
});

test("submitAttempt uploads accepted audio with bearer auth and canonical idempotency key",async()=>{
  const calls=[];
  const client=createOralGraderClient({
    endpoints,
    token:"signed-token",
    fetchImpl:async(url,options)=>{
      calls.push({url,options});
      return new Response(JSON.stringify({
        ok:true,
        jobId:"job-123",
        status:"submitted"
      }),{status:202,headers:{"Content-Type":"application/json"}});
    }
  });

  const blob=new Blob(["audio"],{type:"audio/webm"});
  const out=await client.submitAttempt(blob,metadata(),"attempt-123:grade");

  assert.deepEqual(out,{jobId:"job-123",status:"submitted"});
  const call=calls[0];
  assert.equal(call.url,endpoints.submit);
  assert.equal(call.options.method,"POST");
  assert.equal(call.options.headers.Authorization,"Bearer signed-token");
  assert.ok(call.options.body instanceof FormData);

  const sentMetadata=JSON.parse(call.options.body.get("metadata"));
  assert.equal(sentMetadata.idempotencyKey,"attempt-123:grade");
  assert.equal(sentMetadata.jobId,undefined);
  assert.equal(sentMetadata.audio.mimeType,"audio/webm");
  assert.equal(await call.options.body.get("audio").text(),"audio");
});

test("retrying the same accepted attempt sends the same idempotency key",async()=>{
  const sent=[];
  const client=createOralGraderClient({
    endpoints,
    token:"signed-token",
    fetchImpl:async(_url,options)=>{
      sent.push(JSON.parse(options.body.get("metadata")));
      return new Response(JSON.stringify({
        ok:true,
        jobId:"job-123",
        status:"submitted"
      }),{status:202,headers:{"Content-Type":"application/json"}});
    }
  });
  const blob=new Blob(["same-audio"],{type:"audio/webm"});

  await client.submitAttempt(blob,metadata(),"attempt-123:grade");
  await client.submitAttempt(blob,metadata(),"attempt-123:grade");

  assert.equal(sent.length,2);
  assert.equal(sent[0].idempotencyKey,"attempt-123:grade");
  assert.equal(sent[1].idempotencyKey,"attempt-123:grade");
});

test("getJob reads shared processing state without fabricating scores",async()=>{
  const client=createOralGraderClient({
    endpoints,
    token:"signed-token",
    fetchImpl:async(url,options)=>{
      assert.equal(url,endpoints.status+"?jobId=job-123");
      assert.equal(options.headers.Authorization,"Bearer signed-token");
      return new Response(JSON.stringify({
        ok:true,
        job:{jobId:"job-123",status:"analyzing"}
      }),{status:200,headers:{"Content-Type":"application/json"}});
    }
  });

  const out=await client.getJob("job-123");
  assert.deepEqual(out,{jobId:"job-123",status:"analyzing"});
  assert.equal(out.students,undefined);
});

test("getJob returns the canonical completed Oral Grader result from the online job",async()=>{
  const result={
    jobId:"job-123",
    status:"completed",
    transcript:{
      heard_text:"I have went to the park.",
      speakers:["Paul"],
      segments:[{speaker:"Paul",heard_text:"I have went to the park.",start_ms:0,end_ms:1000}]
    },
    analysis:{
      intended_text:[],pronunciation:[],grammar:[],vocabulary:[],
      fluency:[],coherence:[],interaction:[],evidence:[]
    },
    students:[{
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
      comments:[],
      confidence:"high",
      review_required:false
    }],
    report:{status:"ready"}
  };

  const client=createOralGraderClient({
    endpoints,
    token:"signed-token",
    fetchImpl:async()=>new Response(JSON.stringify({
      ok:true,
      job:{jobId:"job-123",status:"completed",result}
    }),{status:200,headers:{"Content-Type":"application/json"}})
  });

  const out=await client.getJob("job-123");
  assert.equal(out.status,"completed");
  assert.equal(out.transcript.heard_text,"I have went to the park.");
  assert.equal(out.students[0].total,33);
});

test("server errors surface status and retryability",async()=>{
  const client=createOralGraderClient({
    endpoints,
    token:"signed-token",
    fetchImpl:async()=>new Response(JSON.stringify({
      ok:false,
      error:"temporary"
    }),{status:503,headers:{"Content-Type":"application/json"}})
  });

  await assert.rejects(
    ()=>client.submitAttempt(new Blob(["audio"],{type:"audio/webm"}),metadata(),"attempt-123:grade"),
    error=>error.status===503 && error.retryable===true
  );
});
