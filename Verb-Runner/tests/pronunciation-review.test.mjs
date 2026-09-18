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
  assert.match(css,/\.listen-row\{display:grid;grid-template-columns:minmax\(0,1fr\) auto auto auto/);
  assert.match(css,/\.listen-row button\{padding:5px 6px;font-size:11px;white-space:nowrap;min-width:0\}/);
  assert.doesNotMatch(css,/\.listen-row\{[^}]*flex-wrap:wrap/);
});


test('audio name has visual priority and small metadata sits below controls',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const css=readFileSync(join(reviewRoot,'review.css'),'utf8');
  const render=readFileSync(join(reviewRoot,'review-render.js'),'utf8');
  assert.match(html,/class="key-line"[\s\S]*class="audio-key"[\s\S]*class="listen-row"[\s\S]*class="detail-row"[\s\S]*class="metadata"[\s\S]*class="source"/);
  assert.doesNotMatch(html,/class="key-line"[\s\S]{0,250}class="metadata"/);
  assert.match(css,/\.audio-key\{[^}]*white-space:normal[^}]*text-overflow:clip/);
  assert.match(css,/\.detail-row\{[^}]*font-size:9px[^}]*overflow:hidden/);
  assert.match(css,/\.metadata\{[^}]*text-overflow:ellipsis/);
  assert.match(css,/\.source\{[^}]*text-overflow:ellipsis/);
  assert.match(render,/sourceNode\.title=entry\.src/);
});


test('review status badge toggles one hidden reports and history panel',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const events=readFileSync(join(reviewRoot,'review-events.js'),'utf8');
  assert.match(html,/class="status-badge"[^>]*data-action="toggle-history"/);
  assert.match(html,/class="review-history-panel panel" hidden/);
  assert.match(html,/Previous reports/);
  assert.match(html,/Review history/);
  assert.match(events,/action==='toggle-history'/);
  assert.doesNotMatch(html,/<details class="reports-section"/);
  assert.doesNotMatch(html,/<details class="history-section"/);
});

test('mobile review row is constrained to the card width',()=>{
  const css=readFileSync(join(reviewRoot,'review.css'),'utf8');
  assert.match(css,/\.audio-card\{[^}]*min-width:0[^}]*overflow:hidden/);
  assert.match(css,/\.listen-row\{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*width:100%[^}]*min-width:0/);
  assert.match(css,/\.listen-row audio\{[^}]*max-width:100%[^}]*min-width:0/);
  assert.match(css,/@media\(max-width:680px\)[\s\S]*\.listen-row\{grid-template-columns:minmax\(0,1fr\) auto auto auto/);
});


test('Firebase autosave rerender preserves review position and open panels',()=>{
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');
  assert.match(app,/function captureViewState\(\)/);
  assert.match(app,/scrollY:window\.scrollY/);
  assert.match(app,/function restoreViewState\(state\)/);
  assert.match(app,/window\.scrollTo\(\{top:state\.scrollY,left:0,behavior:'instant'\}\)/);
  assert.match(app,/const state=captureViewState\(\);[\s\S]*render\(state\)/);
  assert.match(app,/\.report-panel','\.duplicate-panel','\.review-history-panel'/);
});


test('duplicated audio records the original by numbered reference',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const events=readFileSync(join(reviewRoot,'review-events.js'),'utf8');
  const render=readFileSync(join(reviewRoot,'review-render.js'),'utf8');
  const coreFile=readFileSync(join(reviewRoot,'review-core.js'),'utf8');
  const exp=readFileSync(join(reviewRoot,'review-export.js'),'utf8');

  assert.match(html,/Original audio #/);
  assert.match(html,/class="duplicate-target-ref" type="number"/);
  assert.match(html,/class="duplicate-match"/);
  assert.doesNotMatch(html,/Same as \/ original/);
  assert.match(app,/getEntryByNumber/);
  assert.match(events,/updateDuplicateMatch/);
  assert.match(events,/getEntryByNumber\(value\)/);
  assert.match(events,/Enter the number of the original audio first/);
  assert.match(actions,/duplicateOfRef=canonical\.n/);
  assert.match(actions,/duplicateOfRef,/);
  assert.match(coreFile,/duplicateOfRef:Number\(record\.duplicateOfRef\)\|\|null/);
  assert.match(render,/Duplicate of #/);
  assert.match(exp,/Duplicate of: #/);
});


test('duplicated action removes the redundant asset from active review immediately',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const events=readFileSync(join(reviewRoot,'review-events.js'),'utf8');
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');

  assert.match(html,/>Remove duplicate<\/button>/);
  assert.doesNotMatch(html,/Queue duplicate for deletion/);
  assert.doesNotMatch(html,/data-action="remove-duplicate"/);
  assert.match(actions,/status:'removed-duplicate'/);
  assert.match(actions,/removedAsDuplicate:true/);
  assert.match(actions,/cleanupRequested:true/);
  assert.match(actions,/duplicate-cleanup-requested/);
  assert.doesNotMatch(actions,/export async function removeDuplicate/);
  assert.doesNotMatch(events,/action==='remove-duplicate'/);
  assert.match(app,/filter==='all'&&entry\.status==='removed-duplicate'/);
});

test('repository duplicate cleanup reuses the original asset and deletes redundant WAVs',()=>{
  const generator=readFileSync(join(root,'scripts','generate-pronunciation.py'),'utf8');
  const cleanup=readFileSync(join(root,'scripts','apply-pronunciation-duplicates.py'),'utf8');
  const workflow=readFileSync(join(root,'..','.github','workflows','pronunciation-review-backup.yml'),'utf8');
  const aliases=JSON.parse(readFileSync(join(root,'pronunciation-aliases.json'),'utf8'));

  assert.equal(typeof aliases,'object');
  for(const [duplicate,original] of Object.entries(aliases)){
    assert.ok(duplicate);
    assert.ok(original);
    assert.notEqual(duplicate,original);
  }
  assert.match(generator,/load_pronunciation_aliases/);
  assert.match(generator,/resolve_alias/);
  assert.match(generator,/aliases/);
  assert.match(cleanup,/cleanupRequested/);
  assert.match(cleanup,/duplicateOf/);
  assert.match(cleanup,/pronunciation-aliases\.json/);
  assert.match(workflow,/cron: "\*\/5 \* \* \* \*"/);
  assert.match(workflow,/apply-pronunciation-duplicates\.py/);
  assert.match(workflow,/generate-pronunciation\.py/);
  assert.match(workflow,/Verb-Runner\/pronunciation-aliases\.json/);
  assert.match(workflow,/Verb-Runner\/audio\/pronunciation/);
});


test('validated-correct pronunciation questions are resolved persistently',()=>{
  const validator=readFileSync(join(root,'scripts','apply-pronunciation-validation-decisions.py'),'utf8');
  const workflow=readFileSync(join(root,'..','.github','workflows','pronunciation-review-backup.yml'),'utf8');
  assert.match(validator,/excluded_as_correct/);
  assert.match(validator,/question-validated-correct/);
  assert.match(validator,/validationDecision/);
  assert.match(validator,/status.*reviewed/s);
  assert.match(workflow,/apply-pronunciation-validation-decisions\.py/);
  assert.match(workflow,/pronunciation-validation-firebase-patch\.json/);
});


test('Review Again filter shows only audios whose source changed after review',()=>{
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');
  assert.match(html,/<option value="review-again">Review Again<\/option>/);
  assert.match(app,/filter==='review-again'&&!entry\.sourceChanged/);
  assert.match(app,/filter!=='all'&&filter!=='review-again'&&entry\.status!==filter/);
});

test('new audio source gets a fresh autosave report id and does not reuse the prior report',()=>{
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const render=readFileSync(join(reviewRoot,'review-render.js'),'utf8');
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  assert.match(actions,/function autosaveReportId\(by,src\)/);
  assert.match(actions,/autosaveReportId\(by,entry\.src\)/);
  assert.match(render,/report\.assetSource===entry\.src/);
  assert.match(html,/pronunciation-manifest\.js\?v=review-console-20260916-3/);
});

test('changed pronunciation source is review-again instead of inheriting stale needs-fix status',()=>{
  const core=require(join(reviewRoot,'review-core.js'));
  const manifest={ask:'./audio/new-ask.wav'};
  const id=core.audioIdForKey('ask');
  const catalog=core.mergeCatalog(manifest,{
    [id]:{source:'./audio/old-ask.wav',status:'needs-fix'}
  });
  assert.equal(catalog[0].sourceChanged,true);
  assert.equal(catalog[0].status,'review-again');
  const render=readFileSync(join(reviewRoot,'review-render.js'),'utf8');
  assert.match(render,/'review-again':'REVIEW AGAIN'/);
});

test('reported state drives the repair-review loop',()=>{
  const core=require(join(reviewRoot,'review-core.js'));
  const actions=readFileSync(join(reviewRoot,'review-actions.js'),'utf8');
  const html=readFileSync(join(reviewRoot,'index.html'),'utf8');
  const app=readFileSync(join(reviewRoot,'review-app.js'),'utf8');
  assert.match(actions,/status:'reported'/);
  assert.match(html,/<option value="reported">Reported<\/option>/);
  assert.match(app,/Reported \$\{catalog\.filter\(x=>x\.status==='reported'\)\.length\}/);
  assert.equal(core.normalizeStatus({status:'needs-fix'}),'reported');
  const id=core.audioIdForKey('stop');
  assert.equal(core.mergeCatalog({stop:'new.wav'},{[id]:{source:'old.wav',status:'reported'}})[0].status,'review-again');
});
