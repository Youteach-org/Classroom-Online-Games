const assert=require('node:assert/strict');const core=require('./game-core');
let s=core.normalize({answerSeconds:0,strikeLimit:9});assert.equal(s.answerSeconds,10);assert.equal(s.strikeLimit,3);
assert.equal(core.canBuzz(s,'a','Team 1'),true);s=core.markParticipation(s,'a');assert.equal(core.canBuzz(s,'a','Team 1'),false);
s=core.normalize({strikeLimit:2,strikes:{'Team 1':1,'Team 2':0}});s=core.validate(s,false,'Team 1');assert.equal(s.phase,'steal');
s=core.normalize({roundBank:30,teamScores:{'Team 1':10,'Team 2':0}});s=core.awardBank(s,'Team 1');assert.equal(s.teamScores['Team 1'],40);assert.equal(s.roundBank,0);
const rows=core.parseCsv('prompt,answer,guide,points\n"Maya said I am studying","Maya said that she was studying",Backshift,20');assert.equal(rows[0].points,20);assert.equal(rows[0].prompt,'Maya said I am studying');
console.log('game-core: 9 assertions passed');
