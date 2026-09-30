import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const core = readFileSync(join(here, "..", "aed-trainer", "trainer-core.cpp"), "utf8");

test("TrainerCore avoids exception-dependent parsing for ESP32 toolchains", () => {
  assert.doesNotMatch(core, /std::stoi/);
  assert.doesNotMatch(core, /\btry\s*\{/);
  assert.doesNotMatch(core, /\bcatch\s*\(/);
});
