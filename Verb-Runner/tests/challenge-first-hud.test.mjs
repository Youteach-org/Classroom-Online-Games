import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const css=readFileSync(join(root,'styles.css'),'utf8');

test('challenge HUD always gets its own full-width row below all secondary controls',()=>{
  const marker=css.indexOf('/* Challenge-first HUD hierarchy */');
  assert.ok(marker>=0,'challenge-first HUD override must exist');
  const tail=css.slice(marker);
  assert.match(tail,/\.hud\s*\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto;[\s\S]*?grid-template-areas:"left right" "center center";/);
  assert.match(tail,/\.hud-left\s*\{[\s\S]*?grid-area:left/);
  assert.match(tail,/\.hud-right\s*\{[\s\S]*?grid-area:right/);
  assert.match(tail,/\.hud-center\s*\{[\s\S]*?grid-area:center;[\s\S]*?width:100%;[\s\S]*?max-width:none;/);
});

test('momentum stays in the upper controls row, never inside the challenge box',()=>{
  assert.match(css,/\.hud-left[\s\S]*?\.momentum-panel/);
  const marker=css.indexOf('/* Challenge-first HUD hierarchy */');
  const tail=css.slice(marker);
  assert.match(tail,/\.hud-left\s*\{[\s\S]*?display:flex/);
  assert.match(tail,/\.hud-center\s*\{/);
});

test('mobile challenge still spans the complete safe width',()=>{
  const marker=css.indexOf('/* Challenge-first HUD hierarchy */');
  const tail=css.slice(marker);
  assert.match(tail,/@media\s*\(max-width:640px\)[\s\S]*?\.hud-center\s*\{[\s\S]*?width:100%/);
});
