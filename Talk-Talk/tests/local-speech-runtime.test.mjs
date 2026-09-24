import test from "node:test";
import assert from "node:assert/strict";

import {
  createTransformersSpeechRuntimes,
  scorePastEdEnding
} from "../speech/local-transformers-runtime.mjs";
import {
  resamplePcm,
  createAttemptRecorder
} from "../speech/attempt-recorder.mjs";
import { evaluateRecordedAttempt } from "../speech/attempt-pipeline.mjs";

test("past-ed ending scorer rewards expected final phoneme and flags extra syllable", () => {
  const good=scorePastEdEnding("w ɜ k t",{skillId:"past-ed-t"});
  assert.ok(good.score >= 85);
  assert.equal(good.errors.length,0);

  const extra=scorePastEdEnding("w ɜ k ɪ d",{skillId:"past-ed-t",word:"worked"});
  assert.ok(extra.score < good.score);
  assert.equal(extra.errors[0].type,"extra-syllable");
  assert.equal(extra.errors[0].word,"worked");
});

test("Transformers runtime is local and pipelines are lazy/cached", async () => {
  const calls=[];
  const fakePipeline=async (task,model,options) => {
    calls.push({task,model,options});
    if(model.includes("whisper")) return async () => ({text:" I worked yesterday. "});
    return async () => ({text:"w ɜ k t"});
  };
  const runtimes=createTransformersSpeechRuntimes({
    pipelineFactory:fakePipeline,
    capabilityProfile:{webgpu:true}
  });

  const a=await runtimes.stt.transcribe(new Float32Array([0,.1]));
  const b=await runtimes.stt.transcribe(new Float32Array([0,.1]));
  const p=await runtimes.phoneme.analyze(new Float32Array([0,.1]),{
    skillId:"past-ed-t",word:"worked"
  });

  assert.equal(a.text,"I worked yesterday.");
  assert.equal(b.text,"I worked yesterday.");
  assert.ok(p.score >= 85);
  assert.equal(calls.length,2);
  assert.ok(calls.every(call=>call.options.device==="webgpu"));
});

test("PCM resampler produces finite 16 kHz output", () => {
  const source=new Float32Array([0,1,0,-1,0,1,0,-1]);
  const out=resamplePcm(source,8000,16000);
  assert.equal(out.length,16);
  assert.ok([...out].every(Number.isFinite));
});

test("attempt recorder keeps audio local and returns decoded PCM", async () => {
  class FakeRecorder {
    constructor(stream){ this.stream=stream; this.listeners={}; this.state="inactive"; }
    addEventListener(name,fn){ (this.listeners[name] ||= []).push(fn); }
    start(){ this.state="recording"; }
    stop(){
      this.state="inactive";
      for(const fn of this.listeners.dataavailable||[]) fn({data:new Blob(["audio"])});
      for(const fn of this.listeners.stop||[]) fn();
    }
  }
  const recorder=createAttemptRecorder({
    stream:{id:"local-stream"},
    MediaRecorderClass:FakeRecorder,
    decodeBlob:async blob => {
      assert.ok(blob instanceof Blob);
      return {samples:new Float32Array([0,.1,.2,.1]),sampleRate:16000};
    }
  });
  recorder.start();
  const result=await recorder.stop();
  assert.equal(result.sampleRate,16000);
  const expected=[0,.1,.2,.1];
  assert.equal(result.samples.length,expected.length);
  result.samples.forEach((value,index)=>{
    assert.ok(Math.abs(value-expected[index]) < 1e-6);
  });
});

test("recorded attempt uses local STT/phoneme/prosody and returns one evaluation", async () => {
  const result=await evaluateRecordedAttempt({
    samples:new Float32Array(16000).fill(.08),
    sampleRate:16000,
    task:{
      kind:"pronunciation",
      targetSkill:"past-ed-t",
      targetWord:"worked",
      expectedPhonemes:["w","ɜ","k","t"]
    },
    sttRuntime:{
      kind:"local",
      transcribe:async()=>({text:"I worked yesterday.",confidence:.9})
    },
    phonemeRuntime:{
      kind:"local",
      analyze:async()=>({score:92,confidence:.9,phonemes:["w","ɜ","k","t"],errors:[]})
    }
  });
  assert.equal(result.technicalRetry,false);
  assert.equal(result.transcript.text,"I worked yesterday.");
  assert.equal(result.evaluation.dimensions.pronunciation.value,92);
  assert.ok(result.evaluation.primaryFocus);
  assert.equal("rawAudio" in result,false);
});
