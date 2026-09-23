# Verb Runner 2.5 — Learning-First Dynamic Runner

Status: design direction corrected after review. **No gameplay code changed yet.**

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

## What changes: response mode, not learning frequency

A run should keep presenting English continuously, but the player should not always answer by touching one of three floating cards.

Possible learning interactions:

### 1. Grammar Gate

Prompt:
> Yesterday I ___ home early.

Three routes:
- GO
- WENT
- GONE

The student answers by choosing the route.

### 2. Jump the wrong form

Two or three low obstacles carry verb forms.

Instruction:
> COLLECT THE PAST PARTICIPLE

The player jumps over wrong forms and stays aligned with the correct one.

### 3. Slide under the correct phrase

Low overhead signs contain short alternatives.

Prompt:
> She has ___ here since 2022.

The correct lane requires a slide under:
- lived
- living
- live

The grammar decision and the movement decision are the same event.

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

### 0:05–0:10 — Grammar Gate

FINISHED / FINISH / HAS FINISHED

The player chooses a gate.

Immediate audiovisual feedback follows the choice.

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

First dynamic learning runner.

Still sentence practice throughout, but rotate:
- Grammar Gate;
- integrated obstacle answers;
- route split;
- slide answer;
- collect sequence.

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

**Prototype only Level 2 first.**

Implement:

1. real Roll/Slide on keyboard and mobile;
2. Grammar Gate;
3. Slide Answer;
4. Collect Sequence;
5. Route Split;
6. 6–10 authored obstacle patterns that can safely carry academic choices;
7. Run Director that changes presentation format while maintaining continuous practice;
8. error recycling;
9. tests for:
   - no impossible correct-answer path;
   - no excessive gap between learning events;
   - no repeated presentation format too many times consecutively;
   - reading-heavy prompts getting lower movement pressure.

Do not port to Levels 3–5 until the Level 2 prototype proves both:
- academically dense enough;
- less monotonous than the current version.

## Compatibility constraints

- Do not alter pronunciation review/report state.
- Do not break YouTeach identity or Teacher Monitor.
- Preserve auto-pause.
- Preserve mobile playability.
- Preserve the current coastal visual identity.
- Preserve answer readability.
- Never create unavoidable obstacle + correct-answer conflicts.
- Do not let spectacle obscure the instructional objective.


## Character asset pipeline — locked decision (2026-09-22)

The playable runner character must be a **real 3D asset**, not a screenshot, static render, or procedural placeholder presented as if it were the final model.

### Required review workflow

Before integration into gameplay, the character must be reviewable as an interactive 3D model/turntable so it can be rotated and inspected from all sides.

Accepted production formats:
- `.glb` preferred for the web build;
- `.gltf` acceptable when external textures/resources are managed correctly;
- FBX/OBJ may be used only as intermediate source formats before conversion to the web asset.

### Visual reference rule

The approved red reference character is the visual target. Matching only the red color is not sufficient.

The 3D model must match the reference in:
- overall silhouette;
- head and face design;
- body proportions;
- limb proportions;
- rounded/stylized construction;
- recognizable character identity.

A generic rigid geometric humanoid recolored red is **not acceptable**.

### Character-specific constraints already approved

- The runner must have a visible face.
- Do not use a generic spread-leg mannequin stance as the character design.
- Do not add the previously rejected backpack or backpack elements.
- Keep the character suitable for later rigging and running/jumping/slide animations.

### Repository rule

Do not claim a character is implemented until the actual 3D model file is committed to the repository and can be loaded by the Verb Runner web runtime.

The target location for the approved production asset is:
`Verb-Runner/assets/characters/`

The game should ultimately load the real model asset instead of reconstructing the character from primitive geometry in runtime code.


### Character cleanup rules — locked

- The production runner asset contains **only the character**. No floor, pedestal, card, shadow slab, or geometry connecting the shoes.
- Left and right shoes must remain geometrically independent at ground contact so later rigging/foot placement is not obstructed.
- The face must follow the approved ALEX reference more closely than a generic anime face; preserve the recognizable eye shape, nose/mouth proportions, jaw/cheek proportions, and hair-fringe relationship.
- Visual approval happens before rigging and animation.
