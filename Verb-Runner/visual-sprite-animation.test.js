const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection keeps the approved red girl portrait as character zero',()=>{
  const art=read('runner-art.js'),app=read('app.js');
  assert.match(art,/selectFrames:/);
  assert.match(art,/select-hd-6\.webp\.b64/);
  assert.match(app,/loadSelectionImage/);
  assert.doesNotMatch(app,/backgroundSize='600% 100%'/);
});

test('rear gameplay red girl uses four separate raster frames without slicing a run sheet',()=>{
  const animation=read('runner-animation.js'),phaser=read('phaser-runner.js');
  assert.match(animation,/FRAME_COUNT=4/);
  assert.match(animation,/STANDARD_RUN_FRAME_RATE=7/);
  for(let i=0;i<4;i++)assert.match(animation,new RegExp(`red-girl-frame-${i}\\.webp`));
  assert.match(animation,/scene\.load\.image/);
  assert.doesNotMatch(animation,/load\.spritesheet/);
  assert.doesNotMatch(animation,/runner-run-red-8\.webp/);
  assert.doesNotMatch(animation,/runner-run-red-clean-strip/);
  assert.doesNotMatch(animation,/runner-run-atlas\.svg/);
  assert.match(phaser,/this\.characterIndex!==0/);

  const hashes=[];
  for(let i=0;i<4;i++){
    const webp=fs.readFileSync(path.join(__dirname,'assets','sprites','run',`red-girl-frame-${i}.webp`));
    assert.ok(webp.length>7000,`frame ${i} must contain real artwork`);
    assert.equal(webp.subarray(0,4).toString(),'RIFF');
    assert.equal(webp.subarray(8,12).toString(),'WEBP');
    hashes.push(crypto.createHash('sha256').update(webp).digest('hex'));
  }
  assert.equal(new Set(hashes).size,4,'all running frames must be visually distinct files');
});
