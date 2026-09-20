function requireNonEmptyString(value, field) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new TypeError(`${field} must be a non-empty string.`);
  return text;
}

function requireTimestamp(value, field) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError(`${field} must be a valid timestamp.`);
  }
  return Number(value);
}

function requireCount(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer.`);
  }
  return value;
}

function addUtcMonthsClamped(timestamp, months) {
  const source = new Date(requireTimestamp(timestamp, 'timestamp'));
  const year = source.getUTCFullYear();
  const month = source.getUTCMonth();
  const day = source.getUTCDate();

  const targetMonthIndex = month + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, lastDay);

  return Date.UTC(
    targetYear,
    targetMonth,
    targetDay,
    source.getUTCHours(),
    source.getUTCMinutes(),
    source.getUTCSeconds(),
    source.getUTCMilliseconds()
  );
}

export function validateNormalizedPercent(value, field = 'scorePercent') {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${field} must be a finite number.`);
  }
  const numeric = Number(value);
  if (numeric < 0 || numeric > 100) {
    throw new RangeError(`${field} must be between 0 and 100.`);
  }
  return numeric;
}

export function validateAssignmentConfig(config = {}) {
  const minimumPercent = config.minimumPercent == null || config.minimumPercent === ''
    ? null
    : validateNormalizedPercent(config.minimumPercent, 'minimumPercent');

  return {
    gameId: requireNonEmptyString(config.gameId, 'gameId'),
    modeId: requireNonEmptyString(config.modeId, 'modeId'),
    difficultyId: requireNonEmptyString(config.difficultyId, 'difficultyId'),
    minimumPercent
  };
}

export function canSubmitResult({ assignmentOpen, scorePercent, minimumPercent = null } = {}) {
  if (!assignmentOpen) return false;
  const score = validateNormalizedPercent(scorePercent);
  if (minimumPercent == null || minimumPercent === '') return true;
  const minimum = validateNormalizedPercent(minimumPercent, 'minimumPercent');
  return score >= minimum;
}

export function validateAttemptSummary(summary = {}) {
  const startedAt = requireTimestamp(summary.startedAt, 'startedAt');
  const completedAt = requireTimestamp(summary.completedAt, 'completedAt');
  if (completedAt < startedAt) {
    throw new RangeError('completedAt cannot be earlier than startedAt.');
  }
  if (summary.completed !== true) {
    throw new TypeError('completed must be true for an official completed attempt.');
  }

  const errorCodes = summary.errorCodes == null ? {} : summary.errorCodes;
  if (!errorCodes || typeof errorCodes !== 'object' || Array.isArray(errorCodes)) {
    throw new TypeError('errorCodes must be an object.');
  }
  const normalizedErrorCodes = {};
  for (const [key, value] of Object.entries(errorCodes)) {
    const code = requireNonEmptyString(key, 'error code');
    normalizedErrorCodes[code] = requireCount(value, `errorCodes.${code}`);
  }

  return {
    attemptId: requireNonEmptyString(summary.attemptId, 'attemptId'),
    sessionId: requireNonEmptyString(summary.sessionId, 'sessionId'),
    assignmentId: requireNonEmptyString(summary.assignmentId, 'assignmentId'),
    gameId: requireNonEmptyString(summary.gameId, 'gameId'),
    modeId: requireNonEmptyString(summary.modeId, 'modeId'),
    difficultyId: requireNonEmptyString(summary.difficultyId, 'difficultyId'),
    startedAt,
    completedAt,
    completed: true,
    successes: requireCount(summary.successes, 'successes'),
    errors: requireCount(summary.errors, 'errors'),
    scorePercent: validateNormalizedPercent(summary.scorePercent),
    errorCodes: normalizedErrorCodes
  };
}

export function receiptExpiresAt(createdAt) {
  return addUtcMonthsClamped(createdAt, 6);
}

export function isReceiptVerifiable({ createdAt, now = Date.now(), status = 'active' } = {}) {
  if (status !== 'active') return false;
  const currentTime = requireTimestamp(now, 'now');
  return currentTime < receiptExpiresAt(createdAt);
}