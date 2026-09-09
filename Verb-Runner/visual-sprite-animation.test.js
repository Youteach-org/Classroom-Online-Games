const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses six crisp front-facing anime portraits',()=>{
  const art=read('runner-art.js');
  assert.match(art,/runner-select-anime-sheet\.webp/);
  assert.match(art,/selectFrameWidth:240/);
  assert.match(art,/selectFrameHeight:360/);
});

test('rear gameplay runner has a real multi-frame animation',()=>{
  const animation=read('runner-animation.js');
  assert.match(animation,/FRAMES=8/);
  assert.match(animation,/runner-run-animated-sheet\.webp/);
  assert.match(animation,/setCrop\(frame\*FRAME_W,row\*FRAME_H,FRAME_W,FRAME_H\)/);
  assert.match(animation,/scene\.events\.on\('update',update\)/);
});
