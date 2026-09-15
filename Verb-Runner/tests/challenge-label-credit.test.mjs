import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'styles.css'),'utf8');

test('CHALLENGE label sits outside the blue challenge panel',()=>{
  const hudStart=html.indexOf('<header class="hud">');
  const hudEnd=html.indexOf('</header>',hudStart);
  const hud=html.slice(hudStart,hudEnd);
  const label=hud.indexOf('class="challenge-label"');
  const panel=hud.indexOf('class="hud-center"');
  const oldInside=hud.indexOf('class="challenge-top"');
  assert.ok(label>=0,'external challenge label must exist');
  assert.ok(panel>label,'label must come before the challenge panel');
  assert.equal(oldInside,-1,'old in-panel challenge header must be removed');
});

test('concept credit lives on the gameplay layer at bottom-left, not inside the picker',()=>{
  const pickerStart=html.indexOf('<section id="picker"');
  const pickerEnd=html.indexOf('</section>',pickerStart);
  const picker=html.slice(pickerStart,pickerEnd);
  assert.doesNotMatch(picker,/Concept by/);
  assert.match(html,/class="game-concept-credit"/);
  assert.match(html,/Concept by\s*<a[^>]+mailto:youteach\.tk@gmail\.com[^>]*>YouTeach<\/a>\s*by Armando Anota/);
  assert.match(css,/\.game-concept-credit\{[\s\S]*?left:/);
  assert.match(css,/\.game-concept-credit\{[\s\S]*?bottom:/);
});

test('challenge panel uses its vertical space for the verb forms',()=>{
  assert.match(css,/\/\* Compact external challenge label \*\//);
  assert.match(css,/\.hud-center\{[\s\S]*?padding-top:/);
  assert.match(css,/\.principal-parts\{[\s\S]*?min-height:/);
});
