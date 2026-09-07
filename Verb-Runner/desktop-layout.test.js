const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'desktop.css'),'utf8');

test('desktop HUD uses a device-mode class instead of a width-only media query',()=>{
  assert.match(css,/\.desktop-game-ui\s+\.game-hud/);
});

test('desktop HUD is constrained to a compact max width',()=>{
  assert.match(css,/width:min\(1100px,calc\(100% - 24px\)\)/);
});
