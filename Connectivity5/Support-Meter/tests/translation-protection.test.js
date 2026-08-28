const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const teacher=fs.readFileSync(path.join(root,'teacher.js'),'utf8');

test('student page opts out of automatic translation',()=>{
  assert.match(html,/<html[^>]*lang="en"[^>]*translate="no"[^>]*class="notranslate"/);
  assert.match(html,/<meta name="google" content="notranslate">/);
  assert.match(html,/id="translationDialog"/);
});

test('translation detection blocks the activity and reports it live',()=>{
  assert.match(game,/new MutationObserver/);
  assert.match(game,/Translation attempt detected/);
  assert.match(game,/translationAttemptCount/);
});

test('teacher monitor displays a translation warning',()=>{
  assert.match(teacher,/translationAttemptCount[\s\S]*TRANSLATION/);
});
