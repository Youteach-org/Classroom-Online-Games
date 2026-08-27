const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

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
