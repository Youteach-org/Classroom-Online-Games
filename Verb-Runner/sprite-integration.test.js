const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses a crisp sprite sheet instead of CSS body parts',()=>{
  const app=read('app.js'),art=read('runner-art.js');
  assert.match(art,/runner-select-sheet\.svg/);
  assert.match(app,/sprite-runner/);
  assert.match(app,/backgroundSize='600% 100%'/);
  assert.doesNotMatch(app,/class=\\?"pack\\?"/);
  assert.doesNotMatch(app,/class=\\?"head\\?"/);
});

test('gameplay uses rear-view run and true slide sprite sheets',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/runner-run-sheet\.svg/);
  assert.match(phaser,/runner-slide-sheet\.svg/);
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.match(phaser,/setCrop\(frame\*60,0,60,54\)/);
  assert.doesNotMatch(phaser,/runner-rear-\$\{i\}\.svg/);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
});

test('sprite artwork keeps all six cosmetic runner variants',()=>{
  const art=read('runner-art.js');
  assert.match(art,/selectFrameWidth:180/);
  assert.match(art,/selectFrameHeight:260/);
  assert.match(art,/runFrameWidth:60/);
  assert.match(art,/slideFrameWidth:60/);
  const colors=art.match(/color:'#/g)||[];
  assert.equal(colors.length,6);
});
