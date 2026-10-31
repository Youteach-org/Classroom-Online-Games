import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const path='Conditional-Pairs/Secret-Skills-Club/app.js';
test('Secret Skills Club app JavaScript parses',()=>{execFileSync(process.execPath,['--check',path],{stdio:'pipe'});});
test('Secret Skills Club deploy has essential gameplay',()=>{
 const code=readFileSync(path,'utf8');
 for(const fragment of ['createRoom','joinRoom','renderQuiz','renderClues','renderWitness','createTeams','DOES','DID','DO ','firebase-database.js'])assert.ok(code.includes(fragment),fragment);
 assert.ok(!code.toLowerCase().includes('supabase'));
});
