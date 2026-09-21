import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Cloudflare production packaging includes Talk-Talk", async () => {
  const workflow=await readFile(new URL("../.github/workflows/cloudflare-pages-main.yml",import.meta.url),"utf8");
  const mentions=[...workflow.matchAll(/cp -R ([^\n]+)/g)].map(match=>match[1]);

  assert.ok(
    mentions.some(line=>/\bTalk-Talk\b/.test(line)),
    "Prepare static site must copy Talk-Talk into dist"
  );

  assert.match(
    workflow,
    /BUILD_COMMAND=.*Talk-Talk/,
    "Pinned Cloudflare build command must include Talk-Talk"
  );
});
