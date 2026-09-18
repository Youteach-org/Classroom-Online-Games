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

### Working style
**Decision:** Keep the design conversation exploratory and collaborative. Avoid repeatedly stopping for microdecisions. Consolidate mature decisions into project documentation instead.
