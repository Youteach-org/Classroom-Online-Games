import {
  resolveStudentLaunch,
  saveStudentContext,
  loadStudentContext,
  heartbeatStudent
} from "../../shared/youteach-live-bridge.mjs";
import { createTalkTalkLiveContext } from "./youteach-talk-talk-live.mjs";

const FREE_IDENTITY_KEY = "talkTalkFreeIdentity";

function randomPart() {
  const bytes = new Uint8Array(8);
  globalThis.crypto?.getRandomValues?.(bytes);
  if (bytes.some(Boolean)) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2, 14);
}

export function createFreeStudentIdentity(storage = globalThis.sessionStorage) {
  if (!storage?.getItem || !storage?.setItem) {
    return Object.freeze({ studentKey: `free-${randomPart()}`, nickname: "Learner" });
  }

  try {
    const existing = JSON.parse(storage.getItem(FREE_IDENTITY_KEY) || "null");
    if (String(existing?.studentKey || "").startsWith("free-")) {
      return Object.freeze({
        studentKey: String(existing.studentKey),
        nickname: String(existing.nickname || "Learner")
      });
    }
  } catch {}

  const identity = {
    studentKey: `free-${randomPart()}`,
    nickname: "Learner"
  };
  storage.setItem(FREE_IDENTITY_KEY, JSON.stringify(identity));
  return Object.freeze(identity);
}

export async function bootstrapTalkTalkStudent({
  search = globalThis.location?.search || "",
  storage = globalThis.sessionStorage,
  resolveLaunch = resolveStudentLaunch,
  saveContext = saveStudentContext,
  loadContext = loadStudentContext
} = {}) {
  const params = new URLSearchParams(search);
  const token = String(params.get("ytLiveStudent") || "").trim();
  const issuer = String(params.get("issuer") || "").trim();

  let studentContext = null;
  if (token && issuer) {
    studentContext = await resolveLaunch({ token, issuer });
    saveContext(studentContext, storage);
  } else {
    studentContext = loadContext(storage);
  }

  if (studentContext) {
    try {
      const liveContext = createTalkTalkLiveContext(studentContext);
      return Object.freeze({
        mode: "live",
        studentKey: liveContext.studentKey,
        identity: Object.freeze({ ...studentContext.identity }),
        studentContext,
        liveContext
      });
    } catch {
      // Stale contexts from another COG title must not impersonate Talk Talk learners.
    }
  }

  const identity = createFreeStudentIdentity(storage);
  return Object.freeze({
    mode: "free",
    studentKey: identity.studentKey,
    identity,
    studentContext: null,
    liveContext: null
  });
}

export function startTalkTalkHeartbeat(runtime, {
  intervalMs = 30_000,
  heartbeat = heartbeatStudent,
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval
} = {}) {
  if (runtime?.mode !== "live" || !runtime.studentContext || typeof heartbeat !== "function") {
    return () => {};
  }

  let stopped = false;
  const beat = async () => {
    if (stopped) return;
    try {
      await heartbeat({ studentContext: runtime.studentContext });
    } catch {
      // Connectivity failure is technical state, never academic evidence.
    }
  };

  void beat();
  const timer = setIntervalImpl?.(beat, intervalMs);
  return () => {
    stopped = true;
    if (timer != null) clearIntervalImpl?.(timer);
  };
}
