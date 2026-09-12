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

test('red girl uses four raster run frames while the other five runners stay on their current SVG frames',()=>{
  const phaser=read('phaser-runner.js'),animation=read('runner-animation.js');
  assert.match(phaser,/runner-slide-sheet\.svg/);
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.match(phaser,/this\.characterIndex!==0/);
  assert.match(animation,/FRAME_COUNT=4/);
  assert.match(animation,/STANDARD_RUN_FRAME_RATE=7/);
  assert.match(animation,/DEFAULT_FRAME_RATE=8/);
  assert.match(animation,/DEFAULT_SPRINT_RATE=10/);
  for(let i=0;i<4;i++)assert.match(animation,new RegExp(`red-girl-frame-${i}\\.webp`));
  assert.match(animation,/scene\.load\.image/);
  assert.match(animation,/assets\/sprites\/run\/\$\{id\}-\$\{i\}\.svg/);
  assert.match(animation,/scene\.load\.svg/);
  assert.match(animation,/red-girl/);
  assert.match(animation,/blue-boy/);
  assert.match(animation,/green-boy/);
  assert.match(animation,/pink-girl/);
  assert.match(animation,/white-boy/);
  assert.match(animation,/purple-girl/);
  assert.doesNotMatch(animation,/runner-red-frame-/);
  assert.doesNotMatch(animation,/runner-hd-atlas\.part/);
  assert.doesNotMatch(animation,/runner-run-atlas\.svg/);
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
