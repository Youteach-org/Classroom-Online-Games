# Wordy Game — Concept & Action Plan

**Status:** Exploration / pre-production  
**Branch:** `feature/wordy-game`  
**Repository:** `youteachtk/Classroom-Online-Games`  
**Date started:** 2026-09-17

## 1. Product intent

Create a mobile-first English-learning game inside Classroom Online Games (COG) using the satisfying swap-and-combine loop popularized by games such as Candy Crush, but with the learning content embedded in the actual board mechanics rather than interrupting play with conventional quiz questions.

The game must feel like a real casual mobile game first and an English exercise second.

## 2. Working name

No final name has been selected.

Current candidates:
- Wordy Pop
- Wordy Crush
- Word Wiz

`Match-3` is only an internal description of the base mechanic and is **not** a candidate product name.

## 3. Confirmed design decisions

### 3.1 Board
- Use a regular grid with equal-sized tiles.
- Tile dimensions never change because of word length.
- Typography adapts automatically to the available tile area.
- Long text may reduce font size within a readability limit.
- Multi-word expressions can be split into one word per tile.

Example:

`AS | A | MATTER | OF | FACT`

Each word is an independent tile.

### 3.2 Linguistic matches
Matches are not restricted to three identical pieces.

Valid combinations can have variable length and represent meaningful English relationships, for example:
- `LOOK | AFTER`
- `GO | WENT | GONE`
- `MAKE | A | DECISION`
- `AS | A | MATTER | OF | FACT`

Order can matter when the linguistic target requires it.

### 3.3 Mixed categories
A single level may mix different kinds of English knowledge. The player may need to recognize which relationship applies rather than being told a single category for every move.

Possible content families:
- Irregular verb forms
- Collocations
- Phrasal verbs
- Fixed expressions
- Word families
- Grammar structures
- Vocabulary relationships
- Synonyms / antonyms
- Future additional categories

### 3.4 Mobile-first interaction
The primary interaction is touch-based swapping / moving of tiles. The game must feel natural on a phone.

### 3.5 COG integration
This is not a separate product repository. It belongs inside Classroom Online Games and should eventually follow COG's player/session architecture and teacher-facing ecosystem where appropriate.

## 4. Engagement principles

The game should support many levels and a strong "one more level" loop.

Core ideas to explore:
- Level map / progression path
- Limited moves
- Varying objectives
- Combos and cascades
- Special tiles / boosters
- Streak rewards
- Difficulty waves rather than monotonically increasing difficulty
- Easier recovery levels after hard levels
- New mechanics introduced gradually
- Mixed-category challenge levels
- Special handcrafted milestone levels

The goal is to create satisfaction through board interaction and pattern recognition, not through constant pop-up questions.

## 5. Level system direction

Use a hybrid system:

1. Humans define learning goals, rules, difficulty bands, content pools and special level concepts.
2. A level generator creates candidate boards and level variants.
3. Automated validation checks whether generated levels are solvable and whether required combinations can appear.
4. Difficulty can later be estimated through simulation and player telemetry.
5. Important milestone levels can remain handcrafted.

This allows the game to scale to hundreds or thousands of levels without manually designing every board.

## 6. Content model direction

English content should eventually be stored as structured data rather than hard-coded board text.

A content item should be able to describe:
- Category
- Tokens / tiles
- Correct order when required
- Allowed variants
- Difficulty
- CEFR or course level if useful
- Distractors
- Tags / topic
- Optional explanation or review data

Example concept:

```json
{
  "category": "fixed_expression",
  "tokens": ["as", "a", "matter", "of", "fact"],
  "ordered": true,
  "difficulty": 3
}
```

The exact schema is not yet finalized.

## 7. Word-length constraint

Different word lengths are a known visual challenge.

Current direction:
- Keep all board cells identical.
- Fit text to the tile, never the tile to the text.
- Use responsive font sizing.
- Permit two-line rendering only when visually necessary.
- Prefer one word per tile for long expressions.
- Define a minimum readable font size; content that cannot fit should be rejected or represented differently by the content system.

## 8. Design workflow

Do not turn exploration into a sequence of microdecision questions.

Preferred process:
1. Explore ideas conversationally.
2. Develop promising concepts enough to understand their consequences.
3. Record confirmed decisions here.
4. Mark unconfirmed ideas clearly as proposals.
5. Periodically consolidate rather than asking for approval after every small choice.
6. Create formal implementation specs only when a system is mature enough to build.

## 9. Action plan

### Phase A — Game design
- Define the core swap/match rules.
- Determine how variable-length linguistic matches resolve on the grid.
- Define cascading behavior.
- Define level goals.
- Define failure / success conditions.
- Define first booster concepts.
- Create a small representative English content set.

### Phase B — Playable prototype
- Build a touch-friendly board.
- Implement swapping.
- Implement matching.
- Support 2–5+ tile linguistic combinations.
- Add cascades and refill.
- Add a basic move counter and goal.
- Test whether the mechanic is actually fun before expanding content.

### Phase C — Level architecture
- Define reusable level JSON.
- Build content pools.
- Build deterministic board generation.
- Add solvability validation.
- Add difficulty parameters.
- Add a simple internal level editor.

### Phase D — Progression
- Add world / level map.
- Add stars, streaks or similar progression.
- Introduce blockers and special tiles gradually.
- Add boosters.
- Add mixed-category levels.

### Phase E — COG integration
- Connect player identity/session flow.
- Add persistence.
- Decide which progress information belongs in Teacher Monitor.
- Add classroom-safe analytics without harming the casual-game feel.

### Phase F — Scale
- Generate large level sets.
- Simulate and validate candidate levels.
- Use gameplay data to rebalance difficulty.
- Maintain handcrafted milestone levels.

## 10. Open exploration — not yet decisions

- Final game name
- Exact board size
- Exact swap rules
- Whether every valid phrase must be in a straight line
- How variable-length matches trigger special tiles
- Art direction
- Booster set
- World/map theme
- Teacher Monitor details
- Monetization is not in scope unless explicitly discussed later
