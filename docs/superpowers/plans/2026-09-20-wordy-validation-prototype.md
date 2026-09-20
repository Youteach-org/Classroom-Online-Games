# Wordy Validation Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phone-first, testable Wordy prototype at `/Wordy/` that validates adjacent word swapping, persistent ready relationships, global pop, gravity, crossword intersections, automatic cascades, provisional scoring, controlled board generation, and compact learning review.

**Architecture:** Keep the prototype as a static COG game with browser ES modules and no new framework. Put deterministic game rules in small pure modules under `Wordy/engine/`, curated content under `Wordy/data/`, DOM rendering under `Wordy/ui/`, and orchestration in `Wordy/app.mjs`; use the repository's existing `node:test` style for regression tests.

**Tech Stack:** HTML5, CSS, browser JavaScript ES modules, Node.js built-in `node:test` + `node:assert/strict`; no bundler and no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-09-20-wordy-game-prototype-design.md`  
**Parent architecture:** `docs/superpowers/specs/2026-09-20-wordy-game-architecture-design.md`

## Global Constraints

- Phone-first interface with large readable equal-sized tiles.
- Prototype grid: **5 columns × 7 rows**. This is prototype-only; production dimensions remain deferred.
- Player movement is exactly one orthogonally adjacent swap: up, down, left, or right.
- Non-scoring setup swaps are legal, remain on the board, and consume one move.
- Valid relationships are contiguous straight horizontal or vertical sequences in the relationship's required order.
- A valid relationship remains on the board as ready until broken or the player triggers the global pop.
- The global pop resolves every currently ready relationship together and does **not** consume a move.
- A same-line relationship fully contained by a longer valid relationship is not double-scored; independent crossings still count.
- Gravity is vertical. Gravity/refill-created relationships auto-resolve as cascade generations until stable.
- Runtime validity comes only from the curated relationship bank; do not call an LLM during play.
- Prototype content contains roughly **60–100** curated relationships spanning phrasal verbs, collocations, fixed expressions, and irregular verb sets.
- The prototype is move-limited, not time-limited.
- Dead-board recovery is automatic and costs no move.
- No full map, production stars, adaptive model, Wordbook, boosters, obstacles, Teacher Monitor, currency, lives, or large-scale content ingestion in this plan.
- Keep all game copy in English.
- Follow the repository's static-folder pattern; do not introduce React, Vue, Vite, or another build system.

## File Structure

Create the following focused units:

- `Wordy/index.html` — accessible static entry point and DOM skeleton.
- `Wordy/styles.css` — phone-first layout, tile states, pop/cascade/result animation styling.
- `Wordy/app.mjs` — single game controller/state machine; no matching/scoring logic embedded here.
- `Wordy/data/relationships.mjs` — curated V1 relationship records.
- `Wordy/data/levels.mjs` — validation level definitions and authored board fixtures.
- `Wordy/engine/relationship-bank.mjs` — validate/index relationship data.
- `Wordy/engine/board.mjs` — board creation, immutable swap, adjacency, removal, gravity helpers.
- `Wordy/engine/matcher.mjs` — straight-line matching, maximal-contained filtering, crossings.
- `Wordy/engine/scoring.mjs` — base/length/batch/cross/discovery/cascade scoring.
- `Wordy/engine/resolution.mjs` — global batch resolution and automatic cascade loop.
- `Wordy/engine/generator.mjs` — scoring-move enumeration, depth-2 viability, controlled random boards, dead-board recovery.
- `Wordy/engine/review.mjs` — verified missed-opportunity snapshots and end-of-round summaries.
- `Wordy/engine/telemetry.mjs` — small event store with optional browser storage persistence.
- `Wordy/ui/input.mjs` — pure swipe/selection interpretation plus DOM input binding.
- `Wordy/ui/render.mjs` — render board/HUD/ready states/results from controller state.
- `Wordy/tests/*.test.mjs` — Node regression suite.
- Modify `index.html` only at the final integration task to expose the prototype card on the COG landing page.

## Review Focus

1. **Contained vs crossing matches:** a short relationship inside a longer same-line relationship must be suppressed, while perpendicular relationships sharing a tile must both survive and score.
2. **Shared physical tiles:** a crossing tile must be removed once from the board even though both relationships score.
3. **Cascade runaway:** pathological refill that keeps creating matches must stop at a hard generation cap and trigger safe recovery rather than hang the game.
4. **False dead boards:** a board with no immediate match but a relationship reachable in two legal setup swaps must remain playable.
5. **Touch mistakes and edges:** diagonal/ambiguous swipes and attempts to swap past the board edge must not change the board or consume a move.

---

### Task 1: Curated relationship bank and index

**Files:**
- Create: `Wordy/data/relationships.mjs`
- Create: `Wordy/engine/relationship-bank.mjs`
- Create: `Wordy/tests/relationship-bank.test.mjs`

**Interfaces:**
- Consumes: no earlier prototype modules.
- Produces:
  - `RELATIONSHIPS: Relationship[]`
  - `createRelationshipBank(entries): RelationshipBank`
  - `normalizeToken(value): string`
  - `getRelationship(bank, id): Relationship | null`
  - `relationshipLengths(bank): number[]`

Use this record shape:

```js
{
  id: 'collocation:make-a-decision',
  category: 'collocation',
  tokens: ['MAKE', 'A', 'DECISION'],
  baseScore: 180,
  difficulty: 2,
  meaning: 'choose after considering options',
  explanation: 'MAKE A DECISION is a common verb + noun collocation.'
}
```

Populate `relationships.mjs` with these **85 exact prototype relationships**:

**Phrasal verbs (20):**
`LOOK AFTER`, `LOOK FOR`, `LOOK INTO`, `LOOK UP`, `GIVE UP`, `TURN ON`, `TURN OFF`, `PICK UP`, `FIND OUT`, `GET UP`, `WAKE UP`, `SIT DOWN`, `STAND UP`, `TAKE OFF`, `PUT ON`, `PUT AWAY`, `COME BACK`, `GO OUT`, `GROW UP`, `CARRY ON`.

**Collocations (30):**
`MAKE A DECISION`, `MAKE A MISTAKE`, `MAKE SENSE`, `MAKE PROGRESS`, `MAKE MONEY`, `TAKE A BREAK`, `TAKE NOTES`, `TAKE A CHANCE`, `TAKE CARE OF`, `TAKE PART IN`, `PAY ATTENTION`, `DO HOMEWORK`, `DO EXERCISE`, `HAVE BREAKFAST`, `HAVE FUN`, `HAVE A LOOK`, `HEAVY RAIN`, `STRONG COFFEE`, `FAST FOOD`, `HARD WORK`, `GOOD IDEA`, `BAD HABIT`, `HIGH SCHOOL`, `BIG DIFFERENCE`, `CATCH A BUS`, `CATCH A COLD`, `KEEP A PROMISE`, `SAVE TIME`, `SPEND TIME`, `TELL THE TRUTH`.

**Fixed expressions (15):**
`BY THE WAY`, `IN FRONT OF`, `AS A MATTER OF FACT`, `AT THE MOMENT`, `ON THE OTHER HAND`, `IN THE END`, `AS SOON AS POSSIBLE`, `ONCE IN A WHILE`, `ALL OF A SUDDEN`, `FOR A LONG TIME`, `IN MY OPINION`, `OF COURSE`, `NO MATTER WHAT`, `WHETHER OR NOT`, `EVEN IF`.

**Irregular verb sets (20):**
`GO WENT GONE`, `SEE SAW SEEN`, `TAKE TOOK TAKEN`, `WRITE WROTE WRITTEN`, `GIVE GAVE GIVEN`, `COME CAME COME`, `BECOME BECAME BECOME`, `BEGIN BEGAN BEGUN`, `BREAK BROKE BROKEN`, `CHOOSE CHOSE CHOSEN`, `DRINK DRANK DRUNK`, `DRIVE DROVE DRIVEN`, `EAT ATE EATEN`, `FALL FELL FALLEN`, `FORGET FORGOT FORGOTTEN`, `KNOW KNEW KNOWN`, `SPEAK SPOKE SPOKEN`, `SWIM SWAM SWUM`, `WEAR WORE WORN`, `SING SANG SUNG`.

Assign stable base scores by this rule when authoring the file:
- 2 tokens: 100–140 according to difficulty;
- 3 tokens: 150–210;
- 4 tokens: 220–260;
- 5 tokens: 300;
and keep the chosen number stored on the relationship record.

- [ ] **Step 1: Write the failing bank-validation tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { RELATIONSHIPS } from '../data/relationships.mjs';
import {
  createRelationshipBank,
  normalizeToken,
  relationshipLengths
} from '../engine/relationship-bank.mjs';

test('prototype bank has 60–100 unique validated relationships across all four V1 categories', () => {
  const bank=createRelationshipBank(RELATIONSHIPS);
  assert.ok(RELATIONSHIPS.length>=60 && RELATIONSHIPS.length<=100);
  assert.equal(bank.byId.size, RELATIONSHIPS.length);
  assert.deepEqual(
    [...new Set(RELATIONSHIPS.map(r=>r.category))].sort(),
    ['collocation','fixed-expression','irregular-set','phrasal-verb']
  );
});

test('tokens normalize deterministically and supported lengths cover long expressions', () => {
  assert.equal(normalizeToken('  make '),'MAKE');
  const bank=createRelationshipBank(RELATIONSHIPS);
  assert.ok(relationshipLengths(bank).includes(5));
});

test('bank rejects duplicate ids and duplicate canonical token sequences in the same category', () => {
  const duplicate=[
    {id:'x',category:'collocation',tokens:['MAKE','SENSE'],baseScore:100,difficulty:1},
    {id:'x',category:'collocation',tokens:['TAKE','NOTES'],baseScore:100,difficulty:1}
  ];
  assert.throws(()=>createRelationshipBank(duplicate),/duplicate/i);
});
```

- [ ] **Step 2: Run the tests and verify the module does not exist yet**

Run:
```bash
node --test Wordy/tests/relationship-bank.test.mjs
```

Expected: FAIL because `relationships.mjs` / `relationship-bank.mjs` do not exist.

- [ ] **Step 3: Implement the relationship records and bank index**

Core index shape:

```js
export function createRelationshipBank(entries){
  const byId=new Map();
  const byLength=new Map();
  const signatures=new Set();

  for(const raw of entries){
    const relation={...raw,tokens:raw.tokens.map(normalizeToken)};
    if(byId.has(relation.id))throw new Error('duplicate relationship id: '+relation.id);
    const signature=relation.category+':'+relation.tokens.join('|');
    if(signatures.has(signature))throw new Error('duplicate relationship sequence: '+signature);
    signatures.add(signature);
    byId.set(relation.id,relation);
    if(!byLength.has(relation.tokens.length))byLength.set(relation.tokens.length,[]);
    byLength.get(relation.tokens.length).push(relation);
  }
  return {byId,byLength};
}
```

- [ ] **Step 4: Run the bank tests**

Run:
```bash
node --test Wordy/tests/relationship-bank.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/data/relationships.mjs Wordy/engine/relationship-bank.mjs Wordy/tests/relationship-bank.test.mjs
git commit -m "feat(wordy): add curated relationship bank"
```

---

### Task 2: Board model and legal swaps

**Files:**
- Create: `Wordy/engine/board.mjs`
- Create: `Wordy/tests/board.test.mjs`

**Interfaces:**
- Consumes: normalized word strings.
- Produces:
  - `createBoard(wordRows, idFactory?): Board`
  - `areAdjacent(a, b): boolean`
  - `swapTiles(board, a, b): Board`
  - `removeCells(board, cells): Board`
  - `collapseColumns(board, refillTile): Board`
  - `boardKey(board): string`

Board cells are `null` or `{ id: string, word: string }`. Board operations return new arrays and do not mutate the previous board.

- [ ] **Step 1: Write failing board tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard, areAdjacent, swapTiles, removeCells } from '../engine/board.mjs';

test('only orthogonally adjacent cells are legal swaps',()=>{
  assert.equal(areAdjacent({row:1,col:1},{row:1,col:2}),true);
  assert.equal(areAdjacent({row:1,col:1},{row:2,col:1}),true);
  assert.equal(areAdjacent({row:1,col:1},{row:2,col:2}),false);
  assert.equal(areAdjacent({row:1,col:1},{row:1,col:3}),false);
});

test('swap is immutable and preserves tile identity',()=>{
  const board=createBoard([['LOOK','UP'],['AFTER','GO']]);
  const next=swapTiles(board,{row:0,col:1},{row:1,col:1});
  assert.equal(board[0][1].word,'UP');
  assert.equal(next[0][1].word,'GO');
  assert.equal(next[1][1].word,'UP');
  assert.equal(next[0][1].id,board[1][1].id);
});

test('invalid edge swap throws before a move can be charged',()=>{
  const board=createBoard([['LOOK','AFTER']]);
  assert.throws(
    ()=>swapTiles(board,{row:0,col:1},{row:0,col:2}),
    /outside board|invalid/i
  );
});

test('removing the same shared cell twice still clears one physical tile',()=>{
  const board=createBoard([['MAKE','A'],['TAKE','BREAK']]);
  const next=removeCells(board,[{row:0,col:1},{row:0,col:1}]);
  assert.equal(next[0][1],null);
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: FAIL because `board.mjs` does not exist.

- [ ] **Step 3: Implement immutable board helpers**

Core swap behavior:

```js
export function swapTiles(board,a,b){
  assertCell(board,a);
  assertCell(board,b);
  if(!areAdjacent(a,b))throw new Error('invalid non-adjacent swap');
  const next=board.map(row=>row.slice());
  [next[a.row][a.col],next[b.row][b.col]]=[next[b.row][b.col],next[a.row][a.col]];
  return next;
}
```

`collapseColumns` must preserve existing tile IDs while calling `refillTile({row,col})` only for newly empty top cells.

- [ ] **Step 4: Run board tests**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/board.mjs Wordy/tests/board.test.mjs
git commit -m "feat(wordy): add immutable board and swap rules"
```

---

### Task 3: Straight-line matcher, nested suppression, and crossings

**Files:**
- Create: `Wordy/engine/matcher.mjs`
- Create: `Wordy/tests/matcher.test.mjs`

**Interfaces:**
- Consumes:
  - `Board` from Task 2.
  - `RelationshipBank` from Task 1.
- Produces:
  - `findMatches(board, bank): Match[]`
  - `findCrossings(matches): Crossing[]`
  - `cellKey(cell): string`

`Match` shape:

```js
{
  relationshipId:'collocation:make-a-decision',
  orientation:'horizontal',
  cells:[{row:2,col:1},{row:2,col:2},{row:2,col:3}],
  tokens:['MAKE','A','DECISION']
}
```

- [ ] **Step 1: Write matcher tests, including Review Focus #1**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoard } from '../engine/board.mjs';
import { createRelationshipBank } from '../engine/relationship-bank.mjs';
import { findMatches, findCrossings } from '../engine/matcher.mjs';

const bank=createRelationshipBank([
  {id:'short',category:'fixed-expression',tokens:['LOOK','FORWARD','TO'],baseScore:180,difficulty:2},
  {id:'long',category:'fixed-expression',tokens:['LOOK','FORWARD','TO','SEEING','YOU'],baseScore:300,difficulty:3},
  {id:'horizontal',category:'collocation',tokens:['MAKE','A','DECISION'],baseScore:180,difficulty:2},
  {id:'vertical',category:'collocation',tokens:['TAKE','A','BREAK'],baseScore:180,difficulty:2}
]);

test('finds only straight contiguous ordered relationships',()=>{
  const board=createBoard([
    ['LOOK','FORWARD','TO','SEEING','YOU'],
    ['X','X','X','X','X']
  ]);
  const matches=findMatches(board,bank);
  assert.deepEqual(matches.map(m=>m.relationshipId),['long']);
});

test('suppresses a shorter relationship fully contained in a longer same-line match',()=>{
  const board=createBoard([['LOOK','FORWARD','TO','SEEING','YOU']]);
  assert.deepEqual(findMatches(board,bank).map(m=>m.relationshipId),['long']);
});

test('keeps perpendicular crossing matches that share one cell',()=>{
  const board=createBoard([
    ['X','TAKE','X'],
    ['MAKE','A','DECISION'],
    ['X','BREAK','X']
  ]);
  const matches=findMatches(board,bank);
  assert.deepEqual(new Set(matches.map(m=>m.relationshipId)),new Set(['horizontal','vertical']));
  const crossings=findCrossings(matches);
  assert.equal(crossings.length,1);
  assert.deepEqual(crossings[0].cell,{row:1,col:1});
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs
```

Expected: FAIL because matcher does not exist.

- [ ] **Step 3: Implement row/column scanning and maximal-match filtering**

Scan every start position against relationships grouped by length. After raw matches are found, suppress match `a` only when:
- `a.orientation===b.orientation`;
- both occupy the same row or column line;
- every cell in `a.cells` is contained in `b.cells`;
- `a.cells.length < b.cells.length`.

Do **not** suppress perpendicular overlaps.

- [ ] **Step 4: Run matcher tests**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/matcher.mjs Wordy/tests/matcher.test.mjs
git commit -m "feat(wordy): detect ready relationships and crossings"
```

---

### Task 4: Provisional scoring model

**Files:**
- Create: `Wordy/engine/scoring.mjs`
- Create: `Wordy/tests/scoring.test.mjs`

**Interfaces:**
- Consumes `Match[]`, `RelationshipBank`, discovered relation IDs, cascade depth.
- Produces:
  - `DEFAULT_SCORE_CONFIG`
  - `scoreResolution({matches,bank,discoveredIds,cascadeDepth}): ScoreBreakdown`

Use these provisional constants:

```js
export const DEFAULT_SCORE_CONFIG={
  lengthBonus:{2:0,3:40,4:90,5:150},
  batchBonusPerExtra:75,
  crossBonus:120,
  discoveryBonus:50,
  cascadeMultiplierStep:0.5
};
```

Cascade multiplier is `1 + cascadeDepth * 0.5`, where player-triggered batch depth is `0`, first automatic cascade is `1`.

- [ ] **Step 1: Write scoring tests**

```js
test('batch bonus rewards resolving several ready relationships together',()=>{
  const one=scoreResolution({matches:[m1],bank,discoveredIds:new Set(),cascadeDepth:0});
  const two=scoreResolution({matches:[m1,m2],bank,discoveredIds:new Set(),cascadeDepth:0});
  assert.ok(two.batchBonus>one.batchBonus);
});

test('crossing relationships both score and add one cross bonus',()=>{
  const result=scoreResolution({matches:[horizontal,vertical],bank,discoveredIds:new Set(['h','v']),cascadeDepth:0});
  assert.equal(result.crossCount,1);
  assert.equal(result.crossBonus,120);
});

test('first automatic cascade applies x1.5 multiplier',()=>{
  const result=scoreResolution({matches:[m1],bank,discoveredIds:new Set(['m1']),cascadeDepth:1});
  assert.equal(result.multiplier,1.5);
});

test('discovery bonus is added only for relationships not already discovered',()=>{
  const fresh=scoreResolution({matches:[m1],bank,discoveredIds:new Set(),cascadeDepth:0});
  const known=scoreResolution({matches:[m1],bank,discoveredIds:new Set(['m1']),cascadeDepth:0});
  assert.equal(fresh.discoveryBonus-known.discoveryBonus,50);
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/scoring.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement score breakdown**

Return an object with:
`baseScore`, `lengthBonus`, `batchBonus`, `crossCount`, `crossBonus`, `discoveryBonus`, `multiplier`, `subtotal`, and `total`.

Use `findCrossings(matches)` from Task 3 so crossing logic exists in one place.

- [ ] **Step 4: Run scoring tests**

Run:
```bash
node --test Wordy/tests/scoring.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/scoring.mjs Wordy/tests/scoring.test.mjs
git commit -m "feat(wordy): add prototype scoring model"
```

---

### Task 5: Global pop, gravity, and cascade engine

**Files:**
- Create: `Wordy/engine/resolution.mjs`
- Create: `Wordy/tests/resolution.test.mjs`

**Interfaces:**
- Consumes board/matcher/scoring helpers.
- Produces:
  - `resolvePlayerActivation({board,bank,discoveredIds,refillTile,maxCascadeDepth?}): ResolutionResult`
  - `CascadeLimitError`

`ResolutionResult` includes:
- `board` final stable board;
- `generations` array where index 0 is the player batch;
- `totalScore`;
- `newlyDiscoveredIds`.

Each generation records `matches`, `removedTileIds`, `score`, and `cascadeDepth`.

- [ ] **Step 1: Write global-pop, crossing-removal, and runaway tests**

```js
test('global activation resolves every currently ready relationship in generation zero',()=>{
  const result=resolvePlayerActivation({board,bank,discoveredIds:new Set(),refillTile});
  assert.equal(result.generations[0].matches.length,2);
});

test('a tile shared by two crossing relationships is physically removed once but both relationships score',()=>{
  const first=resolvePlayerActivation({board:crossBoard,bank,discoveredIds:new Set(),refillTile});
  const ids=first.generations[0].removedTileIds;
  assert.equal(ids.length,new Set(ids).size);
  assert.equal(first.generations[0].matches.length,2);
  assert.ok(first.generations[0].score.crossBonus>0);
});

test('gravity-created relationship becomes automatic cascade generation one',()=>{
  const result=resolvePlayerActivation({board:cascadeBoard,bank,discoveredIds:new Set(),refillTile});
  assert.ok(result.generations.length>=2);
  assert.equal(result.generations[1].cascadeDepth,1);
  assert.ok(result.generations[1].matches.some(m=>m.relationshipId==='take-a-break'));
});

test('pathological refill cannot create an infinite cascade',()=>{
  assert.throws(
    ()=>resolvePlayerActivation({
      board:loopBoard,
      bank,
      discoveredIds:new Set(),
      refillTile:()=>({id:crypto.randomUUID(),word:'UP'}),
      maxCascadeDepth:3
    }),
    /cascade limit/i
  );
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/resolution.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement batch + cascade loop**

Core structure:

```js
export function resolvePlayerActivation({
  board,bank,discoveredIds,refillTile,maxCascadeDepth=12
}){
  let current=board;
  let matches=findMatches(current,bank);
  if(matches.length===0)throw new Error('no ready relationships');
  const generations=[];
  const discovered=new Set(discoveredIds);

  for(let depth=0;matches.length>0;depth++){
    if(depth>maxCascadeDepth)throw new CascadeLimitError('cascade limit exceeded');
    const score=scoreResolution({matches,bank,discoveredIds:discovered,cascadeDepth:depth});
    const removed=[...new Set(matches.flatMap(m=>m.cells.map(cell=>current[cell.row][cell.col].id)))];
    current=removeCells(current,matches.flatMap(m=>m.cells));
    current=collapseColumns(current,refillTile);
    generations.push({matches,removedTileIds:removed,score,cascadeDepth:depth});
    for(const match of matches)discovered.add(match.relationshipId);
    matches=findMatches(current,bank);
  }

  return {board:current,generations,newlyDiscoveredIds:[...discovered].filter(id=>!discoveredIds.has(id)),
    totalScore:generations.reduce((n,g)=>n+g.score.total,0)};
}
```

- [ ] **Step 4: Run resolution tests**

Run:
```bash
node --test Wordy/tests/resolution.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/resolution.mjs Wordy/tests/resolution.test.mjs
git commit -m "feat(wordy): add global pop and cascade resolution"
```

---

### Task 6: Meaningful moves, controlled randomness, and dead-board recovery

**Files:**
- Create: `Wordy/engine/generator.mjs`
- Create: `Wordy/tests/generator.test.mjs`

**Interfaces:**
- Consumes board, matcher, relationship bank.
- Produces:
  - `enumerateSwaps(board): Swap[]`
  - `findImmediateScoringMoves(board,bank): ScoringMove[]`
  - `hasViablePlay(board,bank,{maxDepth=2}={}): boolean`
  - `createControlledBoard({bank,rows=7,cols=5,rng,minScoringMoves=2}): Board`
  - `recoverDeadBoard({board,bank,rng}): {board,reset:boolean}`

Controlled generation algorithm:
1. choose a connected subset of 10–14 relationships sharing at least one token with another selected relationship;
2. flatten selected tokens into a candidate bag;
3. repeat bag words until 35 cells are available;
4. shuffle with injected `rng`;
5. build the 7×5 board;
6. accept only boards with at least `minScoringMoves` immediate scoring swaps;
7. after 250 rejected attempts, return a known productive fallback fixture from Task 7.

- [ ] **Step 1: Write generator tests, including Review Focus #4**

```js
test('enumerateSwaps returns each orthogonal edge once',()=>{
  const board=createBoard([
    ['A','B'],
    ['C','D']
  ]);
  assert.equal(enumerateSwaps(board).length,4);
});

test('a board with no immediate score but a match reachable in two setup swaps is not dead',()=>{
  const bank=createRelationshipBank([
    {id:'look-after',category:'phrasal-verb',tokens:['LOOK','AFTER'],baseScore:100,difficulty:1}
  ]);
  const board=createBoard([
    ['LOOK','X','Y'],
    ['Z','AFTER','Q']
  ]);
  assert.equal(findImmediateScoringMoves(board,bank).length,0);
  assert.equal(hasViablePlay(board,bank,{maxDepth:2}),true);
});

test('controlled board satisfies the minimum immediate scoring-move requirement',()=>{
  const board=createControlledBoard({bank:fullBank,rows:7,cols:5,rng:seeded(7),minScoringMoves:2});
  assert.ok(findImmediateScoringMoves(board,fullBank).length>=2);
});

test('dead board recovery costs no game move and marks reset true',()=>{
  const result=recoverDeadBoard({board:deadBoard,bank:fullBank,rng:seeded(4)});
  assert.equal(result.reset,true);
  assert.equal(result.board.length,7);
  assert.equal(result.board[0].length,5);
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/generator.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement depth-2 viability without mutating boards**

Use BFS keyed by `boardKey(board)`. Depth zero is the current board; a state is viable if `findMatches(state,bank)` becomes non-empty after one or two legal swaps. Do not charge moves inside this analysis function.

- [ ] **Step 4: Implement controlled generation with injected RNG and fallback hook**

The generator must never use `Math.random` directly in pure tests; default it only at the public boundary:

```js
export function createControlledBoard({bank,rows=7,cols=5,rng=Math.random,minScoringMoves=2,fallbackBoard}){
  // bounded attempts, then clone fallbackBoard
}
```

- [ ] **Step 5: Run generator tests**

Run:
```bash
node --test Wordy/tests/generator.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Wordy/engine/generator.mjs Wordy/tests/generator.test.mjs
git commit -m "feat(wordy): add productive board generation"
```

---

### Task 7: Authored validation levels and objectives

**Files:**
- Create: `Wordy/data/levels.mjs`
- Create: `Wordy/tests/levels.test.mjs`

**Interfaces:**
- Consumes relationship IDs from Task 1.
- Produces:
  - `LEVELS: LevelDefinition[]`
  - `getLevel(id): LevelDefinition`
  - `isObjectiveComplete(level,state): boolean`
  - `FALLBACK_BOARD_ROWS`

Use a 7-level validation sequence:

```js
[
  {id:'A',title:'First Move',moves:10,goal:{type:'score',target:250}},
  {id:'B',title:'Ready, Set, Pop',moves:12,goal:{type:'score',target:500}},
  {id:'C',title:'Build the Batch',moves:16,goal:{type:'batch',target:2}},
  {id:'D',title:'Let It Fall',moves:16,goal:{type:'cascade',target:1}},
  {id:'E',title:'Long Thought',moves:18,goal:{type:'long-relation',target:4}},
  {id:'F',title:'Crossroads',moves:18,goal:{type:'cross',target:1}},
  {id:'G',title:'Mixed Play',moves:20,goal:{type:'score',target:1800}}
]
```

Every level must provide `boardRows` with exactly 7 arrays of 5 words and a short `instruction`. Levels A–F are authored; Level G may request controlled generation but must also carry a valid fallback board.

Design the authored boards so tests prove:
- A has an intended one-swap relationship and no automatic start match.
- B starts with or can create one obvious ready relationship and teaches the global button.
- C can reach two simultaneous ready relationships.
- D contains a deterministic planned cascade.
- E has a reachable relationship of length ≥4.
- F has a reachable crossing.
- G passes `hasViablePlay` and `findImmediateScoringMoves>=2`.

- [ ] **Step 1: Write level-shape and mechanic tests**

```js
test('all validation levels are 7x5 and move-limited',()=>{
  for(const level of LEVELS){
    assert.equal(level.boardRows.length,7);
    assert.ok(level.boardRows.every(row=>row.length===5));
    assert.ok(Number.isInteger(level.moves)&&level.moves>0);
    assert.ok(level.instruction.length>0);
  }
});

test('level D fixture produces the intended cascade under its documented activation',()=>{
  const level=getLevel('D');
  const board=createBoard(level.boardRows);
  const prepared=applyFixtureMoves(board,level.fixtureMoves);
  const result=resolvePlayerActivation({
    board:prepared,
    bank,
    discoveredIds:new Set(),
    refillTile:fixtureRefill(level)
  });
  assert.ok(result.generations.length>=2);
});

test('level F fixture can produce a crossing before activation',()=>{
  const level=getLevel('F');
  const prepared=applyFixtureMoves(createBoard(level.boardRows),level.fixtureMoves);
  assert.ok(findCrossings(findMatches(prepared,bank)).length>=1);
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/levels.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement all seven concrete level definitions**

Include exact `fixtureMoves` and, for Level D, exact deterministic `fixtureRefillWords` used only by the validation test. Production play still uses the controlled refill generator.

- [ ] **Step 4: Implement objective evaluation**

```js
export function isObjectiveComplete(level,state){
  switch(level.goal.type){
    case 'score': return state.score>=level.goal.target;
    case 'batch': return state.bestBatch>=level.goal.target;
    case 'cascade': return state.bestCascade>=level.goal.target;
    case 'long-relation': return state.longestRelation>=level.goal.target;
    case 'cross': return state.crossCount>=level.goal.target;
    default: throw new Error('unsupported goal: '+level.goal.type);
  }
}
```

- [ ] **Step 5: Run level tests**

Run:
```bash
node --test Wordy/tests/levels.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Wordy/data/levels.mjs Wordy/tests/levels.test.mjs
git commit -m "feat(wordy): add prototype validation levels"
```

---

### Task 8: Missed opportunities, discovery state, and telemetry

**Files:**
- Create: `Wordy/engine/review.mjs`
- Create: `Wordy/engine/telemetry.mjs`
- Create: `Wordy/tests/review-telemetry.test.mjs`

**Interfaces:**
- Consumes scoring moves from Task 6 and score previews from Task 4.
- Produces:
  - `captureMissedOpportunity({board,scoringMoves,chosenSwap,bank}): MissedOpportunity | null`
  - `buildRoundReview({newRelationshipIds,missedOpportunities,bank,limit=3}): RoundReview`
  - `createTelemetryStore({storage,key?}): TelemetryStore`

A missed-opportunity snapshot stores logical data only:

```js
{
  boardRows:[['LOOK','X',...], ...],
  relationshipId:'phrasal:look-after',
  suggestedSwap:{from:{row:1,col:1},to:{row:1,col:2}},
  projectedScore:140
}
```

Discovery persistence key: `wordy.prototype.discovered.v1`.  
Telemetry persistence key: `wordy.prototype.telemetry.v1`.

- [ ] **Step 1: Write review and telemetry tests**

```js
test('chosen best scoring swap is not recorded as missed',()=>{
  const missed=captureMissedOpportunity({
    board,
    scoringMoves:[bestMove],
    chosenSwap:bestMove.swap,
    bank
  });
  assert.equal(missed,null);
});

test('a different chosen move records the highest verified immediate opportunity with logical board snapshot',()=>{
  const missed=captureMissedOpportunity({
    board,
    scoringMoves:[lowMove,bestMove],
    chosenSwap:otherSwap,
    bank
  });
  assert.equal(missed.relationshipId,bestMove.matches[0].relationshipId);
  assert.equal(Array.isArray(missed.boardRows),true);
  assert.equal('image' in missed,false);
});

test('round review returns at most three new and three missed items ordered by value',()=>{
  const review=buildRoundReview({newRelationshipIds:['a','b','c','d'],missedOpportunities:[m1,m2,m3,m4],bank,limit:3});
  assert.equal(review.newLearning.length,3);
  assert.equal(review.missed.length,3);
  assert.ok(review.missed[0].projectedScore>=review.missed[1].projectedScore);
});

test('telemetry store persists and restores events without a backend',()=>{
  const storage=createFakeStorage();
  const store=createTelemetryStore({storage});
  store.record('swap',{from:[0,0],to:[0,1]});
  const restored=createTelemetryStore({storage});
  assert.equal(restored.events().length,1);
  assert.equal(restored.events()[0].type,'swap');
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/review-telemetry.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement review logic and storage abstraction**

Telemetry event shape:

```js
{at:Date.now(),type:'pop',payload:{readyCount:3,cascadeDepth:0}}
```

The store must accept `storage:null` for pure tests and in-memory use.

- [ ] **Step 4: Run review/telemetry tests**

Run:
```bash
node --test Wordy/tests/review-telemetry.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/review.mjs Wordy/engine/telemetry.mjs Wordy/tests/review-telemetry.test.mjs
git commit -m "feat(wordy): add learning review and prototype telemetry"
```

---

### Task 9: Touch/selection input rules

**Files:**
- Create: `Wordy/ui/input.mjs`
- Create: `Wordy/tests/input.test.mjs`

**Interfaces:**
- Produces:
  - `directionFromSwipe(dx,dy,{threshold=24,dominance=1.15}={}): 'up'|'down'|'left'|'right'|null`
  - `neighborForDirection(cell,direction): Cell`
  - `bindBoardInput(boardElement,{onSwap,onSelect}): cleanupFunction`

Support two phone-friendly interactions:
1. swipe a tile toward one orthogonal neighbor;
2. tap one tile then tap an adjacent tile.

- [ ] **Step 1: Write input tests, including Review Focus #5**

```js
test('clear cardinal swipe maps to one orthogonal direction',()=>{
  assert.equal(directionFromSwipe(40,3),'right');
  assert.equal(directionFromSwipe(-40,2),'left');
  assert.equal(directionFromSwipe(2,-40),'up');
  assert.equal(directionFromSwipe(1,42),'down');
});

test('short or diagonal ambiguous gestures do not become swaps',()=>{
  assert.equal(directionFromSwipe(10,4),null);
  assert.equal(directionFromSwipe(35,34),null);
});

test('neighborForDirection can point outside but board controller must reject before charging move',()=>{
  assert.deepEqual(neighborForDirection({row:0,col:0},'up'),{row:-1,col:0});
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/input.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement pointer/tap interpretation**

Do not mutate game state in `input.mjs`; emit requested cell pairs to the controller. The controller owns validation and move consumption.

- [ ] **Step 4: Run input tests**

Run:
```bash
node --test Wordy/tests/input.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/ui/input.mjs Wordy/tests/input.test.mjs
git commit -m "feat(wordy): add mobile tile input"
```

---

### Task 10: Phone-first HTML/CSS renderer

**Files:**
- Create: `Wordy/index.html`
- Create: `Wordy/styles.css`
- Create: `Wordy/ui/render.mjs`
- Create: `Wordy/tests/ui-contract.test.mjs`

**Interfaces:**
- Consumes controller state.
- Produces:
  - `renderGame(root,state)`
  - `renderResult(root,review)`
  - stable DOM hooks: `#wordyBoard`, `#popButton`, `#movesValue`, `#scoreValue`, `#objectiveText`, `#resultOverlay`.

Required visible structure:
- compact top bar: level, score, moves;
- one-line objective/instruction;
- centered 5×7 equal-cell board;
- ready counter near one large global pop button;
- concise event label area for `NEW`, `CROSS`, `COMBO ×N`;
- modal/sheet result screen with New Learning above Missed Opportunities;
- Replay and Next buttons.

Use CSS Grid:

```css
.wordy-board{
  width:min(94vw,520px);
  aspect-ratio:5/7;
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  grid-template-rows:repeat(7,minmax(0,1fr));
  gap:clamp(4px,1.2vw,8px);
  touch-action:none;
}
.wordy-tile{
  min-width:0;
  display:grid;
  place-items:center;
  text-align:center;
  overflow:hidden;
}
```

Ready tiles must have a clearly visible state that does not obscure text. Do not commit a final art direction; keep neutral prototype styling.

- [ ] **Step 1: Write static UI contract tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('prototype exposes required HUD, board, global pop, and result hooks',()=>{
  for(const id of ['wordyBoard','popButton','movesValue','scoreValue','objectiveText','resultOverlay']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
});

test('board is a five-column equal-cell phone-first grid',()=>{
  assert.match(css,/grid-template-columns:\s*repeat\(5/);
  assert.match(css,/aspect-ratio:\s*5\s*\/\s*7/);
  assert.match(css,/touch-action:\s*none/);
});
```

- [ ] **Step 2: Run and verify failure**

Run:
```bash
node --test Wordy/tests/ui-contract.test.mjs
```

Expected: FAIL because UI files do not exist.

- [ ] **Step 3: Implement DOM skeleton, renderer, and neutral responsive CSS**

`renderGame` must:
- render tile text from `tile.word`;
- add `.is-ready` to every cell in a ready match;
- add `.is-cross` when a cell belongs to at least two ready matches;
- disable `#popButton` when `state.readyMatches.length===0`;
- show button text `POP` for one ready relation and `POP ×N` for multiple.

- [ ] **Step 4: Run UI contract tests**

Run:
```bash
node --test Wordy/tests/ui-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/index.html Wordy/styles.css Wordy/ui/render.mjs Wordy/tests/ui-contract.test.mjs
git commit -m "feat(wordy): add phone-first prototype UI"
```

---

### Task 11: Controller, full playable loop, and COG route

**Files:**
- Create: `Wordy/app.mjs`
- Create: `Wordy/tests/controller.test.mjs`
- Modify: `Wordy/index.html` to load `./app.mjs` as a module.
- Modify: `index.html` to add the Wordy prototype card.

**Interfaces:**
- Consumes every earlier module.
- Produces a playable static game at `/Wordy/`.

Controller state shape:

```js
{
  levelId:'A',
  board,
  movesLeft:10,
  score:0,
  readyMatches:[],
  discoveredIds:new Set(),
  bestBatch:0,
  bestCascade:0,
  longestRelation:0,
  crossCount:0,
  phase:'playing', // playing | resolving | result
  missedOpportunities:[]
}
```

The controller must validate swaps before decrementing `movesLeft`. Legal in-bounds adjacent setup swaps consume one move even if they create no match. Invalid/edge/diagonal requests consume nothing.

Before each legal swap:
1. calculate `findImmediateScoringMoves` on the pre-swap board;
2. capture the highest missed verified opportunity if the chosen swap is different;
3. apply the swap;
4. decrement one move;
5. refresh ready matches;
6. log telemetry;
7. check level failure only after the board stabilizes and no resolution animation is running.

Global pop:
1. ignore if no ready matches or phase is not `playing`;
2. set phase `resolving`;
3. resolve player batch + cascades;
4. update score/stats/discoveries;
5. recover dead board if required, with no move charge;
6. set phase back to `playing` or show result if objective is complete / moves are exhausted.

If `CascadeLimitError` occurs:
- log `cascade-limit`;
- replace board via `recoverDeadBoard`;
- do not award further cascade score;
- return safely to player control.

- [ ] **Step 1: Write controller-state tests around move charging and ready persistence**

Factor controller logic into exported `createGameController(deps)` so Node tests can drive it without a DOM.

```js
test('legal non-scoring setup swap consumes one move and stays in place',()=>{
  const game=createTestGame();
  const before=game.state().movesLeft;
  game.swap({row:0,col:0},{row:0,col:1});
  assert.equal(game.state().movesLeft,before-1);
  assert.notEqual(game.state().board[0][0].word,game.initialBoard[0][0].word);
});

test('invalid edge or diagonal swap consumes no move',()=>{
  const game=createTestGame();
  const before=game.state().movesLeft;
  assert.equal(game.swap({row:0,col:0},{row:-1,col:0}),false);
  assert.equal(game.swap({row:0,col:0},{row:1,col:1}),false);
  assert.equal(game.state().movesLeft,before);
});

test('ready relationship persists until broken or global pop is pressed',()=>{
  const game=createReadyTestGame();
  assert.equal(game.state().readyMatches.length,1);
  game.swap(unrelatedA,unrelatedB);
  assert.equal(game.state().readyMatches.length,1);
});

test('global pop does not consume an additional move',()=>{
  const game=createReadyTestGame();
  const before=game.state().movesLeft;
  game.pop();
  assert.equal(game.state().movesLeft,before);
});
```

- [ ] **Step 2: Run controller tests and verify failure**

Run:
```bash
node --test Wordy/tests/controller.test.mjs
```

Expected: FAIL because controller does not exist.

- [ ] **Step 3: Implement controller and connect renderer/input**

In browser bootstrap:

```js
const controller=createGameController({
  bank:createRelationshipBank(RELATIONSHIPS),
  levels:LEVELS,
  storage:window.localStorage,
  rng:Math.random
});

const cleanupInput=bindBoardInput(document.querySelector('#wordyBoard'),{
  onSwap:(from,to)=>controller.swap(from,to),
  onSelect:cell=>controller.select(cell)
});

controller.subscribe(state=>renderGame(document,state));
document.querySelector('#popButton').addEventListener('click',()=>controller.pop());
```

Use short CSS transition delays in browser presentation only; keep engine resolution synchronous and deterministic.

- [ ] **Step 4: Add the route to the COG landing page**

Add this card in the existing **English Games** grid in root `index.html`:

```html
<a class="card" href="/Wordy/">
  <span class="tag">English</span>
  <h3>Wordy Prototype</h3>
  <p>Build English word relationships, prepare combinations and trigger cascades.</p>
  <span class="open">Open prototype →</span>
</a>
```

The label remains explicitly `Prototype` because the final commercial name is deferred.

- [ ] **Step 5: Add an integration test for the entry point and COG link**

```js
test('Wordy entry point loads the controller module',()=>{
  assert.match(wordyHtml,/type="module"\s+src="\.\/app\.mjs"/);
});

test('COG landing page exposes the Wordy prototype route',()=>{
  assert.match(rootHtml,/href="\/Wordy\/"/);
  assert.match(rootHtml,/Wordy Prototype/);
});
```

- [ ] **Step 6: Run the complete automated suite**

Run:
```bash
node --test Wordy/tests/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 7: Run a local static server and browser-check the complete loop**

Run:
```bash
python3 -m http.server 4173
```

Open:
```
http://127.0.0.1:4173/Wordy/
```

Verify on a narrow/mobile viewport:
1. board fits without horizontal scrolling;
2. swipe changes only one adjacent tile;
3. a non-scoring setup move remains in place and reduces moves by one;
4. a ready relation remains visible without disappearing;
5. `POP ×N` appears when multiple relations are ready;
6. pop removes every ready relation together;
7. crossing tile disappears only once;
8. a planned gravity cascade auto-resolves and displays `COMBO ×2` or higher;
9. global pop does not reduce moves;
10. result screen shows New Learning above Missed Opportunities;
11. Replay and Next work;
12. no console errors occur.

- [ ] **Step 8: Commit**

```bash
git add Wordy index.html
git commit -m "feat(wordy): complete playable validation prototype"
```

---

## Final Verification

- [ ] Run all Wordy tests:

```bash
node --test Wordy/tests/*.test.mjs
```

Expected: PASS with zero failures.

- [ ] Confirm the static route is reachable from the root site:

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`, tap **Wordy Prototype**, and confirm it loads `/Wordy/`.

- [ ] Verify prototype exclusions by checking there is no Teacher Monitor, login/session code, currency/lives, booster UI, obstacle engine, adaptive mastery engine, or full map in `Wordy/`.

- [ ] Review telemetry from at least one full Level A→G playthrough and confirm the event stream contains: `level-start`, `swap`, `ready-change`, `pop`, `cascade` when applicable, `dead-board-reset` when applicable, and `level-end`.

- [ ] Confirm the key product behavior manually: on Level C or later, it is possible and visibly advantageous to leave one ready relationship intact while preparing another before pressing the global pop button.
