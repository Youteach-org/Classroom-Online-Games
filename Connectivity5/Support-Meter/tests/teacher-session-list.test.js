const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
const js=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
const cssPath=path.join(root,'teacher-v28.css');
const css=fs.existsSync(cssPath)?fs.readFileSync(cssPath,'utf8'):'';
const student=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('student and teacher pages share version 28',()=>{
  assert.match(student,/aria-label="Version 28">v28/);
  assert.match(html,/aria-label="Version 28">v28/);
});

test('teacher uses a permanent compact session list instead of a dropdown',()=>{
  assert.match(html,/id="sessionList"/);
  assert.doesNotMatch(html,/id="sessionSelect"/);
  assert.match(css,/\.session-list\{[^}]*display:flex/);
  assert.match(css,/\.assignment-panel \.session-card\{[^}]*min-height:3[2-6]px/);
});

test('compact teacher header remains visible while student cards scroll',()=>{
  assert.match(css,/\.teacher-header\{[^}]*position:sticky/);
  assert.match(css,/\.teacher-header\{[^}]*top:0/);
  assert.match(css,/\.teacher-header\{[^}]*z-index:/);
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
  assert.match(js,/scrollIntoView\(\{block:'nearest',inline:'nearest'/);
});
