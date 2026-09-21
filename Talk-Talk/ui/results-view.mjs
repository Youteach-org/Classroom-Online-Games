function cleanDimension(raw) {
  return {
    value: raw?.value ?? null,
    confidence: String(raw?.confidence || "low"),
    evidence: Array.isArray(raw?.evidence) ? raw.evidence : []
  };
}

export function buildResultsModel(evaluation = {}, turns = []) {
  const safeTurns = (turns || []).map(turn => ({
    turnId: String(turn.turnId || ""),
    transcript: String(turn.transcript || ""),
    understood: String(turn.understood || ""),
    evaluation: turn.evaluation || null,
    retryPrompt: String(turn.retryPrompt || "")
  }));

  return {
    overall: evaluation.overall ?? null,
    strength: evaluation.strength || null,
    primaryFocus: evaluation.primaryFocus || null,
    technicalRetry: evaluation.technicalRetry === true,
    dimensions: Object.fromEntries(
      Object.entries(evaluation.dimensions || {}).map(([key, value]) => [key, cleanDimension(value)])
    ),
    turns: safeTurns
  };
}

export function renderResultsView(container, model) {
  if (!container) return;
  container.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = "Results";
  container.append(title);

  if (!model || model.technicalRetry) {
    const note = document.createElement("p");
    note.textContent = "We could not evaluate this attempt reliably. Try again.";
    container.append(note);
    return;
  }

  const strength = document.createElement("p");
  strength.innerHTML = model.strength
    ? `<strong>Strong:</strong> ${model.strength.dimension}`
    : "<strong>Strong:</strong> Keep speaking — more evidence is needed.";

  const focus = document.createElement("p");
  focus.innerHTML = model.primaryFocus
    ? `<strong>Your Focus:</strong> ${model.primaryFocus.skillId}`
    : "<strong>Your Focus:</strong> No recurring priority yet.";

  container.append(strength, focus);
}
