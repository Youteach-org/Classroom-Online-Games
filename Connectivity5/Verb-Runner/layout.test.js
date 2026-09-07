const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const studentPath = path.join(__dirname, 'index.html');
const teacherPath = path.join(__dirname, 'teacher.html');
const rootMenuPath = path.join(repoRoot, 'index.html');
const teacherMenuPath = path.join(repoRoot, 'teacher', 'index.html');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Verb Runner student and teacher routes exist', () => {
  assert.equal(fs.existsSync(studentPath), true, 'student index.html should exist');
  assert.equal(fs.existsSync(teacherPath), true, 'teacher.html should exist');
});

test('Verb Runner page shells expose their root containers', () => {
  assert.match(read(studentPath), /id=["']verbRunnerApp["']/);
  assert.match(read(teacherPath), /id=["']studentGrid["']/);
});

test('COG menus link to Verb Runner', () => {
  assert.match(read(rootMenuPath), /\/Connectivity5\/Verb-Runner\//);
  assert.match(read(teacherMenuPath), /\/Connectivity5\/Verb-Runner\/teacher\//);
});
