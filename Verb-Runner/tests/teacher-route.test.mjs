import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');

test('Verb Runner Teacher Monitor has a directory route that Cloudflare can serve reliably',()=>{
  const route=join(root,'teacher','index.html');
  assert.equal(existsSync(route),true);
  const html=readFileSync(route,'utf8');
  assert.match(html,/VERB RUNNER/);
  assert.match(html,/Teacher Monitor/);
  assert.match(html,/\.\.\/teacher\.css/);
  assert.match(html,/\.\.\/teacher\.js/);
});

test('Teacher menu links to the directory monitor route, not teacher.html',()=>{
  const menu=readFileSync(join(root,'..','teacher','index.html'),'utf8');
  assert.match(menu,/href="\/Verb-Runner\/teacher\/"/);
  assert.doesNotMatch(menu,/href="\/Verb-Runner\/teacher\.html"/);
});
