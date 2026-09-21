const DEFAULT_DATABASE_URL = "https://youteach-d9a79-default-rtdb.firebaseio.com";
const DEFAULT_ROOT = "classroomGames/talkTalk";

function segment(value) {
  return encodeURIComponent(String(value || "").trim());
}

function teamPath(cogSessionId, teamKey) {
  const session = segment(cogSessionId);
  const team = segment(teamKey);
  if (!session || !team) throw new Error("Talk Talk realtime path requires session and team.");
  return `${DEFAULT_ROOT}/sessions/${session}/teams/${team}`;
}

async function requestJson(fetchImpl, databaseUrl, path, method = "GET", body) {
  const response = await fetchImpl(`${databaseUrl}/${path}.json`, {
    method,
    headers: method === "GET" ? undefined : { "Content-Type":"application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Talk Talk Firebase ${method} failed: ${response.status}`);
  return response.json().catch(() => null);
}

export function createTalkTalkFirebaseClient({
  databaseUrl = DEFAULT_DATABASE_URL,
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Firebase client requires fetch.");

  return Object.freeze({
    async getTeam(cogSessionId, teamKey) {
      return requestJson(fetchImpl, databaseUrl, teamPath(cogSessionId, teamKey));
    },

    async confirmMember(cogSessionId, teamKey, confirmation) {
      const studentKey = segment(confirmation?.studentKey);
      if (!studentKey) throw new Error("Confirmation requires studentKey.");
      return requestJson(
        fetchImpl,
        databaseUrl,
        `${teamPath(cogSessionId, teamKey)}/confirmations/${studentKey}`,
        "PUT",
        confirmation
      );
    },

    async setHost(cogSessionId, teamKey, hostStudentKey) {
      return requestJson(
        fetchImpl,
        databaseUrl,
        `${teamPath(cogSessionId, teamKey)}/hostStudentKey`,
        "PUT",
        String(hostStudentKey || "")
      );
    },

    async patchTeam(cogSessionId, teamKey, patch) {
      return requestJson(
        fetchImpl,
        databaseUrl,
        teamPath(cogSessionId, teamKey),
        "PATCH",
        patch || {}
      );
    },

    async publishTurnEvent(cogSessionId, teamKey, event) {
      const eventId = segment(event?.eventId || event?.resultId);
      if (!eventId) throw new Error("Turn event requires an id.");
      return requestJson(
        fetchImpl,
        databaseUrl,
        `${teamPath(cogSessionId, teamKey)}/turnEvents/${eventId}`,
        "PUT",
        event
      );
    }
  });
}

export { DEFAULT_DATABASE_URL, DEFAULT_ROOT };
