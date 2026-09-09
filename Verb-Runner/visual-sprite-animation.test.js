const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses a high-resolution six-panel source',()=>{
  const svg=read('assets/sprites/runner-select-sheet.svg');
  assert.match(svg,/width="1440"/);
  assert.match(svg,/height="320"/);
  assert.equal((svg.match(/<image\b/g)||[]).length,6);
});

test('rear gameplay runner has a continuous stride animation',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/animateRunnerStride\(time\)/);
  assert.match(phaser,/runnerArt\.rotation/);
  assert.match(phaser,/runnerArt\.y/);
  assert.match(phaser,/shadow\.scaleX/);
});
