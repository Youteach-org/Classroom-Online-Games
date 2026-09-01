const fs=require('node:fs');const assert=require('node:assert/strict');
const css=fs.readFileSync('board-fit.css','utf8');
const inner=fs.readFileSync('board-container.css','utf8');
assert.match(css,/width:min\(100vw,177\.777/,'board must fit within viewport width and height');
assert.match(css,/aspect-ratio:16\/9/,'board must preserve 16:9');
assert.match(css,/translate\(-50%,-50%\)/,'board must remain centered');
assert.match(css,/container-type:size/,'board must establish its own sizing context');
assert.doesNotMatch(inner,/\d(?:\.\d+)?v[wh]/,'internal geometry must not use viewport units');
console.log('responsive board layout: 5 assertions passed');
