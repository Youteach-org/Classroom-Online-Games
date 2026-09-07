const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('approved runner selection view is the first interactive screen', () => {
  const html = read('index.html');
  assert.match(html, /id="characterScreen"[^>]*class="[^"]*screen-active/);
  assert.match(html, /id="playerName"/);
  assert.match(html, /id="characterGrid"/);
  assert.match(html, /START RUN/i);
});

test('desktop gameplay HUD uses floating compact modules instead of stacked full-width rows', () => {
  const html = read('index.html');
  assert.match(html, /class="hud-pause"/);
  assert.match(html, /class="hud-prompt/);
  assert.match(html, /class="hud-momentum/);
  assert.match(html, /class="hud-timer/);
  assert.match(html, /class="hud-streak/);
  assert.doesNotMatch(html, /hud-row-top/);
  assert.doesNotMatch(html, /hud-row-bottom/);
});

test('mobile view exposes dedicated touch controls matching the approved layout', () => {
  const html = read('index.html');
  assert.match(html, /class="mobile-controls"/);
  assert.match(html, /data-action="left"/);
  assert.match(html, /data-action="jump"/);
  assert.match(html, /data-action="right"/);
  assert.match(html, /data-action="slide"/);
});

test('approved visual styling keeps the road dominant and the HUD compact', () => {
  const css = read('styles.css') + '\n' + read('desktop.css');
  assert.match(css, /\.game-hud\s*\{[^}]*position:\s*absolute/);
  assert.match(css, /\.hud-prompt\s*\{/);
  assert.match(css, /\.runner-art\s*\{/);
  assert.match(css, /\.mobile-controls\s*\{/);
});
