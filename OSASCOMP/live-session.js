import {
  loadTeacherContext,
  registerLiveGameSession,
  endLiveGameSession,
  heartbeatTeacher,
  resolveStudentLaunch,
  saveStudentContext,
  heartbeatStudent,
  submitLiveResult
} from '../shared/youteach-live-bridge.mjs';

export const OSASCOMP_GAME_ID = 'osascomp';
export const OSASCOMP_GAME_NAME = 'OSASCOMP';

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function roomForTeacherContext(context) {
  const liveContext = context?.liveContext || {};
  const sessionId = String(liveContext.youTeachSessionId || '').trim();
  const assignmentId = String(liveContext.assignmentId || '').trim();
  if (!sessionId || !assignmentId) return '';
  const hash = hash32(`${sessionId}|${assignmentId}|osascomp`)
    .toString(36)
    .toUpperCase()
    .padStart(7, '0')
    .slice(-7);
  return `YTOSA${hash}`;
}

export function loadOsascompTeacherContext() {
  return loadTeacherContext();
}

export async function registerOsascompSession({
  teacherContext,
  room,
  fetchImpl = globalThis.fetch
} = {}) {
  return registerLiveGameSession({
    teacherContext,
    gameId: OSASCOMP_GAME_ID,
    gameName: OSASCOMP_GAME_NAME,
    cogSessionId: String(room || ''),
    fetchImpl
  });
}

export async function endOsascompSession({
  teacherContext,
  room,
  fetchImpl = globalThis.fetch
} = {}) {
  return endLiveGameSession({
    teacherContext,
    cogSessionId: String(room || ''),
    fetchImpl
  });
}

export async function heartbeatOsascompTeacher({
  teacherContext,
  room,
  fetchImpl = globalThis.fetch
} = {}) {
  return heartbeatTeacher({
    teacherContext,
    cogSessionId: String(room || ''),
    fetchImpl
  });
}

export async function resolveOsascompStudentLaunch({
  search = globalThis.location?.search || '',
  fetchImpl = globalThis.fetch,
  storage = globalThis.sessionStorage
} = {}) {
  const params = new URLSearchParams(search);
  const token = String(params.get('ytLiveStudent') || '').trim();
  const issuer = String(params.get('issuer') || '').trim();
  if (!token || !issuer) return null;

  const context = await resolveStudentLaunch({ token, issuer, fetchImpl });
  if (
    context?.liveContext?.gameId !== OSASCOMP_GAME_ID ||
    !context?.liveContext?.cogSessionId
  ) {
    throw new Error('This YouTeach activity is not an OSASCOMP session.');
  }

  saveStudentContext(context, storage);
  return context;
}

export async function heartbeatOsascompStudent({
  studentContext,
  fetchImpl = globalThis.fetch
} = {}) {
  return heartbeatStudent({ studentContext, fetchImpl });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function submitOsascompLiveResult({
  studentContext,
  attemptId,
  completedAt,
  score,
  accuracy,
  correct,
  attempts,
  bestCombo,
  mode,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!studentContext) return null;

  const cleanAttemptId = String(attemptId || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 100);
  if (!cleanAttemptId) throw new Error('Missing OSASCOMP attempt id.');

  const sessionId = String(studentContext.liveContext?.cogSessionId || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
  const studentKey = String(studentContext.identity?.studentKey || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);

  const cleanScore = Math.max(0, Math.round(Number(score) || 0));
  const cleanCorrect = Math.max(0, Math.round(Number(correct) || 0));
  const cleanAttempts = Math.max(0, Math.round(Number(attempts) || 0));
  const result = {
    schemaVersion: 1,
    resultId: `osa_${sessionId || 'live'}_${studentKey || 'student'}_${cleanAttemptId}`.slice(0, 160),
    attemptId: cleanAttemptId,
    resultType: 'individual',
    completedAt: Number(completedAt || Date.now()),
    percentage: Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0))),
    points: cleanScore,
    metrics: {
      score: cleanScore,
      correct: cleanCorrect,
      errors: Math.max(0, cleanAttempts - cleanCorrect),
      attempts: cleanAttempts,
      bestCombo: Math.max(0, Math.round(Number(bestCombo) || 0)),
      mode: String(mode || '').trim().slice(0, 80)
    }
  };

  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await submitLiveResult({
        studentContext,
        result,
        fetchImpl
      });
    } catch (error) {
      lastError = error;
      if ([401, 403, 409, 410].includes(Number(error?.status))) break;
      if (attempt < 3) await wait(attempt * 1000);
    }
  }

  throw lastError || new Error('Could not return the OSASCOMP result to YouTeach.');
}
