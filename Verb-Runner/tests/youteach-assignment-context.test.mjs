import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const sync = readFileSync(join(root, 'session-sync.js'), 'utf8');
const game = readFileSync(join(root, 'prototype.js'), 'utf8');

test('YouTeach launch credential exposes assignment practice context', () => {
  assert.match(sync, /assignmentContext/);
  assert.match(sync, /purpose/);
  assert.match(sync, /modeId/);
  assert.match(sync, /difficultyId/);
  assert.match(sync, /officialSubmissionAllowed/);
});

test('Verb Runner applies and locks assigned mode and difficulty for assignment practice', () => {
  assert.match(game, /function applyYouTeachAssignmentContext/);
  assert.match(game, /assignmentContextLocked/);
  assert.match(game, /document\.querySelectorAll\('\[data-race\]'\)/);
  assert.match(game, /document\.querySelectorAll\('\[data-difficulty\]'\)/);
  assert.match(game, /resolved\.assignmentContext/);
});