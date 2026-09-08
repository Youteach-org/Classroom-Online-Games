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

test('jump and slide obstacles use clearly different silhouettes',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/drawJumpObstacle\(g\)/);
  assert.match(phaser,/drawSlideObstacle\(g\)/);
  assert.match(phaser,/fillRoundedRect\(-46,-24,92,48/);
  assert.match(phaser,/fillRoundedRect\(-60,-108,120,18/);
});

test('obstacles arrive frequently enough to require jump and slide actions',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/nextObstacleAt=time\+780\+Math\.random\(\)\*360/);
});

test('coastal game view adds richer approved-world detail layers',()=>{
  const phaser=read('phaser-runner.js');
  assert.match(phaser,/drawBoardwalkDetails\(w,h,hy\)/);
  assert.match(phaser,/this\.neonSigns=/);
  assert.match(phaser,/this\.cloudShadows=/);
});
