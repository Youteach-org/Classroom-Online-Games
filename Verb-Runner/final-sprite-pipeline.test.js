const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const asset=name=>fs.readFileSync(path.join(__dirname,'assets','sprites',name));
function pngSize(buf){assert.equal(buf.subarray(1,4).toString(),'PNG');return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)};}

test('selection uses six individual high-resolution images instead of one sliced sheet',()=>{
  const art=read('runner-art.js');
  const app=read('app.js');
  for(let i=1;i<=6;i++){
    assert.match(art,new RegExp(`select-runner-${i}\\.png`));
    const {w,h}=pngSize(asset(`select-runner-${i}.png`));
    assert.ok(w>=500,`runner ${i} selection art must be at least 500px wide`);
    assert.ok(h>=1000,`runner ${i} selection art must be at least 1000px tall`);
  }
  assert.match(app,/createElement\('img'\)/);
  assert.doesNotMatch(app,/backgroundSize='600% 100%'/);
});

test('red gameplay runner uses four clean high-resolution PNG frames directly in Phaser',()=>{
  const phaser=read('phaser-runner.js');
  const html=read('index.html');
  for(let i=1;i<=4;i++){
    assert.match(phaser,new RegExp(`runner-red-clean-${i}\\.png`));
    const {w,h}=pngSize(asset(`runner-red-clean-${i}.png`));
    assert.ok(w>=512,`run frame ${i} must be at least 512px wide`);
    assert.ok(h>=768,`run frame ${i} must be at least 768px tall`);
  }
  assert.match(phaser,/createRunnerAnimation/);
  assert.match(phaser,/vr-red-run-1/);
  assert.doesNotMatch(html,/runner-animation\.js/);
  assert.doesNotMatch(phaser,/runner-run-sheet\.svg/);
});

test('hit remains rear-running plus stars and never introduces a fall animation',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/feedbackBurst\(0xffc14f,true\)/);
  assert.doesNotMatch(phaser,/tumble|stumble|fallAnim/i);
});
