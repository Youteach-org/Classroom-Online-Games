import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");

test("standalone preview uses the canonical approved eight-screen reference",()=>{
  assert.match(student,/reference\/talk-talk-approved-8-screen-mockup\.png/);
  assert.match(teacher,/reference\/talk-talk-approved-8-screen-mockup\.png/);

  for(const viewBox of [
    "10 40 368 510",
    "392 40 368 510",
    "776 40 369 510",
    "1160 40 366 510"
  ]){
    assert.match(student,new RegExp('viewBox="'+viewBox+'"'));
  }

  for(const viewBox of [
    "12 607 502 401",
    "528 607 316 401",
    "858 607 337 401",
    "1210 607 317 401"
  ]){
    assert.match(teacher,new RegExp('viewBox="'+viewBox+'"'));
  }
});

test("approved screen hotspots preserve the intended navigation",()=>{
  assert.match(student,/data-target="studentRecordingView"/);
  assert.match(student,/data-target="studentConversationView"/);
  assert.match(student,/data-target="studentPracticeResultView"/);
  assert.match(teacher,/data-target="teacherTeamView"/);
  assert.match(teacher,/data-target="teacherAssessmentView"/);
  assert.match(teacher,/data-target="teacherEvidenceView"/);
});
