import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const teacher=readFileSync(new URL("../teacher.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
const teacherApp=readFileSync(new URL("../teacher-app.mjs",import.meta.url),"utf8");

test("student shell exposes four real approved views",()=>{
  for(const id of ["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"]){
    assert.match(index,new RegExp('id="'+id+'"'));
  }
  assert.doesNotMatch(index,/talk-talk-approved-8-screen-mockup/);
  assert.match(index,/student-home-card/);
  assert.match(index,/recording-panel/);
  assert.match(index,/conversation-panel/);
  assert.match(index,/practice-review-panel/);
  assert.match(app,/showStudentView/);
});

test("teacher shell exposes four real approved views",()=>{
  for(const id of ["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"]){
    assert.match(teacher,new RegExp('id="'+id+'"'));
  }
  assert.doesNotMatch(teacher,/talk-talk-approved-8-screen-mockup/);
  assert.match(teacher,/teacher-monitor-layout/);
  assert.match(teacher,/team-detail-panel/);
  assert.match(teacher,/oral-assessment-panel/);
  assert.match(teacher,/evidence-panel/);
  assert.match(teacherApp,/showTeacherView/);
});

test("approved green system is implemented in CSS, not flattened imagery",()=>{
  assert.match(css,/--tt-green:#0b5f4b/);
  assert.match(css,/\.character-avatar/);
  assert.match(css,/\.audio-wave/);
  assert.match(css,/\.teacher-sidebar/);
  assert.doesNotMatch(css,/\.reference-art/);
  assert.doesNotMatch(css,/\.reference-screen/);
});
