import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateNormalizedPercent,
  validateAssignmentConfig,
  validateAttemptSummary,
  canSubmitResult,
  receiptExpiresAt,
  isReceiptVerifiable
} from '../shared/cog-assignment-contract.mjs';

test('normalized official result must be between 0 and 100', () => {
  assert.equal(validateNormalizedPercent(0), 0);
  assert.equal(validateNormalizedPercent(92), 92);
  assert.equal(validateNormalizedPercent(100), 100);
  assert.throws(() => validateNormalizedPercent(-0.1), /0 and 100/);
  assert.throws(() => validateNormalizedPercent(100.1), /0 and 100/);
  assert.throws(() => validateNormalizedPercent('92'), /finite number/);
});

test('assignment config accepts one optional overall minimum', () => {
  const config = validateAssignmentConfig({
    gameId: 'verb-runner',
    modeId: 'sentence-run',
    difficultyId: 'medium',
    minimumPercent: 70
  });
  assert.deepEqual(config, {
    gameId: 'verb-runner',
    modeId: 'sentence-run',
    difficultyId: 'medium',
    minimumPercent: 70
  });

  const noMinimum = validateAssignmentConfig({
    gameId: 'verb-runner',
    modeId: 'sentence-run',
    difficultyId: 'medium',
    minimumPercent: null
  });
  assert.equal(noMinimum.minimumPercent, null);
  assert.throws(() => validateAssignmentConfig({
    gameId: 'verb-runner',
    modeId: 'sentence-run',
    difficultyId: 'medium',
    minimumPercent: 101
  }), /minimumPercent/);
});

test('submission gate requires open assignment and optional minimum', () => {
  assert.equal(canSubmitResult({ assignmentOpen: true, scorePercent: 55, minimumPercent: null }), true);
  assert.equal(canSubmitResult({ assignmentOpen: true, scorePercent: 69, minimumPercent: 70 }), false);
  assert.equal(canSubmitResult({ assignmentOpen: true, scorePercent: 70, minimumPercent: 70 }), true);
  assert.equal(canSubmitResult({ assignmentOpen: false, scorePercent: 100, minimumPercent: 70 }), false);
});

test('compact attempt summary validates only aggregate evidence needed by server', () => {
  const summary = validateAttemptSummary({
    attemptId: 'attempt-1',
    sessionId: 'session-1',
    assignmentId: 'assignment-1',
    gameId: 'verb-runner',
    modeId: 'sentence-run',
    difficultyId: 'medium',
    startedAt: Date.UTC(2026, 8, 16, 10, 0),
    completedAt: Date.UTC(2026, 8, 16, 10, 5),
    completed: true,
    successes: 18,
    errors: 2,
    scorePercent: 90,
    errorCodes: { spelling: 1, verbForm: 1 }
  });

  assert.equal(summary.completed, true);
  assert.equal(summary.successes, 18);
  assert.equal(summary.errors, 2);
  assert.equal(summary.scorePercent, 90);
  assert.deepEqual(summary.errorCodes, { spelling: 1, verbForm: 1 });
});

test('receipt verification expires six calendar months from receipt creation', () => {
  const createdAt = Date.UTC(2026, 8, 16, 18, 30);
  const expiresAt = receiptExpiresAt(createdAt);
  assert.equal(new Date(expiresAt).toISOString(), '2027-03-16T18:30:00.000Z');

  assert.equal(isReceiptVerifiable({
    createdAt,
    now: Date.UTC(2027, 2, 16, 18, 29, 59),
    status: 'active'
  }), true);

  assert.equal(isReceiptVerifiable({
    createdAt,
    now: expiresAt,
    status: 'active'
  }), false);

  assert.equal(isReceiptVerifiable({
    createdAt,
    now: Date.UTC(2026, 8, 17),
    status: 'superseded'
  }), false);
});