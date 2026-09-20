# Wordy Game — Decision Log

This file is the compact source of truth for decisions already made during design discussions.

## 2026-09-17

### Project placement
**Decision:** The game will live in a branch of `youteachtk/Classroom-Online-Games`, not in a separate repository.

### Branch
**Decision:** Use `feature/wordy-game` as a neutral working branch so the final product name remains open.

### Naming
**Decision:** Do not call the product "Match-3". That term may be used internally to describe the mechanic only.

**Current candidates, not final:**
- Wordy Pop
- Wordy Crush
- Word Wiz

### Core mechanic
**Decision:** Explore a Candy-Crush-like swap-and-combine board adapted specifically for English learning.

### Content variety
**Decision:** Levels may mix linguistic categories rather than being restricted to one category at a time.

### Variable match length
**Decision:** Valid linguistic combinations may contain different numbers of tiles; they are not restricted to three.

Examples:
- `LOOK | AFTER`
- `GO | WENT | GONE`
- `MAKE | A | DECISION`
- `AS | A | MATTER | OF | FACT`

### Board geometry
**Decision:** Valid linguistic combinations use straight contiguous lines only: horizontal or vertical.

- No diagonal matches in the base rules.
- No bent paths or free-form word tracing.
- Word order must be correct along the line.
- Crossed structures are allowed when two valid combinations share a tile, creating crossword-like geometry.
- Gravity acts vertically after tiles are removed.

This geometry is intentionally simple so phrases remain immediately readable on a phone and so gravity can create secondary combinations after a player-triggered pop.

### Gravity-created cascades
**Decision:** Resolving one combination can cause remaining tiles to fall and create a new valid linguistic combination. That new relationship counts as a combo/cascade.

Example:
- `LOOK | AFTER` is resolved.
- Its removal creates vertical space.
- `TAKE` falls into alignment with `A | BREAK`.
- `TAKE | A | BREAK` becomes a cascade combo.

**Design direction:** Player-assembled valid combinations may wait for the player's decision to cash them in, but combinations created directly by gravity after a pop should behave as automatic cascade rewards. This preserves player agency during deliberate construction while retaining the satisfying chain-reaction behavior of a casual match game.

### Tile movement
**Decision:** A player move swaps one tile with exactly one orthogonally adjacent tile.

Allowed directions:
- up;
- down;
- left;
- right.

Not allowed:
- diagonal swaps;
- jumping over tiles;
- dragging a tile across multiple cells in one move;
- free repositioning.

This keeps movement local and strategic while preserving the familiar casual-puzzle feel.

### Non-scoring setup moves
**Decision:** Any legal adjacent orthogonal swap is allowed even when it does not immediately create a valid linguistic combination.

- Setup moves are part of normal strategy.
- Each adjacent swap consumes one move.
- The game does not revert a swap simply because no valid relationship was formed.
- This allows players to reposition words over several moves in order to build longer expressions, crossings, or future cascade opportunities.

### Armed combinations and global player-triggered popping
**Decision:** When a valid linguistic combination is formed, it does not disappear automatically.

- Every currently valid combination is visually marked as **ready to pop**.
- Ready combinations remain in place and continue occupying their cells.
- The player may keep moving tiles, extend relationships, build crossings, or deliberately break a ready combination before cashing in.
- A single global **pop/resolve button** applies to the whole board, not to an individual phrase.
- When the player presses that button, **all combinations that are ready at that exact moment resolve together in one batch**.
- Shared tiles that belong to multiple valid combinations are removed once physically but score as participants in every valid relationship they complete.
- After the batch resolves, gravity acts and new tiles may enter.
- Valid relationships created by that gravity/refill phase trigger the automatic combo/cascade sequence.
- The automatic cascade continues through subsequent gravity-created relationships until no new cascade relationship remains; control then returns to the player.
- There is no mandatory timing window for pressing the global pop button.

This preserves deliberate strategy before activation while avoiding the tediousness of manually resolving phrase after phrase. The player chooses **when to trigger the board**, not which ready phrase to resolve first.

### Expressions
**Decision:** Long expressions may use one word per tile. `AS A MATTER OF FACT` can therefore occupy five separate tiles.

### Player-controlled resolution
**Decision:** The player controls the **timing of board resolution**, not individual phrase-by-phrase resolution.

Example:
- The board contains several relationships already marked ready.
- The player may keep arranging the board to create additional ready relationships or extend existing ones.
- When the player chooses to press the global pop button, every ready relationship resolves simultaneously.
- The resulting gravity can create automatic combo chains.

This mechanic is intended to:
- Give the player agency over timing.
- Create risk/reward decisions.
- Reward building several relationships before cashing in.
- Make longer expressions and crossings possible.
- Avoid repetitive phrase-by-phrase tapping.
- Preserve fast chain-reaction gameplay after activation.


### Scoring model
**Decision:** Scoring should reward linguistic value and strategic play, not raw tile count alone.

- Every validated relationship has a stable base value.
- Longer relationships receive an additional length bonus.
- Resolving several ready relationships in one global pop earns a batch/setup bonus.
- Crossword intersections earn a cross bonus.
- First-time discoveries may earn a modest discovery bonus.
- Gravity-created chains use an increasing cascade multiplier.
- If a shorter relationship is fully contained inside a longer resolved relationship on the same line, score the longer one rather than double-counting both.
- Non-scoring setup swaps do not lose points; they already consume moves.
- Waiting by itself does not earn points. Waiting is rewarded only when it enables more relationships, longer structures, crossings, or stronger cascades.
- Base values remain the same for all players; adaptive learning affects appearance frequency, not base points.

Exact point values and multiplier sizes will be tuned during prototype testing.


### End-of-round learning review
**Decision:** The end-of-round review must stay compact and mobile-first. It is not a long report.

The screen is divided into two main vertical zones:

**Upper half — New learning**
- Show only a small number of words, expressions, or relationships that were genuinely new or newly discovered during the round.
- These items can be tapped to open the deeper explanation: meaning, category, why the game accepted the combination, and concise grammar/usage notes.
- The goal is to capture surprising or useful discoveries without interrupting play.

**Lower half — Missed high-value opportunities**
- Show only a small number of combinations that were actually available during the round and would have produced notably more points.
- Do not list every missed possibility.
- Prioritize the most valuable or pedagogically useful missed combinations.
- These missed combinations become candidates to reappear in future rounds.

**Extended-tutorial replay (early levels only)**
- In the opening portion of the game, a missed high-value opportunity may include a small replay card showing the board state from the moment when the opportunity existed.
- Do not store a literal bitmap screenshot as the canonical record. Store a lightweight logical snapshot: tile identities, positions, the relevant relationship, and the move(s) that would have completed it.
- Re-render that snapshot as a miniature board in the results screen, highlighting the relevant tiles and showing the move or alignment that would have produced the combination.
- Keep this teaching aid limited to early/tutorial levels so experienced players are not repeatedly shown solutions.
- The purpose is to teach the player how to visually recognize possible relationships on the board, then gradually remove the assistance as that skill develops.

The review should fit naturally on a phone screen with minimal scrolling. Detailed explanations are secondary drill-down views, not part of the main results screen.

Successfully formed combinations may remain available in a player-accessible history/reference area for later consultation.

### Shared-tile crossword intersections
**Decision:** A single tile may belong simultaneously to two or more valid combinations, similar to a crossword intersection.

If the player resolves both valid combinations together, the shared tile participates in both and both structures are removed in the same resolution event.

This should be treated as a higher-value play than resolving either relationship alone.

Example concept:

```
      TAKE
       |
MAKE - A - DECISION
       |
     BREAK
```

The precise board geometry will depend on the final matching rules, but the principle is confirmed: valid linguistic structures may intersect through a shared word and resolve together.

### Tile sizing
**Decision:** All board tiles remain the same physical size. Word length must not change grid geometry.

### Typography
**Decision:** Text adapts to the tile rather than changing the tile to fit the text.

### Scale
**Decision:** The design should be capable of supporting many levels and should not require every level to be created manually.

### Level creation direction
**Decision:** Favor a hybrid approach: reusable generation rules and automated validation, with important levels still designed or curated by humans.

### Level goals and round structure
**Decision:** Use a hybrid level-goal system with move limits as the main round constraint.

- Most standard levels combine a target score with a limited number of moves.
- Special levels may require linguistic or structural goals such as forming a number of phrasal verbs, discovering new relationships, building a long expression, creating crossword intersections, resolving several ready relationships in one batch, or reaching a cascade threshold.
- Mixed levels may combine two or more goals.
- Explicit linguistic goals should not appear in every level; many rounds should still feel like ordinary casual-puzzle challenges where learning happens through play.
- Early levels introduce mechanics gradually: basic relationship formation, global pop, cascades, longer expressions, then intersections and more advanced objectives.
- Timed play is not part of the base progression. It may be explored later as an optional special mode.
- The generator should be able to combine an active linguistic pool, board size, move budget, objective set, and difficulty profile to produce candidate levels for validation.


### V1 linguistic relationship families
**Decision:** The first playable version focuses on four relationship families:

- **Phrasal verbs** — e.g. `LOOK | AFTER`, `GIVE | UP`, `TURN | ON`.
- **Collocations** — e.g. `MAKE | A | DECISION`, `TAKE | A | BREAK`, `HEAVY | RAIN`.
- **Fixed expressions** — e.g. `BY | THE | WAY`, `IN | FRONT | OF`, `AS | A | MATTER | OF | FACT`.
- **Irregular verb sets** — e.g. `GO | WENT | GONE`, `SEE | SAW | SEEN`, `WRITE | WROTE | WRITTEN`.

These categories may coexist on the same board unless a level objective deliberately emphasizes one family.

Deferred beyond V1:
- synonyms;
- antonyms;
- broad semantic groups;
- derivational word families;
- open-ended grammar patterns;
- idioms beyond clearly fixed expressions.

The reason for limiting V1 is rule clarity: accepted relationships should feel predictable and defensible rather than arbitrary.


### Vocabulary sources and validation pipeline
**Decision:** Use open lexical resources as inputs, but make the project's own validated relationship bank the runtime authority.

- Use the New General Service List (NGSL) as a primary high-frequency vocabulary/frequency source.
- NGSL-Spoken may be used as an additional signal for conversational weighting.
- Use Open English WordNet as an open lexical support source where useful.
- Commercial learner dictionaries and CEFR-oriented resources may be consulted as reference material but should not be copied wholesale into the product without explicit compatible licensing.
- Definitions, pedagogical explanations, and examples shown by the game should be authored for the project rather than copied from dictionary text.
- Irregular verb sets can be maintained as a small curated in-project dataset.
- AI may assist offline with candidate generation and enrichment, but it is never the live authority deciding whether a board relationship is valid.
- Every playable relationship must exist in the validated Wordy relationship bank before runtime.
- Relationship records should retain provenance/review metadata so proposed, checked, and production-approved content can be distinguished.

Conceptual pipeline:
`open frequency vocabulary -> candidate relationships -> linguistic validation -> gameplay-quality filtering -> Wordy relationship bank`.


### Difficulty model
**Decision:** Level difficulty is multi-dimensional rather than a simple vocabulary rank.

- Separate **linguistic difficulty** from **puzzle difficulty**.
- Linguistic difficulty considers relationship familiarity, lexical frequency, length, category, and ambiguity.
- Puzzle difficulty considers required swaps, spatial separation, blockers/competing paths, move pressure, cascade dependence, and number of viable solutions.
- Track **opportunity density**: boards with many accessible relationships are easier than boards with only a few.
- Track **assistance level** independently so early/tutorial levels can be easier without changing the underlying language.
- Adaptive learning may increase re-exposure to a relationship the player misses, but that reappearance does not have to occur in a harder board.
- Difficulty should follow a wave rather than rise monotonically: challenging levels can be followed by recovery levels.
- Generated difficulty is provisional. Real player data should later recalibrate levels based on completion rate, moves used, misses, abandonment, and other telemetry.

Conceptually, a level profile combines:
`linguistic difficulty + puzzle difficulty + move pressure + opportunity density + assistance level`.


### Progression and retention
**Decision:** Use a broad level map with light meta-progression rather than a heavy economy.

- Levels award 1–3 stars based on performance; completing the main objective with the minimum threshold unlocks the next level.
- Players may replay any completed level to improve score or stars.
- The map is grouped into visual zones/chapters, but these are not textbook-style grammar units.
- Early progression acts as an extended tutorial, introducing the core mechanics gradually before fully mixed boards become normal.
- Periodic challenge levels reuse known mechanics in more demanding combinations rather than constantly inventing new rules.
- Progression difficulty follows waves, with recovery levels after harder peaks.
- The player's discovery history is collected in a Wordbook/reference area, giving long-term progression beyond level numbers.
- Category-weight preferences such as More / Normal / Less unlock after the player already understands the core game, rather than appearing at first launch.
- Avoid heavy V1 meta-systems such as energy, lives, currencies, loot boxes, season passes, or multiple reward economies.
- The core retention loop should remain: move -> prepare -> global pop -> cascade -> discover language -> improve score/mastery.


### V1 boosters and obstacles
**Decision:** Keep V1 boosters and obstacles minimal, readable, and compatible with the linguistic board.

Obstacles:
- **Anchored Word** — a word tile cannot move but may still participate in valid relationships.
- **Blocked Cell** — a board cell cannot receive tiles until its condition is cleared.
- **Frozen Word** — a word remains usable in relationships but must participate in a resolved pop to be freed.

Boosters:
- **Remove Tile** — removes one chosen tile and immediately applies gravity.
- **Hint / Nudge** — highlights a promising tile or local opportunity without completing the move.

Deferred beyond V1:
- unrestricted wildcards;
- long-distance swaps;
- heavy special-piece systems;
- complicated booster economies.

Dead boards continue to use automatic board recovery and do not require a shuffle booster.


### Player learning model
**Decision:** Track learning primarily at the relationship level rather than at the isolated-word level.

Suggested internal relationship states:
`unseen -> seen -> missed / formed -> reinforced -> mastered`.

- **Unseen** — no meaningful exposure yet.
- **Seen** — the relationship has appeared or been revealed, but the player has not demonstrated deliberate recognition.
- **Missed** — a verified, reasonable opportunity to form the relationship existed and was not used.
- **Formed** — the player deliberately constructed the relationship.
- **Reinforced** — the player has formed it correctly again across later play.
- **Mastered** — repeated evidence suggests reliable recognition; exposure priority may decrease but never needs to reach zero.
- Relationships formed only by gravity/cascade count as weaker learning evidence than relationships deliberately constructed by the player.
- Mastery confidence may decay if later evidence shows repeated misses; history is retained rather than resetting to unseen.
- Store supporting statistics such as times seen, verified opportunities, misses, deliberate formations, cascade formations, last exposure, and last successful construction.
- Adaptive selection may increase re-exposure to missed or newly seen relationships, but should avoid immediate forced repetition.
- Neighboring relationships in the lexical graph may receive modest exposure boosts as related knowledge grows.
- Explicit player category preferences remain stronger than adaptive weighting.
- The Wordbook may surface simplified player-facing labels such as Discovered, Practicing, and Mastered while keeping the richer internal model hidden.


### Player content preferences
**Decision:** Players should be able to influence which linguistic relationship types appear more or less often in their games.

The preference system should use weighting rather than forcing the entire board into a single category. For example, a player who wants more practice with phrasal verbs can increase their frequency while still seeing collocations, irregular verbs, fixed expressions, and other enabled categories.

Initial preference concept:
- **More / Focus** — strongly increase the probability that this relationship type appears.
- **Normal** — use the game's default distribution.
- **Less** — reduce its frequency without removing it completely.
- A complete **Off** option may be considered later, but should not be the default because removing categories entirely can reduce variety and make the relationship graph less connected.

Manual preferences should coexist with adaptive learning. The game may also modestly increase exposure to categories or combinations the player repeatedly misses, but the player's explicit preference remains the stronger signal.

Examples:
- Phrasal verbs: More
- Collocations: Normal
- Irregular verbs: Less
- Fixed expressions: Normal

This setting affects content weighting and generation, not scoring rules or the validity of combinations.

### Productive randomness
**Decision:** New words must not fall as unconstrained random text. The board generator should use controlled randomness so that future combinations remain reasonably possible.

Not every tile must be immediately usable, and not every tile must eventually clear. Distractors and temporarily isolated words are allowed. However, the system should avoid boards that become linguistically sterile or depend on impossible luck.

### Combination space
**Decision:** The content system should be designed around reusable relationships between words/tokens rather than a finite list of pre-scripted board solutions. The same word may participate in many valid combinations across categories and contexts.

The long-term goal is a very large, extensible combination space so that play does not reduce to memorizing a small fixed set of phrases.

### Dead-board protection
**Decision:** After every resolved move/cascade, the engine checks whether at least one meaningful player move remains.

If no meaningful combination can still be created:
1. The state is treated as a dead board, not as a player error.
2. The current word tiles are cleared or swept away with a visible board-reset animation.
3. A fresh set of tiles drops in.
4. The replacement board is validated before play resumes so that it contains multiple plausible linguistic moves rather than merely one accidental rescue move.
5. The automatic reset does not consume one of the player's moves.

This is the preferred recovery behavior rather than requiring the player to use a booster or manually request a shuffle.

Exact animation, treatment of future blockers, and minimum number of validated moves remain implementation details.

### Response style for design discussions
**Decision:** Number substantive response points so the user can refer back to them efficiently in later messages.

### Working style
**Decision:** Keep the design conversation exploratory and collaborative. Avoid repeatedly stopping for microdecisions. Consolidate mature decisions into project documentation instead.
