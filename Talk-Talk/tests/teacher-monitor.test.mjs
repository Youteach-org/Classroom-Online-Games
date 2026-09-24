import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildAssessmentPolicy,
  buildMonitorSnapshot,
  buildTwistCommand,
  buildEndActivityCommand
} from "../teacher/monitor-model.mjs";

test("practice permits hints, retries and corrective feedback", () => {
  const policy=buildAssessmentPolicy("practice");
  assert.equal(policy.mode,"practice");
  assert.equal(policy.hintsAllowed,true);
  assert.equal(policy.retriesAllowed,true);
  assert.equal(policy.midTaskCorrectiveFeedback,true);
  assert.ok(policy.minimumScoredConfidence < buildAssessmentPolicy("assessment").minimumScoredConfidence);
});

test("assessment disables hints, retries and mid-task corrective feedback", () => {
  const policy=buildAssessmentPolicy("assessment");
  assert.equal(policy.mode,"assessment");
  assert.equal(policy.hintsAllowed,false);
  assert.equal(policy.retriesAllowed,false);
  assert.equal(policy.midTaskCorrectiveFeedback,false);
  assert.ok(policy.minimumScoredConfidence >= 0.8);
});

test("monitor snapshot is team-first and hides linguistic scores without reportable evidence", () => {
  const snapshot=buildMonitorSnapshot({
    sessionId:"s1",
    mode:"practice",
    teams:[
      {
        teamId:"team-a",
        state:"speaking",
        members:[
          { studentKey:"a", nickname:"Ana", online:true, reportableEvidence:false, dimensions:{ pronunciation:88 } },
          { studentKey:"b", nickname:"Beto", online:true, reportableEvidence:true, dimensions:{ interaction:76 } }
        ]
      }
    ]
  });

  assert.equal(snapshot.teams[0].state,"speaking");
  assert.equal(snapshot.teams[0].members[0].dimensions,null);
  assert.deepEqual(snapshot.teams[0].members[1].dimensions,{ interaction:76 });
});

test("technical problem takes precedence over speaking/ready in team state", () => {
  const snapshot=buildMonitorSnapshot({
    teams:[{
      teamId:"team-a",
      members:[
        { studentKey:"a", online:true, phase:"speak", technicalProblem:true },
        { studentKey:"b", online:true, phase:"speak" }
      ]
    }]
  });
  assert.equal(snapshot.teams[0].state,"technical-problem");
});

test("teacher commands are scoped to the active COG session", () => {
  assert.deepEqual(
    buildTwistCommand({ cogSessionId:"c1", teamId:"t1", twistId:"remember-detail" }),
    { type:"talk-talk-twist", cogSessionId:"c1", teamId:"t1", twistId:"remember-detail" }
  );
  assert.deepEqual(
    buildEndActivityCommand({ cogSessionId:"c1" }),
    { type:"talk-talk-end-activity", cogSessionId:"c1" }
  );
});

test("teacher shell exposes team grid, mode and teacher actions", async () => {
  const html=await readFile(new URL("../teacher.html",import.meta.url),"utf8");
  assert.match(html,/id="teamGrid"/);
  assert.match(html,/id="activityMode"/);
  assert.match(html,/id="sendTwistBtn"/);
  assert.match(html,/id="endActivityBtn"/);
});
