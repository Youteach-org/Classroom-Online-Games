const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('verb panels are smaller without sacrificing the approved neon glow',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/width=Math\.max\(104,item\.value\.length\*15\)/);
  assert.match(phaser,/width\+16,58/);
  assert.match(phaser,/setStrokeStyle\(6,0x4acfff,\.42\)/);
});

test('gameplay feedback is overridden above the action area on desktop and mobile',()=>{
  const desktop=read('desktop.css');
  assert.match(desktop,/\.desktop-game-ui \.game-notice\{[^}]*top:14%/);
  assert.match(desktop,/@media\(max-width:900px\)\{[^}]*\.game-notice\{top:30%/);
});

test('gameplay uses raster PNG art so Phaser does not turn complex SVG effects into black boxes',()=>{
  const phaser=read('phaser-runner.js');
  for(const file of ['assets/coastal-city.png','assets/obstacle-jump.png','assets/obstacle-slide.png','assets/runner-rear-1.png','assets/runner-rear-2.png','assets/runner-rear-3.png','assets/runner-rear-4.png','assets/runner-rear-5.png','assets/runner-rear-6.png']){
    assert.equal(fs.existsSync(path.join(__dirname,file)),true,`${file} must exist`);
  }
  assert.match(phaser,/preload\(\)/);
  assert.match(phaser,/this\.load\.image\('vr-coastal','assets\/coastal-city\.png'\)/);
  assert.match(phaser,/this\.load\.image\('vr-jump','assets\/obstacle-jump\.png'\)/);
  assert.match(phaser,/this\.load\.image\('vr-slide','assets\/obstacle-slide\.png'\)/);
  assert.match(phaser,/assets\/runner-rear-\$\{i\}\.png/);
  assert.doesNotMatch(phaser,/this\.load\.svg\(/);
});

test('jump and slide obstacles use separate illustrated textures and remain semantically distinct',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/type==='crate'\?'vr-jump':'vr-slide'/);
  assert.match(phaser,/c\.type=type/);
});

test('obstacles arrive frequently enough to require jump and slide actions',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/nextObstacleAt=time\+780\+Math\.random\(\)\*360/);
});
