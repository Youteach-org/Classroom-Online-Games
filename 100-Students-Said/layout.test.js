const fs=require('node:fs');const assert=require('node:assert/strict');
const css=fs.readFileSync('board-fit.css','utf8');
assert.match(css,/width:min\(100vw,177\.777/,'board must fit within viewport width and height');
assert.match(css,/aspect-ratio:16\/9/,'board must preserve 16:9');
assert.match(css,/translate\(-50%,-50%\)/,'board must remain centered');
console.log('responsive board layout: 3 assertions passed');
