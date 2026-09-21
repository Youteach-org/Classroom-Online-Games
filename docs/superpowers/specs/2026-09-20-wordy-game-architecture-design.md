# Wordy Game — Consolidated Architecture Design

**Repository:** `youteachtk/Classroom-Online-Games`  
**Branch:** `feature/wordy-game`  
**Status:** Design consolidated; user review required before implementation planning  
**Date:** 2026-09-20

## 1. Product intent

Wordy is a mobile-first English-learning casual puzzle game inside Classroom Online Games (COG). Its core goal is to make English knowledge part of the board mechanic itself rather than interrupt play with quizzes.

The game should feel like a genuine casual puzzle first and an English exercise second. Learning emerges from recognizing, constructing, extending, and remembering useful relationships between English words and expressions.

The final product name is not fixed. Current working candidates include Wordy Pop, Wordy Crush, and Word Wiz. “Match-3” may describe inspiration internally but is not a product name.

## 2. Core player loop

The intended loop is:

`inspect -> productive adjacent swap -> mark ready relationships -> global pop -> gravity -> cascade -> discover language -> improve score/mastery`

The player:
1. swaps adjacent tiles to rearrange words;
2. forms one or more valid linguistic relationships;
3. may continue moving instead of resolving immediately;
4. presses one global resolve/pop control when ready;
5. all currently ready relationships resolve together;
6. gravity and refill change the board;
7. newly created relationships resolve automatically as cascade combos until the board stabilizes;
8. play returns to the player.

The strategic decision is therefore not “which phrase should I pop?” but “when is the board prepared well enough to trigger?”

## 3. Board geometry and movement

### 3.1 Grid

The rules engine uses a regular logical matrix, but the rendered word blocks have variable visual width.

- Logical row/column coordinates remain stable for adjacency, matching, gravity, and crossings.
- Short tokens occupy compact blocks.
- Longer words receive progressively more horizontal space.
- Long expressions still use one word/token per tile.
- Readability takes priority over forcing every word into an equal-width square.

### 3.2 Valid spatial relationships

A playable linguistic relationship must occupy a straight contiguous line:

- horizontal, left-to-right;
- vertical, top-to-bottom.

The base rules do not allow:
- diagonal matching;
- bent paths;
- free-form tracing;
- non-contiguous selection.

Word order must match the relationship definition when order is linguistically meaningful.

Examples:
- `LOOK | AFTER`
- `MAKE | A | DECISION`
- `AS | A | MATTER | OF | FACT`
- `GO | WENT | GONE`

### 3.3 Tile movement

A player move swaps exactly one tile with one orthogonally adjacent tile:

- up;
- down;
- left;
- right.

Not allowed:
- diagonal swaps;
- jumps;
- multi-cell drags;
- free repositioning.

A player may attempt only an orthogonally adjacent swap. The exchange is accepted only when that single swap creates at least one new validated linguistic relationship.

A non-scoring adjacent swap is rejected/reverted immediately and consumes no move. The player cannot walk a word across the board through repeated setup swaps.

## 4. Relationship recognition and ready state

When the board contains a validated linguistic relationship in the required geometry, the relationship is marked as **ready to pop**.

Ready relationships:
- remain physically on the board;
- continue occupying their cells;
- may remain ready across several later moves;
- may be extended into longer relationships;
- may become part of a crossword-style intersection;
- remain intact unless a later accepted productive swap legitimately changes one of their tiles.

Breaking a ready relationship before resolution removes its ready state without an additional penalty beyond the move already spent.

The board may contain several ready relationships at the same time.

If a shorter valid relationship is fully contained inside a longer valid relationship on the same line, the longer resolved structure takes precedence for scoring rather than double-counting the nested shorter structure.

A ready relationship may also be recognized as extendable. The UI should communicate that it can still grow without revealing the missing answer. The exact visual treatment is deferred until interface design.

## 5. Global resolution, gravity, and cascades

### 5.1 Global pop

Resolution is controlled by one board-level action.

When the player presses the global pop/resolve control:
- every relationship that is ready at that exact moment resolves in one batch;
- all participating tiles are removed;
- shared physical tiles are removed only once;
- every independent valid relationship still contributes its scoring value.

Pressing the global pop control does not itself consume an additional move. Moves are spent on tile swaps.

### 5.2 Gravity

After the initial batch resolves:
- tiles above empty cells fall vertically;
- new tiles may enter from the top;
- the resulting board is re-evaluated.

### 5.3 Automatic cascade phase

Any valid relationships formed directly by gravity or refill become automatic cascade rewards.

The cascade cycle is:

`resolve -> fall/refill -> detect -> auto-resolve -> fall/refill -> detect ...`

This continues until no new gravity-created relationship remains. Only then does control return to the player.

The player does not manually intervene during an active cascade sequence.

### 5.4 Strategic consequence

The player can intentionally prepare the board so that one global pop causes a beneficial fall.

Example:
- `LOOK | AFTER` is ready;
- `TAKE` is positioned above `A | BREAK`;
- the player triggers the board;
- removing `LOOK | AFTER` creates vertical space;
- `TAKE` falls into alignment with `A | BREAK`;
- `TAKE | A | BREAK` becomes an automatic cascade combo.

Planning this kind of gravity outcome is a core source of strategic depth.

## 6. Crossword intersections

A single tile may participate in multiple valid relationships simultaneously, like a crossword intersection.

If two or more ready relationships share a tile:
- each relationship counts independently;
- the shared tile is removed once physically;
- the play earns an additional cross/intersection bonus.

Crosses are intended to reward compact, high-skill board construction.

The base design supports two-way intersections. Rare multi-way intersections may be supported if they arise naturally from the same rules.

## 7. Linguistic model

### 7.1 Relationship graph

The content system is a weighted lexical relationship graph / hypergraph rather than a flat word list.

- Nodes represent words/tokens/lemmas.
- Two-token relations behave like edges.
- Three-or-more-token relations behave like hyperedges.

A word can participate in many valid relationships.

Examples:
- `TAKE -> NOTES`
- `TAKE -> OFF`
- `MAKE -> SENSE`
- `TAKE + A + BREAK`
- `MAKE + A + DECISION`
- `GO + WENT + GONE`

### 7.2 Linguistic validity vs gameplay value

A mathematically possible or grammatically possible combination is not automatically a playable relationship.

Every relationship must satisfy two separate tests:

1. **Linguistic quality** — real, useful, teachable English.
2. **Gameplay quality** — meaningful enough to recognize, non-trivial, and worthwhile as a puzzle reward.

Function words such as `A`, `THE`, `OF`, and `TO` should normally serve as supporting tiles inside richer structures rather than forming trivial independent matches.

### 7.3 Relationship metadata

Each production relationship should be able to carry:

- canonical token sequence;
- category;
- ordered/unordered behavior where applicable;
- frequency/usefulness signals;
- difficulty metadata;
- length;
- base score;
- extendability;
- related relationships;
- explanation/meaning;
- grammar/usage note;
- provenance;
- review status;
- gameplay-quality indicators.

Runtime validation must consult this approved relationship bank. An LLM is not used live to decide whether a move is valid.

## 8. V1 linguistic families

The first playable product version focuses on four relationship families:

1. **Phrasal verbs**
   - `LOOK AFTER`
   - `GIVE UP`
   - `TURN ON`

2. **Collocations**
   - `MAKE A DECISION`
   - `TAKE A BREAK`
   - `HEAVY RAIN`

3. **Fixed expressions**
   - `BY THE WAY`
   - `IN FRONT OF`
   - `AS A MATTER OF FACT`

4. **Irregular verb sets**
   - `GO | WENT | GONE`
   - `SEE | SAW | SEEN`
   - `WRITE | WROTE | WRITTEN`

These families can coexist on the same board unless a level objective deliberately emphasizes one category.

Deferred beyond the first version:
- synonyms;
- antonyms;
- broad semantic groups;
- derivational word families;
- open-ended grammar patterns;
- ambiguous semantic grouping;
- broader idiom systems beyond clearly fixed expressions.

## 9. Vocabulary sources and content pipeline

The project uses open lexical resources as inputs but treats the project’s own validated relationship bank as the production authority.

Current source direction:
- NGSL as a primary high-frequency vocabulary/frequency foundation;
- NGSL-Spoken as an optional conversational-weighting signal;
- Open English WordNet as lexical support where useful;
- commercial learner dictionaries and CEFR-oriented resources as reference material only unless explicit compatible licensing permits ingestion.

Definitions, explanations, and pedagogical examples displayed by the game should be authored for the project rather than copied from dictionary text.

AI may assist offline with:
- candidate generation;
- enrichment;
- duplicate detection;
- metadata suggestions.

AI is not the runtime judge of validity.

Conceptual pipeline:

`open frequency vocabulary -> candidate relationships -> linguistic validation -> gameplay filtering -> production relationship bank`

Each relationship should retain provenance and review metadata so candidate, checked, and production-approved content remain distinguishable.

## 10. Productive randomness and board generation

Words must not enter the board as unconstrained random text.

The generator should prefer tiles that preserve a productive linguistic neighborhood around the current board state.

Instead of asking only:
> Which random word falls next?

the generator should effectively ask:
> Which candidate keeps enough useful future relationships possible?

The system should:
- use dense compatible subgraphs rather than arbitrary slices of the full lexicon;
- allow distractors and temporarily isolated words;
- avoid boards that are linguistically sterile;
- avoid making every falling tile obviously useful;
- consider high-connectivity words while discounting trivial function-word connectivity;
- eventually simulate limited lookahead so a technically alive board is not predictably doomed.

Exact generation weights are a balancing concern for implementation and testing.

## 11. Dead-board handling

After a resolved batch/cascade and once the board stabilizes, the engine checks whether meaningful future play remains.

If the board is dead:
1. treat it as a system state, not a player mistake;
2. clear/sweep the current board visibly;
3. refill with a fresh board;
4. validate that the replacement contains multiple plausible linguistic opportunities;
5. do not charge a move for the automatic recovery.

A manual shuffle booster is not required for dead-board recovery.

## 12. Scoring and risk/reward

Scoring rewards language value and strategic construction rather than raw tile count.

Components:

### 12.1 Relationship base value
Every validated relationship has a stable base value derived from linguistic usefulness and gameplay value.

### 12.2 Length bonus
Longer structures receive additional value, but length alone does not determine score.

### 12.3 Batch/setup bonus
Resolving several ready relationships in one global pop earns an additional bonus. This rewards deliberate preparation before activation.

### 12.4 Cross bonus
Crossword-style intersections earn additional value.

### 12.5 Discovery bonus
A player’s first successful discovery of a relationship may earn a modest bonus.

### 12.6 Cascade multiplier
Successive automatic cascade generations increase a combo multiplier.

### 12.7 Non-penalties
- setup swaps do not directly subtract points;
- waiting does not itself earn points;
- pressing the pop control does not consume a move.

The reward for waiting comes from creating stronger structures, more simultaneous ready relationships, intersections, or better cascades.

Base relationship values remain consistent across players. Adaptive learning affects what appears, not the base score of the same relationship.

Exact point magnitudes and multipliers are deferred to prototype balancing.

## 13. Level goals and round structure

The main progression uses move-limited rounds, not time-limited rounds.

Standard levels usually combine:
- a target score;
- a fixed move budget.

Special or mixed levels may additionally target:
- a number of newly discovered relationships;
- a relationship category;
- a long expression;
- one or more crossword intersections;
- a minimum number of ready relationships in one batch;
- a cascade threshold;
- blocker-clearing objectives in later versions;
- combinations of the above.

Explicit linguistic objectives should not appear in every level. Many rounds should feel like ordinary casual-puzzle challenges where learning is embedded in play.

Timed play is deferred to an optional future mode.

## 14. Difficulty model

Difficulty is multi-dimensional.

### 14.1 Linguistic difficulty
Considers:
- lexical frequency/familiarity;
- relationship familiarity;
- category;
- length;
- ambiguity;
- usefulness/complexity.

### 14.2 Puzzle difficulty
Considers:
- swaps required;
- spatial separation;
- competing paths;
- move pressure;
- dependency on cascades;
- blockers;
- number of viable solutions.

### 14.3 Additional controls
- opportunity density;
- amount of tutorial assistance;
- board productivity;
- relationship overlap.

A level profile can therefore be modeled as:

`linguistic difficulty + puzzle difficulty + move pressure + opportunity density + assistance level`

Difficulty should rise in waves rather than monotonically. Harder peaks can be followed by recovery levels.

Generated difficulty is an estimate. Production difficulty should later be recalibrated with telemetry such as:
- completion rate;
- moves used;
- misses;
- restarts;
- abandonment;
- hint usage.

## 15. Player learning model

Learning is tracked primarily per relationship, not per isolated word.

Suggested internal states:

`unseen -> seen -> missed / formed -> reinforced -> mastered`

Definitions:
- **Unseen:** no meaningful exposure.
- **Seen:** appeared or was revealed, but no deliberate construction evidence.
- **Missed:** a verified reasonable opportunity existed and was not used.
- **Formed:** the player deliberately constructed the relationship.
- **Reinforced:** formed correctly again in later play.
- **Mastered:** repeated evidence suggests reliable recognition.

Gravity-created cascade relationships provide weaker learning evidence than deliberate construction.

The model may store:
- times seen;
- verified opportunities;
- misses;
- deliberate formations;
- cascade formations;
- last exposure;
- last deliberate success.

Mastery confidence can decrease after repeated later misses without erasing prior history.

Adaptive selection may increase re-exposure to newly seen or missed relationships, but should avoid immediate forced repetition.

Related relationships in the graph may receive modest exposure boosts as knowledge grows.

## 16. Player content preferences

After the player understands the core game, the product may expose a simple category-weighting control.

Concept:
- **More / Focus**
- **Normal**
- **Less**

A complete **Off** mode is deferred because fully removing categories can reduce variety and graph connectivity.

Manual player preference is stronger than adaptive learning. Adaptation works inside the player’s chosen mix rather than overriding it.

Preference affects appearance frequency, not relationship validity or base scoring.

## 17. End-of-round learning review

The results screen is compact and mobile-first.

### 17.1 Upper section — New learning

Show only a small number of genuinely new or newly discovered relationships.

Each may be opened for:
- meaning;
- category;
- concise explanation;
- why the relationship is valid;
- short usage/grammar guidance.

### 17.2 Lower section — Missed high-value opportunities

Show only a few missed relationships that:
- were truly available during the round;
- would have produced meaningfully more value;
- are pedagogically useful.

Do not display an exhaustive error list.

### 17.3 Early tutorial replay

Early levels may show a miniature replay of a missed opportunity.

Do not store screenshot bitmaps as canonical data. Store a logical snapshot:
- tile IDs;
- positions;
- target relationship;
- relevant move/alignment.

Re-render that state in the results view and highlight the missed opportunity.

This support is gradually removed as players learn to read the board.

## 18. Progression and retention

The long-term progression uses a broad level map with light meta-progression.

### 18.1 Stars
Levels award 1–3 stars based on performance.

- Meeting the minimum completion threshold unlocks the next level.
- Higher scores earn additional stars.
- Completed levels may be replayed to improve score/stars.

### 18.2 Visual zones
The map may group levels into visual chapters/zones, but these are not textbook-style grammar units.

### 18.3 Tutorial progression
Early levels gradually introduce:
- basic relationship formation;
- global pop;
- multiple simultaneous ready relationships;
- cascades;
- longer expressions;
- intersections;
- advanced objectives.

### 18.4 Challenge levels
Periodic challenge levels reuse known mechanics in demanding combinations instead of constantly introducing new rules.

### 18.5 Wordbook
A player-accessible Wordbook/history records discovered relationships and may expose simplified labels such as:
- Discovered;
- Practicing;
- Mastered.

### 18.6 Heavy meta-economy
The first version avoids:
- energy/lives systems;
- currencies;
- loot boxes;
- season passes;
- complicated reward economies.

Retention should primarily come from the quality of the puzzle loop, discovery, mastery, score improvement, and level progression.

## 19. Boosters and obstacles

These belong after the base loop is proven fun.

### 19.1 V1 obstacles
- **Anchored Word:** cannot move but can participate in relationships.
- **Blocked Cell:** cannot receive a tile until its condition is cleared.
- **Frozen Word:** can participate in a relationship but must resolve in a pop to become free.

### 19.2 V1 boosters
- **Remove Tile:** remove one chosen tile and apply gravity.
- **Hint / Nudge:** highlight a promising local opportunity without executing the move.

Deferred:
- unrestricted wildcards;
- long-distance swaps;
- heavy special-piece systems;
- complex booster economies.

## 20. COG integration

The game remains inside Classroom Online Games and should eventually use COG’s identity/session architecture.

Future product integration may include:
- player persistence;
- classroom/session launch;
- Teacher Monitor visibility;
- classroom-safe progress analytics.

Teacher Monitor specifics are deferred until after the core puzzle prototype proves viable.

## 21. Validation prototype — next implementation scope

The first implementation is not the full product. It is a mobile-first validation prototype of the real core loop.

It must include:
- adjacent orthogonal swaps;
- setup moves that may score nothing immediately;
- relationship detection;
- ready-to-pop state;
- one global pop control;
- simultaneous resolution of all ready relationships;
- gravity/refill;
- automatic cascade combos;
- crossword intersections;
- provisional scoring;
- roughly 60–100 curated relationships across the four initial families;
- deliberately authored test boards;
- controlled-random boards;
- a small set of levels testing movement, batching, cascades, longer expressions, intersections, and mixed play;
- compact end-of-round review;
- early tutorial replay for selected missed opportunities.

It intentionally excludes:
- the full level map;
- complete star progression;
- developed Wordbook;
- adaptive learning implementation;
- category preference UI;
- boosters;
- obstacles;
- large-scale content ingestion;
- heavy meta-progression.

## 22. Prototype success criteria

The prototype is successful only if players understand and enjoy the intended decision loop.

Primary observations:
- players understand why relationships are marked ready;
- players understand the global pop action;
- players voluntarily delay popping to prepare stronger outcomes;
- players attempt to anticipate gravity;
- cascades feel rewarding and legible;
- crossword intersections are discoverable;
- the board requires thought without feeling like a worksheet;
- new linguistic relationships feel credible rather than arbitrary;
- missed-opportunity feedback teaches without overwhelming.

A particularly strong positive signal is the player intentionally thinking: “not yet — I can prepare one more relationship before I pop.”

Technical metrics to capture during validation:
- dead-board frequency;
- swaps per successful deliberate relationship;
- number of non-scoring setup moves;
- ready relationships per activation;
- cascade depth;
- missed high-value opportunities;
- hint requests;
- level completion;
- restart/abandonment behavior.

## 23. Explicitly deferred product decisions

These are intentionally outside the prototype implementation scope and do not block the next stage:

- final commercial/product name;
- final art direction;
- final map theme;
- exact production board dimensions;
- final visual treatment for ready/extendable relationships;
- final scoring constants;
- final cascade multiplier values;
- final minimum viable-move threshold for generation;
- full Teacher Monitor design;
- monetization;
- live-service systems.

They should be designed only after prototype evidence shows the core loop is viable.

## 24. Design principles

1. **Game first, learning embedded.**
2. **Player agency before activation; spectacle after activation.**
3. **Only validated relationships count.**
4. **Language and gameplay quality are separate filters.**
5. **Controlled randomness should feel natural, not rigged.**
6. **The game teaches relationships, not isolated vocabulary alone.**
7. **Do not scale content before the core loop proves fun.**
8. **Prefer simple readable rules over broad ambiguous linguistic coverage.**
