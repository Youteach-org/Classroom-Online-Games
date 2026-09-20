import {
  consumeTeacherLaunch,
  loadTeacherContext
} from "../shared/youteach-live-bridge.mjs";

const gateMessage = document.getElementById("gameGateMessage");
const cards = [...document.querySelectorAll(".card")];

function showMessage(message, tone = "info") {
  if (!gateMessage) return;
  gateMessage.textContent = message;
  gateMessage.dataset.tone = tone;
}

function setContextAttributes(context) {
  const groupName = String(context?.liveContext?.groupName || "");
  const sessionId = String(context?.liveContext?.youTeachSessionId || "");
  document.documentElement.dataset.youteachLive = context ? "true" : "false";
  document.documentElement.dataset.youteachGroup = groupName;
  document.documentElement.dataset.youteachSession = sessionId;

  cards.forEach((card) => {
    if (context) {
      card.dataset.youteachLive = "true";
      card.dataset.youteachGroup = groupName;
    } else {
      delete card.dataset.youteachLive;
      delete card.dataset.youteachGroup;
    }
  });
}

async function initializeTeacherContext() {
  const params = new URLSearchParams(location.search);
  const hasLaunch = Boolean(params.get("ytLiveTeacher") && params.get("issuer"));

  try {
    const context = hasLaunch
      ? await consumeTeacherLaunch({ search: location.search })
      : loadTeacherContext();

    if (hasLaunch) {
      history.replaceState(null, "", location.pathname + location.hash);
    }

    if (context) {
      setContextAttributes(context);
      showMessage(
        `YouTeach connected · Group ${context.liveContext.groupName} · Select a game, then start its session to make it available to students.`
      );
      return;
    }

    setContextAttributes(null);
    showMessage(
      "Standalone teacher mode. Open Classroom Online Games from YouTeach Buzzer to create a group-linked live activity.",
      "standalone"
    );
  } catch (error) {
    console.error("Could not resolve YouTeach teacher context", error);
    setContextAttributes(null);
    showMessage(
      error?.message || "Could not verify the YouTeach teacher session. Reopen Classroom Online Games from Buzzer.",
      "error"
    );
  }
}

initializeTeacherContext();
