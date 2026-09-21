const TEACHER_CONTEXT_KEY = "cogYouTeachLiveTeacherContext";
const STUDENT_CONTEXT_KEY = "cogYouTeachLiveStudentContext";

export function normalizeYouTeachIssuer(rawIssuer) {
  try {
    const url = new URL(String(rawIssuer || ""));
    const host = url.hostname.toLowerCase();
    if (
      url.protocol === "https:" &&
      (
        host === "youteach.pages.dev" ||
        host.endsWith(".youteach.pages.dev")
      )
    ) {
      return url.origin;
    }
  } catch {}
  return "";
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

async function postJson(url, { token = "", body = {}, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Fetch is not available.");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const payload = await responseJson(response);
  if (!response.ok || payload?.ok !== true) {
    const error = new Error(payload?.error || "YouTeach live bridge request failed.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function validTeacherContext(context) {
  return Boolean(
    context &&
    normalizeYouTeachIssuer(context.issuer) &&
    context.teacher?.username &&
    context.liveContext?.youTeachSessionId &&
    context.liveContext?.groupName &&
    context.liveContext?.assignmentId &&
    context.bridgeToken
  );
}

export function normalizeYouTeachTeamContext(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const teamKey = String(raw.teamKey || "").trim();
  const teamLabel = String(raw.teamLabel || "").trim();
  const teamRevision = String(raw.teamRevision || "").trim();
  const memberKeys = Array.isArray(raw.memberKeys)
    ? raw.memberKeys.map(value => String(value || "").trim()).filter(Boolean)
    : [];
  const memberNames = Array.isArray(raw.memberNames)
    ? raw.memberNames.map(value => String(value || "").trim()).filter(Boolean)
    : [];

  if (!teamKey || !teamLabel || !teamRevision || !memberKeys.length) return null;
  return { teamKey, teamLabel, memberKeys, memberNames, teamRevision };
}

function validStudentContext(context) {
  return Boolean(
    context &&
    normalizeYouTeachIssuer(context.issuer) &&
    context.identity?.studentKey &&
    context.liveContext?.cogSessionId &&
    context.liveContext?.gameId &&
    context.bridgeToken
  );
}

export async function resolveTeacherLaunch({
  token,
  issuer,
  fetchImpl = globalThis.fetch
} = {}) {
  const cleanIssuer = normalizeYouTeachIssuer(issuer);
  const cleanToken = String(token || "").trim();
  if (!cleanIssuer || !cleanToken) throw new Error("Invalid YouTeach teacher launch.");

  const payload = await postJson(
    `${cleanIssuer}/api/cog-live-teacher-resolve`,
    { body: { token: cleanToken }, fetchImpl }
  );

  const context = {
    teacher: {
      username: String(payload?.teacher?.username || ""),
      role: String(payload?.teacher?.role || "teacher"),
      displayName: String(payload?.teacher?.displayName || "Teacher")
    },
    liveContext: {
      youTeachSessionId: String(payload?.liveContext?.youTeachSessionId || ""),
      groupName: String(payload?.liveContext?.groupName || ""),
      assignmentId: String(payload?.liveContext?.assignmentId || ""),
      assignmentCode: String(payload?.liveContext?.assignmentCode || ""),
      assignmentTitle: String(payload?.liveContext?.assignmentTitle || "")
    },
    bridgeToken: String(payload?.bridgeToken || ""),
    bridgeExpiresAt: Number(payload?.bridgeExpiresAt || 0),
    issuer: cleanIssuer
  };

  if (!validTeacherContext(context)) {
    throw new Error("YouTeach returned an incomplete teacher context.");
  }
  return context;
}

export function saveTeacherContext(context, storage = globalThis.sessionStorage) {
  if (!validTeacherContext(context)) throw new Error("Invalid teacher live context.");
  if (!storage?.setItem) throw new Error("Session storage is not available.");
  storage.setItem(TEACHER_CONTEXT_KEY, JSON.stringify(context));
  return context;
}

export function loadTeacherContext(storage = globalThis.sessionStorage) {
  if (!storage?.getItem) return null;
  try {
    const context = JSON.parse(storage.getItem(TEACHER_CONTEXT_KEY) || "null");
    if (!validTeacherContext(context)) return null;
    if (Number(context.bridgeExpiresAt || 0) <= Date.now()) {
      storage.removeItem?.(TEACHER_CONTEXT_KEY);
      return null;
    }
    return context;
  } catch {
    return null;
  }
}

export function clearTeacherContext(storage = globalThis.sessionStorage) {
  storage?.removeItem?.(TEACHER_CONTEXT_KEY);
}

export async function consumeTeacherLaunch({
  search = globalThis.location?.search || "",
  storage = globalThis.sessionStorage,
  fetchImpl = globalThis.fetch
} = {}) {
  const params = new URLSearchParams(search);
  const token = params.get("ytLiveTeacher") || "";
  const issuer = params.get("issuer") || "";

  if (token && issuer) {
    const context = await resolveTeacherLaunch({ token, issuer, fetchImpl });
    saveTeacherContext(context, storage);
    return context;
  }
  return loadTeacherContext(storage);
}

export async function registerLiveGameSession({
  teacherContext,
  gameId,
  gameName,
  cogSessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  const context = teacherContext || loadTeacherContext();
  if (!validTeacherContext(context)) throw new Error("Open Classroom Online Games from YouTeach Buzzer first.");
  return postJson(
    `${context.issuer}/api/cog-live-session-register`,
    {
      token: context.bridgeToken,
      body: {
        gameId: String(gameId || ""),
        gameName: String(gameName || ""),
        cogSessionId: String(cogSessionId || "")
      },
      fetchImpl
    }
  );
}

export async function endLiveGameSession({
  teacherContext,
  cogSessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  const context = teacherContext || loadTeacherContext();
  if (!validTeacherContext(context)) throw new Error("Missing YouTeach teacher context.");
  return postJson(
    `${context.issuer}/api/cog-live-session-end`,
    {
      token: context.bridgeToken,
      body: { cogSessionId: String(cogSessionId || "") },
      fetchImpl
    }
  );
}

export async function heartbeatTeacher({
  teacherContext,
  cogSessionId,
  fetchImpl = globalThis.fetch
} = {}) {
  const context = teacherContext || loadTeacherContext();
  if (!validTeacherContext(context)) throw new Error("Missing YouTeach teacher context.");
  return postJson(
    `${context.issuer}/api/cog-live-heartbeat`,
    {
      token: context.bridgeToken,
      body: {
        role: "teacher",
        cogSessionId: String(cogSessionId || "")
      },
      fetchImpl
    }
  );
}

export async function resolveStudentLaunch({
  token,
  issuer,
  fetchImpl = globalThis.fetch
} = {}) {
  const cleanIssuer = normalizeYouTeachIssuer(issuer);
  const cleanToken = String(token || "").trim();
  if (!cleanIssuer || !cleanToken) throw new Error("Invalid YouTeach student launch.");

  const payload = await postJson(
    `${cleanIssuer}/api/cog-live-student-resolve`,
    { body: { token: cleanToken }, fetchImpl }
  );

  const context = {
    identity: {
      studentKey: String(payload?.identity?.studentKey || ""),
      nickname: String(payload?.identity?.nickname || "Student"),
      fullName: String(payload?.identity?.fullName || ""),
      groupName: String(payload?.identity?.groupName || ""),
      studentNumber: String(payload?.identity?.studentNumber || "")
    },
    liveContext: {
      youTeachSessionId: String(payload?.liveContext?.youTeachSessionId || ""),
      groupName: String(payload?.liveContext?.groupName || ""),
      gameId: String(payload?.liveContext?.gameId || ""),
      gameName: String(payload?.liveContext?.gameName || ""),
      cogSessionId: String(payload?.liveContext?.cogSessionId || ""),
      assignmentId: String(payload?.liveContext?.assignmentId || ""),
      launchMode: "live-buzzer"
    },
    teamContext: normalizeYouTeachTeamContext(payload?.teamContext),
    bridgeToken: String(payload?.bridgeToken || ""),
    bridgeExpiresAt: Number(payload?.bridgeExpiresAt || 0),
    issuer: cleanIssuer
  };

  if (!validStudentContext(context)) {
    throw new Error("YouTeach returned an incomplete student context.");
  }
  return context;
}

export function saveStudentContext(context, storage = globalThis.sessionStorage) {
  if (!validStudentContext(context)) throw new Error("Invalid student live context.");
  if (!storage?.setItem) throw new Error("Session storage is not available.");
  storage.setItem(STUDENT_CONTEXT_KEY, JSON.stringify(context));
  return context;
}

export function loadStudentContext(storage = globalThis.sessionStorage) {
  if (!storage?.getItem) return null;
  try {
    const context = JSON.parse(storage.getItem(STUDENT_CONTEXT_KEY) || "null");
    if (!validStudentContext(context)) return null;
    if (Number(context.bridgeExpiresAt || 0) <= Date.now()) {
      storage.removeItem?.(STUDENT_CONTEXT_KEY);
      return null;
    }
    return context;
  } catch {
    return null;
  }
}

export async function heartbeatStudent({
  studentContext,
  fetchImpl = globalThis.fetch
} = {}) {
  const context = studentContext || loadStudentContext();
  if (!validStudentContext(context)) throw new Error("Missing YouTeach student context.");
  return postJson(
    `${context.issuer}/api/cog-live-heartbeat`,
    {
      token: context.bridgeToken,
      body: {
        role: "student",
        cogSessionId: context.liveContext.cogSessionId
      },
      fetchImpl
    }
  );
}

export async function submitLiveResult({
  studentContext,
  result,
  fetchImpl = globalThis.fetch
} = {}) {
  const context = studentContext || loadStudentContext();
  if (!validStudentContext(context)) throw new Error("Missing YouTeach student context.");
  return postJson(
    `${context.issuer}/api/cog-live-result-submit`,
    {
      token: context.bridgeToken,
      body: { result },
      fetchImpl
    }
  );
}
