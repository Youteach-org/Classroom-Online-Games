import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  talkTalkCogSessionId,
  bootstrapTalkTalkTeacher,
  startTalkTalkTeacherHeartbeat
} from "../live/teacher-bootstrap.mjs";

test("Teacher Monitors exposes Talk Talk", async () => {
  const html=await readFile(new URL("../../teacher/index.html",import.meta.url),"utf8");
  assert.match(html,/href="\/Talk-Talk\/teacher\.html"/);
  assert.match(html,/Talk Talk Monitor/);
});

test("Talk Talk teacher bootstrap registers the YouTeach live session", async () => {
  const calls=[];
  const teacherContext={
    liveContext:{
      youTeachSessionId:"yt-1",
      groupName:"FANTASMA",
      assignmentId:"talk-assignment",
      assignmentTitle:"Talk Talk · Tell Me What Happened"
    },
    bridgeToken:"bridge",
    bridgeExpiresAt:Date.now()+60000,
    issuer:"https://youteach.pages.dev",
    teacher:{username:"teacher",displayName:"Teacher"}
  };

  const runtime=await bootstrapTalkTalkTeacher({
    search:"?ytLiveTeacher=launch&issuer=https%3A%2F%2Fyouteach.pages.dev",
    consumeLaunch:async()=>teacherContext,
    registerSession:async args=>{calls.push(["register",args]);return {ok:true};},
    heartbeat:async args=>{calls.push(["heartbeat",args]);return {ok:true};}
  });

  assert.equal(runtime.mode,"live");
  assert.equal(runtime.groupName,"FANTASMA");
  assert.equal(runtime.cogSessionId,talkTalkCogSessionId(teacherContext));
  assert.equal(calls[0][0],"register");
  assert.equal(calls[0][1].gameId,"talk-talk");
  assert.equal(calls[0][1].gameName,"Talk Talk");
  assert.equal(calls[1][0],"heartbeat");
});

test("Talk Talk teacher heartbeat can be stopped cleanly", async () => {
  const callbacks=[];
  let clears=0;
  let beats=0;
  const stop=startTalkTalkTeacherHeartbeat({
    mode:"live",
    teacherContext:{},
    cogSessionId:"TT-123"
  },{
    heartbeat:async()=>{beats+=1;},
    setIntervalImpl:(fn)=>{callbacks.push(fn);return 9;},
    clearIntervalImpl:(id)=>{assert.equal(id,9);clears+=1;},
    intervalMs:10
  });
  await Promise.resolve();
  assert.ok(beats>=1);
  stop();
  assert.equal(clears,1);
});

test("Talk Talk teacher app uses the live teacher bootstrap", async () => {
  const source=await readFile(new URL("../teacher-app.mjs",import.meta.url),"utf8");
  assert.match(source,/bootstrapTalkTalkTeacher/);
  assert.match(source,/startTalkTalkTeacherHeartbeat/);
  assert.match(source,/endTalkTalkTeacher/);
});
