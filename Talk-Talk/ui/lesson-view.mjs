import {
  createActivitySession,
  advanceActivity
} from "../core/activity-engine.mjs";

const TECHNICAL_COPY = Object.freeze({
  "microphone-denied": "Microphone access is blocked. Allow it and try again.",
  "input-too-low": "We can barely hear you. Move closer to the microphone and try again.",
  "input-clipping": "The microphone signal is too loud. Move it farther away and try again.",
  "model-unavailable": "Local speech analysis is unavailable on this device right now."
});

function sanitizeTurn(turn = {}) {
  return {
    turnId: String(turn.turnId || ""),
    transcript: String(turn.transcript || "").trim(),
    understood: String(turn.understood || turn.transcript || "").trim(),
    evaluation: turn.evaluation || null,
    retryPrompt: String(turn.retryPrompt || "").trim()
  };
}

export function createIndividualFlow(activity, learner = {}) {
  return {
    session: createActivitySession(activity, learner),
    turns: [],
    recordingState: { status:"ready", academicFailure:false }
  };
}

export function completeCurrentPhase(flow) {
  return {
    ...flow,
    session: advanceActivity(flow.session, { type:"PHASE_COMPLETE" })
  };
}

export function addLearnerTurn(flow, turn) {
  return {
    ...flow,
    turns: [...(flow.turns || []), sanitizeTurn(turn)]
  };
}

export function recordingStateForTechnicalReason(reason) {
  const clean = String(reason || "model-unavailable");
  return {
    status: "technical-retry",
    reason: clean,
    message: TECHNICAL_COPY[clean] || "We could not evaluate this attempt reliably. Try again.",
    canRetry: true,
    academicFailure: false
  };
}

const PHASE_TITLES = Object.freeze({
  hear: "Hear it",
  notice: "Notice it",
  say: "Say it",
  use: "Use it",
  react: "React",
  speak: "Speak",
  challenge: "Challenge",
  results: "Results",
  adapt: "Your next step"
});

export function renderLessonView(container, flow, { onAdvance } = {}) {
  if (!container || !flow?.session) return;
  const phase = flow.session.phase;
  container.innerHTML = "";

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = phase ? phase.toUpperCase() : "COMPLETE";

  const title = document.createElement("h2");
  title.id = "lessonPhase";
  title.textContent = PHASE_TITLES[phase] || "Lesson complete";

  const prompt = document.createElement("p");
  prompt.className = "lesson-prompt";
  prompt.textContent = phase === "hear"
    ? "Listen for how past-tense endings change."
    : phase === "notice"
      ? "Notice /t/, /d/ and /ɪd/ at the end of regular past verbs."
      : phase === "say"
        ? "Say the model clearly, then use the same ending in a new word."
        : phase === "use"
          ? "Build a short sentence about something that happened yesterday."
          : phase === "react"
            ? "Respond to new information without reading a prepared sentence."
            : phase === "speak"
              ? "Tell what happened in your own words."
              : phase === "challenge"
                ? "Add detail and answer a follow-up question."
                : phase === "results"
                  ? "Review what worked and the one thing to improve next."
                  : "Talk Talk will use your evidence to choose the next focus.";

  container.append(eyebrow, title, prompt);

  if (phase && phase !== "results" && phase !== "adapt") {
    const advance = document.createElement("button");
    advance.className = "secondary";
    advance.type = "button";
    advance.textContent = "Continue";
    advance.addEventListener("click", () => onAdvance?.());
    container.append(advance);
  }
}
