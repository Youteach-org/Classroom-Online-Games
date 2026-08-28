const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const teacherCss = fs.readFileSync(path.join(__dirname, '..', 'teacher-v21.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('mobile shows complete story artwork', () => {
  assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.story-image\{[^}]*object-fit:contain/);
});

test('expression radios use fixed mobile-safe geometry', () => {
  assert.match(css, /\.expressions button:before\{[^}]*width:22px[^}]*height:22px/);
  assert.match(css, /\.expressions button\{[^}]*padding-left:52px/);
});

test('mobile coach reserves the action-button area', () => {
  assert.match(css, /\.feedback\{[^}]*bottom:calc\(92px \+ env\(safe-area-inset-bottom\)\)/);
});

test('student menu action is in the bottom bar and never floats over content', () => {
  assert.match(html, /<div class="bottombar">\s*<button id="studentMenuBtn"/);
  assert.ok(css.lastIndexOf('.student-menu-btn{position:static')>css.lastIndexOf('.student-menu-btn{position:absolute'));
});

test('focused teacher view keeps compact thumbnails in two columns', () => {
  assert.match(teacherCss, /\.thumbnail-rail\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(teacherCss, /\.thumbnail-rail \.live-grid\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(teacherCss, /\.thumbnail-rail\{[^}]*max-height:calc\(100vh/);
});

test('mobile navigation and coach controls share a dedicated top row', () => {
  assert.match(html, /class="mobile-controlbar"[\s\S]*id="mobileStudentMenuBtn"[\s\S]*id="mobileCoachToggle"/);
  assert.match(css, /@media\(max-width:900px\)[\s\S]*\.mobile-controlbar\{display:flex[^}]*justify-content:space-between/);
});

test('desktop zoom-out cards use the same compact geometry as focus thumbnails', () => {
  assert.match(teacherCss, /\.grid \.student-card,\.thumbnail-rail \.student-card\{/);
  assert.match(teacherCss, /\.grid\{[^}]*grid-template-columns:repeat\(auto-fill,minmax\(300px,1fr\)\)/);
});
