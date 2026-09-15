import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'styles.css'),'utf8');
const coastal=readFileSync(join(root,'coastal-world.mjs'),'utf8');

test('gameplay no longer shows the bottom movement instruction strip',()=>{
  assert.doesNotMatch(html,/<div class="controls">[\s\S]*?← → lanes[\s\S]*?<\/div>/);
  assert.match(html,/id="controlsPanel"/,'pause menu controls must remain available');
});

test('momentum lives in the top-left HUD cluster instead of the bottom status stack',()=>{
  const leftStart=html.indexOf('<div class="hud-left">');
  const centerStart=html.indexOf('<div class="hud-center"');
  const momentum=html.indexOf('class="momentum-panel"');
  assert.ok(leftStart>=0&&centerStart>leftStart);
  assert.ok(momentum>leftStart&&momentum<centerStart,'Momentum should be inside the top-left HUD cluster');
  assert.match(css,/\.momentum-panel\{[\s\S]*?width:min\(170px,32vw\)/);
});

test('Mediterranean village stays lightweight on mobile while recycling without a long empty sector',()=>{
  assert.match(coastal,/const VILLAGE_BUILDING_SPACING=12;/);
  assert.match(coastal,/const buildingCount=isMobile\?10:15;/);
  assert.match(coastal,/const villageSpan=buildingCount\*VILLAGE_BUILDING_SPACING;/);
  assert.match(coastal,/registerMover\(building,\{speedFactor:\.90,span:villageSpan/);
  assert.match(coastal,/registerMover\(pot,\{speedFactor:\.98,span:villageSpan/);
  assert.match(coastal,/registerMover\(lamp,\{speedFactor:\.98,span:villageSpan/);
  assert.doesNotMatch(coastal,/Math\.ceil\(NEAR_SPAN\/VILLAGE_BUILDING_SPACING\)/);
});
