# Wordy Game — Vocabulary & Relationship Engine

**Status:** Design proposal under active discussion  
**Branch:** `feature/wordy-game`  
**Date:** 2026-09-17

## Core principle

The game should not be modeled as a flat list of words. It should be modeled as a linguistic relationship graph.

- **Nodes:** words / tokens / lemmas.
- **Edges:** two-token relationships such as phrasal verbs, antonyms, verb+noun collocations, adjective+noun collocations, etc.
- **Hyperedges:** valid ordered or unordered combinations of 3+ tokens, such as irregular-verb sets, fixed phrases, idioms and grammar frames.

Examples:
- TAKE -> NOTES
- TAKE -> RESPONSIBILITY
- TAKE + A + BREAK
- GO + WENT + GONE
- AS + A + MATTER + OF + FACT

A word can participate in many relations. This multiplicity is what makes the board combinatorial rather than a collection of pre-written quiz answers.

## Mathematical combinations are not gameplay combinations

For 2,000 distinct words there are 1,999,000 unordered two-word pairs mathematically, but almost all of those pairs are irrelevant to the game.

The relationship bank must contain only combinations that pass two independent filters:

1. **Linguistic validity** — the combination represents a real, teachable relationship in English.
2. **Gameplay value** — recognizing or constructing that relationship is satisfying, non-trivial and worth rewarding in the board mechanic.

Mere grammatical compatibility is not enough.

Example: the article `A` can precede hundreds of countable nouns, but `A + TABLE`, `A + DOG`, and `A + BOOK` are generally too trivial to deserve a match by themselves. The same token `A` becomes meaningful when it participates in a larger chunk such as:
- `TAKE + A + BREAK`
- `MAKE + A + DECISION`
- `AS + A + MATTER + OF + FACT`

Therefore function words such as A, THE, OF, TO, IN, etc. should normally act as **supporting tiles inside richer relationships**, not as independent high-value pair matches.

## Relationship quality score

Every candidate relationship should eventually carry metadata that allows the game to decide whether it is worth including.

Candidate dimensions:
- Frequency in real English
- Usefulness for communication
- CEFR / learner level
- Semantic or grammatical distinctiveness
- Ambiguity
- Recognition difficulty
- Length
- Board-play potential
- Whether it creates interesting overlap with other relationships
- Whether it is too obvious to be rewarding

The engine should favor relationships that are both useful English and good puzzle material.

## Vocabulary-source direction

Do not invent the core lexicon manually.

Candidate foundations:
1. A high-frequency spoken core (for the earliest worlds).
2. A general high-frequency learner list around 2,000–3,000 words.
3. CEFR metadata to stage vocabulary by level.
4. Phrase/collocation resources to create relationships between the core words.

Useful external reference families to evaluate include NGSL / NGSL-Spoken and Oxford learner lists. Licensing must be checked before importing any list data directly into the product.

## Important distinction: master lexicon vs active level pool

The full game may know thousands of words, but an individual level should draw from a much smaller compatible pool.

The engine should maintain:
- **Master lexicon:** all supported words and metadata.
- **Relationship bank:** valid combinations among those words.
- **World/theme pools:** subsets introduced progressively.
- **Level active pool:** a relatively small set chosen to ensure productive board play.

This prevents a 2,000-word dictionary from producing hopelessly sparse boards.

## Relationship types to support

Potential relationship families:
- Collocations
- Phrasal verbs
- Fixed expressions
- Idioms
- Irregular verb forms
- Inflection families
- Word families / derivation
- Synonyms
- Antonyms
- Compound words
- Grammar frames / patterns
- Functional expressions
- Semantic sets where pedagogically appropriate

Not all relationship types need to exist in the first prototype.

## Productive-word weighting

Words should receive an internal connectivity score.

Highly connected words (e.g. TAKE, MAKE, GET, GO, HAVE) can appear more often because they open many possible paths.

Low-connectivity words can still appear, but the generator should pair them with compatible support tiles or reserve them for targeted levels.

Connectivity alone does not imply a good match: very common function words may connect to hundreds of words but should be weighted by gameplay value, not raw degree.

## Generation rule

Randomness should be constrained by the relationship graph.

The generator should not ask only:
> Which word should fall next?

It should ask:
> Which word can fall next while preserving enough possible relationships in the current board state?

This supports apparent randomness while avoiding linguistically sterile boards.

## Scale

The target is not mathematical infinity. The target is a relationship space large enough, combined with board layouts, objectives, blockers and random order, that play feels effectively non-repeating.

A relatively modest master lexicon can support a much larger number of valid relationships because each high-frequency word can participate in multiple collocations, phrases and grammatical structures.

## Open design questions

- Exact master lexicon size for launch.
- Which public/licensable list becomes the canonical source.
- Which relationship types belong in v1.
- How to score connectivity and pedagogical usefulness.
- Minimum number of viable moves required when generating/refilling a board.
- Whether homographs/polysemy are represented as one tile or sense-specific metadata.
