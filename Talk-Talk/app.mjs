import { TALK_TALK_GAME_NAME } from "./config.mjs";
import { normalizeActivity } from "./core/activity-schema.mjs";
import { TELL_ME_WHAT_HAPPENED } from "./curriculum/tell-me-what-happened.mjs";
import { createAudioCapture } from "./speech/audio-capture.mjs";
import {
  createIndividualFlow,
  completeCurrentPhase,
  recordingStateForTechnicalReason,
  renderLessonView
} from "./ui/lesson-view.mjs";
import { buildResultsModel, renderResultsView } from "./ui/results-view.mjs";
import { renderConversationReplay } from "./ui/conversation-replay.mjs";

document.documentElement.dataset.app = "talk-talk";
document.title = TALK_TALK_GAME_NAME;

const homeView = document.getElementById("homeView");
const lessonView = document.getElementById("lessonView");
const resultsView = document.getElementById("resultsView");
const replayPanel = document.getElementById("replayPanel");
const replayList = document.getElementById("replayList");
const speechDock = document.getElementById("speechDock");
const continueAction = document.getElementById("continueAction");
const recordButton = document.getElementById("recordButton");
const recordingState = document.getElementById("recordingState");

let activitySource=TELL_ME_WHAT_HAPPENED;
if (new URLSearchParams(location.search).get("draft") === "preview") {
  try {
    const saved=JSON.parse(sessionStorage.getItem("talkTalk.previewDraft") || "null");
    if (saved) activitySource=saved;
  } catch {}
}
const activity = normalizeActivity(activitySource);
let flow = null;
let capture = null;
let micOpen = false;

function phaseNeedsSpeech(phase) {
  return ["say","use","react","speak","challenge"].includes(phase);
}

function showFlow() {
  if (!flow) return;
  const phase = flow.session.phase;
  lessonView.hidden = phase === "results" || flow.session.status === "complete";
  resultsView.hidden = phase !== "results";
  speechDock.hidden = !phaseNeedsSpeech(phase);

  if (phase === "results") {
    const latestEvaluation = flow.turns.at(-1)?.evaluation || null;
    const model = buildResultsModel(latestEvaluation || {
      technicalRetry: true,
      dimensions: {}
    }, flow.turns);
    renderResultsView(resultsView, model);
    renderConversationReplay(replayList, flow.turns);
    replayPanel.hidden = flow.turns.length === 0;
    return;
  }

  renderLessonView(lessonView, flow, {
    onAdvance() {
      flow = completeCurrentPhase(flow);
      showFlow();
    }
  });
}

continueAction?.addEventListener("click", () => {
  homeView.hidden = true;
  lessonView.hidden = false;
  flow = createIndividualFlow(activity, { studentKey:"local-preview" });
  showFlow();
});

recordButton?.addEventListener("click", async () => {
  if (!micOpen) {
    try {
      capture = createAudioCapture();
      await capture.open();
      micOpen = true;
      recordingState.textContent = "Listening…";
      recordButton.dataset.active = "true";
    } catch (error) {
      const state = recordingStateForTechnicalReason(error.talkTalkReason || error.code || "microphone-denied");
      recordingState.textContent = state.message;
    }
    return;
  }

  capture?.close();
  capture = null;
  micOpen = false;
  recordButton.dataset.active = "false";
  const state = recordingStateForTechnicalReason("model-unavailable");
  recordingState.textContent = state.message;
});
