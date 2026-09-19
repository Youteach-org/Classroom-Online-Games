# Wordy Game — Remaining Design Checklist

**Branch:** `feature/wordy-game`  
**Status:** Architectural brainstorming

## Priority 1 — Board interaction rules
Still unresolved:
- Exact adjacency rule: horizontal/vertical only, or additional geometries.
- How a player selects/claims a valid combination.
- Whether swaps must always create or improve a relationship.
- What happens to an existing valid combination when one of its tiles is moved.
- How shared-tile / crossword intersections are selected and resolved.
- How longer extendable combinations are visually distinguished from complete non-extendable combinations.

This is the highest-priority unresolved system because it defines the actual feel of play.

## Priority 2 — Scoring and risk/reward
Need a consistent scoring model for:
- relationship length;
- linguistic difficulty;
- rarity / discovery;
- shared-tile cross-combos;
- waiting to extend a valid relationship;
- chains/cascades after a pop;
- level goals.

Scoring should reward interesting linguistic construction rather than raw tile count alone.

## Priority 3 — Level goals and round structure
Need to define what completing a level means. Candidate objective families:
- reach a score;
- discover a number of new relationships;
- resolve specific relationship categories;
- create one or more long expressions;
- produce cross-combos;
- clear blockers or constrained board regions;
- mixed objectives.

Need to decide whether levels are move-limited, time-limited, objective-limited, or combinations of these.

## Priority 4 — Relationship categories for v1
A first playable version should use a deliberately limited set of relationship families rather than every possible language relationship.

Likely strong candidates:
- collocations;
- phrasal verbs;
- irregular verb forms;
- fixed expressions;
- word families.

Still open:
- synonyms;
- antonyms;
- semantic groups;
- broader grammar frames;
- idioms.

## Priority 5 — Canonical content sources and licensing
Need to choose:
- master high-frequency vocabulary source;
- phrase/collocation sources;
- CEFR metadata source;
- rules for AI-assisted candidate generation;
- validation process before a relationship becomes playable.

No external list should be copied into the product until licensing is verified.

## Priority 6 — Difficulty model
Difficulty must combine at least:
- word familiarity;
- relationship familiarity;
- relationship length;
- board geometry;
- number of competing possible relationships;
- available moves;
- blockers;
- amount of tutorial assistance.

Difficulty should follow waves rather than only increasing monotonically.

## Priority 7 — Progression / retention loop
Need to define:
- level map or other progression surface;
- stars or completion ratings, if any;
- streaks / return incentives;
- unlock cadence for new relationship types;
- when player preferences (More/Normal/Less) become available;
- how missed relationships re-enter later play.

## Priority 8 — Boosters and blockers
These should come only after the base board loop is proven fun.

Need eventual concepts for:
- shuffle / targeted hint;
- remove one tile;
- protect or freeze a promising combination;
- wildcard tile;
- blockers that constrain movement or word access.

Avoid adding these before the core mechanic is validated.

## Priority 9 — Player learning model
Need a lightweight per-player record for each relationship:
- unseen;
- seen;
- missed;
- formed;
- repeatedly formed;
- likely mastered.

This model feeds adaptive weighting without overriding explicit player preferences.

## Priority 10 — Prototype validation
Before building hundreds of levels:
- create a small curated relationship set;
- build a minimal board prototype;
- test whether players understand what can connect;
- test whether waiting to extend combinations is fun;
- test whether cross-combos feel discoverable;
- measure dead-board frequency;
- verify that controlled randomness does not feel rigged.

## Recommended next design focus

Finish **Priority 1: Board interaction rules** before scoring, level generation, boosters, art direction, or large-scale vocabulary ingestion. If the physical interaction is not satisfying, the rest of the architecture will not rescue the game.
