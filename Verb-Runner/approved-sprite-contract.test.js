const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('selection is backed by actual front-facing anime artwork',()=>{
  const app=read('app.js'),css=read('desktop.css'),art=read('runner-art.js');
  assert.match(app,/sprite-runner/);
  assert.match(css,/\.runner-art\.sprite-runner/);
  assert.match(css,/aspect-ratio:180\/260/);
  assert.match(art,/assets\/sprites\/runner-select-anime-sheet\.webp/);
  assert.doesNotMatch(app,/class=\\?"(?:head|hair|body|arm|leg|shoe|pack)/);
});

test('rear runner changes visual state without tumble or squash',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/setRunnerState\('slide'\)/);
  assert.match(phaser,/runnerState/);
  assert.doesNotMatch(phaser,/scaleY:s\*\.46/);
  assert.doesNotMatch(phaser,/tumble|stumble/i);
  assert.match(phaser,/feedbackBurst\(0xffc14f,true\)/);
});


test('raster runner rendering preserves smooth high-density scaling',()=>{
  const phaser=read('phaser-runner.js'),animation=read('runner-animation.js');
  assert.match(phaser,/devicePixelRatio/);
  assert.match(phaser,/antialias:true/);
  assert.match(animation,/FilterMode\.LINEAR/);
});
