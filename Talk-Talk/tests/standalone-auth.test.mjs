import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  authenticateStandaloneUser,
  routeForStandaloneRole
} from "../standalone-auth.mjs";

test("standalone credentials distinguish student and teacher", () => {
  assert.deepEqual(authenticateStandaloneUser("student","talktalk"), { role:"student", username:"student" });
  assert.deepEqual(authenticateStandaloneUser("teacher","talktalk"), { role:"teacher", username:"teacher" });
  assert.equal(authenticateStandaloneUser("student","wrong"), null);
  assert.equal(authenticateStandaloneUser("unknown","talktalk"), null);
});

test("standalone roles route to the correct Talk Talk screens", () => {
  assert.equal(routeForStandaloneRole("student"), "./index.html");
  assert.equal(routeForStandaloneRole("teacher"), "./teacher.html");
  assert.equal(routeForStandaloneRole("other"), "./login.html");
});

test("standalone login shell exposes credential fields", async () => {
  const html=await readFile(new URL("../login.html",import.meta.url),"utf8");
  assert.match(html,/id="standaloneUsername"/);
  assert.match(html,/id="standalonePassword"/);
  assert.match(html,/id="standaloneLoginForm"/);
  assert.match(html,/student \/ talktalk/i);
  assert.match(html,/teacher \/ talktalk/i);
});
