const test = require('node:test');
const assert = require('node:assert/strict');

test('lane movement is clamped to three lanes', () => {
  const core = require('./runner-core.js');
  assert.equal(core.moveLane(0,-1),0);
  assert.equal(core.moveLane(0,1),1);
  assert.equal(core.moveLane(1,1),2);
  assert.equal(core.moveLane(2,1),2);
});

test('momentum controls speed inside a playable range', () => {
  const core = require('./runner-core.js');
  assert.equal(core.speedForMomentum(0),210);
  assert.equal(core.speedForMomentum(75),300);
  assert.equal(core.speedForMomentum(100),330);
});

test('obstacle collision respects jump and slide requirements', () => {
  const core = require('./runner-core.js');
  assert.equal(core.hitsObstacle({type:'crate'}, {jumping:false, sliding:false}), true);
  assert.equal(core.hitsObstacle({type:'crate'}, {jumping:true, sliding:false}), false);
  assert.equal(core.hitsObstacle({type:'barrier'}, {jumping:false, sliding:false}), true);
  assert.equal(core.hitsObstacle({type:'barrier'}, {jumping:false, sliding:true}), false);
});
