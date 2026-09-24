import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const teacher=readFileSync(new URL("../teacher.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
const teacherApp=readFileSync(new URL("../teacher-app.mjs",import.meta.url),"utf8");

test("student shell exposes the four approved views",()=>{
  for(const id of ["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"]){
    assert.match(index,new RegExp('id="'+id+'"'));
  }
  assert.match(index,/talk-talk-approved-8-screen-mockup\.webp/);
  assert.match(app,/showStudentView/);
});

test("teacher shell exposes the four approved views",()=>{
  for(const id of ["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"]){
    assert.match(teacher,new RegExp('id="'+id+'"'));
  }
  assert.match(teacher,/talk-talk-approved-8-screen-mockup\.webp/);
  assert.match(teacherApp,/showTeacherView/);
});

test("approved green mockup remains the visible design instead of a CSS recreation",()=>{
  assert.match(css,/--tt-green:#0d624e/);
  assert.match(css,/\.reference-screen/);
  assert.match(css,/\.reference-art/);
  assert.doesNotMatch(css,/\.avatar-hair/);
  assert.doesNotMatch(css,/\.character-avatar/);
});
