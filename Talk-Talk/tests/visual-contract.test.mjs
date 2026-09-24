import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teacher = readFileSync(new URL("../teacher.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.mjs", import.meta.url), "utf8");
const teacherApp = readFileSync(new URL("../teacher-app.mjs", import.meta.url), "utf8");

test("student shell exposes the four approved visual views", () => {
  for (const id of ["studentHomeView","studentRecordingView","studentConversationView","studentPracticeResultView"]) {
    assert.match(index, new RegExp('id="'+id+'"'));
  }
  assert.match(index, /class="character-avatar/);
  assert.match(index, /Your speaking review/);
  assert.match(app, /showStudentView/);
});

test("teacher shell exposes monitor, team, assessment and evidence views", () => {
  for (const id of ["teacherMonitorView","teacherTeamView","teacherAssessmentView","teacherEvidenceView"]) {
    assert.match(teacher, new RegExp('id="'+id+'"'));
  }
  assert.match(teacher, /Transcript/);
  assert.match(teacher, /Evidence/);
  assert.match(teacher, /Comments/);
  assert.match(teacherApp, /showTeacherView/);
});

test("approved green Talk Talk visual system and characters are retained", () => {
  assert.match(css, /--tt-green:/);
  assert.match(css, /--tt-green-dark:/);
  assert.match(css, /\.character-avatar/);
  assert.match(css, /\.avatar-hair/);
  assert.match(css, /\.speech-bubble/);
  assert.match(css, /\.audio-wave/);
});
