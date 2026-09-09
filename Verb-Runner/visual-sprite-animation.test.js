const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection keeps the approved crisp front-facing anime sheet',()=>{
  const art=read('runner-art.js'),app=read('app.js');
  assert.match(art,/runner-select-anime-sheet\.webp/);
  assert.match(app,/sprites\.select/);
  assert.match(app,/backgroundSize='600% 100%'/);
});

test('rear gameplay red runner uses separate clean animation frames instead of slicing one corrupt sheet',()=>{
  const animation=read('runner-animation.js');
  assert.match(animation,/FRAME_COUNT=4/);
  assert.match(animation,/runner-red-frame-\$\{i\}\.webp\.b64/);
  assert.match(animation,/scene\.load\.image/);
  assert.doesNotMatch(animation,/load\.spritesheet/);
  assert.doesNotMatch(animation,/runner-run-red-8\.webp/);
  assert.doesNotMatch(animation,/runner-run-red-clean-strip/);

  const hashes=[];
  for(let i=0;i<4;i++){
    const encoded=read(`assets/sprites/runner-red-frame-${i}.webp.b64`).replace(/\s+/g,'');
    const webp=Buffer.from(encoded,'base64');
    assert.ok(webp.length>4000,`frame ${i} must contain real artwork`);
    assert.equal(webp.subarray(0,4).toString(),'RIFF');
    assert.equal(webp.subarray(8,12).toString(),'WEBP');
    hashes.push(crypto.createHash('sha256').update(webp).digest('hex'));
  }
  assert.equal(new Set(hashes).size,4,'all running frames must be visually distinct files');
});
