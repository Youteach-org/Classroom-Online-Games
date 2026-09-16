import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const reviewRoot=join(root,'pronunciation-review');
const require=createRequire(import.meta.url);

test('pronunciation review console ships as part of Verb Runner',()=>{
  for(const name of ['index.html','review.css','review-core.js','firebase-store.js','review-actions.js','review-render.js','review-events.js','review-export.js','review-app.js']){
    assert.equal(existsSync(join(reviewRoot,name)),true,name+' should exist');
  }
});

test('review core creates safe stable audio ids and detects repeated reports',()=>{
  const core=require(join(reviewRoot,'review-core.js'));
  const id1=core.audioIdForKey('was / were');
  const id2=core.audioIdForKey('was / were');
  assert.equal(id1,id2);
  assert.match(id1,/^[a-z0-9-]+$/);
  assert.equal(core.reportFingerprint('  Sounds   WRONG '),core.reportFingerprint('sounds wrong'));
  assert.equal(core.hasDuplicateReport({
    a:{text:'Sounds wrong',status:'open'}
  },' sounds  wrong '),true);
  assert.equal(core.hasDuplicateReport({
    a:{text:'Sounds wrong',status:'deleted'}
  },'sounds wrong'),false);
});

test('legacy asset metadata uses the original Bella generation timestamp',()=>{
  const core=require(join(reviewRoot,'review-core.js'));
  const stamp=core.inferAssetCreatedAt('ate','./audio/pronunciation/ate-189b7ea01f.wav');
  assert.equal(new Date(stamp).toISOString(),'2026-09-15T17:41:02.000Z');
});

test('review UI persists audit metadata and duplicate workflow in Firebase',()=>{
  const store=readFileSync(join(reviewRoot,'firebase-store.js'),'utf8');
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const combined=store+'\n'+actions;
  assert.match(store,/classroomGames\/verbRunnerV2\/pronunciationReview/);
  assert.match(combined,/reviewedBy/);
  assert.match(combined,/reviewedAt/);
  assert.match(combined,/assetCreatedAt/);
  assert.match(combined,/reports/);
  assert.match(combined,/history/);
  assert.match(combined,/duplicateOf/);
  assert.match(combined,/removedAsDuplicate/);
  assert.match(actions,/hasDuplicateReport/);
});

test('review UI keeps prior reports and allows deleting repeated report entries',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const events=readFileSync(join(reviewRoot,'review-events.js'),'utf8');
  assert.match(html,/Previous reports/i);
  assert.match(actions,/deleteReport/);
  assert.match(actions,/resolveReport/);
  assert.match(actions,/markDuplicate/);
  assert.match(actions,/removeDuplicate/);
  assert.match(events,/delete-report/);
});

test('teacher menu links to pronunciation review console',()=>{
  const teacher=readFileSync(join(root,'..','teacher','index.html'),'utf8');
  assert.match(teacher,/\/Verb-Runner\/pronunciation-review\//);
});

test('Bella/Kokoro correction profile is locked to the original bank settings',()=>{
  const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');
  const policy=readFileSync(join(root,'..','docs','superpowers','decisions','2026-09-15-verb-runner-pronunciation-policy.md'),'utf8');
  assert.match(generator,/VOICE\s*=\s*['"]af_bella['"]/);
  assert.match(generator,/SPEED\s*=\s*0\.8/);
  assert.match(generator,/SAMPLE_RATE\s*=\s*24000/);
  assert.match(generator,/LEAD_SILENCE_SECONDS\s*=\s*0\.04/);
  assert.match(generator,/TAIL_SILENCE_SECONDS\s*=\s*0\.35/);
  assert.match(policy,/Kokoro.*Bella/i);
  assert.doesNotMatch(policy,/official pronunciation voice.*Nichalia/i);
});

test('GitHub backup workflow snapshots Firebase review data',()=>{
  const workflow=readFileSync(join(root,'..','.github','workflows','pronunciation-review-backup.yml'),'utf8');
  assert.match(workflow,/pronunciationReview\.json/);
  assert.match(workflow,/pronunciation-review-live-backup\.json/);
  assert.match(workflow,/schedule:/);
});


test('review console does not rebuild audio controls while one is playing',()=>{
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');
  assert.match(app,/function hasPlayingAudio\(\)/);
  assert.match(app,/function requestSafeRender\(/);
  assert.match(app,/if\(hasPlayingAudio\(\)\|\|hasActiveReportEditor\(\)\)/);
  assert.match(app,/watchRecords\([\s\S]*requestSafeRender/);
});


test('report editor is hidden until Report and autosaves without a save button',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const css=readFileSync(join(reviewRoot,'review.css'),'utf8');
  const events=readFileSync(join(reviewRoot,'review-events.js'),'utf8');
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');

  assert.match(html,/class="report-panel panel" hidden/);
  assert.match(css,/\.panel\[hidden\]\s*\{\s*display:none/);
  assert.doesNotMatch(html,/data-action="save-report"/);
  assert.match(html,/class="autosave-status"/);
  assert.match(events,/input/);
  assert.match(events,/scheduleAutosave/);
  assert.match(actions,/saveAutosaveReport/);
  assert.match(actions,/clearAutosaveReport/);
});

test('review action labels are concise and descriptive',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  assert.match(html,/>OK<\/button>/);
  assert.match(html,/>Duplicated<\/button>/);
  assert.doesNotMatch(html,/>Reviewed OK<\/button>/);
  assert.doesNotMatch(html,/>Duplicate<\/button>/);
});


test('audio review controls stay on one compact row',()=>{
  const css=readFileSync(join(reviewRoot,'review.css'),'utf8');
  assert.match(css,/\.listen-row\{display:grid;grid-template-columns:minmax\(120px,1fr\) auto auto auto/);
  assert.match(css,/\.listen-row button\{padding:6px 8px;font-size:12px;white-space:nowrap\}/);
  assert.doesNotMatch(css,/\.listen-row\{[^}]*flex-wrap:wrap/);
});


test('audio metadata stays inline with the name without crowding',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const css=readFileSync(join(reviewRoot,'review.css'),'utf8');
  const render=readFileSync(join(reviewRoot,'review-render.js'),'utf8');
  assert.match(html,/class="key-line"[\s\S]*class="audio-key"[\s\S]*class="metadata"[\s\S]*class="source"/);
  assert.match(css,/\.key-line\{[^}]*white-space:nowrap[^}]*overflow:hidden/);
  assert.match(css,/\.audio-key\{[^}]*text-overflow:ellipsis/);
  assert.match(css,/\.metadata\{[^}]*text-overflow:ellipsis/);
  assert.match(css,/\.source\{[^}]*text-overflow:ellipsis/);
  assert.match(render,/sourceNode\.title=entry\.src/);
});
