# Wordy Game — Validation Prototype Design

**Repository:** `youteachtk/Classroom-Online-Games`  
**Branch:** `feature/wordy-game`  
**Status:** Design consolidated; user review required before implementation planning  
**Date:** 2026-09-20  
**Parent architecture:** `docs/superpowers/specs/2026-09-20-wordy-game-architecture-design.md`

## 1. Purpose

Build the smallest mobile-first version that can truthfully test the core Wordy mechanic.

The prototype is not intended to prove the full progression system, content scale, adaptive learning, or meta-game. It exists to answer one question:

> Is arranging English relationships, preparing several at once, triggering a global pop, and anticipating cascades genuinely understandable and fun?

If the answer is no, the core mechanic must be redesigned before content and progression are scaled.

## 2. Required game loop

The prototype must implement this exact sequence:

1. display a readable equal-cell word grid;
2. allow one orthogonally adjacent swap per move;
3. permit swaps that do not immediately score;
4. detect validated horizontal/vertical relationships after each player swap;
5. mark every current valid relationship as ready;
6. keep ready relationships on the board until the player triggers resolution or breaks them;
7. activate one global resolve/pop control when at least one ready relationship exists;
8. resolve all ready relationships simultaneously when triggered;
9. apply score for relationships, batching, crossings, and discovery as applicable;
10. apply vertical gravity and refill;
11. detect gravity/refill-created relationships;
12. resolve those relationships automatically as cascade generations;
13. repeat gravity/refill/cascade until stable;
14. return control to the player;
15. end the level when its objective succeeds or its move budget is exhausted;
16. show a compact learning review.

## 3. Board rules

### 3.1 Swap rule
A tile swaps with exactly one immediate neighbor:
- up;
- down;
- left;
- right.

No diagonal movement, jumping, long drags, or free repositioning.

### 3.2 Match geometry
Valid relationships must be:
- contiguous;
- horizontal or vertical;
- in the relationship’s required order.

### 3.3 Setup moves
A legal swap remains valid even if it creates no relationship. It consumes one move and stays in place.

### 3.4 Ready state
Any current validated relationship becomes ready.

Ready relationships are not frozen. The player may:
- leave them intact;
- extend them;
- cross them;
- break them with later movement.

### 3.5 Global pop
The global pop control:
- belongs to the board, not to one phrase;
- is disabled when no relationship is ready;
- resolves all ready relationships together;
- does not consume an extra move.

### 3.6 Nested relationships
If a longer valid relationship fully contains a shorter valid relationship on the same line, the prototype resolves/scores the longer structure rather than double-counting the shorter contained one.

### 3.7 Crossword intersections
Two valid relationships may share a physical tile.

At global resolution:
- both relationships score;
- the shared tile disappears once;
- the play receives a cross bonus.

## 4. Cascade rules

After the initial player-triggered batch:
1. remove resolved tiles;
2. fall existing tiles vertically;
3. refill empty cells from the top;
4. detect new valid relationships;
5. automatically resolve them as the next cascade generation;
6. repeat until no new gravity/refill-created relationship exists.

The player cannot move tiles during the cascade.

Cascade depth increments for each automatic generation after the initial player-triggered resolution.

## 5. Prototype content bank

Use roughly 60–100 manually curated and validated relationships.

All four initial families must be represented:
- phrasal verbs;
- collocations;
- fixed expressions;
- irregular verb sets.

The bank should favor:
- high-frequency useful English;
- short and medium relationships;
- some longer relationships;
- overlapping vocabulary that enables multiple possible paths;
- enough repeated hub words such as TAKE, MAKE, LOOK, GO, GET, and HAVE to create strategic ambiguity.

Do not load thousands of words yet.

The prototype relationship bank is local curated production data, not live LLM output.

## 6. Board creation modes

The prototype needs two sources of boards.

### 6.1 Authored validation boards
Use deliberately designed board states to test:
- first swap;
- non-scoring setup moves;
- two or more ready relationships at once;
- a planned gravity-created cascade;
- a crossword intersection;
- a longer expression;
- a board where waiting before popping is clearly advantageous.

These boards are for reliable usability testing.

### 6.2 Controlled-random boards
Use a constrained generator that selects from compatible relationship neighborhoods rather than arbitrary vocabulary.

The random generator should:
- preserve multiple plausible future relationships;
- allow some distractors;
- avoid obviously scripted boards;
- reject dead/sterile starts.

It does not need the final production generator or deep simulation yet.

## 7. Prototype levels

Use a small sequence of validation levels rather than a full map.

Recommended progression:

### Level A — Basic movement
Purpose: learn adjacent swaps and relationship recognition.

### Level B — Global pop
Purpose: form a relationship, observe ready state, trigger resolution.

### Level C — Batch preparation
Purpose: demonstrate that several ready relationships can coexist and resolve together.

### Level D — Planned cascade
Purpose: make the player see that removing one structure can cause another relationship to fall into place.

### Level E — Longer expression
Purpose: practice deliberate multi-move construction.

### Level F — Crossword intersection
Purpose: build two independent relationships sharing one tile.

### Level G+ — Mixed play
Purpose: combine categories and mechanics with reduced guidance.

The exact count can remain small as long as every core mechanic is tested.

## 8. Scoring in the prototype

Use provisional constants, but preserve the production scoring structure:

- stable relationship base value;
- length bonus;
- batch/setup bonus;
- cross bonus;
- modest first-discovery bonus;
- increasing cascade multiplier.

Do not penalize non-scoring setup swaps beyond move consumption.

Do not award a waiting bonus merely for leaving a relationship ready.

The prototype UI does not need to expose the full formula. It should make high-value events legible through score changes and concise labels such as:
- Combo x2;
- Cross;
- New;
- multi-ready batch indicator.

## 9. Level completion

The base prototype uses move-limited levels.

A level can require:
- target score;
- one structural objective;
- or a simple combination of the two.

Timed play is excluded.

The prototype should include both:
- straightforward score-focused rounds;
- rounds designed to test a specific mechanic.

## 10. End-of-round review

Keep the result screen compact.

### New learning
Show only a few newly discovered relationships from the round.

### Missed opportunity
Show only a few verified high-value missed relationships.

### Tutorial replay
For early validation levels, store a lightweight logical board snapshot and re-render the missed state rather than saving a bitmap screenshot.

The replay should highlight:
- relevant tiles;
- the move/alignment that would have created the opportunity.

## 11. Telemetry required for validation

Capture enough local/test telemetry to analyze the loop:

- level start/end;
- move count;
- every swap;
- whether a swap immediately created a relationship;
- relationships marked ready;
- number of ready relationships when the player triggers pop;
- deliberate relationship formations;
- relationships broken before pop;
- intersection creation;
- cascade depth;
- cascade-created relationships;
- dead-board resets;
- missed high-value opportunities;
- completion/failure;
- restart/abandonment.

The prototype does not require the final player learning model, but event structure should not make future learning-state tracking impossible.

## 12. Dead-board behavior

When a stabilized board has no meaningful viable play:
- automatically clear/reset it;
- replace it with a validated productive board;
- do not consume a move for the recovery.

For validation, log every dead-board reset so generation quality can be measured.

## 13. Mobile interaction requirements

The prototype is phone-first.

Requirements:
- large readable tiles;
- clear swipe/tap swap interaction;
- no tiny hit targets;
- obvious ready-state marking;
- obvious disabled/enabled state for global pop;
- readable cascade feedback;
- text remains primary and unobscured by effects.

Visual polish is secondary to clarity and feel.

## 14. Explicit prototype exclusions

Do not implement these in the first validation build:
- full world/level map;
- production star progression;
- full Wordbook;
- category preference UI;
- adaptive relationship weighting;
- full mastery model;
- boosters;
- obstacles;
- currency/lives/economy;
- season/live-service systems;
- Teacher Monitor integration;
- thousands of relationships;
- final art direction;
- final production scoring balance.

These are intentionally deferred, not missing requirements.

## 15. Validation questions

The prototype test should answer:

1. Do players understand why a relationship is valid?
2. Do they understand that ready relationships remain until global pop?
3. Do they ever choose not to pop immediately?
4. Can they anticipate useful gravity?
5. Do simultaneous ready relationships feel rewarding?
6. Are automatic cascades understandable rather than confusing?
7. Are crossword intersections discoverable?
8. Does mixed linguistic content feel coherent?
9. Do missed-opportunity replays teach board reading?
10. Does the activity feel like a game rather than a disguised worksheet?

## 16. Go/no-go criterion for scaling

Do not proceed to large-scale content, progression, boosters, or meta-game merely because the prototype functions technically.

The core loop should first show evidence that players:
- understand the rules with limited explanation;
- deliberately prepare multiple relationships;
- intentionally delay activation for strategic reasons;
- attempt cascade planning;
- react positively to chain resolution;
- accept the validated linguistic relationships as credible;
- want another round.

If those behaviors do not emerge, revise the core interaction before scaling the product.
