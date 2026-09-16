import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'styles.css'),'utf8';

test('game uses the approved COG PNG asset instead of the placeholder SVG',()=>{
  assert.match(html,/class="cog-mark"[\s\S]*?<img[^>]+class="cog-logo-image"[^>]+src="\.\/assets\/cog-logo\.png"/);
  assert.doesNotMatch(html,/class="cog-rings"/);
  assert.doesNotMatch(html,/class="cog-teeth"/);
  assert.doesNotMatch(html,/<text[^>]*>C<\/text>[\s\S]*<text[^>]*>O<\/text>[\s\S]*<text[^>]*>G<\/text>/);
});

test('COG logo is clearly visible but still discreet',()=>{
  const mark=css.match(/\.cog-mark\s*\{([\s\S]*?)\}/);
  assert.ok(mark);
  assert.match(mark[1],/opacity:\s*(?:0?\.9|1)/);
  assert.match(css,/\.cog-logo-image\s*\{[\s\S]*?width:100%;[\s\S]*?height:auto;/);
});

test('concept credit has a visible treatment rather than washed-out text',()=>{
  const credit=css.match(/\.game-concept-credit\s*\{([\s\S]*?)\}/);
  assert.ok(credit);
  assert.match(credit[1],/background:/);
  assert.match(credit[1],/color:\s*#fff|color:\s*rgba\(255,255,255,/);
  assert.match(credit[1],/padding:/);
  assert.match(credit[1],/border-radius:/);
});
