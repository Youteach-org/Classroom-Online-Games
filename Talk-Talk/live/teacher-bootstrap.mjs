import {
  consumeTeacherLaunch,
  loadTeacherContext,
  registerLiveGameSession,
  heartbeatTeacher,
  endLiveGameSession
} from "../../shared/youteach-live-bridge.mjs";

function cleanId(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function talkTalkCogSessionId(teacherContext) {
  const assignmentId=cleanId(teacherContext?.liveContext?.assignmentId);
  const sessionId=cleanId(teacherContext?.liveContext?.youTeachSessionId);
  const seed=assignmentId || sessionId || "session";
  return `TT-${seed.slice(-56)}`;
}

export async function bootstrapTalkTalkTeacher({
  search = globalThis.location?.search || "",
  storage = globalThis.sessionStorage,
  consumeLaunch = consumeTeacherLaunch,
  loadContext = loadTeacherContext,
  registerSession = registerLiveGameSession,
  heartbeat = heartbeatTeacher
} = {}) {
  const params=new URLSearchParams(search);
  const hasLaunch=Boolean(params.get("ytLiveTeacher") && params.get("issuer"));

  const teacherContext=hasLaunch
    ? await consumeLaunch({ search, storage })
    : loadContext(storage);

  if (!teacherContext) {
    return Object.freeze({
      mode:"standalone",
      teacherContext:null,
      cogSessionId:"",
      groupName:"",
      assignmentTitle:"Tell Me What Happened"
    });
  }

  const cogSessionId=talkTalkCogSessionId(teacherContext);
  await registerSession({
    teacherContext,
    gameId:"talk-talk",
    gameName:"Talk Talk",
    cogSessionId
  });
  await heartbeat({ teacherContext, cogSessionId });

  return Object.freeze({
    mode:"live",
    teacherContext,
    cogSessionId,
    groupName:String(teacherContext.liveContext?.groupName || ""),
    assignmentTitle:String(
      teacherContext.liveContext?.assignmentTitle ||
      "Talk Talk · Tell Me What Happened"
    )
  });
}

export function startTalkTalkTeacherHeartbeat(runtime, {
  intervalMs=25_000,
  heartbeat=heartbeatTeacher,
  setIntervalImpl=globalThis.setInterval,
  clearIntervalImpl=globalThis.clearInterval
} = {}) {
  if (runtime?.mode !== "live" || !runtime.teacherContext || !runtime.cogSessionId) {
    return () => {};
  }

  let stopped=false;
  const beat=async()=>{
    if(stopped) return;
    try {
      await heartbeat({
        teacherContext:runtime.teacherContext,
        cogSessionId:runtime.cogSessionId
      });
    } catch {
      // Connectivity state is technical; the monitor remains usable.
    }
  };

  void beat();
  const timer=setIntervalImpl?.(beat,intervalMs);
  return ()=>{
    stopped=true;
    if(timer != null) clearIntervalImpl?.(timer);
  };
}

export async function endTalkTalkTeacher(runtime, {
  endSession=endLiveGameSession
} = {}) {
  if (runtime?.mode !== "live" || !runtime.teacherContext || !runtime.cogSessionId) {
    return { ok:true, standalone:true };
  }
  return endSession({
    teacherContext:runtime.teacherContext,
    cogSessionId:runtime.cogSessionId
  });
}
