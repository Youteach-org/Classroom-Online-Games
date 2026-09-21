import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Talk Talk shell exposes student and teacher entry points", async () => {
  const student = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const teacher = await readFile(new URL("../teacher.html", import.meta.url), "utf8");

  assert.match(student, /<script type="module" src="\.\/app\.mjs"><\/script>/);
  assert.match(teacher, /<script type="module" src="\.\/teacher-app\.mjs"><\/script>/);
});
