const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

test('temporary direct entry uses a player name field on runner select instead of YouTeach gating', () => {
  assert.match(html, /id="playerName"/);
  assert.match(html, /id="startRunnerBtn"/);
  assert.match(html, /id="characterGrid"/);
  assert.doesNotMatch(html, /Waiting for YouTeach|Open Verb Runner from your YouTeach/i);
});

test('Level 1 loads academic core, runner art, runner core, Phaser, and app scripts', () => {
  for (const file of ['runner-art.js','verb-bank.js','challenge-core.js','game-core.js','runner-core.js','phaser-runner.js','app.js']) assert.match(html, new RegExp(file.replace('.','\\.')));
  assert.match(html, /phaser(?:\.min)?\.js/i);
});
