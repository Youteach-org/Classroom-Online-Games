# Verb Runner 2.5 — Learning-First Dynamic Runner

Status: **Phase 1 development prototype implemented and browser-verified. Development only. Production main remains stable.**

Current Phase 1 implementation:
- dedicated Sentence Runner world module, separate from the Level 1 near corridor;
- three route zones: Market Streets, Rooftop Run, Seafront Promenade;
- rooftop route elevation at 4.2 world units;
- zone-specific lane widths and camera framing;
- large three-choice HUD for sentence/verb-phrase answers;
- in-world lane beacons carry position only, never long sentence text;
- reading lead time grows with answer length;
- Level 1 near-world group is hidden only while Level 2 is active and restored for every other race;
- full Verb Runner regression suite passes;
- Cloudflare development preview browser smoke test passes at 1536×864 with three visible answer choices measured around 352–364 px wide and 110–114 px high.

Still intentionally pending:
- physical route split / shortcut consequence after an answer;
- richer authored obstacle patterns per zone;
- chase/rival system;
- visual polish beyond the first zone prototype;
- validation of the later Rooftop and Promenade sections through longer automated play.

Rejected prototype lessons:
- small Grammar Gates are not readable enough for sentence/tense answers;
- adding crouch/slide mechanics on the same road does not meaningfully reduce monotony;
- visual variety must include genuinely different route geometry and environments, not cosmetic changes.

## Non-negotiable principle

Verb Runner is an educational game first.

Entertainment exists to:
- sustain attention;
- reduce monotony;
- make repetition feel varied;
- create meaningful pressure and movement around the learning task.

Entertainment must **never delay the learning task** or create long stretches in which the student is only running.

The student should begin practicing within the first few seconds and continue making frequent language decisions throughout the race.

## Design goal

Keep Level 1 as the clear introductory principal-parts race, because its current structure works as an introduction.

From Level 2 onward, preserve a **high density of English practice** while varying how the student responds physically.

The problem to solve is not “there is too much learning.” The problem is:

> the same learning interaction is repeated with nearly the same physical action.

Current repeated loop:

> read → choose lane → collect answer → repeat

Target loop:

> read/notice language → make a language decision through movement → receive immediate feedback → encounter the next language problem in a different physical form.

The academic task remains continuous. The runner mechanics change around it.

## Learning-density rule

Target behavior for Levels 2–5:

- first language prompt appears within roughly **3–6 seconds** of starting;
- a meaningful language decision occurs approximately every **6–10 seconds**, depending on reading complexity and difficulty;
- pure traversal/reward intervals should normally last only **2–5 seconds**;
- no 20–40 second “gameplay-only” sections;
- no one-minute delay before serious practice;
- special events must themselves contain language practice whenever possible.

The exact timing should remain adaptive to reading load and difficulty; these values are design targets, not rigid timers.

## What changes: the whole run, not just the answer widget

A run should keep presenting English continuously, but from Level 2 onward it must also stop looking and feeling like the exact same three-lane road.

The redesign must change:
- route geometry;
- elevation;
- scenery zones;
- camera behavior;
- obstacle language;
- pacing;
- how the academic prompt is presented.

**Rejected direction:** keeping the same road and merely replacing cards with small gates or crouch obstacles. That is superficial variety, not a new runner experience.

A new level must look recognizably different within the first few seconds while preserving the overall Verb Runner brand.

Possible learning interactions:

### 1. Wide readable choice + physical route consequence

Sentence Runner contains full sentences and verb phrases, so answers **must not be squeezed into small in-world gates**.

The sentence stays large and readable in the HUD. Answer choices use a wide readable presentation with enough lead time. Once the student chooses, the physical route reacts:
- shortcut opens;
- upper route becomes available;
- obstacle pattern changes;
- rival distance changes;
- boost line activates.

The academic choice remains readable; the runner consequence makes it feel like a game.

### 2. Jump the wrong form

Two or three low obstacles carry verb forms.

Instruction:
> COLLECT THE PAST PARTICIPLE

The player jumps over wrong forms and stays aligned with the correct one.

### 3. Movement challenge after the answer

Roll, jump and route changes are movement mechanics, not text containers.

For Sentence Runner:
- do not print long verb phrases on low barriers;
- do not force the student to read while timing a slide;
- use movement immediately after a readable academic choice as consequence/reward.

Short labels such as FOR / SINCE / AGO may later be tested in world-space because they remain legible.

### 4. Collect sequence

The player must collect a short sequence in order.

Example:
> TAKE → TOOK → TAKEN

The tokens are distributed over a short obstacle pattern.

This practices recognition/order without stopping the run.

### 5. Route by time clue

Prompt:
> I have known her ___ five years.

Two or three street branches:
- FOR
- SINCE
- AGO

The environment becomes the answer interface.

### 6. Chase with learning

A rival is visible ahead, but the chase is not an entertainment-only segment.

Every correct answer:
- closes the distance;
- increases momentum;
- may briefly increase speed.

Every wrong answer:
- loses distance;
- lowers momentum.

The chase adds stakes to the same practice.

### 7. Rooftop learning route

The upper route does not merely contain coins.

It may contain:
- a faster sequence of principal parts;
- a bonus sentence;
- a correction challenge;
- a harder distractor set.

The lower route contains the normal version of the same learning goal.

Thus route choice changes **difficulty/reward**, not whether learning happens.

### 8. Speed challenge with language

A short speed zone still contains language decisions, but uses shorter material:
- one-word forms;
- time clues;
- auxiliaries;
- short collocations.

Long sentences should not be presented at maximum speed.

## Correct rhythm for a sample run

This replaces the previous design that delayed practice.

### 0:00–0:05 — Immediate prompt

Sentence appears while the player begins running.

> Yesterday she ___ the report.

The road is simple enough to read safely.

### 0:05–0:10 — Readable answer choice

FINISHED / FINISH / HAS FINISHED

The three options are presented large enough to read immediately. The road is deliberately simple during the decision.

The chosen answer then changes the route or upcoming movement sequence.

### 0:10–0:14 — Micro-transition

A few seconds of running/jumping while the correct form remains visible or is pronounced.

This is processing/feedback time, not a long break.

### 0:14–0:22 — Second learning event

A new sentence appears.

This time the answer is not a gate: the options are integrated into an obstacle pattern.

### 0:22–0:28 — Collect sequence

The player collects a short grammar sequence or avoids distractors.

### 0:28–0:36 — Third prompt + route split

Another language decision, now tied to two possible routes.

### 0:36–0:42 — Feedback + movement

Short physical variation: jump/slide/turn while the previous answer is reinforced.

### 0:42–0:50 — Fourth learning event

A short time-clue or verb-form decision during a faster section.

### 0:50–1:00 — Chase challenge

A rival appears, but the chase contains one or two rapid language decisions.

Correct answers close the gap.

### 1:00 onward

Continue alternating **response formats**, not alternating “learning mode” and “game mode.”

The student should still be practicing throughout the run.

## Pedagogical structure

### Retrieval remains central

The player must retrieve/recognize the correct language form repeatedly.

### Immediate feedback remains central

Correct/incorrect feedback should stay immediate and readable.

For important targets, the correct form can:
- move into the sentence;
- remain visible briefly;
- play pronunciation;
- reappear later if missed.

### Errors should recycle

Incorrect items should return later in the run or near the end, as the current system already does in several modes.

### Difficulty changes distractors and cognitive load

Difficulty should affect:
- closeness of distractors;
- number of distractors;
- reading complexity;
- speed;
- obstacle complexity.

It should not simply reduce the amount of practice.

### Movement must not obscure reading

When the prompt is linguistically complex:
- simplify the immediate obstacle field;
- give sufficient visual lead time;
- avoid simultaneous high-speed precision movement.

When the prompt is short:
- movement can be more demanding.

## Entertainment layer

The entertaining part should come from **how the learning is delivered**:

- different routes;
- ramps;
- jump/slide requirements;
- chase pressure;
- changing scenery;
- speed changes;
- authored obstacle patterns;
- optional harder paths;
- streak effects;
- short reward bursts;
- rivals;
- visible progress.

These features wrap around the learning. They do not replace it.

## Level progression

### Level 1 — Verb Runner / Verb Hunt

Keep largely as it is.

Purpose:
- introduce controls;
- practice principal parts;
- teach the basic collect/avoid language mechanic.

### Level 2 — Sentence Runner

First genuinely different runner.

It must not reuse Level 1's visual structure as its dominant look.

Core visual/gameplay zones:
- **Coastal boulevard start** — only a short transition from the familiar Level 1 world;
- **Market streets** — narrower route, awnings, delivery carts, turns and readable storefront landmarks;
- **Rooftops / terraces** — elevation change, ramps, gaps, upper/lower paths;
- **Seafront promenade / pier** — wider space, boost lines, moving hazards, sea immediately beside the route;
- **Tunnel / service passage** — tighter camera, lighting change, short high-focus grammar sequence;
- **Plaza / final stretch** — open space, branching paths, visible rival or goal.

Sentence practice remains continuous, but the academic response is shown in a **large readable interface** and the chosen answer affects the physical run.

Do not use Grammar Gates or text-on-slide-obstacle mechanics for sentence-length answers.

### Level 3 — Time Clues

Every special mechanic continues to ask for time relationships.

Examples:
- choose FOR / SINCE / AGO as routes;
- collect compatible time expressions;
- avoid incompatible clues;
- chase events driven by correct time-clue choices.

### Level 4 — Perfect Running

Mechanics vary, but all decisions remain focused on Perfect Simple vs Perfect Continuous and their clues.

### Level 5 — Final Race

Mixed academic content with the widest response variety:
- principal parts;
- tense/context;
- time clues;
- perfect aspect;
- mixed combinations.

The “final race” should feel more dynamic, but it must also have the **highest meaningful practice density**, not the lowest.

## Run Director responsibility

The Run Director should **not** decide when learning stops and gameplay begins.

It should decide:
- which response format presents the next academic item;
- which obstacle pattern is compatible with that item;
- how much movement pressure is safe for the reading load;
- which route/interaction has not been used recently;
- whether the next item should be a recycled error or a new item.

Conceptually:

> NEXT LEARNING ITEM → choose safe presentation format → play → immediate feedback → next learning item

Not:

> game section → game section → game section → eventually show a question

## First implementation milestone

**Prototype only Level 2 first, entirely in the development branch.**

The first prototype must prove two things simultaneously:
1. Sentence Runner is still dense educational practice.
2. It visibly and physically feels like a different runner from Level 1.

Implement in this order:

1. new Level 2 route/zone system with at least **three visibly different environments** in one run;
2. one elevation change: road → rooftop/terrace → road;
3. one route split with different physical consequences;
4. readable large-format sentence answers with enough lead time;
5. answer consequences that alter route, momentum, shortcut or pursuit state;
6. 6–10 authored obstacle patterns appropriate to each zone;
7. error recycling;
8. only after the above works, evaluate Roll/Slide as normal movement mechanics;
9. tests for:
   - no impossible route;
   - no excessive gap between learning events;
   - long answer text never rendered inside small world-space containers;
   - reading-heavy prompts lower movement pressure;
   - Level 2 uses multiple visual zones rather than the same road loop.

Do not port to Levels 3–5 until the Level 2 prototype proves both:
- academically dense enough;
- less monotonous than the current version.

## Compatibility constraints

- Do not alter pronunciation review/report state.
- Do not break YouTeach identity or Teacher Monitor.
- Preserve auto-pause.
- Preserve mobile playability.
- Preserve the **overall coastal brand**, not the exact same road layout.
- Level 2 may and should introduce new streets, rooftops, market areas, pier/promende, tunnel/service routes and camera changes.
- Production `main` remains untouched until the development preview is explicitly approved.
- Preserve answer readability.
- Never create unavoidable obstacle + correct-answer conflicts.
- Do not let spectacle obscure the instructional objective.
