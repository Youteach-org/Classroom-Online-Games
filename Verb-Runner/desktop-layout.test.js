const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'desktop.css'),'utf8');

test('desktop HUD uses a device-mode class instead of a width-only media query',()=>{
  assert.match(css,/\.desktop-game-ui\s+\.game-hud/);
});

test('desktop HUD is a full overlay with individually compact floating modules',()=>{
  assert.match(css,/\.desktop-game-ui \.game-hud\{[^}]*position:absolute[^}]*width:100%[^}]*height:100%/);
  assert.match(css,/\.desktop-game-ui \.hud-prompt\{[^}]*width:min\(650px,46vw\)/);
  assert.match(css,/\.desktop-game-ui \.hud-momentum\{[^}]*width:220px/);
});
