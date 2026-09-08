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

test('gameplay loads illustrated environment obstacle and runner assets instead of only procedural shapes',()=>{
  const phaser=read('phaser-runner.js');
  for(const file of ['assets/coastal-city.svg','assets/obstacle-jump.svg','assets/obstacle-slide.svg','assets/runner-rear-1.svg','assets/runner-rear-2.svg','assets/runner-rear-3.svg','assets/runner-rear-4.svg','assets/runner-rear-5.svg','assets/runner-rear-6.svg']){
    assert.equal(fs.existsSync(path.join(__dirname,file)),true,`${file} must exist`);
    assert.match(phaser,new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(phaser,/preload\(\)/);
  assert.match(phaser,/this\.load\.svg\('vr-coastal'/);
  assert.match(phaser,/this\.add\.image\([^\n]*'vr-coastal'/);
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
