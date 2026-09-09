const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const asset=name=>fs.readFileSync(path.join(__dirname,'assets',name),'utf8');
const spriteFiles=['obstacle-jump.svg','obstacle-slide.svg',...Array.from({length:6},(_,i)=>`runner-rear-${i+1}.svg`)];

test('legacy Phaser-safe SVGs remain valid fallback assets',()=>{
  for(const file of spriteFiles){
    const svg=asset(file);
    assert.match(svg,/data-safe-svg="1"/,`${file} must use the safe SVG contract`);
    assert.match(svg,/data-sprite-root="transparent"/,`${file} must declare a transparent sprite canvas`);
    assert.match(svg,/<svg[^>]+width="\d+"[^>]+height="\d+"[^>]+viewBox=/,`${file} needs explicit raster dimensions`);
    assert.doesNotMatch(svg,/<(?:filter|mask|foreignObject|image)\b/i,`${file} must avoid SVG features that can rasterize incorrectly in Phaser`);
  }
});

test('illustrated coastal background uses the safe SVG contract',()=>{
  const svg=asset('coastal-city.svg');
  assert.match(svg,/data-safe-svg="1"/);
  assert.match(svg,/<svg[^>]+width="1600"[^>]+height="900"[^>]+viewBox="0 0 1600 900"/);
  assert.doesNotMatch(svg,/<(?:filter|mask|foreignObject|image)\b/i);
});

test('anime selection and clean red run strip are real raster payloads',()=>{
  const selectPath=path.join(__dirname,'assets','sprites','runner-select-anime-sheet.webp');
  const runPayloadPath=path.join(__dirname,'assets','sprites','runner-run-red-clean-strip.webp.b64');
  assert.ok(fs.existsSync(selectPath));
  assert.ok(fs.existsSync(runPayloadPath));
  assert.ok(fs.statSync(selectPath).size>10000);
  const encoded=fs.readFileSync(runPayloadPath,'utf8').replace(/\s+/g,'');
  const webp=Buffer.from(encoded,'base64');
  assert.ok(webp.length>30000);
  assert.equal(webp.subarray(0,4).toString(),'RIFF');
  assert.equal(webp.subarray(8,12).toString(),'WEBP');
  for(const file of ['sprites/runner-run-sheet.svg','sprites/runner-slide-sheet.svg']){
    const svg=asset(file);
    assert.match(svg,/data-raster-sprite="1"/);
    assert.match(svg,/<image\b/);
    assert.match(svg,/data:image\/webp;base64,/);
  }
});
