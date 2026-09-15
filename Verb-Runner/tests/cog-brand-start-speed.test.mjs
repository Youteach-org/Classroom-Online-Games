import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const html=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'styles.css'),'utf8');
const game=readFileSync(join(root,'prototype.js'),'utf8');

test('COG mark and exact concept credit are present without claiming development authorship',()=>{
  assert.match(html,/class="cog-mark"/);
  assert.match(html,/Concept by\s*<a[^>]+href="mailto:youteach\.tk@gmail\.com"[^>]*>YouTeach<\/a>\s*by Armando Anota/);
  assert.doesNotMatch(html,/Created by|Developed by|Programmed by/i);
  assert.match(css,/\.cog-mark\{/);
});

test('start menu exposes the same 60-165 speed control as pause settings',()=>{
  assert.match(html,/id="startingSpeedControl"[^>]+min="60"[^>]+max="165"[^>]+step="5"[^>]+value="100"/);
  assert.match(html,/id="startingSpeedValue">100%<\/b>/);
  assert.match(html,/id="speedControl"[^>]+min="60"[^>]+max="165"/);
});

test('changing speed synchronizes start and pause controls',()=>{
  assert.match(game,/const startingSpeedControl=document\.querySelector\('#startingSpeedControl'\)/);
  assert.match(game,/const startingSpeedValue=document\.querySelector\('#startingSpeedValue'\)/);
  const setterStart=game.indexOf('function setPlayerSpeedPercent');
  const setterEnd=game.indexOf('\n}\n',setterStart)+3;
  const setter=game.slice(setterStart,setterEnd);
  assert.match(setter,/startingSpeedControl\.value=String\(percent\)/);
  assert.match(setter,/startingSpeedValue\.textContent=percent\+'%'/);
  assert.match(game,/startingSpeedControl\?\.addEventListener\('input',\(\)=>setPlayerSpeedPercent\(startingSpeedControl\.value\)\)/);
});

test('starting speed remains a multiplier while momentum continues to modify target speed',()=>{
  assert.match(game,/playerSpeedMultiplier=percent\/100/);
  assert.match(game,/const momentumBoost=[\s\S]*?runState\?\.momentum/);
  assert.match(game,/const baseTarget=[\s\S]*?\*momentumBoost[\s\S]*?\*playerSpeedMultiplier/);
});
