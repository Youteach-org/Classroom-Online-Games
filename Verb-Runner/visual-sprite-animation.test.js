const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('runner selection keeps the approved crisp front-facing anime sheet',()=>{
  const art=read('runner-art.js'),app=read('app.js');
  assert.match(art,/runner-select-anime-sheet\.webp/);
  assert.match(app,/sprites\.select/);
  assert.match(app,/backgroundSize='600% 100%'/);
});

test('rear gameplay red runner uses a clean eight-frame strip with correct frame geometry',()=>{
  const animation=read('runner-animation.js');
  assert.match(animation,/runner-run-red-clean-strip\.webp\.b64/);
  assert.match(animation,/FRAMES=8/);
  assert.match(animation,/FRAME_W=164/);
  assert.match(animation,/FRAME_H=272/);
  assert.match(animation,/load\.spritesheet/);
  assert.match(animation,/repeat:-1/);
  assert.doesNotMatch(animation,/frameWidth:82/);
  assert.doesNotMatch(animation,/frameHeight:136/);

  const encoded=read('assets/sprites/runner-run-red-clean-strip.webp.b64').replace(/\s+/g,'');
  const webp=Buffer.from(encoded,'base64');
  assert.equal(webp.subarray(0,4).toString(),'RIFF');
  assert.equal(webp.subarray(8,12).toString(),'WEBP');
  assert.equal(webp.subarray(12,16).toString(),'VP8X');
  const width=webp.readUIntLE(24,3)+1;
  const height=webp.readUIntLE(27,3)+1;
  assert.equal(width,1312);
  assert.equal(height,272);
  assert.equal(width/164,8);
});
