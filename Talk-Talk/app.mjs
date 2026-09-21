import { TALK_TALK_GAME_NAME } from "./config.mjs";

document.documentElement.dataset.app = "talk-talk";
document.title = TALK_TALK_GAME_NAME;

const continueAction = document.getElementById("continueAction");
const lessonView = document.getElementById("lessonView");
const homeView = document.getElementById("homeView");

continueAction?.addEventListener("click", () => {
  homeView.hidden = true;
  lessonView.hidden = false;
  lessonView.innerHTML = "<p class=\"eyebrow\">Vertical slice</p><h2>Tell Me What Happened</h2><p>The lesson engine is the next implementation task.</p>";
});
