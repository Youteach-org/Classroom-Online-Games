const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('selection and gameplay use real raster art without the late animation patch',()=>{
  const art=read('runner-art.js');
  const app=read('app.js');
  const phaser=read('phaser-runner.js');
  const html=read('index.html');

  assert.match(art,/assets\/sprites\/runner-select-anime-sheet\.webp/);
  assert.match(app,/sprite-runner/);
  assert.doesNotMatch(app,/<span class=\\?"(?:head|hair|body|arm|leg|shoe|pack)/i);

  assert.match(phaser,/load\.spritesheet\('vr-runner-run'/);
  assert.match(phaser,/runner-run-red-8\.webp/);
  assert.match(phaser,/frameWidth:\s*82/);
  assert.match(phaser,/frameHeight:\s*136/);
  assert.match(phaser,/createRunnerAnimation/);
  assert.match(phaser,/RUNNER_TINTS/);
  assert.match(phaser,/setRunnerState\('slide'\)/);

  assert.doesNotMatch(html,/runner-animation\.js/);
  assert.doesNotMatch(html,/\.webp\.b64/);
});

test('all six choices use the animated rear runner and keep the no-fall hit rule',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/RUNNER_TINTS\s*=\s*\[[^\]]+\]/s);
  assert.match(phaser,/this\.characterIndex\s*%\s*RUNNER_TINTS\.length/);
  assert.match(phaser,/feedbackBurst\(0xffc14f,true\)/);
  assert.doesNotMatch(phaser,/tumble|stumble/i);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
});
