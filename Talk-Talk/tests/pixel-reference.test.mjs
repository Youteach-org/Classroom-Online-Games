import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const css=await readFile(new URL("../styles.css",import.meta.url),"utf8");
const source="a_clean_ui_ux_product_mockup_collage_with_multiple.png";

test("all eight screens are tied to the approved reference and exact crop coordinates",()=>{
  assert.match(student,new RegExp('data-reference-source="'+source+'"'));
  assert.match(teacher,new RegExp('data-reference-source="'+source+'"'));
  const expected=[
    [student,1,"10,40,378,550"],[student,2,"392,40,760,550"],[student,3,"776,40,1145,550"],[student,4,"1160,40,1526,550"],
    [teacher,5,"12,607,514,1008"],[teacher,6,"528,607,844,1008"],[teacher,7,"858,607,1195,1008"],[teacher,8,"1210,607,1527,1008"]
  ];
  for(const [html,screen,crop] of expected){
    assert.match(html,new RegExp('data-approved-screen="'+screen+'"[^>]*data-crop="'+crop+'"'));
  }
});

test("approved character assets are used instead of reinterpretations",()=>{
  assert.match(student,/home_chars\.webp/);
  assert.match(student,/paul_head\.webp/);
  assert.match(student,/paulina_head\.webp/);
  assert.match(teacher,/paul_head\.webp/);
  assert.match(teacher,/paulina_head\.webp/);
});

test("reference canvas dimensions match the approved screens",()=>{
  assert.match(css,/\.student-reference\{width:368px;height:510px\}/);
  assert.match(css,/\.teacher-monitor-reference\{width:502px;height:401px\}/);
  assert.match(css,/\.teacher-narrow-reference\{width:316px;height:401px\}/);
  assert.match(css,/\.teacher-eval-reference\{width:337px;height:401px\}/);
  assert.match(css,/\.teacher-evidence-reference\{width:317px;height:401px\}/);
});

test("approved-screen controls preserve the intended navigation",()=>{
  assert.match(student,/data-target="studentRecordingView"/);
  assert.match(student,/data-target="studentConversationView"/);
  assert.match(student,/data-target="studentPracticeResultView"/);
  assert.match(teacher,/data-target="teacherTeamView"/);
  assert.match(teacher,/data-target="teacherAssessmentView"/);
  assert.match(teacher,/data-target="teacherEvidenceView"/);
});
