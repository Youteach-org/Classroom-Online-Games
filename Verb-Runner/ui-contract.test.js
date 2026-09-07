const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('./index.html','utf8');

test('temporary direct entry uses a player name field instead of YouTeach gating', () => {
  assert.match(html, /id="playerName"/);
  assert.match(html, /id="enterGameBtn"/);
  assert.doesNotMatch(html, /Waiting for YouTeach|Open Verb Runner from your YouTeach/i);
});

test('Level 1 loads academic core, runner core, Phaser, and app scripts', () => {
  for (const file of ['verb-bank.js','challenge-core.js','game-core.js','runner-core.js','phaser-runner.js','app.js']) assert.match(html, new RegExp(file.replace('.','\\.')));
  assert.match(html, /phaser(?:\.min)?\.js/i);
});
