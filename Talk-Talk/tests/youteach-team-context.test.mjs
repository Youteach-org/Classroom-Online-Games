import test from "node:test";
import assert from "node:assert/strict";

import { resolveStudentLaunch } from "../../shared/youteach-live-bridge.mjs";
import {
  createTalkTalkLiveContext,
  normalizeTalkTalkTeamContext
} from "../live/youteach-talk-talk-live.mjs";

test("generic YouTeach bridge normalizes optional Talk Talk team context", async () => {
  const context = await resolveStudentLaunch({
    token: "student-launch-token",
    issuer: "https://youteach.pages.dev",
    fetchImpl: async () => new Response(JSON.stringify({
      ok: true,
      identity: {
        studentKey: "student-1",
        nickname: "Sandra",
        fullName: "Sandra Alvarado",
        groupName: "533-2",
        studentNumber: "A001"
      },
      liveContext: {
        youTeachSessionId: "yt-123",
        groupName: "533-2",
        gameId: "talk-talk",
        gameName: "Talk Talk",
        cogSessionId: "TT123",
        assignmentId: "assignment-1"
      },
      teamContext: {
        teamKey: "team1",
        teamLabel: "Team 1",
        memberKeys: ["student-1", "student-2"],
        memberNames: ["Sandra", "Paul"],
        teamRevision: "yt-123:teams:1",
        forgedExtra: "drop-me"
      },
      bridgeToken: "student-bridge-token",
      bridgeExpiresAt: Date.now() + 60_000
    }), { status: 200, headers: { "Content-Type":"application/json" } })
  });

  assert.deepEqual(context.teamContext, {
    teamKey: "team1",
    teamLabel: "Team 1",
    memberKeys: ["student-1", "student-2"],
    memberNames: ["Sandra", "Paul"],
    teamRevision: "yt-123:teams:1"
  });

  const live = createTalkTalkLiveContext(context);
  assert.equal(live.studentKey, "student-1");
  assert.equal(live.cogSessionId, "TT123");
  assert.equal(live.teamContext.teamKey, "team1");
});

test("team context is optional for generic bridge but required by Talk Talk live context", () => {
  assert.equal(normalizeTalkTalkTeamContext(null), null);
  assert.throws(
    () => createTalkTalkLiveContext({
      identity: { studentKey:"student-1" },
      liveContext: { gameId:"talk-talk", cogSessionId:"TT123" },
      teamContext: null
    }),
    /team context/i
  );
});
