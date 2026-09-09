const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses a crisp anime sprite sheet instead of CSS body parts',()=>{
  const app=read('app.js'),art=read('runner-art.js');
  assert.match(art,/runner-select-anime-sheet\.webp/);
  assert.match(app,/sprite-runner/);
  assert.match(app,/backgroundSize='600% 100%'/);
  assert.doesNotMatch(app,/class=\\?"pack\\?"/);
  assert.doesNotMatch(app,/class=\\?"head\\?"/);
});

test('gameplay uses rear-view run, true slide and separate red running frames',()=>{
  const phaser=read('phaser-runner.js'),animation=read('runner-animation.js');
  assert.match(phaser,/runner-run-sheet\.svg/);
  assert.match(phaser,/runner-slide-sheet\.svg/);
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.match(phaser,/setCrop\(frame\*60,0,60,54\)/);
  assert.match(animation,/FRAME_COUNT=4/);
  assert.match(animation,/runner-red-frame-\$\{i\}\.webp\.b64/);
  assert.match(animation,/scene\.load\.image/);
  assert.match(animation,/add\.sprite/);
  assert.match(animation,/setVisible\(true\)/);
  assert.doesNotMatch(animation,/load\.spritesheet/);
  assert.doesNotMatch(animation,/runner-run-red-8\.webp/);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
});

test('sprite artwork keeps all six cosmetic runner variants in matching order',()=>{
  const art=read('runner-art.js');
  assert.match(art,/selectFrameWidth:180/);
  assert.match(art,/selectFrameHeight:260/);
  assert.match(art,/runFrameWidth:60/);
  assert.match(art,/slideFrameWidth:60/);
  const colors=art.match(/color:'#/g)||[];
  assert.equal(colors.length,6);
});
