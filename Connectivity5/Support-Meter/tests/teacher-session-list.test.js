const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
const js=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
const cssPath=path.join(root,'teacher-v26.css');
const css=fs.existsSync(cssPath)?fs.readFileSync(cssPath,'utf8'):'';
const student=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('student and teacher pages share version 26',()=>{
  assert.match(student,/aria-label="Version 26">v26/);
  assert.match(html,/aria-label="Version 26">v26/);
});

test('teacher uses a permanent compact session list instead of a dropdown',()=>{
  assert.match(html,/id="sessionList"/);
  assert.doesNotMatch(html,/id="sessionSelect"/);
  assert.match(css,/\.session-list\{[^}]*display:grid/);
  assert.match(css,/\.assignment-panel \.session-card\{[^}]*min-height:4[4-8]px/);
});

test('compact teacher header remains visible while student cards scroll',()=>{
  assert.match(css,/\.teacher-header\{[^}]*position:sticky/);
  assert.match(css,/\.teacher-header\{[^}]*top:0/);
  assert.match(css,/\.teacher-header\{[^}]*z-index:/);
});

test('teacher defaults to all students and filters only after a session click',()=>{
  assert.match(js,/active='all'/);
  assert.match(js,/ALL ACTIVE STUDENTS/);
  assert.match(js,/data-session-id/);
});
