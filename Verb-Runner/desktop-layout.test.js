const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'styles.css'),'utf8');

test('desktop HUD is capped and centered without changing mobile breakpoints',()=>{
  assert.match(css,/@media\(min-width:1000px\)\{[\s\S]*?\.game-hud\{[^}]*width:min\(1160px,calc\(100% - 48px\)\)[^}]*margin:0 auto/);
  assert.match(css,/@media\(min-width:1000px\)\{[\s\S]*?\.challenge-panel\{[^}]*width:min\(760px,100%\)/);
  assert.match(css,/@media\(max-width:760px\)/);
});
