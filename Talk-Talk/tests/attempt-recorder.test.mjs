import test from "node:test";
import assert from "node:assert/strict";
import { createAttemptRecorder } from "../speech/attempt-recorder.mjs";

class FakeRecorder {
  constructor(stream){
    this.stream=stream;
    this.mimeType="audio/webm";
    this.listeners=new Map();
  }
  addEventListener(type,fn,options={}){
    const list=this.listeners.get(type)||[];
    list.push({fn,once:options.once===true});
    this.listeners.set(type,list);
  }
  emit(type,event={}){
    const list=[...(this.listeners.get(type)||[])];
    this.listeners.set(type,list.filter(x=>!x.once));
    for(const item of list) item.fn(event);
  }
  start(){
    this.emit("dataavailable",{data:new Blob(["abc"],{type:"audio/webm"})});
  }
  stop(){
    queueMicrotask(()=>this.emit("stop"));
  }
}

test("attempt recorder returns original audio blob with decoded PCM", async () => {
  const recorder=createAttemptRecorder({
    stream:{},
    MediaRecorderClass:FakeRecorder,
    decodeBlob:async()=>({samples:new Float32Array([0.1,0.2]),sampleRate:16000,durationMs:125})
  });
  recorder.start();
  const out=await recorder.stop();
  assert.ok(out.blob instanceof Blob);
  assert.equal(out.blob.type,"audio/webm");
  assert.equal(await out.blob.text(),"abc");
  assert.deepEqual(Array.from(out.samples),Array.from(new Float32Array([0.1,0.2])));
  assert.equal(out.durationMs,125);
});
