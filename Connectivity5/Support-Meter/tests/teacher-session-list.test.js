const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
const js=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
const css=fs.readFileSync(path.join(root,'teacher-v25.css'),'utf8');
const student=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('student and teacher pages share version 25',()=>{
  assert.match(student,/aria-label="Version 25">v25/);
  assert.match(html,/aria-label="Version 25">v25/);
});

test('teacher uses a permanent compact session list instead of a dropdown',()=>{
  assert.match(html,/id="sessionList"/);
  assert.doesNotMatch(html,/id="sessionSelect"/);
  assert.match(css,/\.session-list\{[^}]*display:grid/);
  assert.match(css,/\.session-card\{[^}]*min-height:72px/);
});

test('teacher defaults to all students and filters only after a session click',()=>{
  assert.match(js,/active='all'/);
  assert.match(js,/ALL ACTIVE STUDENTS/);
  assert.match(js,/data-session-id/);
});
