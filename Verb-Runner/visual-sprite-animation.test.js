const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses six crisp front-facing anime portraits',()=>{
  const art=read('runner-art.js');
  assert.match(art,/runner-select-anime-sheet\.webp/);
  assert.match(art,/selectFrameWidth:180/);
  assert.match(art,/selectFrameHeight:260/);
});

test('rear gameplay red runner uses a visible real Phaser eight-frame spritesheet animation',()=>{
  const animation=read('runner-animation.js');
  assert.match(animation,/FRAMES=8/);
  assert.match(animation,/runner-run-red-8\.webp/);
  assert.match(animation,/load\.spritesheet/);
  assert.match(animation,/add\.sprite/);
  assert.match(animation,/generateFrameNumbers/);
  assert.match(animation,/repeat:-1/);
  assert.match(animation,/setVisible\(true\)/);
});
