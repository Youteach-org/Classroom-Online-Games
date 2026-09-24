function movesFor(turn) {
  return Array.isArray(turn?.interactionMoves)
    ? turn.interactionMoves.map(value => String(value || "").toLowerCase())
    : [];
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

export function analyzeInteraction(timeline = [], studentKey, task = {}) {
  const key = String(studentKey || "").trim();
  if (!key) throw new Error("Interaction analysis requires studentKey.");

  const turns = Array.isArray(timeline)
    ? timeline.filter(turn => String(turn?.studentKey || "") === key)
    : [];

  if (!turns.length) {
    return {
      studentKey:key,
      confidence:"low",
      score:null,
      evidence:[],
      respondedTurns:0,
      relevantFollowUps:0,
      clarificationMoves:0,
      repairMoves:0,
      initiatedTurns:0,
      sustainedExchange:false
    };
  }

  let respondedTurns=0;
  let relevantFollowUps=0;
  let clarificationMoves=0;
  let repairMoves=0;
  let initiatedTurns=0;

  for (const turn of turns) {
    const relevant=turn?.relevant !== false;
    const moves=movesFor(turn);
    if (turn?.respondsToTurnId && relevant) respondedTurns += 1;
    if (!turn?.respondsToTurnId) initiatedTurns += 1;
    if (relevant && moves.includes("follow-up")) relevantFollowUps += 1;
    if (moves.includes("clarification")) clarificationMoves += 1;
    if (moves.includes("repair")) repairMoves += 1;
  }

  const sustainedExchange = turns.length >= 2 && (
    respondedTurns > 0 ||
    relevantFollowUps > 0 ||
    clarificationMoves > 0 ||
    repairMoves > 0
  );

  let score=20;
  score += Math.min(30,respondedTurns*15);
  score += Math.min(20,relevantFollowUps*20);
  score += Math.min(15,(clarificationMoves+repairMoves)*15);
  score += Math.min(10,initiatedTurns*5);
  if(sustainedExchange) score += 20;

  const requestedTargets=Array.isArray(task?.interactionTargets)
    ? task.interactionTargets.map(String)
    : [];

  const confidence=turns.length >= 2 ? "high" : "medium";
  const summary={
    studentKey:key,
    respondedTurns,
    relevantFollowUps,
    clarificationMoves,
    repairMoves,
    initiatedTurns,
    sustainedExchange,
    requestedTargets
  };

  return {
    ...summary,
    confidence,
    score:clampScore(score),
    evidence:[{ type:"interaction-summary", ...summary }]
  };
}
