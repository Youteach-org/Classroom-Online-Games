const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const firebase=fs.readFileSync(path.join(root,'firebase-client.js'),'utf8');
const source=fs.existsSync(path.join(root,'result-certificate.js'))?fs.readFileSync(path.join(root,'result-certificate.js'),'utf8'):'';
const sandbox={window:{}};vm.createContext(sandbox);if(source)vm.runInContext(source,sandbox);

test('student result certificate uses final verified activity values',()=>{
  const core=sandbox.window.SupportMeterResult;
  assert.ok(core,'result certificate module should exist');
  const result=core.buildResultData({studentName:'Sofía Hernández',setNumber:2,supportMeter:84,score:920,streak:5,completedAt:1788111720000,runId:'-ObcAbC7k4p9q'});
  assert.deepEqual(JSON.parse(JSON.stringify(result)),{studentName:'Sofía Hernández',setLabel:'Set 2',supportMeter:'84%',score:'920',streak:'5',completedLabel:'Aug 30, 2026 · 11:42 AM',recordCode:'SM-C7K4P9Q'});
  assert.equal(core.fileName(result),'Sofia-Hernandez-Support-Meter-Result.png');
});

test('completion screen and download are unavailable until the game finishes',()=>{
  assert.match(html,/id="resultScreen" class="result-screen hidden"/);
  assert.match(html,/id="downloadResult"[^>]*>Download Result \(PNG\)/);
  assert.match(game,/state\.completed=true[\s\S]*showFinalResult/);
  assert.match(game,/el\.downloadResult\.onclick=downloadFinalResult/);
});

test('completion time comes from Firebase server and both pages use version 30',()=>{
  assert.match(firebase,/export async function completeRun\(runId,patch\)/);
  assert.match(firebase,/completedAt:serverTimestamp\(\)/);
  assert.match(game,/await completeRun\(/);
  assert.match(html,/aria-label="Version 30">v30/);
  const teacher=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
  assert.match(teacher,/aria-label="Version 30">v30/);
});

test('teacher can compare the completed student record code',()=>{
  const teacher=fs.readFileSync(path.join(root,'teacher.html'),'utf8');
  const teacherJs=fs.readFileSync(path.join(root,'teacher.js'),'utf8');
  assert.match(teacher,/src="result-certificate\.js"/);
  assert.match(teacherJs,/class="result-record"/);
  assert.match(teacherJs,/run\.status==='completed'/);
  assert.match(teacherJs,/recordCode/);
});
