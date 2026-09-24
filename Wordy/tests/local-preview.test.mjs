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

test('development controls are mounted on local or GitHub Codespaces preview hosts',()=>{
  assert.match(app,/localhost/);
  assert.match(app,/127\.0\.0\.1/);
  assert.match(app,/app\.github\.dev/);
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

test('local preview server defaults to loopback unless a development host is explicitly supplied',()=>{
  assert.match(preview,/WORDY_PREVIEW_HOST/);
  assert.match(preview,/127\.0\.0\.1/);
  assert.match(preview,/server\.listen\(port,host/);
});


test('Codespaces preview can bind externally while local default stays loopback-only',()=>{
  assert.match(preview,/WORDY_PREVIEW_HOST/);
  assert.match(preview,/\|\|'127\.0\.0\.1'/);
});

test('production packaging includes Wordy without depending on the local preview server',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/cloudflare-pages-main.yml',import.meta.url),'utf8');
  const copyCommands=workflow.match(/cp -R[^\n]*/g)??[];
  assert.ok(copyCommands.length>=2);
  assert.ok(copyCommands.every(command=>/\bWordy\b/.test(command)));
  assert.doesNotMatch(workflow,/preview-local\.mjs/);
});
