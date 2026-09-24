export const HOTEL_SCENARIO = Object.freeze({
  id: "hotel-noisy-room",
  opening: "Good evening. How can I help you?",
  goals: [
    { id: "explain-problem", intents: ["noise-problem"] },
    { id: "request-solution", intents: ["request-solution"] },
    { id: "reach-agreement", intents: ["agreement"] }
  ],
  intents: [
    {
      id: "noise-problem",
      patterns: ["noisy", "noise", "loud", "room"],
      replies: [
        "I'm sorry about the noise in your room. What kind of noise are you hearing?"
      ]
    },
    {
      id: "request-solution",
      patterns: ["change room", "another room", "solution", "can you", "could you"],
      replies: [
        "I can check the available rooms. What solution would work best for you?"
      ]
    },
    {
      id: "agreement",
      patterns: ["okay", "ok", "that works", "agree", "fine"],
      replies: [
        "Great. I'll make a note of that solution."
      ]
    }
  ],
  fallbackReplies: [
    "Tell me a little more about the problem.",
    "What would you like me to do?"
  ]
});

export const TELL_ME_WHAT_HAPPENED_SCENARIO = Object.freeze({
  id: "tell-me-what-happened-conversation",
  opening: "Tell me what happened.",
  goals: [
    { id: "set-time", intents: ["past-event"] },
    { id: "sequence-event", intents: ["sequence"] },
    { id: "add-detail", intents: ["detail"] }
  ],
  intents: [
    {
      id: "past-event",
      patterns: ["yesterday", "last night", "last week", "ago", "happened", "saw"],
      replies: [
        "What happened next?"
      ]
    },
    {
      id: "sequence",
      patterns: ["then", "after", "next", "later", "finally"],
      replies: [
        "And then what happened?"
      ]
    },
    {
      id: "detail",
      patterns: ["because", "when", "while", "suddenly", "really"],
      replies: [
        "That's an important detail. What happened after that?"
      ]
    }
  ],
  fallbackReplies: [
    "Tell me one more detail.",
    "What happened next?"
  ],
  twist: {
    id: "remember-detail",
    afterTurns: 3,
    text: "You suddenly remember one important detail. Add it to the story."
  }
});
