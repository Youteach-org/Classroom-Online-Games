const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner cards are cosmetic avatars with no fixed character names or taglines',()=>{
  const app=read('app.js');
  assert.doesNotMatch(app,/data\.name|data\.tagline|runner-caption/);
  assert.match(app,/aria-label[^\n]*Choose runner/);
});

test('pause uses explicit gameplay freeze and resume hooks',()=>{
  const app=read('app.js');
  const phaser=read('phaser-runner.js');
  assert.match(app,/scene\.pauseRun\(\)/);
  assert.match(app,/scene\.resumeRun\(\)/);
  assert.match(phaser,/pauseRun\(\)\s*\{/);
  assert.match(phaser,/resumeRun\(\)\s*\{/);
  assert.match(phaser,/this\.active=false/);
  assert.match(phaser,/this\.tweens\.pauseAll\(\)/);
  assert.match(phaser,/this\.time\.paused=true/);
});

test('pause overlay is truly hidden when the hidden attribute is present',()=>{
  const css=read('styles.css')+'\n'+read('desktop.css');
  assert.match(css,/\.pause-overlay\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/);
});
