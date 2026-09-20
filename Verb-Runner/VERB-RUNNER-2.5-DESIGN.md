# Verb Runner 2.5 — Gameplay Direction

Status: design direction approved for exploration; **no gameplay code changed yet**.

## Design goal

Keep Level 1 as the clear introductory race, but make Levels 2–5 feel progressively more like a true infinite runner instead of repeating the same “read → choose lane → collect answer” loop.

The target feeling is not simply “more obstacles.” The race should change what the player is doing every 15–25 seconds while the English objective remains integrated into the action.

## Core principles

1. **Level 1 stays familiar.** It remains the tutorial/introductory principal-parts race.
2. **Gameplay states change during one run.** Normal running, obstacle patterns, routes, grammar gates, chase sequences, slide sections, speed/reward sections.
3. **Grammar belongs to the world.** Answers should sometimes be gates, routes, objects, targets, or route choices instead of always floating cards.
4. **Designed patterns beat pure randomness.** Obstacle sequences must be authored and fair.
5. **Pressure must breathe.** Alternate challenge, reward, rest, surprise, and challenge again.
6. **No unfair overlap.** Grammar choices and obstacle patterns must never create impossible lanes.
7. **Current systems stay intact unless explicitly revised.** Coastal world, characters, YouTeach/Teacher Monitor sync, pronunciation review, mobile controls, difficulty system and session behavior are preserved.
8. **Use existing native animations first.** The current Quaternius runners already provide Run, Jump, Roll, RecieveHit and Idle. Roll should become a real gameplay action before adding unnecessary animation work.

## Reference design lessons

The direction borrows design principles—not copied assets or layouts—from successful infinite runners:

- route/vertical variety;
- temporary changes of locomotion or rules;
- authored obstacle patterns;
- chase/special sequences;
- reward/rest segments between intense sections;
- optional higher-risk routes;
- spectacle without interrupting control.

## Sample 2–3 minute run

### 01 — Warm-up Run · 0:00–0:20

Normal coastal road. Simple lane changes and one or two readable jump obstacles. No grammar question immediately.

Purpose: establish control rhythm and give the player a short physical warm-up.

### 02 — Rooftop Route · 0:20–0:42

A visible ramp opens an optional upper route over awnings/low roofs while the normal road remains available.

Upper route:
- slightly harder;
- extra grammar tokens / reward;
- different view of the coastal town.

Lower route:
- safer;
- normal road obstacles.

Purpose: create choice without pausing the runner.

### 03 — Traffic Rush · 0:42–1:03

A short authored sequence of cars, boxes and barricades. The pattern is deterministic enough to be learnable/fair but can be selected from a library.

Example:
- car left;
- box center;
- open right;
- second wave reverses the safe route;
- one jump requirement.

Purpose: short pure-runner intensity before another academic decision.

### 04 — Grammar Gate · 1:03–1:25

Instead of three floating cards, the road itself becomes the answer.

Example prompt:

> Yesterday I ___ home early.

Three physical gates/routes:
- GO
- WENT
- GONE

The player commits to a route by running through the chosen gate.

Purpose: preserve the academic choice while making it feel like traversal.

### 05 — Slide + Chase · 1:25–1:50

A rival appears farther ahead. Low market awnings/barriers require Roll/Slide.

Correct grammar choices reduce distance to the rival; wrong answers or obstacle hits increase the gap.

Purpose:
- activate the currently unused Roll gameplay;
- create a temporary goal other than “finish 20 questions.”

### 06 — Seafront Boost · 1:50–2:15+

Short reward section:
- speed pads;
- collectible tokens;
- reduced academic load for several seconds;
- stronger camera/speed sensation;
- coastal promenade emphasis.

After the boost, the director chooses another sequence from compatible blocks rather than restarting the exact same loop.

## Gameplay block library

Initial block types:

- NORMAL_RUN
- JUMP_PATTERN
- SLIDE_PATTERN
- TRAFFIC_RUSH
- ROUTE_SPLIT
- ROOFTOP_ROUTE
- GRAMMAR_GATE
- COLLECT_SEQUENCE
- CHASE_EVENT
- SPEED_ZONE
- REWARD_ZONE
- SHORTCUT
- FINAL_SPRINT

Each level should use only a subset appropriate to its grammar goal.

## Level progression

### Level 1 — Verb Runner / Verb Hunt
Keep current structure largely unchanged. Introduce movement and principal parts.

### Level 2 — Sentence Runner
First real dynamic runner:
- Roll/slide enabled;
- authored obstacle patterns;
- grammar gates;
- route splits;
- short reward zones.

### Level 3 — Time Clues
Add chase behavior and route-based clue choices.

### Level 4 — Perfect Running
Combine vertical/horizontal movement, low barriers and Simple vs Continuous decisions.

### Level 5 — Final Race
Mixed gameplay director:
- all compatible block types;
- stronger speed curve;
- surprise events;
- final sprint;
- no predictable fixed rhythm.

## Technical direction

Do not continue expanding the already-large `prototype.js` indefinitely.

Preferred modules:

- `run-director.js` — selects the next compatible gameplay block.
- `segment-library.js` — definitions and timing for run segments.
- `obstacle-patterns.js` — fair authored obstacle patterns.
- `grammar-events.js` — gates, route answers, collectible sequences.
- `special-events.js` — chase, speed zone, reward section, shortcut.
- `powerups.js` — only after the new core loop proves fun.

`prototype.js` should remain orchestration/integration rather than contain every rule.

## First implementation milestone

**Verb Runner 2.5 prototype = Level 2 only.**

Implement and test:

1. real Roll/Slide control on keyboard and mobile;
2. 6–10 authored obstacle patterns;
3. Grammar Gate;
4. one Route Split / Rooftop-style alternate route;
5. one Chase Event;
6. one short Speed/Reward Zone;
7. a simple Run Director that alternates these blocks safely;
8. tests for impossible overlaps, repeat prevention and state transitions.

Do **not** port the system to Levels 3–5 until Level 2 is demonstrably more fun than the current loop.

## Safety / compatibility constraints

- Do not alter pronunciation review/report state.
- Do not break YouTeach identity or Teacher Monitor.
- Preserve auto-pause behavior.
- Preserve mobile playability.
- Preserve current coastal-world visual identity.
- Keep answer readability high.
- Never create unavoidable obstacle + correct-answer conflicts.

