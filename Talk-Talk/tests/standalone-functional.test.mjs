import test from "node:test";
import assert from "node:assert/strict";

import {
  createStandaloneAttempt,
  completeStandaloneAttempt,
  buildLocalStandaloneEvaluation,
  createStandaloneAttemptStore
} from "../standalone-session.mjs";

test("new standalone attempt contains no invented transcript or linguistic scores", () => {
  const attempt=createStandaloneAttempt({
    studentKey:"student",
    studentName:"Paul",
    partnerName:"Paulina",
    activityTitle:"Tell me what happened",
    now:()=>1000
  });
  assert.equal(attempt.status,"ready");
  assert.equal(attempt.transcript.status,"pending");
  assert.equal(attempt.transcript.heardText,"");
  assert.equal(attempt.evaluation,null);
});

test("local standalone evaluation scores only evidence available from real audio", () => {
  const samples=new Float32Array(16000).fill(0.08);
  const evaluation=buildLocalStandaloneEvaluation({
    samples,
    sampleRate:16000,
    durationMs:1000
  });
  assert.ok(evaluation.dimensions.fluency.value !== null);
  assert.ok(evaluation.dimensions.taskCompletion.value !== null);
  assert.equal(evaluation.dimensions.pronunciation.value,null);
  assert.equal(evaluation.dimensions.grammarVocabulary.value,null);
  assert.equal(evaluation.dimensions.interaction.value,null);
});

test("completed recording remains transcript-pending until Oral-Grader is connected", () => {
  const attempt=createStandaloneAttempt({now:()=>1000});
  const samples=new Float32Array(16000).fill(0.08);
  const evaluation=buildLocalStandaloneEvaluation({samples,sampleRate:16000,durationMs:1000});
  const completed=completeStandaloneAttempt(attempt,{
    durationMs:1000,
    audioKey:"standalone-latest-audio",
    evaluation,
    now:()=>2500
  });
  assert.equal(completed.status,"recorded");
  assert.equal(completed.audioKey,"standalone-latest-audio");
  assert.equal(completed.transcript.status,"pending");
  assert.equal(completed.transcript.heardText,"");
});

test("standalone store shares metadata and audio between student and teacher roles", async () => {
  const map=new Map();
  const storage={
    getItem:key=>map.get(key)??null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key)
  };
  const blobs=new Map();
  const blobStore={
    put:async(key,blob)=>blobs.set(key,blob),
    get:async key=>blobs.get(key)??null,
    delete:async key=>blobs.delete(key)
  };
  const store=createStandaloneAttemptStore({storage,blobStore});
  const attempt=completeStandaloneAttempt(
    createStandaloneAttempt({studentName:"Paul",now:()=>1000}),
    {durationMs:800,audioKey:"a1",evaluation:null,now:()=>1800}
  );
  const audioBlob=new Blob(["audio"],{type:"audio/webm"});
  await store.save(attempt,{audioBlob});

  const loaded=await store.load();
  assert.equal(loaded.attempt.studentName,"Paul");
  assert.equal(loaded.attempt.audioKey,"a1");
  assert.equal(await loaded.audioBlob.text(),"audio");
});
