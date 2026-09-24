import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const css=await readFile(new URL("../styles.css",import.meta.url),"utf8");
const asset="./reference/talk-talk-approved-8-screen-mockup.webp";

test("all eight views render the canonical approved mockup asset",()=>{
  assert.ok(student.includes(asset));
  assert.ok(teacher.includes(asset));
  assert.match(student,/data-reference-source="a_clean_ui_ux_product_mockup_collage_with_multiple\.png"/);
  assert.match(teacher,/data-reference-source="a_clean_ui_ux_product_mockup_collage_with_multiple\.png"/);
});

test("student views use the exact approved crop boxes",()=>{
  const boxes=[
    ["studentHomeView","10 40 368 510"],
    ["studentRecordingView","392 40 368 510"],
    ["studentConversationView","776 40 369 510"],
    ["studentPracticeResultView","1160 40 366 510"]
  ];
  for(const [id,box] of boxes){
    assert.match(student,new RegExp('id="'+id+'"[\\s\\S]*?viewBox="'+box+'"'));
  }
});

test("teacher views use the exact approved crop boxes",()=>{
  const boxes=[
    ["teacherMonitorView","12 607 502 401"],
    ["teacherTeamView","528 607 316 401"],
    ["teacherAssessmentView","858 607 337 401"],
    ["teacherEvidenceView","1210 607 317 401"]
  ];
  for(const [id,box] of boxes){
    assert.match(teacher,new RegExp('id="'+id+'"[\\s\\S]*?viewBox="'+box+'"'));
  }
});

test("reference image is never restyled or replaced by recreated characters",()=>{
  assert.match(css,/\.reference-art\{[^}]*display:block/);
  assert.match(css,/\.reference-screen\{[^}]*position:relative/);
  assert.doesNotMatch(student,/class="character-avatar/);
  assert.doesNotMatch(teacher,/class="character-avatar/);
});

test("transparent hotspots preserve test navigation without changing the visual",()=>{
  assert.match(student,/data-target="studentRecordingView"/);
  assert.match(student,/data-target="studentConversationView"/);
  assert.match(student,/data-target="studentPracticeResultView"/);
  assert.match(teacher,/data-target="teacherTeamView"/);
  assert.match(teacher,/data-target="teacherAssessmentView"/);
  assert.match(teacher,/data-target="teacherEvidenceView"/);
  assert.match(css,/\.screen-hotspot\{[^}]*background:transparent/);
});
