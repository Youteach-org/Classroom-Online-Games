const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const targets = [
  path.join(repoRoot, 'index.html'),
  path.join(repoRoot, 'teacher', 'index.html'),
  path.join(repoRoot, 'Support-Meter', 'index.html'),
  path.join(repoRoot, 'Support-Meter', 'config.js'),
  path.join(repoRoot, 'Support-Meter', 'game.js'),
  path.join(repoRoot, 'Support-Meter', 'teacher.js'),
  path.join(repoRoot, 'Support-Meter', 'result-certificate.js'),
  path.join(repoRoot, 'Verb-Runner', 'index.html'),
  path.join(repoRoot, 'Verb-Runner', 'teacher.html')
];

test('retired course branding and route references are absent from active game files', () => {
  for (const file of targets) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /Connectivity\s*5|Connectivity5|CONNECT5/i, file);
  }
});

test('retired course folder no longer exists', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, 'Connectivity5')), false);
});
