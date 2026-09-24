export function buildConversationReplay(turns = []) {
  return turns.map(turn => ({
    turnId: String(turn.turnId || ""),
    transcript: String(turn.transcript || "").trim(),
    understood: String(turn.understood || turn.transcript || "").trim(),
    retryPrompt: String(turn.retryPrompt || "").trim(),
    primaryFocus: turn.evaluation?.primaryFocus || null
  }));
}

export function renderConversationReplay(container, turns = []) {
  if (!container) return;
  container.innerHTML = "";
  for (const turn of buildConversationReplay(turns)) {
    const item = document.createElement("article");
    item.className = "replay-turn";
    const text = document.createElement("p");
    text.textContent = turn.transcript || "No transcript available.";
    item.append(text);
    if (turn.primaryFocus) {
      const focus = document.createElement("small");
      focus.textContent = `Focus: ${turn.primaryFocus.skillId}`;
      item.append(focus);
    }
    container.append(item);
  }
}
