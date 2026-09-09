const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection uses six independent front-facing portraits without sheet slicing',()=>{
  const art=read('runner-art.js'),app=read('app.js');
  for(let i=1;i<=6;i++)assert.match(art,new RegExp(`select-clean-${i}\\.webp`));
  assert.match(art,/selectFrames:/);
  assert.match(app,/sprites\.selectFrames/);
  assert.match(app,/backgroundSize='contain'/);
  assert.doesNotMatch(app,/backgroundSize='600% 100%'/);
});

test('rear gameplay red runner uses eight independent clean animation frames',()=>{
  const animation=read('runner-animation.js');
  for(let i=0;i<8;i++)assert.match(animation,new RegExp(`runner-red-frame-${i}\\.webp`));
  assert.match(animation,/RUN_FRAME_URLS/);
  assert.match(animation,/load\.image/);
  assert.match(animation,/frames:RUN_KEYS\.map/);
  assert.match(animation,/add\.sprite/);
  assert.match(animation,/repeat:-1/);
  assert.match(animation,/setVisible\(true\)/);
});
