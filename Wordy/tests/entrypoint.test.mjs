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
