import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTalkTalkResultPayload,
  submitTalkTalkResult
} from "../live/youteach-talk-talk-live.mjs";

const liveContext={
  studentKey:"student-1",
  cogSessionId:"TT123",
  bridgeToken:"bridge-token",
  issuer:"https://youteach.pages.dev"
};

const evaluation={
  overall:82,
  dimensions:{
    pronunciation:{value:84},
    fluency:{value:79},
    grammarVocabulary:{value:81},
    interaction:{value:86},
    taskCompletion:{value:90}
  },
  primaryFocus:{skillId:"past-ed-t"}
};

test("Talk Talk result payload is individual and contains only allowed summary metrics", () => {
  const payload=buildTalkTalkResultPayload({
    liveContext,
    evaluation,
    evidenceConfidence:88,
    unitId:"tell-me-what-happened",
    cefr:"B1",
    attemptId:"attempt1",
    completedAt:123456
  });
  assert.equal(payload.resultType,"individual");
  assert.equal(payload.schemaVersion,1);
  assert.equal(payload.percentage,82);
  assert.deepEqual(payload.metrics,{
    pronunciation:84,
    fluency:79,
    grammarVocabulary:81,
    interaction:86,
    taskCompletion:90,
    evidenceConfidence:88,
    unitId:"tell-me-what-happened",
    cefr:"B1",
    primaryFocus:"past-ed-t"
  });
  assert.equal(JSON.stringify(payload).includes("transcript"),false);
});

test("Talk Talk result submit sends bridge token and canonical endpoint", async () => {
  const calls=[];
  const fetchImpl=async (url,init) => {
    calls.push({url:String(url),init});
    return new Response(JSON.stringify({ok:true,duplicate:false,receipt:{}}),{
      status:200,
      headers:{"Content-Type":"application/json"}
    });
  };
  const result=await submitTalkTalkResult({
    liveContext,
    payload:buildTalkTalkResultPayload({
      liveContext,
      evaluation,
      evidenceConfidence:88,
      unitId:"tell-me-what-happened",
      cefr:"B1",
      attemptId:"attempt1",
      completedAt:123456
    }),
    fetchImpl
  });
  assert.equal(result.ok,true);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,"https://youteach.pages.dev/api/cog-live-result-submit");
  assert.equal(calls[0].init.headers.Authorization,"Bearer bridge-token");
});
