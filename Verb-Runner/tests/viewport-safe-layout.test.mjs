import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const css=readFileSync(join(root,'styles.css'),'utf8');

test('all overlays use the available dynamic viewport and can scroll instead of clipping controls',()=>{
  assert.match(css,/\/\* Viewport-safe overlays \*\//);
  assert.match(css,/\.picker,\s*\.pause-overlay,\s*\.result-overlay\s*\{[\s\S]*?position:fixed;[\s\S]*?height:100dvh;[\s\S]*?overflow-y:auto;/);
  assert.match(css,/\.picker-card,\s*\.pause-card,\s*\.result-card\s*\{[\s\S]*?max-height:none;[\s\S]*?overflow:visible;/);
});

test('COG mark sits above the picker overlay so it is actually visible',()=>{
  const match=css.match(/\/\* Viewport-safe overlays \*\/[\s\S]*?\.cog-mark\s*\{([\s\S]*?)\}/);
  assert.ok(match,'viewport-safe section should include a cog-mark override');
  const z=Number(match[1].match(/z-index:\s*(\d+)/)?.[1]||0);
  assert.ok(z>20,'COG mark must render above the picker overlay');
});

test('small-height landscape screens get tighter spacing instead of hidden overflow',()=>{
  assert.match(css,/@media\s*\(max-height:700px\)[\s\S]*?\.picker-card[\s\S]*?padding:/);
  assert.match(css,/@media\s*\(max-height:700px\)[\s\S]*?\.picker-speed-setting[\s\S]*?margin:/);
});
