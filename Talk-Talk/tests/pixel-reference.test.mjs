import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const source="a_clean_ui_ux_product_mockup_collage_with_multiple.png";

test("student preview uses direct crops from the approved visual reference",()=>{
  assert.match(student,new RegExp('data-reference-source="'+source+'"'));
  for(const [screen,crop] of [[1,"10,40,378,550"],[2,"392,40,760,550"],[3,"776,40,1145,550"],[4,"1160,40,1526,550"]]){
    assert.match(student,new RegExp('data-approved-screen="'+screen+'"[^>]*data-crop="'+crop+'"[^>]*src="data:image/webp;base64,'));
  }
});

test("teacher preview uses direct crops from the approved visual reference",()=>{
  assert.match(teacher,new RegExp('data-reference-source="'+source+'"'));
  for(const [screen,crop] of [[5,"12,607,514,1008"],[6,"528,607,844,1008"],[7,"858,607,1195,1008"],[8,"1210,607,1527,1008"]]){
    assert.match(teacher,new RegExp('data-approved-screen="'+screen+'"[^>]*data-crop="'+crop+'"[^>]*src="data:image/webp;base64,'));
  }
});

test("approved-screen hotspots preserve the intended navigation",()=>{
  assert.match(student,/data-target="studentRecordingView"/);
  assert.match(student,/data-target="studentConversationView"/);
  assert.match(student,/data-target="studentPracticeResultView"/);
  assert.match(teacher,/data-target="teacherTeamView"/);
  assert.match(teacher,/data-target="teacherAssessmentView"/);
  assert.match(teacher,/data-target="teacherEvidenceView"/);
});
