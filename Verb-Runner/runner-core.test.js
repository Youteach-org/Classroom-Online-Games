const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./runner-core.js');

test('lane movement is clamped to three lanes', () => {
  assert.equal(core.moveLane(0,-1),0);
  assert.equal(core.moveLane(0,1),1);
  assert.equal(core.moveLane(1,1),2);
  assert.equal(core.moveLane(2,1),2);
});

test('momentum controls speed inside a playable range', () => {
  assert.equal(core.speedForMomentum(0),210);
  assert.equal(core.speedForMomentum(75),300);
  assert.equal(core.speedForMomentum(100),330);
});

test('obstacle collision respects jump and slide requirements', () => {
  assert.equal(core.hitsObstacle({type:'crate'}, {jumping:false, sliding:false}), true);
  assert.equal(core.hitsObstacle({type:'crate'}, {jumping:true, sliding:false}), false);
  assert.equal(core.hitsObstacle({type:'barrier'}, {jumping:false, sliding:false}), true);
  assert.equal(core.hitsObstacle({type:'barrier'}, {jumping:false, sliding:true}), false);
});

test('desktop mode is based on a fine pointer and landscape geometry, not only width', () => {
  assert.equal(core.isDesktopViewport(920,540,true),true);
  assert.equal(core.isDesktopViewport(390,844,false),false);
  assert.equal(core.isDesktopViewport(844,390,false),false);
});

test('desktop fine-pointer landscape gets a much larger gameplay scale even below 1000 CSS px', () => {
  assert.equal(core.displayScaleForViewport(920,540,true),1.7);
  assert.equal(core.displayScaleForViewport(1366,768,true),1.78);
  assert.equal(core.displayScaleForViewport(1920,1080,true),1.85);
});

test('mobile and coarse-pointer layouts keep the original gameplay scale', () => {
  assert.equal(core.displayScaleForViewport(390,844,false),1);
  assert.equal(core.displayScaleForViewport(844,390,false),1);
});
