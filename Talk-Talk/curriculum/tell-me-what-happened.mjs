import { TALK_TALK_PHASES } from "../core/activity-schema.mjs";

export const TELL_ME_WHAT_HAPPENED = Object.freeze({
  id: "tell-me-what-happened",
  title: "Tell Me What Happened",
  cefr: ["A2", "B1"],
  practiceMode: "practice",
  languageTargets: ["past-simple", "sequencing"],
  pronunciationTargets: ["past-ed-t", "past-ed-d", "past-ed-id"],
  speakingTargets: ["narrate-event", "add-detail"],
  interactionTargets: ["follow-up-question", "clarification"],
  phases: [...TALK_TALK_PHASES],
  pairGroup: {
    modes: ["role-play", "information-gap", "problem-solving", "open-discussion"],
    twistEnabled: true
  }
});
