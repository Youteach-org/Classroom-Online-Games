import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const sync=readFileSync(join(root,'session-sync.js'),'utf8');
const prototype=readFileSync(join(root,'prototype.js'),'utf8');
const html=readFileSync(join(root,'index.html'),'utf8');

test('assignment resolver retains a server-issued result submission token only in memory',()=>{
  assert.match(sync,/submissionToken/);
  assert.match(sync,/officialSubmissionAllowed/);
  assert.match(prototype,/youTeachSubmissionToken/);
  assert.match(prototype,/resolved\.submissionToken/);
  assert.doesNotMatch(prototype,/localStorage\.setItem\([^\n]*submissionToken/i);
});

test('session sync submits completed attempts only to the validated YouTeach issuer',()=>{
  assert.match(sync,/async function submitYouTeachAssignmentResult/);
  assert.match(sync,/\/api\/cog-result-submit/);
  assert.match(sync,/submissionToken/);
  assert.match(sync,/attempt/);
});

test('result overlay exposes Send to teacher without changing free-mode results',()=>{
  assert.match(html,/id="sendYouTeachResultButton"/);
  assert.match(html,/SEND TO TEACHER/);
  assert.match(html,/id="sendYouTeachResultStatus"/);
  assert.match(prototype,/sendYouTeachResultButton\.hidden/);
  assert.match(prototype,/officialSubmissionAllowed/);
});

test('official result payload contains event counts and timestamps, not an authoritative client grade',()=>{
  assert.match(prototype,/successes:\s*runState\.correct/);
  assert.match(prototype,/errors:\s*runState\.grammarErrors/);
  assert.match(prototype,/startedAt:\s*officialAttemptStartedAt/);
  assert.match(prototype,/completedAt:/);
  assert.match(prototype,/completed:\s*true/);
  assert.doesNotMatch(prototype,/scorePercent:\s*summary\.accuracy/);
});

test('minimum performance blocks Send to teacher client-side while server remains authoritative',()=>{
  assert.match(prototype,/minimumPercent/);
  assert.match(prototype,/summary\.accuracy\s*>=\s*minimum/);
  assert.match(prototype,/Minimum .* required/);
});