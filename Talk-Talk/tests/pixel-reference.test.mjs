import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const student=await readFile(new URL("../index.html",import.meta.url),"utf8");
const teacher=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
const css=await readFile(new URL("../styles.css",import.meta.url),"utf8");

test("approved mockup is implemented as real DOM, never as screenshot UI",()=>{
  for(const source of [student,teacher]){
    assert.doesNotMatch(source,/reference-art/);
    assert.doesNotMatch(source,/talk-talk-approved-8-screen-mockup\.(png|webp)/);
    assert.doesNotMatch(source,/<svg[^>]*viewBox=.*approved/i);
  }
  assert.match(student,/class="student-home-card"/);
  assert.match(student,/class="recording-panel"/);
  assert.match(student,/class="conversation-panel"/);
  assert.match(student,/class="practice-review-panel"/);
  assert.match(teacher,/class="teacher-monitor-layout"/);
  assert.match(teacher,/class="team-detail-panel"/);
  assert.match(teacher,/class="oral-assessment-panel"/);
  assert.match(teacher,/class="evidence-panel"/);
});

test("characters are independent assets, not baked into screen captures",()=>{
  assert.match(student,/assets\/home-characters\.webp/);
  assert.match(student,/assets\/paul-head\.webp/);
  assert.match(student,/assets\/paulina-head\.webp/);
  assert.match(student,/assets\/paulina-record\.webp/);
  assert.match(teacher,/assets\/paul-head\.webp/);
  assert.match(teacher,/assets\/paulina-head\.webp/);
  assert.match(css,/--tt-green:#0b5f4b/);
});

test("eight approved views keep their real interactive navigation",()=>{
  for(const id of ["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"]){
    assert.match(student,new RegExp('id="'+id+'"'));
  }
  for(const id of ["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"]){
    assert.match(teacher,new RegExp('id="'+id+'"'));
  }
  assert.match(student,/data-target="studentRecordingView"/);
  assert.match(student,/data-target="studentConversationView"/);
  assert.match(student,/data-target="studentPracticeResultView"/);
  assert.match(teacher,/data-target="teacherTeamView"/);
  assert.match(teacher,/data-target="teacherAssessmentView"/);
  assert.match(teacher,/data-target="teacherEvidenceView"/);
});
