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

### Expressions
**Decision:** Long expressions may use one word per tile. `AS A MATTER OF FACT` can therefore occupy five separate tiles.

### Tile sizing
**Decision:** All board tiles remain the same physical size. Word length must not change grid geometry.

### Typography
**Decision:** Text adapts to the tile rather than changing the tile to fit the text.

### Scale
**Decision:** The design should be capable of supporting many levels and should not require every level to be created manually.

### Level creation direction
**Decision:** Favor a hybrid approach: reusable generation rules and automated validation, with important levels still designed or curated by humans.

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

### Working style
**Decision:** Keep the design conversation exploratory and collaborative. Avoid repeatedly stopping for microdecisions. Consolidate mature decisions into project documentation instead.
