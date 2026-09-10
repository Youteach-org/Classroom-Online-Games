const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('selection and gameplay use the approved raster sprite pipeline directly',()=>{
  const art=read('runner-art.js');
  const app=read('app.js');
  const phaser=read('phaser-runner.js');
  const html=read('index.html');

  assert.match(art,/assets\/sprites\/runner-select-sheet\.webp/);
  assert.match(art,/assets\/sprites\/runner-gameplay-atlas\.webp/);
  assert.match(app,/sprite-runner/);
  assert.doesNotMatch(app,/<span class=\\?"(?:head|hair|body|arm|leg|shoe|pack)/i);

  assert.match(phaser,/load\.spritesheet\('vr-runner-atlas'/);
  assert.match(phaser,/frameWidth:\s*192/);
  assert.match(phaser,/frameHeight:\s*192/);
  assert.match(phaser,/createRunnerAnimation/);
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.doesNotMatch(phaser,/runner-run-sheet\.svg|runner-slide-sheet\.svg/);

  assert.doesNotMatch(html,/runner-animation\.js/);
  assert.doesNotMatch(html,/\.webp\.b64/);
});

test('all six runners animate from their own atlas row and keep the no-fall hit rule',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/characterIndex\s*\*\s*4/);
  assert.match(phaser,/\+\s*\[0,1,2\]/);
  assert.match(phaser,/feedbackBurst\(0xffc14f,true\)/);
  assert.doesNotMatch(phaser,/tumble|stumble/i);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
});
