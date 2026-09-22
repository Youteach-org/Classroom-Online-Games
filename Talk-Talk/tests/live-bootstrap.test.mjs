import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  bootstrapTalkTalkStudent,
  createFreeStudentIdentity
} from "../live/student-bootstrap.mjs";

function storageStub() {
  const values=new Map();
  return {
    getItem:key=>values.get(key) ?? null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
}

test("live bootstrap resolves YouTeach launch and uses canonical student identity", async () => {
  const storage=storageStub();
  let called=null;
  const context={
    identity:{studentKey:"student-7",nickname:"Nico"},
    liveContext:{gameId:"talk-talk",cogSessionId:"TT7",youTeachSessionId:"yt7",groupName:"533-2"},
    teamContext:{teamKey:"team1",teamLabel:"Team 1",memberKeys:["student-7"],memberNames:["Nico"],teamRevision:"r1"},
    bridgeToken:"bridge",
    bridgeExpiresAt:Date.now()+60_000,
    issuer:"https://talk-talk-v1-20260921.youteach.pages.dev"
  };

  const out=await bootstrapTalkTalkStudent({
    search:"?ytLiveStudent=launch-token&issuer=https%3A%2F%2Ftalk-talk-v1-20260921.youteach.pages.dev",
    storage,
    resolveLaunch:async args => { called=args; return context; },
    saveContext:(value,store) => { store.setItem("saved",JSON.stringify(value)); return value; },
    loadContext:()=>null
  });

  assert.equal(called.token,"launch-token");
  assert.equal(out.mode,"live");
  assert.equal(out.studentKey,"student-7");
  assert.equal(out.liveContext.studentKey,"student-7");
  assert.equal(out.liveContext.teamContext.teamKey,"team1");
});

test("free bootstrap creates stable local identity without pretending to be a YouTeach student", async () => {
  const storage=storageStub();
  const first=createFreeStudentIdentity(storage);
  const second=createFreeStudentIdentity(storage);
  assert.equal(first.studentKey,second.studentKey);
  assert.match(first.studentKey,/^free-/);

  const out=await bootstrapTalkTalkStudent({
    search:"",
    storage,
    loadContext:()=>null
  });
  assert.equal(out.mode,"free");
  assert.match(out.studentKey,/^free-/);
  assert.equal(out.liveContext,null);
});

test("student app uses bootstrap instead of hard-coded local-preview identity", async () => {
  const source=await readFile(new URL("../app.mjs",import.meta.url),"utf8");
  assert.match(source,/bootstrapTalkTalkStudent/);
  assert.doesNotMatch(source,/studentKey:\s*"local-preview"/);
});
