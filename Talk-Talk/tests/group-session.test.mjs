import test from "node:test";
import assert from "node:assert/strict";

import {
  confirmTeamMember,
  chooseHost
} from "../group/group-session.mjs";

function studentContext(studentKey, teamKey = "team1") {
  return {
    identity: { studentKey, nickname: studentKey },
    liveContext: { gameId:"talk-talk", cogSessionId:"TT123" },
    teamContext: {
      teamKey,
      teamLabel:"Team 1",
      memberKeys:["a","b","c","d"],
      memberNames:["A","B","C","D"],
      teamRevision:"yt-123:teams:1"
    }
  };
}

test("confirmation is derived from canonical team context", () => {
  const out = confirmTeamMember(
    { cogSessionId:"TT123" },
    studentContext("b"),
    {
      tier:"standard",
      microphoneUsable:true,
      storageAvailableBytes:300_000_000
    }
  );
  assert.equal(out.studentKey, "b");
  assert.equal(out.teamKey, "team1");
  assert.equal(out.teamRevision, "yt-123:teams:1");
  assert.equal(out.microphoneUsable, true);
});

test("host election prioritizes usable mic, then tier, storage, then studentKey", () => {
  const confirmations = [
    { studentKey:"a", microphoneUsable:false, tier:"enhanced", storageAvailableBytes:900_000_000 },
    { studentKey:"d", microphoneUsable:true, tier:"basic", storageAvailableBytes:900_000_000 },
    { studentKey:"c", microphoneUsable:true, tier:"enhanced", storageAvailableBytes:200_000_000 },
    { studentKey:"b", microphoneUsable:true, tier:"enhanced", storageAvailableBytes:400_000_000 }
  ];
  assert.equal(chooseHost(confirmations), "b");
});

test("stable studentKey breaks a complete host-election tie", () => {
  const confirmations = [
    { studentKey:"zoe", microphoneUsable:true, tier:"standard", storageAvailableBytes:100 },
    { studentKey:"ana", microphoneUsable:true, tier:"standard", storageAvailableBytes:100 }
  ];
  assert.equal(chooseHost(confirmations), "ana");
});

test("student outside canonical team cannot confirm that team", () => {
  assert.throws(
    () => confirmTeamMember(
      { cogSessionId:"TT123" },
      {
        identity:{ studentKey:"intruder" },
        liveContext:{ gameId:"talk-talk", cogSessionId:"TT123" },
        teamContext:{
          teamKey:"team1",
          teamLabel:"Team 1",
          memberKeys:["a","b"],
          memberNames:["A","B"],
          teamRevision:"r1"
        }
      },
      { tier:"enhanced", microphoneUsable:true, storageAvailableBytes:1000 }
    ),
    /member/i
  );
});
