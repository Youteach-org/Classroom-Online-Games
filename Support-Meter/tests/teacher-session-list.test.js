const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
const js=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
const cssPath=path.join(root,'teacher-v29.css');
const css=fs.existsSync(cssPath)?fs.readFileSync(cssPath,'utf8'):'';
const student=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('student and teacher pages share version 31',()=>{
  assert.match(student,/aria-label="Version 31">v31/);
  assert.match(html,/aria-label="Version 31">v31/);
});

test('teacher uses a permanent compact session list instead of a dropdown',()=>{
  assert.match(html,/id="sessionList"/);
  assert.doesNotMatch(html,/id="sessionSelect"/);
  assert.match(css,/\.session-list\{[^}]*display:flex/);
  assert.match(css,/\.session-card\{[^}]*min-height:3[2-6]px/);
});

test('only the blue title and session ribbon remain fixed',()=>{
  assert.match(html,/class="monitor-sticky-header"[\s\S]*class="teacher-header"[\s\S]*class="session-list-wrap"[\s\S]*<\/div>\s*<section class="assignment-panel"/);
  assert.match(css,/\.monitor-sticky-header\{[^}]*position:sticky[^}]*top:0[^}]*z-index:/);
  assert.doesNotMatch(css,/\.teacher-header\{[^}]*position:sticky/);
});

test('session controls use one compact row without displaying the full student URL',()=>{
  assert.match(html,/id="copyLink"[^>]*>Copy Student Link</);
  assert.match(html,/class="statusbar"[^>]*>.*id="onlineCount".*id="hideOffline"/);
  assert.doesNotMatch(html,/<label>Student link<input/);
  assert.match(css,/\.share-box input\{display:none/);
});

test('teacher defaults to all students and filters only after a session click',()=>{
  assert.match(js,/active='all'/);
  assert.match(js,/ALL ACTIVE STUDENTS/);
  assert.match(js,/data-session-id/);
});

test('any number of sessions stays in one horizontal row and selected session remains visible',()=>{
  assert.match(css,/\.session-list\{[^}]*display:flex[^}]*overflow-x:auto[^}]*flex-wrap:nowrap/);
  assert.match(js,/scrollSelectedSessionIntoView/);
  assert.doesNotMatch(js,/scrollIntoView/);
  assert.match(js,/el\.sessions\.scrollTo\(\{left:/);
  assert.doesNotMatch(js,/function refreshSessionList\(\)[^}]*scrollSelectedSessionIntoView/);
});

test('zoom-out student cards fit more students without hiding live activity',()=>{
  assert.match(css,/\.grid\{[^}]*minmax\(260px,1fr\)/);
  assert.match(css,/\.grid \.live-grid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/\.grid \.story-summary\{[^}]*-webkit-line-clamp:1/);
});
