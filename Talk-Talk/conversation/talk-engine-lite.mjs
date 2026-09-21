function normalizeDefinition(definition) {
  if (!definition?.id) throw new Error("Conversation definition requires an id.");
  return {
    id: String(definition.id),
    opening: String(definition.opening || ""),
    goals: Array.isArray(definition.goals) ? definition.goals : [],
    intents: Array.isArray(definition.intents) ? definition.intents : [],
    fallbackReplies: Array.isArray(definition.fallbackReplies) && definition.fallbackReplies.length
      ? definition.fallbackReplies.map(String)
      : ["Tell me more."],
    twist: definition.twist || null
  };
}

function lowerText(value) {
  return String(value || "").trim().toLowerCase();
}

function matchIntent(definition, text) {
  const clean = lowerText(text);
  return definition.intents.find(intent =>
    (intent.patterns || []).some(pattern => clean.includes(String(pattern).toLowerCase()))
  ) || null;
}

function completedGoalIds(definition, matchedIntents) {
  const set = new Set(matchedIntents);
  return definition.goals
    .filter(goal => (goal.intents || []).some(intent => set.has(intent)))
    .map(goal => goal.id);
}

function replyFor(intent, fallbackReplies, turnCount) {
  const replies = intent?.replies?.length ? intent.replies : fallbackReplies;
  return String(replies[(Math.max(1, turnCount) - 1) % replies.length] || "Tell me more.");
}

export function createConversation(definition, learnerContext = {}) {
  const normalized = normalizeDefinition(definition);
  return {
    definition: normalized,
    learnerContext: { ...learnerContext },
    turnCount: 0,
    matchedIntents: [],
    completedGoals: [],
    twistEmitted: false,
    history: []
  };
}

export function respond(conversation, learnerTurn = {}) {
  if (!conversation?.definition) throw new Error("A Talk Talk conversation state is required.");

  const text = String(learnerTurn.text || "").trim();
  const turnCount = Number(conversation.turnCount || 0) + 1;
  const intent = matchIntent(conversation.definition, text);
  const matchedIntents = intent && !conversation.matchedIntents.includes(intent.id)
    ? [...conversation.matchedIntents, intent.id]
    : [...conversation.matchedIntents];
  const completedGoals = completedGoalIds(conversation.definition, matchedIntents);
  const reply = replyFor(intent, conversation.definition.fallbackReplies, turnCount);

  const twist = conversation.definition.twist;
  const shouldEmitTwist = Boolean(
    twist &&
    !conversation.twistEmitted &&
    turnCount >= Number(twist.afterTurns || Infinity)
  );
  const optionalTwist = shouldEmitTwist
    ? { id:String(twist.id || "twist"), text:String(twist.text || "") }
    : null;

  const state = {
    ...conversation,
    turnCount,
    matchedIntents,
    completedGoals,
    twistEmitted: conversation.twistEmitted || shouldEmitTwist,
    history: [
      ...conversation.history,
      {
        turn: turnCount,
        learnerText: text,
        matchedIntent: intent?.id || null,
        reply
      }
    ]
  };

  return {
    reply,
    state,
    completedGoals,
    optionalTwist
  };
}
