import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const wordyHtml=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const rootHtml=readFileSync(new URL('../../index.html',import.meta.url),'utf8');

test('Wordy entry point loads the controller module',()=>{
  assert.match(wordyHtml,/type="module"\s+src="\.\/app\.mjs"/);
});

test('COG landing page exposes the Wordy prototype route',()=>{
  assert.match(rootHtml,/href="\/Wordy\/"/);
  assert.match(rootHtml,/Wordy Prototype/);
});


test('browser app records abandonment on pagehide',()=>{
  const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
  assert.match(app,/addEventListener\('pagehide'/);
  assert.match(app,/controller\.abandon\(\)/);
});


test('browser app plays resolution timeline before revealing final result',()=>{
  const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
  assert.match(app,/playResolutionTimeline/);
  assert.match(app,/timelinePlaying/);
  assert.match(app,/await\s+playResolutionTimeline/);
});


test('Cloudflare production build includes the Wordy static route',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/cloudflare-pages-main.yml',import.meta.url),'utf8');
  const copyCommands=workflow.match(/cp -R[^\n]*/g)??[];
  assert.ok(copyCommands.length>=2,'expected both local and pinned production copy commands');
  assert.ok(copyCommands.every(command=>/\bWordy\b/.test(command)),'every production copy command must include Wordy');
});
