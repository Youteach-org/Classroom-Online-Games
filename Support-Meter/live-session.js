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

export const SUPPORT_METER_GAME_ID = 'support-meter';
export const SUPPORT_METER_GAME_NAME = 'Support Meter';

export function loadSupportMeterTeacherContext() {
  return loadTeacherContext();
}

export async function registerSupportMeterSession({
  teacherContext,
  sessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  return registerLiveGameSession({
    teacherContext,
    gameId: SUPPORT_METER_GAME_ID,
    gameName: SUPPORT_METER_GAME_NAME,
    cogSessionId: String(sessionId || ''),
    fetchImpl
  });
}

export async function endSupportMeterSession({
  teacherContext,
  sessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  return endLiveGameSession({
    teacherContext,
    cogSessionId: String(sessionId || ''),
    fetchImpl
  });
}

export async function heartbeatSupportMeterTeacher({
  teacherContext,
  sessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  return heartbeatTeacher({
    teacherContext,
    cogSessionId: String(sessionId || ''),
    fetchImpl
  });
}

export async function resolveSupportMeterStudentLaunch({
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
    context?.liveContext?.gameId !== SUPPORT_METER_GAME_ID ||
    !context?.liveContext?.cogSessionId
  ) {
    throw new Error('This YouTeach activity is not a Support Meter session.');
  }

  saveStudentContext(context, storage);
  return context;
}

export async function heartbeatSupportMeterStudent({
  studentContext,
  fetchImpl = globalThis.fetch
} = {}) {
  return heartbeatStudent({ studentContext, fetchImpl });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function submitSupportMeterLiveResult({
  studentContext,
  runId,
  completedAt,
  supportMeter,
  streak,
  storiesCompleted,
  translationAttempts,
  fetchImpl = globalThis.fetch
} = {}) {
  if (!studentContext) return null;

  const cleanRunId = String(runId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 96);
  if (!cleanRunId) throw new Error('Missing Support Meter run id.');

  const sessionId = String(studentContext.liveContext?.cogSessionId || '')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 48);
  const result = {
    schemaVersion: 1,
    resultId: `sm_${sessionId || 'live'}_${cleanRunId}`.slice(0, 160),
    attemptId: cleanRunId,
    resultType: 'individual',
    completedAt: Number(completedAt || Date.now()),
    percentage: Math.max(0, Math.min(100, Math.round(Number(supportMeter) || 0))),
    points: null,
    metrics: {
      supportMeter: Number(supportMeter) || 0,
      streak: Number(streak) || 0,
      storiesCompleted: Number(storiesCompleted) || 0,
      translationAttempts: Number(translationAttempts) || 0,
      mode: 'support-meter'
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

  throw lastError || new Error('Could not return Support Meter result to YouTeach.');
}
