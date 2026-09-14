(function(global){
  const SENTENCES=[
  {
    "id": "ps01",
    "group": "present-simple",
    "base": "drink",
    "text": "Maya usually ___ coffee before work.",
    "timeExpressions": [
      "usually"
    ],
    "correctAnswers": [
      "drinks"
    ],
    "distractors": [
      "drank",
      "is drinking",
      "has drunk",
      "will drink"
    ]
  },
  {
    "id": "ps02",
    "group": "present-simple",
    "base": "walk",
    "text": "Tom ___ to school every morning.",
    "timeExpressions": [
      "every morning"
    ],
    "correctAnswers": [
      "walks"
    ],
    "distractors": [
      "walked",
      "is walking",
      "has walked",
      "will walk"
    ]
  },
  {
    "id": "ps03",
    "group": "present-simple",
    "base": "study",
    "text": "Sara ___ English on Mondays.",
    "timeExpressions": [
      "on Mondays"
    ],
    "correctAnswers": [
      "studies"
    ],
    "distractors": [
      "studied",
      "is studying",
      "has studied",
      "will study"
    ]
  },
  {
    "id": "ps04",
    "group": "present-simple",
    "base": "play",
    "text": "Our team ___ basketball every Friday.",
    "timeExpressions": [
      "every Friday"
    ],
    "correctAnswers": [
      "plays"
    ],
    "distractors": [
      "played",
      "is playing",
      "has played",
      "will play"
    ]
  },
  {
    "id": "ps05",
    "group": "present-simple",
    "base": "watch",
    "text": "My grandparents often ___ the news after dinner.",
    "timeExpressions": [
      "often"
    ],
    "correctAnswers": [
      "watch"
    ],
    "distractors": [
      "watched",
      "are watching",
      "have watched",
      "will watch"
    ]
  },
  {
    "id": "ps06",
    "group": "present-simple",
    "base": "work",
    "text": "Daniel normally ___ at a hospital from Monday to Friday.",
    "timeExpressions": [
      "normally",
      "from Monday to Friday"
    ],
    "correctAnswers": [
      "works"
    ],
    "distractors": [
      "worked",
      "is working",
      "has worked",
      "will work"
    ]
  },
  {
    "id": "ps07",
    "group": "present-simple",
    "base": "take",
    "text": "A ride on this bus usually ___ about twenty minutes.",
    "timeExpressions": [
      "usually",
      "about twenty minutes"
    ],
    "correctAnswers": [
      "takes"
    ],
    "distractors": [
      "took",
      "is taking",
      "has taken",
      "will take"
    ]
  },
  {
    "id": "ps08",
    "group": "present-simple",
    "base": "open",
    "text": "The library ___ at eight every weekday.",
    "timeExpressions": [
      "every weekday"
    ],
    "correctAnswers": [
      "opens"
    ],
    "distractors": [
      "opened",
      "is opening",
      "has opened",
      "will open"
    ]
  },
  {
    "id": "ps09",
    "group": "present-simple",
    "base": "need",
    "text": "This machine always ___ regular maintenance to operate safely.",
    "timeExpressions": [
      "always"
    ],
    "correctAnswers": [
      "needs"
    ],
    "distractors": [
      "needed",
      "is needing",
      "has needed",
      "will need"
    ]
  },
  {
    "id": "ps10",
    "group": "present-simple",
    "base": "rain",
    "text": "It rarely ___ here in July.",
    "timeExpressions": [
      "rarely",
      "in July"
    ],
    "correctAnswers": [
      "rains"
    ],
    "distractors": [
      "rained",
      "is raining",
      "has rained",
      "will rain"
    ]
  },
  {
    "id": "pa01",
    "group": "past-simple",
    "base": "visit",
    "text": "We ___ the museum last Saturday.",
    "timeExpressions": [
      "last Saturday"
    ],
    "correctAnswers": [
      "visited"
    ],
    "distractors": [
      "visit",
      "are visiting",
      "have visited",
      "will visit"
    ]
  },
  {
    "id": "pa02",
    "group": "past-simple",
    "base": "buy",
    "text": "Leo ___ a new backpack two weeks ago.",
    "timeExpressions": [
      "two weeks ago"
    ],
    "correctAnswers": [
      "bought"
    ],
    "distractors": [
      "buys",
      "is buying",
      "has bought",
      "will buy"
    ]
  },
  {
    "id": "pa03",
    "group": "past-simple",
    "base": "see",
    "text": "I ___ that movie in 2024.",
    "timeExpressions": [
      "in 2024"
    ],
    "correctAnswers": [
      "saw"
    ],
    "distractors": [
      "see",
      "am seeing",
      "have seen",
      "will see"
    ]
  },
  {
    "id": "pa04",
    "group": "past-simple",
    "base": "write",
    "text": "Nora ___ the report last night.",
    "timeExpressions": [
      "last night"
    ],
    "correctAnswers": [
      "wrote"
    ],
    "distractors": [
      "writes",
      "is writing",
      "has written",
      "will write"
    ]
  },
  {
    "id": "pa05",
    "group": "past-simple",
    "base": "meet",
    "text": "We first ___ when I was ten.",
    "timeExpressions": [
      "when I was ten"
    ],
    "correctAnswers": [
      "met"
    ],
    "distractors": [
      "meet",
      "are meeting",
      "have met",
      "will meet"
    ]
  },
  {
    "id": "pa06",
    "group": "past-simple",
    "base": "leave",
    "text": "The train ___ an hour ago.",
    "timeExpressions": [
      "an hour ago"
    ],
    "correctAnswers": [
      "left"
    ],
    "distractors": [
      "leaves",
      "is leaving",
      "has left",
      "will leave"
    ]
  },
  {
    "id": "pa07",
    "group": "past-simple",
    "base": "win",
    "text": "Our school ___ the tournament last year.",
    "timeExpressions": [
      "last year"
    ],
    "correctAnswers": [
      "won"
    ],
    "distractors": [
      "wins",
      "is winning",
      "has won",
      "will win"
    ]
  },
  {
    "id": "pa08",
    "group": "past-simple",
    "base": "forget",
    "text": "He ___ his keys yesterday afternoon.",
    "timeExpressions": [
      "yesterday afternoon"
    ],
    "correctAnswers": [
      "forgot"
    ],
    "distractors": [
      "forgets",
      "is forgetting",
      "has forgotten",
      "will forget"
    ]
  },
  {
    "id": "pa09",
    "group": "past-simple",
    "base": "drive",
    "text": "My aunt ___ across Mexico last summer.",
    "timeExpressions": [
      "last summer"
    ],
    "correctAnswers": [
      "drove"
    ],
    "distractors": [
      "drives",
      "is driving",
      "has driven",
      "will drive"
    ]
  },
  {
    "id": "pa10",
    "group": "past-simple",
    "base": "finish",
    "text": "They ___ the project three days ago.",
    "timeExpressions": [
      "three days ago"
    ],
    "correctAnswers": [
      "finished"
    ],
    "distractors": [
      "finish",
      "are finishing",
      "have finished",
      "will finish"
    ]
  },
  {
    "id": "fw01",
    "group": "future-will",
    "base": "answer",
    "text": "The phone is ringing. I ___ it.",
    "timeExpressions": [],
    "correctAnswers": [
      "will answer"
    ],
    "distractors": [
      "answer",
      "answered",
      "am answering",
      "have answered"
    ]
  },
  {
    "id": "fw02",
    "group": "future-will",
    "base": "help",
    "text": "I just decided: I ___ you with the boxes.",
    "timeExpressions": [
      "just decided"
    ],
    "correctAnswers": [
      "will help"
    ],
    "distractors": [
      "help",
      "helped",
      "am helping",
      "have helped"
    ]
  },
  {
    "id": "fw03",
    "group": "future-will",
    "base": "call",
    "text": "I promise I ___ you tonight.",
    "timeExpressions": [
      "tonight"
    ],
    "correctAnswers": [
      "will call"
    ],
    "distractors": [
      "call",
      "called",
      "am calling",
      "have called"
    ]
  },
  {
    "id": "fw04",
    "group": "future-will",
    "base": "be",
    "text": "I predict tomorrow's test ___ harder than today's.",
    "timeExpressions": [
      "I predict",
      "tomorrow"
    ],
    "correctAnswers": [
      "will be"
    ],
    "distractors": [
      "is",
      "was",
      "is being",
      "has been"
    ]
  },
  {
    "id": "fw05",
    "group": "future-will",
    "base": "send",
    "text": "I ___ you the file as soon as I get home.",
    "timeExpressions": [
      "as soon as I get home"
    ],
    "correctAnswers": [
      "will send"
    ],
    "distractors": [
      "send",
      "sent",
      "am sending",
      "have sent"
    ]
  },
  {
    "id": "fw06",
    "group": "future-will",
    "base": "remember",
    "text": "I'm sure she ___ your birthday tomorrow.",
    "timeExpressions": [
      "I'm sure",
      "tomorrow"
    ],
    "correctAnswers": [
      "will remember"
    ],
    "distractors": [
      "remembers",
      "remembered",
      "is remembering",
      "has remembered"
    ]
  },
  {
    "id": "fw07",
    "group": "future-will",
    "base": "carry",
    "text": "Those bags look heavy. I ___ one for you.",
    "timeExpressions": [],
    "correctAnswers": [
      "will carry"
    ],
    "distractors": [
      "carry",
      "carried",
      "am carrying",
      "have carried"
    ]
  },
  {
    "id": "fw08",
    "group": "future-will",
    "base": "tell",
    "text": "I ___ you the result when the teacher posts it.",
    "timeExpressions": [
      "when the teacher posts it"
    ],
    "correctAnswers": [
      "will tell"
    ],
    "distractors": [
      "tell",
      "told",
      "am telling",
      "have told"
    ]
  },
  {
    "id": "fw09",
    "group": "future-will",
    "base": "stay",
    "text": "If it rains, we ___ inside.",
    "timeExpressions": [],
    "correctAnswers": [
      "will stay"
    ],
    "distractors": [
      "stay",
      "stayed",
      "are staying",
      "have stayed"
    ]
  },
  {
    "id": "fw10",
    "group": "future-will",
    "base": "win",
    "text": "I predict our team ___ the final next week.",
    "timeExpressions": [
      "I predict",
      "next week"
    ],
    "correctAnswers": [
      "will win"
    ],
    "distractors": [
      "wins",
      "won",
      "is winning",
      "has won"
    ]
  },
  {
    "id": "pc01",
    "group": "present-continuous",
    "base": "study",
    "text": "Mia ___ for her exam right now.",
    "timeExpressions": [
      "right now"
    ],
    "correctAnswers": [
      "is studying"
    ],
    "distractors": [
      "studies",
      "studied",
      "has studied",
      "will study"
    ]
  },
  {
    "id": "pc02",
    "group": "present-continuous",
    "base": "wait",
    "text": "We ___ for the bus at the moment.",
    "timeExpressions": [
      "at the moment"
    ],
    "correctAnswers": [
      "are waiting"
    ],
    "distractors": [
      "wait",
      "waited",
      "have waited",
      "will wait"
    ]
  },
  {
    "id": "pc03",
    "group": "present-continuous",
    "base": "rain",
    "text": "Look! It ___ outside.",
    "timeExpressions": [
      "Look!"
    ],
    "correctAnswers": [
      "is raining"
    ],
    "distractors": [
      "rains",
      "rained",
      "has rained",
      "will rain"
    ]
  },
  {
    "id": "pc04",
    "group": "present-continuous",
    "base": "work",
    "text": "My brother ___ from home this week.",
    "timeExpressions": [
      "this week"
    ],
    "correctAnswers": [
      "is working"
    ],
    "distractors": [
      "works",
      "worked",
      "has worked",
      "will work"
    ]
  },
  {
    "id": "pc05",
    "group": "present-continuous",
    "base": "cook",
    "text": "Dad ___ dinner now.",
    "timeExpressions": [
      "now"
    ],
    "correctAnswers": [
      "is cooking"
    ],
    "distractors": [
      "cooks",
      "cooked",
      "has cooked",
      "will cook"
    ]
  },
  {
    "id": "pc06",
    "group": "present-continuous",
    "base": "talk",
    "text": "The students ___ quietly at the moment.",
    "timeExpressions": [
      "at the moment"
    ],
    "correctAnswers": [
      "are talking"
    ],
    "distractors": [
      "talk",
      "talked",
      "have talked",
      "will talk"
    ]
  },
  {
    "id": "pc07",
    "group": "present-continuous",
    "base": "wear",
    "text": "Julia ___ her new jacket today.",
    "timeExpressions": [
      "today"
    ],
    "correctAnswers": [
      "is wearing"
    ],
    "distractors": [
      "wears",
      "wore",
      "has worn",
      "will wear"
    ]
  },
  {
    "id": "pc08",
    "group": "present-continuous",
    "base": "build",
    "text": "They ___ a new bridge near our town currently.",
    "timeExpressions": [
      "currently"
    ],
    "correctAnswers": [
      "are building"
    ],
    "distractors": [
      "build",
      "built",
      "have built",
      "will build"
    ]
  },
  {
    "id": "pc09",
    "group": "present-continuous",
    "base": "stay",
    "text": "I ___ with my cousin for a few days this week.",
    "timeExpressions": [
      "this week"
    ],
    "correctAnswers": [
      "am staying"
    ],
    "distractors": [
      "stay",
      "stayed",
      "have stayed",
      "will stay"
    ]
  },
  {
    "id": "pc10",
    "group": "present-continuous",
    "base": "look",
    "text": "Why ___ at me right now?",
    "timeExpressions": [
      "right now"
    ],
    "correctAnswers": [
      "are you looking"
    ],
    "distractors": [
      "do you look",
      "did you look",
      "have you looked",
      "will you look"
    ]
  },
  {
    "id": "pac01",
    "group": "past-continuous",
    "base": "study",
    "text": "At 8 p.m. last night, I ___ for the exam.",
    "timeExpressions": [
      "at 8 p.m. last night"
    ],
    "correctAnswers": [
      "was studying"
    ],
    "distractors": [
      "studied",
      "am studying",
      "have studied",
      "will study"
    ]
  },
  {
    "id": "pac02",
    "group": "past-continuous",
    "base": "drive",
    "text": "She ___ home when the storm started.",
    "timeExpressions": [
      "when the storm started"
    ],
    "correctAnswers": [
      "was driving"
    ],
    "distractors": [
      "drove",
      "is driving",
      "has driven",
      "will drive"
    ]
  },
  {
    "id": "pac03",
    "group": "past-continuous",
    "base": "sleep",
    "text": "The baby ___ when I called.",
    "timeExpressions": [
      "when I called"
    ],
    "correctAnswers": [
      "was sleeping"
    ],
    "distractors": [
      "slept",
      "is sleeping",
      "has slept",
      "will sleep"
    ]
  },
  {
    "id": "pac04",
    "group": "past-continuous",
    "base": "play",
    "text": "They ___ soccer while it began to rain.",
    "timeExpressions": [
      "while it began to rain"
    ],
    "correctAnswers": [
      "were playing"
    ],
    "distractors": [
      "played",
      "are playing",
      "have played",
      "will play"
    ]
  },
  {
    "id": "pac05",
    "group": "past-continuous",
    "base": "work",
    "text": "We ___ at noon yesterday.",
    "timeExpressions": [
      "at noon yesterday"
    ],
    "correctAnswers": [
      "were working"
    ],
    "distractors": [
      "worked",
      "are working",
      "have worked",
      "will work"
    ]
  },
  {
    "id": "pac06",
    "group": "past-continuous",
    "base": "wait",
    "text": "He ___ for the doctor when I saw him.",
    "timeExpressions": [
      "when I saw him"
    ],
    "correctAnswers": [
      "was waiting"
    ],
    "distractors": [
      "waited",
      "is waiting",
      "has waited",
      "will wait"
    ]
  },
  {
    "id": "pac07",
    "group": "past-continuous",
    "base": "watch",
    "text": "I ___ TV while my sister was cooking.",
    "timeExpressions": [
      "while my sister was cooking"
    ],
    "correctAnswers": [
      "was watching"
    ],
    "distractors": [
      "watched",
      "am watching",
      "have watched",
      "will watch"
    ]
  },
  {
    "id": "pac08",
    "group": "past-continuous",
    "base": "walk",
    "text": "The children ___ home when the lights went out.",
    "timeExpressions": [
      "when the lights went out"
    ],
    "correctAnswers": [
      "were walking"
    ],
    "distractors": [
      "walked",
      "are walking",
      "have walked",
      "will walk"
    ]
  },
  {
    "id": "pac09",
    "group": "past-continuous",
    "base": "rain",
    "text": "It ___ heavily at midnight.",
    "timeExpressions": [
      "at midnight"
    ],
    "correctAnswers": [
      "was raining"
    ],
    "distractors": [
      "rained",
      "is raining",
      "has rained",
      "will rain"
    ]
  },
  {
    "id": "pac10",
    "group": "past-continuous",
    "base": "talk",
    "text": "The teachers ___ when the bell rang.",
    "timeExpressions": [
      "when the bell rang"
    ],
    "correctAnswers": [
      "were talking"
    ],
    "distractors": [
      "talked",
      "are talking",
      "have talked",
      "will talk"
    ]
  },
  {
    "id": "fc01",
    "group": "future-continuous",
    "base": "fly",
    "text": "At this time tomorrow, we ___ to Monterrey.",
    "timeExpressions": [
      "at this time tomorrow"
    ],
    "correctAnswers": [
      "will be flying"
    ],
    "distractors": [
      "fly",
      "flew",
      "are flying",
      "have flown"
    ]
  },
  {
    "id": "fc02",
    "group": "future-continuous",
    "base": "work",
    "text": "At 9 tomorrow morning, she ___ in the lab.",
    "timeExpressions": [
      "at 9 tomorrow morning"
    ],
    "correctAnswers": [
      "will be working"
    ],
    "distractors": [
      "works",
      "worked",
      "is working",
      "has worked"
    ]
  },
  {
    "id": "fc03",
    "group": "future-continuous",
    "base": "study",
    "text": "This time next week, I ___ for my finals.",
    "timeExpressions": [
      "this time next week"
    ],
    "correctAnswers": [
      "will be studying"
    ],
    "distractors": [
      "study",
      "studied",
      "am studying",
      "have studied"
    ]
  },
  {
    "id": "fc04",
    "group": "future-continuous",
    "base": "drive",
    "text": "At 6 p.m. tomorrow, they ___ home.",
    "timeExpressions": [
      "at 6 p.m. tomorrow"
    ],
    "correctAnswers": [
      "will be driving"
    ],
    "distractors": [
      "drive",
      "drove",
      "are driving",
      "have driven"
    ]
  },
  {
    "id": "fc05",
    "group": "future-continuous",
    "base": "sleep",
    "text": "Do not call at midnight; the baby ___ then.",
    "timeExpressions": [
      "at midnight",
      "then"
    ],
    "correctAnswers": [
      "will be sleeping"
    ],
    "distractors": [
      "sleeps",
      "slept",
      "is sleeping",
      "has slept"
    ]
  },
  {
    "id": "fc06",
    "group": "future-continuous",
    "base": "wait",
    "text": "When you arrive, we ___ for you at the entrance.",
    "timeExpressions": [
      "when you arrive"
    ],
    "correctAnswers": [
      "will be waiting"
    ],
    "distractors": [
      "wait",
      "waited",
      "are waiting",
      "will wait"
    ]
  },
  {
    "id": "fc07",
    "group": "future-continuous",
    "base": "take",
    "text": "At ten tomorrow, the students ___ their exam.",
    "timeExpressions": [
      "at ten tomorrow"
    ],
    "correctAnswers": [
      "will be taking"
    ],
    "distractors": [
      "take",
      "took",
      "are taking",
      "have taken"
    ]
  },
  {
    "id": "fc08",
    "group": "future-continuous",
    "base": "meet",
    "text": "This time tomorrow, the directors ___ with the new client.",
    "timeExpressions": [
      "this time tomorrow"
    ],
    "correctAnswers": [
      "will be meeting"
    ],
    "distractors": [
      "meet",
      "met",
      "are meeting",
      "have met"
    ]
  },
  {
    "id": "fc09",
    "group": "future-continuous",
    "base": "travel",
    "text": "During July, my parents ___ around Europe.",
    "timeExpressions": [
      "during July"
    ],
    "correctAnswers": [
      "will be traveling",
      "will be travelling"
    ],
    "distractors": [
      "travel",
      "traveled",
      "are traveling",
      "have traveled"
    ]
  },
  {
    "id": "fc10",
    "group": "future-continuous",
    "base": "use",
    "text": "At 3 p.m., the technicians ___ the main server.",
    "timeExpressions": [
      "at 3 p.m."
    ],
    "correctAnswers": [
      "will be using"
    ],
    "distractors": [
      "use",
      "used",
      "are using",
      "have used"
    ]
  },
  {
    "id": "pp01",
    "group": "present-perfect",
    "base": "finish",
    "text": "I ___ my homework already.",
    "timeExpressions": [
      "already"
    ],
    "correctAnswers": [
      "have finished"
    ],
    "distractors": [
      "finish",
      "finished",
      "am finishing",
      "will finish"
    ]
  },
  {
    "id": "pp02",
    "group": "present-perfect",
    "base": "see",
    "text": "She ___ snow before.",
    "timeExpressions": [
      "never",
      "before"
    ],
    "correctAnswers": [
      "has never seen"
    ],
    "distractors": [
      "never sees",
      "never saw",
      "is never seeing",
      "will never see"
    ]
  },
  {
    "id": "pp03",
    "group": "present-perfect",
    "base": "visit",
    "text": "We ___ that museum three times this year.",
    "timeExpressions": [
      "three times this year"
    ],
    "correctAnswers": [
      "have visited"
    ],
    "distractors": [
      "visit",
      "visited",
      "are visiting",
      "will visit"
    ]
  },
  {
    "id": "pp04",
    "group": "present-perfect",
    "base": "lose",
    "text": "He ___ his keys just now.",
    "timeExpressions": [
      "just"
    ],
    "correctAnswers": [
      "has just lost"
    ],
    "distractors": [
      "loses",
      "lost",
      "is losing",
      "will lose"
    ]
  },
  {
    "id": "pp05",
    "group": "present-perfect",
    "base": "read",
    "text": "They ___ five chapters so far.",
    "timeExpressions": [
      "so far"
    ],
    "correctAnswers": [
      "have read"
    ],
    "distractors": [
      "read",
      "were reading",
      "are reading",
      "will read"
    ]
  },
  {
    "id": "pp06",
    "group": "present-perfect",
    "base": "live",
    "text": "I ___ here since 2020.",
    "timeExpressions": [
      "since 2020"
    ],
    "correctAnswers": [
      "have lived"
    ],
    "distractors": [
      "live",
      "lived",
      "am living",
      "will live"
    ]
  },
  {
    "id": "pp07",
    "group": "present-perfect",
    "base": "meet",
    "text": "___ a famous actor?",
    "timeExpressions": [
      "ever"
    ],
    "correctAnswers": [
      "Have you ever met"
    ],
    "distractors": [
      "Do you ever meet",
      "Did you ever meet",
      "Are you meeting",
      "Will you meet"
    ]
  },
  {
    "id": "pp08",
    "group": "present-perfect",
    "base": "arrive",
    "text": "The package ___ yet.",
    "timeExpressions": [
      "yet"
    ],
    "correctAnswers": [
      "has not arrived"
    ],
    "distractors": [
      "does not arrive",
      "did not arrive",
      "is not arriving",
      "will not arrive"
    ]
  },
  {
    "id": "pp09",
    "group": "present-perfect",
    "base": "change",
    "text": "The city ___ a lot recently.",
    "timeExpressions": [
      "recently"
    ],
    "correctAnswers": [
      "has changed"
    ],
    "distractors": [
      "changes",
      "changed",
      "is changing",
      "will change"
    ]
  },
  {
    "id": "pp10",
    "group": "present-perfect",
    "base": "complete",
    "text": "Our class ___ four projects this semester.",
    "timeExpressions": [
      "this semester"
    ],
    "correctAnswers": [
      "has completed"
    ],
    "distractors": [
      "completes",
      "completed",
      "is completing",
      "will complete"
    ]
  },
  {
    "id": "pap01",
    "group": "past-perfect",
    "base": "leave",
    "text": "The train ___ before we reached the station.",
    "timeExpressions": [
      "before we reached the station",
      "already"
    ],
    "correctAnswers": [
      "had already left"
    ],
    "distractors": [
      "left",
      "was leaving",
      "has left",
      "will leave"
    ]
  },
  {
    "id": "pap02",
    "group": "past-perfect",
    "base": "finish",
    "text": "She ___ the report by the time the meeting started.",
    "timeExpressions": [
      "by the time the meeting started"
    ],
    "correctAnswers": [
      "had finished"
    ],
    "distractors": [
      "finished",
      "was finishing",
      "has finished",
      "will finish"
    ]
  },
  {
    "id": "pap03",
    "group": "past-perfect",
    "base": "eat",
    "text": "They ___ when we arrived for dinner.",
    "timeExpressions": [
      "when we arrived",
      "already"
    ],
    "correctAnswers": [
      "had already eaten"
    ],
    "distractors": [
      "ate",
      "were eating",
      "have eaten",
      "will eat"
    ]
  },
  {
    "id": "pap04",
    "group": "past-perfect",
    "base": "see",
    "text": "I ___ the ocean before that trip.",
    "timeExpressions": [
      "before that trip",
      "never"
    ],
    "correctAnswers": [
      "had never seen"
    ],
    "distractors": [
      "never saw",
      "was never seeing",
      "has never seen",
      "will never see"
    ]
  },
  {
    "id": "pap05",
    "group": "past-perfect",
    "base": "study",
    "text": "He ___ the chapter before the quiz began.",
    "timeExpressions": [
      "before the quiz began"
    ],
    "correctAnswers": [
      "will study"
    ],
    "distractors": [
      "studied",
      "was studying",
      "has studied",
      "will study"
    ]
  },
  {
    "id": "pap06",
    "group": "past-perfect",
    "base": "close",
    "text": "The store ___ by the time we got there.",
    "timeExpressions": [
      "by the time we got there"
    ],
    "correctAnswers": [
      "had closed"
    ],
    "distractors": [
      "closed",
      "was closing",
      "has closed",
      "will close"
    ]
  },
  {
    "id": "pap07",
    "group": "past-perfect",
    "base": "forget",
    "text": "She realized that she ___ her wallet at home.",
    "timeExpressions": [],
    "correctAnswers": [
      "had forgotten"
    ],
    "distractors": [
      "forgot",
      "was forgetting",
      "has forgotten",
      "will forget"
    ]
  },
  {
    "id": "pap08",
    "group": "past-perfect",
    "base": "send",
    "text": "They ___ the email before the system crashed.",
    "timeExpressions": [
      "before the system crashed"
    ],
    "correctAnswers": [
      "had sent"
    ],
    "distractors": [
      "sent",
      "were sending",
      "have sent",
      "will send"
    ]
  },
  {
    "id": "pap09",
    "group": "past-perfect",
    "base": "start",
    "text": "The movie ___ when we found our seats.",
    "timeExpressions": [
      "when we found our seats",
      "already"
    ],
    "correctAnswers": [
      "had already started"
    ],
    "distractors": [
      "started",
      "was starting",
      "has started",
      "will start"
    ]
  },
  {
    "id": "pap10",
    "group": "past-perfect",
    "base": "break",
    "text": "The pipe ___ before the plumber arrived.",
    "timeExpressions": [
      "before the plumber arrived"
    ],
    "correctAnswers": [
      "had broken"
    ],
    "distractors": [
      "broke",
      "was breaking",
      "has broken",
      "will break"
    ]
  },
  {
    "id": "fup01",
    "group": "future-perfect",
    "base": "finish",
    "text": "By Friday, I ___ the report.",
    "timeExpressions": [
      "by Friday"
    ],
    "correctAnswers": [
      "will have finished"
    ],
    "distractors": [
      "finish",
      "finished",
      "will be finishing",
      "have finished"
    ]
  },
  {
    "id": "fup02",
    "group": "future-perfect",
    "base": "graduate",
    "text": "By next June, she ___ from college.",
    "timeExpressions": [
      "by next June"
    ],
    "correctAnswers": [
      "will have graduated"
    ],
    "distractors": [
      "graduates",
      "graduated",
      "will be graduating",
      "has graduated"
    ]
  },
  {
    "id": "fup03",
    "group": "future-perfect",
    "base": "complete",
    "text": "By 2030, they ___ the new highway.",
    "timeExpressions": [
      "by 2030"
    ],
    "correctAnswers": [
      "will have completed"
    ],
    "distractors": [
      "complete",
      "completed",
      "will be completing",
      "have completed"
    ]
  },
  {
    "id": "fup04",
    "group": "future-perfect",
    "base": "leave",
    "text": "By the time you arrive, we ___ the office.",
    "timeExpressions": [
      "by the time you arrive"
    ],
    "correctAnswers": [
      "will have left"
    ],
    "distractors": [
      "leave",
      "left",
      "will be leaving",
      "have left"
    ]
  },
  {
    "id": "fup05",
    "group": "future-perfect",
    "base": "save",
    "text": "By December, he ___ enough money for the trip.",
    "timeExpressions": [
      "by December"
    ],
    "correctAnswers": [
      "will have saved"
    ],
    "distractors": [
      "saves",
      "saved",
      "will be saving",
      "has saved"
    ]
  },
  {
    "id": "fup06",
    "group": "future-perfect",
    "base": "read",
    "text": "By tomorrow night, I ___ the whole book.",
    "timeExpressions": [
      "by tomorrow night"
    ],
    "correctAnswers": [
      "will have read"
    ],
    "distractors": [
      "read",
      "read yesterday",
      "will be reading",
      "have read"
    ]
  },
  {
    "id": "fup07",
    "group": "future-perfect",
    "base": "build",
    "text": "By next year, the company ___ three new stores.",
    "timeExpressions": [
      "by next year"
    ],
    "correctAnswers": [
      "had been building"
    ],
    "distractors": [
      "builds",
      "built",
      "will be building",
      "has built"
    ]
  },
  {
    "id": "fup08",
    "group": "future-perfect",
    "base": "take",
    "text": "By noon, the students ___ all four tests.",
    "timeExpressions": [
      "by noon"
    ],
    "correctAnswers": [
      "will have taken"
    ],
    "distractors": [
      "take",
      "took",
      "will be taking",
      "have taken"
    ]
  },
  {
    "id": "fup09",
    "group": "future-perfect",
    "base": "visit",
    "text": "By the end of the tour, we ___ six cities.",
    "timeExpressions": [
      "by the end of the tour"
    ],
    "correctAnswers": [
      "will have visited"
    ],
    "distractors": [
      "visit",
      "visited",
      "will be visiting",
      "have visited"
    ]
  },
  {
    "id": "fup10",
    "group": "future-perfect",
    "base": "write",
    "text": "By Monday, she ___ the final chapter.",
    "timeExpressions": [
      "by Monday"
    ],
    "correctAnswers": [
      "will have written"
    ],
    "distractors": [
      "writes",
      "wrote",
      "will be writing",
      "has written"
    ]
  },
  {
    "id": "ppc01",
    "group": "present-perfect-continuous",
    "base": "study",
    "text": "I ___ continuously for two hours, and I am still not finished.",
    "timeExpressions": [
      "continuously for two hours",
      "still not finished"
    ],
    "correctAnswers": [
      "have been studying"
    ],
    "distractors": [
      "study",
      "studied",
      "am studying",
      "had studied"
    ]
  },
  {
    "id": "ppc02",
    "group": "present-perfect-continuous",
    "base": "work",
    "text": "She ___ nonstop since 8:00 this morning, and she is still working now.",
    "timeExpressions": [
      "since 8:00 this morning",
      "still working now"
    ],
    "correctAnswers": [
      "has been working"
    ],
    "distractors": [
      "works",
      "worked",
      "is working",
      "will work"
    ]
  },
  {
    "id": "ppc03",
    "group": "present-perfect-continuous",
    "base": "rain",
    "text": "It is still raining; it ___ continuously all morning.",
    "timeExpressions": [
      "still raining",
      "continuously all morning"
    ],
    "correctAnswers": [
      "has been raining"
    ],
    "distractors": [
      "rains",
      "rained",
      "is raining",
      "will rain"
    ]
  },
  {
    "id": "ppc04",
    "group": "present-perfect-continuous",
    "base": "wait",
    "text": "We ___ at this bus stop for thirty minutes, and the bus still has not arrived.",
    "timeExpressions": [
      "for thirty minutes"
    ],
    "correctAnswers": [
      "have been waiting"
    ],
    "distractors": [
      "wait",
      "waited",
      "are waiting",
      "have waited"
    ]
  },
  {
    "id": "ppc05",
    "group": "present-perfect-continuous",
    "base": "practice",
    "text": "He ___ the piano since breakfast and has not stopped yet.",
    "timeExpressions": [
      "since breakfast"
    ],
    "correctAnswers": [
      "has been practicing"
    ],
    "distractors": [
      "practices",
      "practiced",
      "is practicing",
      "will practice"
    ]
  },
  {
    "id": "ppc06",
    "group": "present-perfect-continuous",
    "base": "learn",
    "text": "They ___ Spanish continuously for three years, and they are still taking classes every week.",
    "timeExpressions": [
      "continuously for three years",
      "still taking classes every week"
    ],
    "correctAnswers": [
      "have been learning"
    ],
    "distractors": [
      "learn",
      "learned",
      "are learning",
      "had learned"
    ]
  },
  {
    "id": "ppc07",
    "group": "present-perfect-continuous",
    "base": "run",
    "text": "You are still breathing hard because you ___ continuously for an hour.",
    "timeExpressions": [
      "for an hour"
    ],
    "correctAnswers": [
      "have been running"
    ],
    "distractors": [
      "run",
      "ran",
      "are running",
      "had run"
    ]
  },
  {
    "id": "ppc08",
    "group": "present-perfect-continuous",
    "base": "clean",
    "text": "Mom ___ the kitchen all afternoon, and she is still cleaning it now.",
    "timeExpressions": [
      "all afternoon"
    ],
    "correctAnswers": [
      "has been cleaning"
    ],
    "distractors": [
      "cleans",
      "cleaned",
      "is cleaning",
      "had cleaned"
    ]
  },
  {
    "id": "ppc09",
    "group": "present-perfect-continuous",
    "base": "try",
    "text": "I ___ to call you since noon, but the line is still busy.",
    "timeExpressions": [
      "since noon"
    ],
    "correctAnswers": [
      "have been trying"
    ],
    "distractors": [
      "try",
      "tried",
      "am trying",
      "had tried"
    ]
  },
  {
    "id": "ppc10",
    "group": "present-perfect-continuous",
    "base": "snow",
    "text": "Snow is still falling; it ___ continuously since early this morning.",
    "timeExpressions": [
      "since early this morning"
    ],
    "correctAnswers": [
      "has been snowing"
    ],
    "distractors": [
      "snows",
      "snowed",
      "is snowing",
      "had snowed"
    ]
  },
  {
    "id": "papc01",
    "group": "past-perfect-continuous",
    "base": "study",
    "text": "She ___ for three hours before the exam began.",
    "timeExpressions": [
      "for three hours",
      "before the exam began"
    ],
    "correctAnswers": [
      "had been studying"
    ],
    "distractors": [
      "studied",
      "was studying",
      "has been studying",
      "had studied"
    ]
  },
  {
    "id": "papc02",
    "group": "past-perfect-continuous",
    "base": "wait",
    "text": "We ___ for forty minutes when the bus finally arrived.",
    "timeExpressions": [
      "for forty minutes",
      "when the bus finally arrived"
    ],
    "correctAnswers": [
      "had been waiting"
    ],
    "distractors": [
      "waited",
      "were waiting",
      "have been waiting",
      "had waited"
    ]
  },
  {
    "id": "papc03",
    "group": "past-perfect-continuous",
    "base": "work",
    "text": "He ___ all day before he went home.",
    "timeExpressions": [
      "all day",
      "before he went home"
    ],
    "correctAnswers": [
      "had been working"
    ],
    "distractors": [
      "worked",
      "was working",
      "has been working",
      "had worked"
    ]
  },
  {
    "id": "papc04",
    "group": "past-perfect-continuous",
    "base": "rain",
    "text": "It ___ for hours before the sky cleared.",
    "timeExpressions": [
      "for hours",
      "before the sky cleared"
    ],
    "correctAnswers": [
      "had been raining"
    ],
    "distractors": [
      "rained",
      "was raining",
      "has been raining",
      "had rained"
    ]
  },
  {
    "id": "papc05",
    "group": "past-perfect-continuous",
    "base": "drive",
    "text": "They ___ for six hours when they stopped for dinner.",
    "timeExpressions": [
      "for six hours",
      "when they stopped for dinner"
    ],
    "correctAnswers": [
      "had been driving"
    ],
    "distractors": [
      "drove",
      "were driving",
      "have been driving",
      "will drive"
    ]
  },
  {
    "id": "papc06",
    "group": "past-perfect-continuous",
    "base": "practice",
    "text": "Mia ___ every day before the competition started.",
    "timeExpressions": [
      "before the competition started"
    ],
    "correctAnswers": [
      "had been practicing"
    ],
    "distractors": [
      "practiced",
      "was practicing",
      "has been practicing",
      "had practiced"
    ]
  },
  {
    "id": "papc07",
    "group": "past-perfect-continuous",
    "base": "live",
    "text": "We ___ there for five years before we moved.",
    "timeExpressions": [
      "for five years",
      "before we moved"
    ],
    "correctAnswers": [
      "had been living"
    ],
    "distractors": [
      "lived",
      "were living",
      "have been living",
      "will live"
    ]
  },
  {
    "id": "papc08",
    "group": "past-perfect-continuous",
    "base": "talk",
    "text": "They ___ for an hour when the teacher interrupted them.",
    "timeExpressions": [
      "for an hour",
      "when the teacher interrupted them"
    ],
    "correctAnswers": [
      "had been talking"
    ],
    "distractors": [
      "talked",
      "were talking",
      "have been talking",
      "will talk"
    ]
  },
  {
    "id": "papc09",
    "group": "past-perfect-continuous",
    "base": "sleep",
    "text": "The baby ___ for only twenty minutes when the noise woke him.",
    "timeExpressions": [
      "for only twenty minutes",
      "when the noise woke him"
    ],
    "correctAnswers": [
      "had been sleeping"
    ],
    "distractors": [
      "slept",
      "was sleeping",
      "has been sleeping",
      "will sleep"
    ]
  },
  {
    "id": "papc10",
    "group": "past-perfect-continuous",
    "base": "train",
    "text": "The team ___ for months before the championship.",
    "timeExpressions": [
      "for months",
      "before the championship"
    ],
    "correctAnswers": [
      "had been training"
    ],
    "distractors": [
      "trained",
      "was training",
      "has been training",
      "will train"
    ]
  },
  {
    "id": "fupc01",
    "group": "future-perfect-continuous",
    "base": "work",
    "text": "By next January, she ___ here for ten years.",
    "timeExpressions": [
      "by next January",
      "for ten years"
    ],
    "correctAnswers": [
      "will have been working"
    ],
    "distractors": [
      "works",
      "will be working",
      "has been working",
      "had been working"
    ]
  },
  {
    "id": "fupc02",
    "group": "future-perfect-continuous",
    "base": "study",
    "text": "By midnight, I ___ for six hours.",
    "timeExpressions": [
      "by midnight",
      "for six hours"
    ],
    "correctAnswers": [
      "will have been studying"
    ],
    "distractors": [
      "study",
      "will be studying",
      "have been studying",
      "had been studying"
    ]
  },
  {
    "id": "fupc03",
    "group": "future-perfect-continuous",
    "base": "travel",
    "text": "By the end of June, they ___ for three months.",
    "timeExpressions": [
      "by the end of June",
      "for three months"
    ],
    "correctAnswers": [
      "will have been traveling",
      "will have been travelling"
    ],
    "distractors": [
      "travel",
      "will be traveling",
      "have been traveling",
      "had been traveling"
    ]
  },
  {
    "id": "fupc04",
    "group": "future-perfect-continuous",
    "base": "live",
    "text": "By 2030, we ___ in this house for twenty years.",
    "timeExpressions": [
      "by 2030",
      "for twenty years"
    ],
    "correctAnswers": [
      "will have been living"
    ],
    "distractors": [
      "live",
      "will be living",
      "have been living",
      "had been living"
    ]
  },
  {
    "id": "fupc05",
    "group": "future-perfect-continuous",
    "base": "teach",
    "text": "By next semester, Mr. Lee ___ at the school for five years.",
    "timeExpressions": [
      "by next semester",
      "for five years"
    ],
    "correctAnswers": [
      "will have been teaching"
    ],
    "distractors": [
      "teaches",
      "will be teaching",
      "has been teaching",
      "had been teaching"
    ]
  },
  {
    "id": "fupc06",
    "group": "future-perfect-continuous",
    "base": "wait",
    "text": "By noon, we ___ for three hours.",
    "timeExpressions": [
      "by noon",
      "for three hours"
    ],
    "correctAnswers": [
      "will have been waiting"
    ],
    "distractors": [
      "wait",
      "will be waiting",
      "have been waiting",
      "had been waiting"
    ]
  },
  {
    "id": "fupc07",
    "group": "future-perfect-continuous",
    "base": "run",
    "text": "By the finish line, she ___ for nearly four hours.",
    "timeExpressions": [
      "by the finish line",
      "for nearly four hours"
    ],
    "correctAnswers": [
      "will have been running"
    ],
    "distractors": [
      "runs",
      "will be running",
      "has been running",
      "had been running"
    ]
  },
  {
    "id": "fupc08",
    "group": "future-perfect-continuous",
    "base": "build",
    "text": "By next month, they ___ the stadium for a year.",
    "timeExpressions": [
      "by next month",
      "for a year"
    ],
    "correctAnswers": [
      "will have been building"
    ],
    "distractors": [
      "build",
      "will be building",
      "have been building",
      "will have built"
    ]
  },
  {
    "id": "fupc09",
    "group": "future-perfect-continuous",
    "base": "practice",
    "text": "By the concert, he ___ this piece for six months.",
    "timeExpressions": [
      "by the concert",
      "for six months"
    ],
    "correctAnswers": [
      "will have been practicing"
    ],
    "distractors": [
      "practices",
      "will be practicing",
      "has been practicing",
      "had been practicing"
    ]
  },
  {
    "id": "fupc10",
    "group": "future-perfect-continuous",
    "base": "use",
    "text": "By Friday, we ___ this system for two weeks.",
    "timeExpressions": [
      "by Friday",
      "for two weeks"
    ],
    "correctAnswers": [
      "will have been using"
    ],
    "distractors": [
      "use",
      "will be using",
      "have been using",
      "had been using"
    ]
  },
  {
    "id": "gt01",
    "group": "going-to",
    "base": "rain",
    "text": "Look at those dark clouds. It ___.",
    "timeExpressions": [
      "Look at those dark clouds"
    ],
    "correctAnswers": [
      "is going to rain"
    ],
    "distractors": [
      "rains",
      "rained",
      "is raining",
      "will have rained"
    ]
  },
  {
    "id": "gt02",
    "group": "going-to",
    "base": "visit",
    "text": "We bought the tickets yesterday. We ___ Oaxaca next weekend.",
    "timeExpressions": [
      "next weekend"
    ],
    "correctAnswers": [
      "are going to visit"
    ],
    "distractors": [
      "visit",
      "visited",
      "are visiting now",
      "have visited"
    ]
  },
  {
    "id": "gt03",
    "group": "going-to",
    "base": "study",
    "text": "I made a study schedule. I ___ tonight after dinner.",
    "timeExpressions": [
      "tonight after dinner"
    ],
    "correctAnswers": [
      "am going to study"
    ],
    "distractors": [
      "study",
      "studied",
      "am studying now",
      "have studied"
    ]
  },
  {
    "id": "gt04",
    "group": "going-to",
    "base": "fall",
    "text": "Be careful! That box ___.",
    "timeExpressions": [
      "Be careful!"
    ],
    "correctAnswers": [
      "is going to fall"
    ],
    "distractors": [
      "falls",
      "fell",
      "is falling every day",
      "has fallen"
    ]
  },
  {
    "id": "gt05",
    "group": "going-to",
    "base": "cook",
    "text": "We already bought all the ingredients. Dad ___ dinner tonight.",
    "timeExpressions": [
      "tonight"
    ],
    "correctAnswers": [
      "is going to cook"
    ],
    "distractors": [
      "cooks",
      "cooked",
      "is cooking now",
      "has cooked"
    ]
  },
  {
    "id": "gt06",
    "group": "going-to",
    "base": "move",
    "text": "They signed the lease. They ___ next month.",
    "timeExpressions": [
      "next month"
    ],
    "correctAnswers": [
      "are going to move"
    ],
    "distractors": [
      "move",
      "moved",
      "are moving now",
      "have moved"
    ]
  },
  {
    "id": "gt07",
    "group": "going-to",
    "base": "buy",
    "text": "She has saved enough money. She ___ a new laptop tomorrow.",
    "timeExpressions": [
      "tomorrow"
    ],
    "correctAnswers": [
      "is going to buy"
    ],
    "distractors": [
      "buys",
      "bought",
      "is buying now",
      "has bought"
    ]
  },
  {
    "id": "gt08",
    "group": "going-to",
    "base": "practice",
    "text": "I have an audition Friday, so I ___ every evening this week.",
    "timeExpressions": [
      "every evening this week"
    ],
    "correctAnswers": [
      "am going to practice"
    ],
    "distractors": [
      "practice",
      "practiced",
      "am practicing right now",
      "have practiced"
    ]
  },
  {
    "id": "gt09",
    "group": "going-to",
    "base": "start",
    "text": "The company approved the plan. It ___ construction in June.",
    "timeExpressions": [
      "in June"
    ],
    "correctAnswers": [
      "is going to start"
    ],
    "distractors": [
      "starts",
      "started",
      "is starting now",
      "has started"
    ]
  },
  {
    "id": "gt10",
    "group": "going-to",
    "base": "watch",
    "text": "We chose a movie already. We ___ it after dinner.",
    "timeExpressions": [
      "after dinner"
    ],
    "correctAnswers": [
      "are going to watch"
    ],
    "distractors": [
      "watch",
      "watched",
      "are watching now",
      "have watched"
    ]
  },
  {
    "id": "im01",
    "group": "imperative",
    "base": "close",
    "text": "___ the door quietly when you leave.",
    "timeExpressions": [
      "when you leave"
    ],
    "correctAnswers": [
      "close"
    ],
    "distractors": [
      "open",
      "push",
      "hold",
      "lock"
    ]
  },
  {
    "id": "im02",
    "group": "imperative",
    "base": "turn",
    "text": "Please ___ off your phone before the exam starts.",
    "timeExpressions": [
      "before the exam starts"
    ],
    "correctAnswers": [
      "turn"
    ],
    "distractors": [
      "put",
      "take",
      "bring",
      "keep"
    ]
  },
  {
    "id": "im03",
    "group": "imperative",
    "base": "write",
    "text": "___ your name at the top of the page.",
    "timeExpressions": [],
    "correctAnswers": [
      "write"
    ],
    "distractors": [
      "read",
      "say",
      "spell",
      "erase"
    ]
  },
  {
    "id": "im04",
    "group": "imperative",
    "base": "wait",
    "text": "___ here until I come back.",
    "timeExpressions": [
      "until I come back"
    ],
    "correctAnswers": [
      "wait"
    ],
    "distractors": [
      "walk",
      "leave",
      "move",
      "run"
    ]
  },
  {
    "id": "im05",
    "group": "imperative",
    "base": "listen",
    "text": "___ carefully to the instructions before you begin.",
    "timeExpressions": [
      "before you begin"
    ],
    "correctAnswers": [
      "listen"
    ],
    "distractors": [
      "speak",
      "write",
      "move",
      "answer"
    ]
  },
  {
    "id": "im06",
    "group": "imperative",
    "base": "do",
    "text": "___ not touch the wet paint.",
    "timeExpressions": [],
    "correctAnswers": [
      "do"
    ],
    "distractors": [
      "make",
      "take",
      "keep",
      "give"
    ]
  },
  {
    "id": "im07",
    "group": "imperative",
    "base": "take",
    "text": "___ a deep breath before you answer.",
    "timeExpressions": [
      "before you answer"
    ],
    "correctAnswers": [
      "take"
    ],
    "distractors": [
      "make",
      "give",
      "keep",
      "bring"
    ]
  },
  {
    "id": "im08",
    "group": "imperative",
    "base": "keep",
    "text": "___ your ticket until the end of the event.",
    "timeExpressions": [
      "until the end of the event"
    ],
    "correctAnswers": [
      "keep"
    ],
    "distractors": [
      "throw",
      "lose",
      "tear",
      "leave"
    ]
  },
  {
    "id": "im09",
    "group": "imperative",
    "base": "bring",
    "text": "___ your notebook to class tomorrow.",
    "timeExpressions": [
      "tomorrow"
    ],
    "correctAnswers": [
      "bring"
    ],
    "distractors": [
      "leave",
      "forget",
      "lose",
      "lend"
    ]
  },
  {
    "id": "im10",
    "group": "imperative",
    "base": "follow",
    "text": "___ the arrows to reach the emergency exit.",
    "timeExpressions": [],
    "correctAnswers": [
      "follow"
    ],
    "distractors": [
      "erase",
      "ignore",
      "cover",
      "remove"
    ]
  },
  {
    "id": "mo01",
    "group": "modals",
    "base": "wear",
    "text": "All cyclists are required by law to ___ a helmet.",
    "timeExpressions": [],
    "correctAnswers": [
      "must wear"
    ],
    "distractors": [
      "can wear",
      "might wear",
      "could wear",
      "would wear"
    ]
  },
  {
    "id": "mo02",
    "group": "modals",
    "base": "study",
    "text": "You have an exam tomorrow, so you ___ tonight.",
    "timeExpressions": [
      "tomorrow",
      "tonight"
    ],
    "correctAnswers": [
      "should study"
    ],
    "distractors": [
      "can study",
      "might study",
      "would study",
      "could study"
    ]
  },
  {
    "id": "mo03",
    "group": "modals",
    "base": "enter",
    "text": "Only staff members ___ this room.",
    "timeExpressions": [],
    "correctAnswers": [
      "can enter"
    ],
    "distractors": [
      "must enter",
      "should enter",
      "might enter",
      "would enter"
    ]
  },
  {
    "id": "mo04",
    "group": "modals",
    "base": "rain",
    "text": "Take an umbrella; it ___ later.",
    "timeExpressions": [
      "later"
    ],
    "correctAnswers": [
      "might rain"
    ],
    "distractors": [
      "must rain",
      "can rain",
      "would rain",
      "should rain"
    ]
  },
  {
    "id": "mo05",
    "group": "modals",
    "base": "leave",
    "text": "The sign says parking ends at 6 p.m.; we ___ before then.",
    "timeExpressions": [
      "before then"
    ],
    "correctAnswers": [
      "must leave"
    ],
    "distractors": [
      "can leave",
      "might leave",
      "would leave",
      "could leave"
    ]
  },
  {
    "id": "mo06",
    "group": "modals",
    "base": "swim",
    "text": "When I was six, I ___ across the pool without help.",
    "timeExpressions": [
      "when I was six"
    ],
    "correctAnswers": [
      "could swim"
    ],
    "distractors": [
      "can swim",
      "must swim",
      "should swim",
      "might swim"
    ]
  },
  {
    "id": "mo07",
    "group": "modals",
    "base": "eat",
    "text": "You ___ that food if you are allergic to peanuts.",
    "timeExpressions": [],
    "correctAnswers": [
      "should not eat"
    ],
    "distractors": [
      "can eat",
      "might eat",
      "would eat",
      "could eat"
    ]
  },
  {
    "id": "mo08",
    "group": "modals",
    "base": "finish",
    "text": "With enough time, we ___ the project today.",
    "timeExpressions": [
      "today"
    ],
    "correctAnswers": [
      "can finish"
    ],
    "distractors": [
      "must finish",
      "should finish",
      "might finish",
      "would finish"
    ]
  },
  {
    "id": "mo09",
    "group": "modals",
    "base": "be",
    "text": "I'm not sure, but the person at the door ___ Ana.",
    "timeExpressions": [],
    "correctAnswers": [
      "could be"
    ],
    "distractors": [
      "must be",
      "should be",
      "would be",
      "is"
    ]
  },
  {
    "id": "mo10",
    "group": "modals",
    "base": "use",
    "text": "Students ___ calculators during this section because the rules permit them.",
    "timeExpressions": [
      "during this section"
    ],
    "correctAnswers": [
      "may use",
      "can use"
    ],
    "distractors": [
      "must use",
      "should use",
      "would use",
      "might use"
    ]
  }
];

  const GROUPS=[
  "present-simple",
  "past-simple",
  "future-will",
  "present-continuous",
  "past-continuous",
  "future-continuous",
  "present-perfect",
  "past-perfect",
  "future-perfect",
  "present-perfect-continuous",
  "past-perfect-continuous",
  "future-perfect-continuous",
  "going-to",
  "imperative",
  "modals"
];
  const DIFFICULTY_GROUPS={
  easy:[
    "present-simple",
    "past-simple",
    "future-will",
    "present-continuous",
    "going-to",
    "imperative",
    "modals"
  ],
  medium:[
    "past-continuous",
    "future-continuous",
    "present-perfect",
    "past-perfect"
  ],
  hard:[
    "future-perfect",
    "present-perfect-continuous",
    "past-perfect-continuous",
    "future-perfect-continuous"
  ]
};

  const GROUP_LABELS={
  "present-simple": "Present Simple",
  "past-simple": "Past Simple",
  "future-will": "Future with will",
  "present-continuous": "Present Continuous",
  "past-continuous": "Past Continuous",
  "future-continuous": "Future Continuous",
  "present-perfect": "Present Perfect",
  "past-perfect": "Past Perfect",
  "future-perfect": "Future Perfect",
  "present-perfect-continuous": "Present Perfect Continuous",
  "past-perfect-continuous": "Past Perfect Continuous",
  "future-perfect-continuous": "Future Perfect Continuous",
  "going-to": "Be going to",
  "imperative": "Commands / Imperatives",
  "modals": "Modal verbs"
};

  function shuffled(values,random=Math.random){
    const copy=[...values];
    for(let i=copy.length-1;i>0;i--){
      const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }

  function unique(values){
    return [...new Set((values||[]).filter(Boolean).map(v=>String(v).toLowerCase()))];
  }

  function createChallenge(template,{difficulty='medium',distractorCount=null,random=Math.random}={}){
    const correctAnswers=unique(template.correctAnswers);
    const wanted=Math.max(1,Math.floor(distractorCount??3));
    const distractors=shuffled(
      unique(template.distractors).filter(v=>!correctAnswers.includes(v)),
      random
    ).slice(0,wanted);

    if(!correctAnswers.length)throw new Error('Sentence Run needs a correct answer: '+template.id);
    if(!distractors.length)throw new Error('Sentence Run needs distractors: '+template.id);

    return {
      id:template.id,
      level:2,
      mode:'sentence-run',
      group:template.group,
      grammarLabel:GROUP_LABELS[template.group]||template.group,
      base:template.base,
      text:template.text,
      timeExpressions:[...(template.timeExpressions||[])],
      cue:template.base,
      correctAnswer:correctAnswers[0],
      correctAnswers,
      distractors,
      difficulty
    };
  }

  function buildAnswerSequence(challenge,{random=Math.random,distractorCount=null}={}){
    const amount=Math.max(1,Math.min(
      challenge.distractors.length,
      Math.floor(distractorCount??challenge.distractors.length)
    ));
    const correctAnswers=unique(challenge.correctAnswers?.length?challenge.correctAnswers:[challenge.correctAnswer]);
    return shuffled([
      ...challenge.distractors.slice(0,amount).map(value=>({value,correct:false})),
      ...correctAnswers.map(value=>({value,correct:true}))
    ],random);
  }

  function buildRound(count=20,{difficulty='medium',distractorCount=null,random=Math.random}={}){
    const total=Math.max(3,Math.min(SENTENCES.length,Math.floor(count)));
    const difficultyGroups=DIFFICULTY_GROUPS[difficulty]||DIFFICULTY_GROUPS.medium;
    const activeGroups=total>=difficultyGroups.length
      ?[...difficultyGroups]
      :shuffled(difficultyGroups,random).slice(0,total);
    const baseEach=Math.floor(total/activeGroups.length);
    const remainder=total-baseEach*activeGroups.length;
    const bonusOrder=shuffled(activeGroups,random);
    const quotas=Object.fromEntries(activeGroups.map(group=>[group,baseEach]));
    for(let i=0;i<remainder;i++)quotas[bonusOrder[i]]+=1;

    const picked=[];
    for(const group of activeGroups){
      const pool=shuffled(SENTENCES.filter(item=>item.group===group),random);
      picked.push(...pool.slice(0,quotas[group]));
    }

    return shuffled(picked,random).map(item=>createChallenge(item,{
      difficulty,
      distractorCount,
      random
    }));
  }

  const api={SENTENCES,GROUPS,GROUP_LABELS,DIFFICULTY_GROUPS,createChallenge,buildAnswerSequence,buildRound,shuffled};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  global.VerbRunnerSentenceBank=api;
})(typeof window!=='undefined'?window:globalThis);
