import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require=createRequire(import.meta.url);
const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');

test('Sentence Runner 2.5 defines three visibly different route zones',()=>{
  const layout=require('../sentence-runner-layout.js');
  assert.equal(layout.zoneForProgress(0.05).id,'market');
  assert.equal(layout.zoneForProgress(0.45).id,'rooftops');
  assert.equal(layout.zoneForProgress(0.82).id,'promenade');

  const market=layout.zoneForProgress(0.05);
  const rooftops=layout.zoneForProgress(0.45);
  const promenade=layout.zoneForProgress(0.82);

  assert.equal(market.elevation,0);
  assert.ok(rooftops.elevation>=3.5,'rooftop route must be physically elevated');
  assert.equal(promenade.elevation,0);
  assert.notEqual(market.laneSpacing,rooftops.laneSpacing);
  assert.notEqual(rooftops.laneSpacing,promenade.laneSpacing);
});

test('Sentence Runner reduces any answer bank to three readable lane choices with one correct answer',()=>{
  const layout=require('../sentence-runner-layout.js');
  const source=[
    {value:'has been studying',correct:true},
    {value:'studied',correct:false},
    {value:'is studying',correct:false},
    {value:'has studied',correct:false},
    {value:'will study',correct:false}
  ];
  const choices=layout.buildLaneChoices(source,()=>0.37);
  assert.equal(choices.length,3);
  assert.equal(choices.filter(x=>x.correct).length,1);
  assert.equal(new Set(choices.map(x=>x.value)).size,3);
  assert.ok(choices.some(x=>x.value==='has been studying'));
});

test('longer sentence choices receive at least as much reading lead as short choices',()=>{
  const layout=require('../sentence-runner-layout.js');
  const shortLead=layout.readingLeadSeconds(['went','go','gone'],'medium');
  const longLead=layout.readingLeadSeconds([
    'has been working',
    'had already finished',
    'will have been studying'
  ],'medium');
  assert.ok(shortLead>=2.4);
  assert.ok(longLead>=shortLead);
  assert.ok(longLead<=5.5);
});

test('Sentence Runner 2.5 world contains market, rooftop and promenade builders',()=>{
  const world=readFileSync(join(root,'sentence-runner-world.mjs'),'utf8');
  assert.match(world,/function createMarketSegment\(/);
  assert.match(world,/function createRooftopSegment\(/);
  assert.match(world,/function createPromenadeSegment\(/);
  assert.match(world,/export function buildSentenceRunnerWorld\(/);
});

test('Level 2 uses large HUD choices and a dedicated world instead of in-world sentence text cards',()=>{
  const html=readFileSync(join(root,'index.html'),'utf8');
  const css=readFileSync(join(root,'styles.css'),'utf8');
  const game=readFileSync(join(root,'prototype.js'),'utf8');

  assert.match(html,/id="sentenceChoices"/);
  assert.match(css,/\.sentence-choices/);
  assert.match(css,/\.sentence-choice/);
  assert.match(game,/buildSentenceRunnerWorld/);
  assert.match(game,/function renderSentenceLaneChoices\(/);
  assert.match(game,/function setSentenceRunnerZone\(/);
  assert.match(game,/routeBaseY/);
  assert.match(game,/currentLevel===2[\s\S]*?spawnSentenceLaneBeacon/);
});

test('Sentence Runner replaces the near Level 1 corridor instead of layering over it',()=>{
  const game=readFileSync(join(root,'prototype.js'),'utf8');
  assert.match(game,/if\(currentLevel!==2\)[\s\S]*?world\.visible=true[\s\S]*?sentenceRunnerWorld\.setVisible\(false\)/);
  assert.match(game,/currentLevel===2[\s\S]*?world\.visible=false[\s\S]*?sentenceRunnerWorld\.setVisible\(true\)/);
});

test('Level 1 remains on the original coastal world path',()=>{
  const game=readFileSync(join(root,'prototype.js'),'utf8');
  assert.match(game,/if\(currentLevel!==2\)[\s\S]*?sentenceRunnerWorld\.setVisible\(false\)/);
  assert.match(game,/const lanes=\[-3,0,3\]/);
});
