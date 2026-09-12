const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses six individual HD portraits instead of sprite-sheet crops',()=>{
  const app=read('app.js'),art=read('runner-art.js');
  assert.match(art,/selectFrames:/);
  assert.match(art,/select-hd-6\.webp\.b64/);
  assert.match(app,/loadSelectionImage/);
  assert.match(app,/querySelector\('\.sprite-runner'\)/);
  assert.doesNotMatch(app,/backgroundSize='600% 100%'/);
  assert.doesNotMatch(app,/backgroundPosition=/);
  assert.doesNotMatch(app,/class=\\?"pack\\?"/);
  assert.doesNotMatch(app,/class=\\?"head\\?"/);
});

test('gameplay uses one clean six-character rear-view atlas with real four-frame runs',()=>{
  const phaser=read('phaser-runner.js'),animation=read('runner-animation.js'),atlas=read('assets/sprites/runner-run-atlas.svg');
  assert.match(phaser,/runner-slide-sheet\.svg/);
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.match(animation,/FRAME_COUNT=4/);
  assert.match(animation,/runner-run-atlas\.svg/);
  assert.match(animation,/CELL_W=128/);
  assert.match(animation,/CELL_H=192/);
  assert.match(animation,/scene\.load\.svg/);
  assert.match(animation,/add\.sprite/);
  assert.doesNotMatch(animation,/runner-red-frame-/);
  assert.doesNotMatch(animation,/runner-hd-atlas\.part/);
  assert.match(atlas,/red-girl-f0/);
  assert.match(atlas,/blue-boy-f0/);
  assert.match(atlas,/green-boy-f0/);
  assert.match(atlas,/pink-girl-f0/);
  assert.match(atlas,/white-boy-f0/);
  assert.match(atlas,/purple-girl-f0/);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
});

test('sprite artwork keeps all six cosmetic runner variants in matching order',()=>{
  const art=read('runner-art.js');
  assert.match(art,/selectFrameWidth:256/);
  assert.match(art,/selectFrameHeight:480/);
  assert.match(art,/runFrameWidth:60/);
  assert.match(art,/slideFrameWidth:60/);
  const colors=art.match(/color:'#/g)||[];
  assert.equal(colors.length,6);
});
