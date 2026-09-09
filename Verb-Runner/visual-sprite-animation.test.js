const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses a crisp six-character vector source',()=>{
  const svg=read('assets/sprites/runner-select-sheet.svg');
  assert.match(svg,/width="1080"/);
  assert.match(svg,/height="260"/);
  assert.match(svg,/data-vector-portrait-sheet="1"/);
  assert.doesNotMatch(svg,/data:image\/webp;base64/);
});

test('rear gameplay runner has a real multi-frame animation',()=>{
  const animation=read('runner-animation.js');
  assert.match(animation,/FRAMES=8/);
  assert.match(animation,/runner-run-animated-sheet\.webp/);
  assert.match(animation,/setCrop\(frame\*FRAME_W,row\*FRAME_H,FRAME_W,FRAME_H\)/);
  assert.match(animation,/scene\.events\.on\('update',update\)/);
});
