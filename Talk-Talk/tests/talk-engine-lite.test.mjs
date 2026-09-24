import test from "node:test";
import assert from "node:assert/strict";
import {
  createConversation,
  respond
} from "../conversation/talk-engine-lite.mjs";
import { createLocalAiAdapter } from "../conversation/local-ai-adapter.mjs";
import {
  HOTEL_SCENARIO,
  TELL_ME_WHAT_HAPPENED_SCENARIO
} from "../conversation/scenarios.mjs";

test("lite engine follows the learner's stated problem", () => {
  const conversation = createConversation(HOTEL_SCENARIO, {});
  const result = respond(conversation, { text: "My room is very noisy." });

  assert.match(result.reply.toLowerCase(), /noise|room|hear/);
  assert.ok(result.state.turnCount >= 1);
});

test("Tell Me What Happened responds to a past-event detail", () => {
  const conversation = createConversation(TELL_ME_WHAT_HAPPENED_SCENARIO, {});
  const result = respond(conversation, { text: "Yesterday I walked home and I saw an accident." });

  assert.match(result.reply.toLowerCase(), /what happened next|then|detail/);
});

test("lite engine emits the configured twist after enough learner turns", () => {
  let conversation = createConversation(TELL_ME_WHAT_HAPPENED_SCENARIO, {});
  let result;

  for (const text of [
    "Yesterday something strange happened.",
    "I walked home after class.",
    "Then I saw a bicycle in the street."
  ]) {
    result = respond(conversation, { text });
    conversation = result.state;
  }

  assert.equal(result.optionalTwist?.id, "remember-detail");
});

test("local AI failure falls back without failing the activity", async () => {
  const adapter = createLocalAiAdapter({
    kind: "local",
    async generate() {
      throw new Error("oom");
    }
  });

  const result = await adapter.respond({
    context: { learnerText: "I saw something yesterday." },
    fallback: () => ({ reply: "Tell me what happened next." })
  });

  assert.equal(result.reply, "Tell me what happened next.");
  assert.equal(result.usedFallback, true);
});

test("local AI adapter rejects a remote runtime", () => {
  assert.throws(
    () => createLocalAiAdapter({ kind: "remote", generate: async () => "hello" }),
    /local/i
  );
});
