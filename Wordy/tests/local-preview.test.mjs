import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const preview=readFileSync(new URL('../preview-local.mjs',import.meta.url),'utf8');

test('local preview can start directly on a requested validation level',()=>{
  assert.match(app,/new URLSearchParams\(window\.location\.search\)/);
  assert.match(app,/get\(['"]level['"]\)/);
  assert.match(app,/initialLevelId\s*:\s*requestedLevelId/);
  assert.match(app,/LEVELS\.some\(/);
});

test('development controls are mounted only on loopback hosts',()=>{
  assert.match(app,/localhost/);
  assert.match(app,/127\.0\.0\.1/);
  assert.match(app,/isLocalPreview/);
  assert.match(app,/wordy-devbar/);
});

test('development controls expose A-G level selection and restart without changing game rules',()=>{
  assert.match(app,/LEVELS\.forEach/);
  assert.match(app,/controller\.replay\(\)/);
  assert.match(app,/URLSearchParams/);
  assert.match(css,/\.wordy-devbar/);
  assert.match(css,/\.wordy-devbar\s+select/);
});

test('local preview server remains loopback-only and never binds publicly',()=>{
  assert.match(preview,/server\.listen\(port,['"]127\.0\.0\.1['"]/);
  assert.doesNotMatch(preview,/0\.0\.0\.0/);
});
