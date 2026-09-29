import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { mapOralGraderResultToTalkTalk } from "../evaluation/oral-grader-mapper.mjs";
import { createOralGraderAdapter } from "../evaluation/oral-grader-adapter.mjs";

const fixture=JSON.parse(
  await readFile(new URL("./fixtures/paul-paulina-oral-grader-result.json",import.meta.url),"utf8")
);

test("mapper preserves literal heard_text byte-for-byte",()=>{
  const mapped=mapOralGraderResultToTalkTalk(fixture);
  assert.equal(mapped.transcript.heardText,fixture.transcript.heard_text);
  assert.equal(
    mapped.transcript.segments[0].heardText,
    "Who helped you when you was staying a difficult moment?"
  );
});

test("mapper exposes real Paul and Paulina rubric scores without recalculating them",()=>{
  const mapped=mapOralGraderResultToTalkTalk(fixture);
  const paul=mapped.students.find(x=>x.name==="Paul");
  const paulina=mapped.students.find(x=>x.name==="Paulina");

  assert.deepEqual(
    paul.rubric.map(x=>x.score),
    [7,6,6,7,7]
  );
  assert.equal(paul.total,33);

  assert.deepEqual(
    paulina.rubric.map(x=>x.score),
    [7,5,6,7,7]
  );
  assert.equal(paulina.total,32);
});

test("mapper keeps Oral Grader evidence available for Teacher Monitor",()=>{
  const mapped=mapOralGraderResultToTalkTalk(fixture);
  const item=mapped.analysis.evidence.find(x=>x.heard==="fires");
  assert.equal(item.intended,"fathers");
  assert.deepEqual(item.source,["teacher-confirmed","audio"]);
});

test("adapter validates and maps a transport result through the canonical schema",async()=>{
  const adapter=createOralGraderAdapter({
    transport:{
      async getJob(jobId){
        assert.equal(jobId,"fixture-paul-paulina");
        return fixture;
      }
    }
  });

  const mapped=await adapter.getResult("fixture-paul-paulina");
  assert.equal(mapped.status,"completed");
  assert.equal(mapped.students[0].maxTotal,40);
  assert.equal(mapped.transcript.heardText,fixture.transcript.heard_text);
});
