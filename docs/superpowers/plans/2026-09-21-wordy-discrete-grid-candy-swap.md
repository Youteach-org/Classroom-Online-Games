# Wordy Discrete Grid + Candy-Style Swaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Wordy on a 12×7 discrete microgrid with 1–4-column word blocks, Candy-Crush-style attempted swaps with rebound, rigid-block gravity, and a symmetric readable board.

**Architecture:** Replace the equal-cell / free-flex prototype geometry with one tile-centric board authority: `{rows, columns, tiles[]}`. Every engine and UI subsystem reads the same `row/startColumn/span` coordinates. Swapping, matching, gravity, refill, rendering, review replays, and playability checks are all derived from that geometry rather than maintaining parallel coordinate systems.

**Tech Stack:** Vanilla JavaScript ES modules, Node.js `node:test`, DOM/CSS Grid, Web Animations API with a no-animation fallback, GitHub branch `feature/wordy-game`, existing Classroom Online Games Cloudflare Pages production route for final review.

**Spec:** `docs/superpowers/specs/2026-09-21-wordy-discrete-grid-swap-architecture.md`

## Global Constraints

- Canonical board size is exactly **12 microcolumns × 7 rows**.
- Tile spans are exactly **1, 2, 3, or 4 microcolumns**.
- Word-to-span mapping is deterministic: 1–2 characters → 1; 3–5 → 2; 6–8 → 3; 9+ → 4.
- A player gesture swaps exactly **two physical tiles**.
- Horizontal swap partners may have different spans when their edges touch.
- Vertical swap partners require identical `startColumn` and identical `span` on adjacent rows.
- Any geometrically valid pair can be attempted.
- A non-productive valid attempt visibly swaps and rebounds, changes no canonical state, and consumes no move.
- A productive attempt remains and consumes exactly one move.
- Horizontal matches use edge-touching consecutive tiles.
- Vertical matches use consecutive rows with a non-empty common microcolumn intersection; vertical matching does **not** require equal spans.
- Gravity moves each tile as a rigid block only when every microcell below its footprint is empty.
- After rigid gravity, every remaining horizontal empty run is packed exactly; stable rows end fully occupied.
- Global POP, simultaneous ready relationships, crossings, scoring, cascades, discovery, and round review remain.
- Runtime relationship validity continues to use the approved relationship bank; no live LLM judging.
- Do not create alternate hosting, githack mirrors, Vercel previews, Codespaces requirements, or user-local download workflows.
- Development happens in `feature/wordy-game`; the live COG `/Wordy/` runtime is updated only after the implementation verification gate.

## Review Focus

1. **Wide tile above partially empty support:** a span-3 tile with only two empty cells below must not fall; Task 5 adds this regression.
2. **Mixed-width vertical phrase:** `TAKE / A / BREAK` must match when all three footprints share one microcolumn; Task 2 adds this regression.
3. **Duplicate vertical detection through wide tiles:** scanning multiple microcolumns must emit one relationship, not duplicate copies; Task 2 adds deduplication coverage.
4. **Failed swap during an existing ready relationship:** rebound must preserve ready state, moves, score, and tile coordinates; Task 4 adds this regression.
5. **Cavity refill after rigid gravity:** an enclosed horizontal gap that cannot be reached by falling blocks must still be packed exactly without overlap; Task 5 adds this regression.

---

## File Structure

### New files

- `Wordy/engine/tile-size.mjs`
  - Owns deterministic word normalization and `spanForWord(word)`.
- `Wordy/ui/swap-animation.mjs`
  - Owns accepted FLIP animation and rejected forward/back rebound animation; contains no game rules.

### Existing files to rewrite or adapt

- `Wordy/engine/board.mjs`
  - Sole geometry authority: board creation, cloning, occupancy, adjacency, directional neighbors, rigid swaps, removal, empty-run discovery, gravity.
- `Wordy/engine/matcher.mjs`
  - Tile-ID-based horizontal/vertical matching and crossings.
- `Wordy/engine/generator.mjs`
  - Geometric swap enumeration, productive move search, 12-wide row packing, dead-board recovery.
- `Wordy/engine/controller.mjs`
  - Accepted/rebound swap semantics, state lifecycle, telemetry, refill orchestration.
- `Wordy/engine/resolution.mjs`
  - Tile-ID removal, rigid gravity, exact-run refill, cascade loop.
- `Wordy/engine/scoring.mjs`
  - Match length from `tileIds.length`; crossings by shared tile ID.
- `Wordy/engine/review.mjs`
  - Tile-centric snapshots and tile-ID suggested swaps.
- `Wordy/data/levels.mjs`
  - Authored rows whose span totals are exactly 12.
- `Wordy/ui/input.mjs`
  - Tile-ID gestures with geometry callbacks instead of row/column arithmetic.
- `Wordy/ui/render.mjs`
  - Direct 12×7 CSS Grid rendering from `row/startColumn/span`.
- `Wordy/styles.css`
  - Remove free-flex width buckets; add grid geometry and motion states.
- `Wordy/app.mjs`
  - Coordinate input locking and swap animation with controller results.
- `Wordy/tests/*.test.mjs`
  - Replace cell-matrix assumptions with discrete-grid expectations.

---

### Task 1: Canonical tile spans and 12×7 board geometry

**Files:**
- Create: `Wordy/engine/tile-size.mjs`
- Rewrite: `Wordy/engine/board.mjs`
- Modify: `Wordy/tests/board.test.mjs`
- Modify: `Wordy/tests/helpers.mjs`

**Interfaces:**
- Produces:
  - `spanForWord(word): 1|2|3|4`
  - `createBoard(wordRows,{columns=12,idFactory}={}): Board`
  - `cloneBoard(board): Board`
  - `tileById(board,tileId): Tile|null`
  - `tilesInRow(board,row): Tile[]`
  - `occupancyMap(board): Array<Array<string|null>>`
  - `areSwapNeighbors(board,aId,bId): boolean`
  - `neighborForDirection(board,tileId,direction): string|null`
  - `swapTiles(board,aId,bId): Board`
  - `removeTiles(board,tileIds): Board`
  - `emptyRuns(board,row): Array<{row,startColumn,width}>`
  - `settleGravity(board): Board`
  - `boardKey(board): string`
- Board:
```js
{
  rows: 7,
  columns: 12,
  tiles: [
    { id: 'tile-1', word: 'LOOK', row: 0, startColumn: 0, span: 2 }
  ]
}
```

- [ ] **Step 1: Write span-bucket and exact-row packing tests**

```js
test('spanForWord returns only the four approved width buckets',()=>{
  assert.equal(spanForWord('A'),1);
  assert.equal(spanForWord('OF'),1);
  assert.equal(spanForWord('LOOK'),2);
  assert.equal(spanForWord('AFTER'),2);
  assert.equal(spanForWord('COFFEE'),3);
  assert.equal(spanForWord('HOMEWORK'),3);
  assert.equal(spanForWord('ATTENTION'),4);
  assert.equal(spanForWord('DIFFERENCE'),4);
});

test('createBoard packs each authored row to exactly 12 microcolumns',()=>{
  const board=createBoard([
    ['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A']
  ],{columns:12});
  assert.equal(board.columns,12);
  assert.deepEqual(
    board.tiles.map(t=>[t.word,t.startColumn,t.span]),
    [
      ['LOOK',0,2],['WENT',2,2],['AFTER',4,2],['MONEY',6,2],
      ['BEGUN',8,2],['OF',10,1],['A',11,1]
    ]
  );
});

test('createBoard rejects rows that underfill or overflow the 12-column grid',()=>{
  assert.throws(()=>createBoard([['LOOK','AFTER']],{columns:12}),/exactly 12/i);
  assert.throws(()=>createBoard([['ATTENTION','DIFFERENCE','HOMEWORK','COFFEE']],{columns:12}),/12 columns/i);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: FAIL because `spanForWord` and the tile-centric board shape do not exist.

- [ ] **Step 3: Implement deterministic span sizing**

```js
// Wordy/engine/tile-size.mjs
export function normalizeWord(value){
  return String(value??'').trim().replace(/\s+/g,' ').toUpperCase();
}

export function spanForWord(value){
  const word=normalizeWord(value);
  if(!word)throw new Error('word is required');
  const length=word.length;
  if(length<=2)return 1;
  if(length<=5)return 2;
  if(length<=8)return 3;
  return 4;
}
```

- [ ] **Step 4: Replace the matrix board with one tile-centric geometry authority**

Implement `createBoard` by accumulating `startColumn` using `spanForWord`; require every authored row to finish at exactly `columns`. `occupancyMap` writes each tile ID into every microcell in its footprint and throws on overlap/out-of-bounds.

Horizontal neighbor rule:
```js
const rightEdge=a.startColumn+a.span;
const horizontal=a.row===b.row &&
  (rightEdge===b.startColumn || b.startColumn+b.span===a.startColumn);
```

Vertical neighbor rule:
```js
const vertical=Math.abs(a.row-b.row)===1 &&
  a.startColumn===b.startColumn &&
  a.span===b.span;
```

Horizontal `swapTiles` exchanges the two tiles' order inside their combined footprint. Vertical `swapTiles` exchanges only their `row` values.

- [ ] **Step 5: Add directional-neighbor and wide-vs-small regression tests**

```js
test('different-width touching tiles can swap horizontally',()=>{
  const board=createBoard([
    ['A','ATTENTION','LOOK','MAKE','OF','TO'] // 1+4+2+2+1+1 = 11; add I below in implementation fixture
  ],{columns:12});
  const a=board.tiles.find(t=>t.word==='A');
  const attention=board.tiles.find(t=>t.word==='ATTENTION');
  assert.equal(areSwapNeighbors(board,a.id,attention.id),true);
});

test('vertical swap requires identical complete footprint',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'wide',word:'COFFEE',row:0,startColumn:0,span:3},
      {id:'one',word:'A',row:1,startColumn:0,span:1},
      {id:'two',word:'OF',row:1,startColumn:1,span:1},
      {id:'three',word:'TO',row:1,startColumn:2,span:1}
    ]
  });
  assert.equal(areSwapNeighbors(board,'wide','one'),false);
  assert.equal(neighborForDirection(board,'wide','down'),null);
});
```

Use a test helper `boardFromTiles({rows,columns,tiles})` that validates geometry but permits intentionally incomplete fixtures; production `createBoard` continues requiring fully packed rows.

- [ ] **Step 6: Run Task 1 tests GREEN**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Wordy/engine/tile-size.mjs Wordy/engine/board.mjs Wordy/tests/board.test.mjs Wordy/tests/helpers.mjs
git commit -m "refactor(wordy): add discrete microgrid board geometry"
```

---

### Task 2: Tile-ID relationship matching and crossings

**Files:**
- Rewrite: `Wordy/engine/matcher.mjs`
- Modify: `Wordy/tests/matcher.test.mjs`
- Modify: `Wordy/engine/scoring.mjs`
- Modify: `Wordy/tests/scoring.test.mjs`

**Interfaces:**
- Consumes: Task 1 `tilesInRow`, tile footprints.
- Produces:
```js
{
  relationshipId: 'take-a-break',
  orientation: 'vertical',
  tileIds: ['take','a','break'],
  tokens: ['TAKE','A','BREAK']
}
```
- `findMatches(board,bank): Match[]`
- `findCrossings(matches): Array<{tileId,matches}>`

- [ ] **Step 1: Write mixed-span horizontal and vertical tests**

```js
test('horizontal matching follows touching tiles even when spans differ',()=>{
  const board=boardFromTiles({
    rows:1,columns:12,
    tiles:[
      {id:'make',word:'MAKE',row:0,startColumn:0,span:2},
      {id:'a',word:'A',row:0,startColumn:2,span:1},
      {id:'decision',word:'DECISION',row:0,startColumn:3,span:3}
    ]
  });
  const matches=findMatches(board,bank);
  assert.ok(matches.some(m=>m.relationshipId==='make-a-decision'));
});

test('TAKE A BREAK can match vertically with mixed widths sharing one microcolumn',()=>{
  const board=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'take',word:'TAKE',row:0,startColumn:1,span:2},
      {id:'a',word:'A',row:1,startColumn:2,span:1},
      {id:'break',word:'BREAK',row:2,startColumn:1,span:2}
    ]
  });
  const match=findMatches(board,bank).find(m=>m.relationshipId==='take-a-break');
  assert.deepEqual(match.tileIds,['take','a','break']);
  assert.equal(match.orientation,'vertical');
});

test('mixed-width vertical sequence does not match without a common microcolumn',()=>{
  const board=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'take',word:'TAKE',row:0,startColumn:0,span:2},
      {id:'a',word:'A',row:1,startColumn:3,span:1},
      {id:'break',word:'BREAK',row:2,startColumn:0,span:2}
    ]
  });
  assert.equal(findMatches(board,bank).some(m=>m.relationshipId==='take-a-break'),false);
});
```

- [ ] **Step 2: Verify RED**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs Wordy/tests/scoring.test.mjs
```

Expected: FAIL because matcher still addresses `board[row][col]` and matches expose `cells`.

- [ ] **Step 3: Implement horizontal matching**

For every row, sort tiles by `startColumn`. Slide relationship-length windows and require:
```js
function tilesTouch(left,right){
  return left.row===right.row &&
    left.startColumn+left.span===right.startColumn;
}
```

Emit `tileIds`, not matrix cells.

- [ ] **Step 4: Implement vertical matching by shared microcolumn lanes**

For each microcolumn 0–11:
1. collect the one tile occupying that microcolumn in each row;
2. slide relationship-length windows over consecutive rows;
3. compare words;
4. emit the relationship;
5. deduplicate by `relationshipId + orientation + tileIds` because wide tiles appear in multiple lane scans.

Add regression:

```js
test('wide vertical phrase found through two shared lanes is emitted once',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'look',word:'LOOK',row:0,startColumn:4,span:2},
      {id:'after',word:'AFTER',row:1,startColumn:4,span:2}
    ]
  });
  const matches=findMatches(board,lookAfterBank)
    .filter(m=>m.relationshipId==='look-after');
  assert.equal(matches.length,1);
});
```

- [ ] **Step 5: Rewrite crossings and scoring length around tile IDs**

`findCrossings` groups by shared `tileId`, then requires both horizontal and vertical orientations.

Change:
```js
lengthBonus+=lengthBonusFor(match.tileIds?.length??relation.tokens.length,config);
```

- [ ] **Step 6: Run Task 2 tests GREEN**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs Wordy/tests/scoring.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Wordy/engine/matcher.mjs Wordy/engine/scoring.mjs Wordy/tests/matcher.test.mjs Wordy/tests/scoring.test.mjs
git commit -m "refactor(wordy): match relationships on tile footprints"
```

---

### Task 3: Geometric move enumeration, productive boards, and packed level fixtures

**Files:**
- Rewrite: `Wordy/engine/generator.mjs`
- Modify: `Wordy/data/levels.mjs`
- Modify: `Wordy/tests/generator.test.mjs`
- Modify: `Wordy/tests/levels.test.mjs` if present; otherwise create it.

**Interfaces:**
- Consumes: `areSwapNeighbors`, `swapTiles`, `findMatches`.
- Produces:
  - `enumerateSwaps(board): Array<{fromTileId,toTileId}>`
  - `findImmediateScoringMoves(board,bank): Array<{swap,matches,projectedScore,board}>`
  - `hasViablePlay(board,bank): boolean`
  - `createControlledBoard({bank,rows=7,columns=12,rng,minScoringMoves=4,fallbackBoard}): Board`
  - `recoverDeadBoard(...)`

- [ ] **Step 1: Write geometric swap enumeration tests**

```js
test('enumerateSwaps includes every touching horizontal pair and only exact-footprint vertical pairs',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'a',word:'A',row:0,startColumn:0,span:1},
      {id:'look',word:'LOOK',row:0,startColumn:1,span:2},
      {id:'after',word:'AFTER',row:1,startColumn:1,span:2}
    ]
  });
  const keys=enumerateSwaps(board).map(s=>[s.fromTileId,s.toTileId].sort().join('|'));
  assert.ok(keys.includes('a|look'));
  assert.ok(keys.includes('after|look'));
});
```

- [ ] **Step 2: Verify RED**

Run:
```bash
node --test Wordy/tests/generator.test.mjs
```

Expected: FAIL because generator still enumerates matrix cells.

- [ ] **Step 3: Rebuild scoring move discovery with tile IDs**

Match identity becomes:
```js
function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${match.tileIds.join(',')}`;
}
```

For each geometric pair:
- generate `next=swapTiles(board,fromTileId,toTileId)`;
- find matches;
- retain only matches absent before the swap.

- [ ] **Step 4: Set the playable-board floor to four productive moves across three regions**

A controlled board passes only if:
```js
const moves=findImmediateScoringMoves(board,bank);
const regions=new Set(moves.flatMap(move=>{
  const a=tileById(board,move.swap.fromTileId);
  const b=tileById(board,move.swap.toTileId);
  return [Math.floor(a.row/3),Math.floor(b.row/3)];
}));
return moves.length>=4 && regions.size>=3;
```

Tests must reject a board with only one or two productive pairs.

- [ ] **Step 5: Convert authored rows to exact 12-column rows**

Use these exact reusable filler rows:

```js
const COMMON_ROWS=[
  ['COFFEE','NOTES','PROMISE','SCHOOL','A'],              // 3+2+3+3+1 = 12
  ['BROKE','CHOSEN','RAIN','FOOD','HABIT','A'],           // 2+3+2+2+2+1 = 12
  ['WROTE','SEEN','COLD','TIME','TRUTH','OF','A'],        // 2+2+2+2+2+1+1 = 12
  ['DRANK','GONE','EXERCISE','DIFFERENCE','A'],           // 2+2+3+4+1 = 12
  ['GAVE','KNOWN','WORK','IDEA','HOMEWORK','A'],          // 2+2+2+2+3+1 = 12
  ['DROVE','FALLEN','COURSE','ATTENTION']                 // 2+3+3+4 = 12
];
```

Objective rows:
```js
const LOOK_ROW=['LOOK','WENT','AFTER','MONEY','BEGUN','OF','A'];
const MAKE_ROW=['MAKE','WENT','SENSE','MONEY','BEGUN','OF','A'];
const LONG_ROW=['AS','MATTER','A','OF','FACT','TIME','TRUTH'];
```

Cascade fixture rows:
```js
[
  ['TAKE','COFFEE','PROMISE','TIME','OF','A'],
  ['LOOK','AFTER','PROMISE','SCHOOL','OF','A'],
  ['I','A','COFFEE','PROMISE','SCHOOL','A'],
  ['BREAK','COFFEE','PROMISE','TIME','OF','A'],
  ...COMMON_ROWS.slice(2,5)
]
```

Cross fixture rows:
```js
[
  COMMON_ROWS[0],
  COMMON_ROWS[1],
  ['A','PROMISE','TAKE','SCHOOL','FUN','OF'],
  ['MAKE','A','DECISION','TIME','TRUTH','OF','I'],
  ['I','BREAK','COFFEE','NOTES','MONEY','OF','A'],
  COMMON_ROWS[4],
  COMMON_ROWS[5]
]
```

For the cross fixture, swapping `PROMISE` and `TAKE` horizontally places TAKE at columns 1–2; row 3's A occupies column 2; BREAK occupies columns 1–2, producing the vertical `TAKE / A / BREAK` through the horizontal `MAKE A DECISION`.

Replace coordinate-based `fixtureMoves` with:
```js
fixtureMoveWords:[['WENT','AFTER']]
```
or the exact word pair appropriate to the level; fixture metadata is test-only and is resolved to tile IDs after board creation.

- [ ] **Step 6: Add level validation tests**

```js
test('every authored Wordy level packs all seven rows to 12 columns',()=>{
  for(const level of LEVELS){
    assert.doesNotThrow(()=>createBoard(level.boardRows,{columns:12}));
  }
});

test('cross fixture can create MAKE A DECISION crossed by TAKE A BREAK in one swap',()=>{
  const level=getLevel('F');
  const board=createBoard(level.boardRows,{columns:12});
  const promise=board.tiles.find(t=>t.word==='PROMISE'&&t.row===2);
  const take=board.tiles.find(t=>t.word==='TAKE'&&t.row===2);
  const next=swapTiles(board,promise.id,take.id);
  const ids=new Set(findMatches(next,bank).map(m=>m.relationshipId));
  assert.ok(ids.has('make-a-decision'));
  assert.ok(ids.has('take-a-break'));
});
```

- [ ] **Step 7: Run Task 3 tests GREEN**

Run:
```bash
node --test Wordy/tests/generator.test.mjs Wordy/tests/levels.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add Wordy/engine/generator.mjs Wordy/data/levels.mjs Wordy/tests/generator.test.mjs Wordy/tests/levels.test.mjs
git commit -m "refactor(wordy): generate productive packed microgrid boards"
```

---

### Task 4: Candy-style attempt / accept / rebound semantics in the controller

**Files:**
- Modify: `Wordy/engine/controller.mjs`
- Modify: `Wordy/engine/review.mjs`
- Modify: `Wordy/tests/controller.test.mjs`
- Modify: `Wordy/tests/review.test.mjs` if present; otherwise create it.

**Interfaces:**
- Public controller method changes from cell-based `swap(from,to)` to:
```js
attemptSwap(fromTileId,toTileId)
// -> {status:'invalid'|'rebound'|'accepted',fromTileId,toTileId}
```
- `status:'invalid'`: not geometric neighbors; no animation contract required.
- `status:'rebound'`: legal geometric pair but no new relationship; canonical state unchanged.
- `status:'accepted'`: swap committed; one move consumed; state emitted.
- Review snapshots store `boardSnapshot: cloneBoard(board)` and `suggestedSwap:{fromTileId,toTileId}`.

- [ ] **Step 1: Write rebound-state tests**

```js
test('geometrically valid non-scoring attempt rebounds without changing canonical state',()=>{
  const {game}=makeGame();
  const before=game.state();
  const [left,right]=findKnownNonScoringNeighborPair(before.board);
  const result=game.attemptSwap(left.id,right.id);
  assert.equal(result.status,'rebound');
  const after=game.state();
  assert.equal(after.movesLeft,before.movesLeft);
  assert.equal(boardKey(after.board),boardKey(before.board));
});

test('rebound preserves an existing ready relationship exactly',()=>{
  const {game}=makeGame({ready:true});
  const before=game.state();
  const pair=findKnownNonScoringNeighborPair(before.board);
  assert.equal(game.attemptSwap(pair[0].id,pair[1].id).status,'rebound');
  const after=game.state();
  assert.deepEqual(
    after.readyMatches.map(m=>m.relationshipId),
    before.readyMatches.map(m=>m.relationshipId)
  );
  assert.equal(after.score,before.score);
});
```

- [ ] **Step 2: Verify RED**

Run:
```bash
node --test Wordy/tests/controller.test.mjs
```

Expected: FAIL because the controller currently accepts cell objects and returns booleans.

- [ ] **Step 3: Implement `attemptSwap`**

Algorithm:
1. reject unknown/non-neighbor tile IDs with `status:'invalid'`;
2. enumerate productive scoring moves;
3. find the matching unordered tile-ID pair;
4. if none, record optional `swap-rebound` telemetry and return without changing state;
5. if found, capture missed high-value opportunity, commit `chosenMove.board`, decrement move once, refresh ready/cross telemetry, emit, return `accepted`.

Pair comparison:
```js
function sameSwap(a,b){
  return a && b && (
    (a.fromTileId===b.fromTileId && a.toTileId===b.toTileId) ||
    (a.fromTileId===b.toTileId && a.toTileId===b.fromTileId)
  );
}
```

- [ ] **Step 4: Move review snapshots to tile geometry**

Replace row-matrix snapshots with:
```js
{
  boardSnapshot: cloneBoard(board),
  relationshipId,
  suggestedSwap:{fromTileId,toTileId},
  projectedScore
}
```

A rebound attempt must never generate a missed-opportunity record.

- [ ] **Step 5: Run Task 4 tests GREEN**

Run:
```bash
node --test Wordy/tests/controller.test.mjs Wordy/tests/review.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add Wordy/engine/controller.mjs Wordy/engine/review.mjs Wordy/tests/controller.test.mjs Wordy/tests/review.test.mjs
git commit -m "feat(wordy): add Candy-style swap rebound semantics"
```

---

### Task 5: Rigid-block gravity and exact cavity refill

**Files:**
- Modify: `Wordy/engine/board.mjs`
- Rewrite: `Wordy/engine/resolution.mjs`
- Modify: `Wordy/engine/controller.mjs`
- Modify: `Wordy/tests/board.test.mjs`
- Modify: `Wordy/tests/resolution.test.mjs`

**Interfaces:**
- Consumes: Task 1 occupancy and removal.
- Produces:
  - `settleGravity(board): Board`
  - `partitionRun(width): number[]`
  - `refillEmptyRuns(board,refillTile): Board`
- Refill callback:
```js
refillTile({span,row,startColumn})
// must return {id,word} where spanForWord(word)===span
```

- [ ] **Step 1: Write rigid gravity regressions**

```js
test('span-3 tile falls only when all three destination microcells are empty',()=>{
  const blocked=boardFromTiles({
    rows:3,columns:12,
    tiles:[
      {id:'wide',word:'COFFEE',row:0,startColumn:0,span:3},
      {id:'support',word:'A',row:1,startColumn:1,span:1}
    ]
  });
  assert.equal(tileById(settleGravity(blocked),'wide').row,0);

  const clear=removeTiles(blocked,['support']);
  assert.equal(tileById(settleGravity(clear),'wide').row,2);
});
```

- [ ] **Step 2: Write cavity-refill regression**

```js
test('refill closes an enclosed horizontal cavity left by rigid gravity',()=>{
  const board=boardFromTiles({
    rows:2,columns:12,
    tiles:[
      {id:'wide',word:'COFFEE',row:0,startColumn:0,span:3},
      {id:'support',word:'A',row:1,startColumn:1,span:1}
    ]
  });
  const settled=settleGravity(board);
  const filled=refillEmptyRuns(settled,({span,row,startColumn})=>({
    id:`r-${row}-${startColumn}`,
    word:{1:'OF',2:'LOOK',3:'COFFEE',4:'ATTENTION'}[span]
  }));
  const map=occupancyMap(filled);
  assert.ok(map.every(row=>row.every(Boolean)));
});
```

- [ ] **Step 3: Verify RED**

Run:
```bash
node --test Wordy/tests/board.test.mjs Wordy/tests/resolution.test.mjs
```

Expected: FAIL because current gravity collapses independent matrix columns and cannot preserve rigid spans.

- [ ] **Step 4: Implement repeated rigid gravity**

One pass iterates tiles bottom-up. A tile may move from row `r` to `r+1` only if all destination microcells are empty when the tile's current footprint is temporarily ignored. Repeat passes until no tile moved.

- [ ] **Step 5: Implement exact run partitioning**

Use:
```js
export function partitionRun(width){
  if(!Number.isInteger(width)||width<1)throw new Error('run width must be positive');
  const spans=[];
  let remaining=width;
  while(remaining>0){
    if(remaining===1){ spans.push(1); break; }
    if(remaining===2){ spans.push(2); break; }
    if(remaining===3){ spans.push(3); break; }
    if(remaining===5){ spans.push(3,2); break; }
    spans.push(4);
    remaining-=4;
  }
  return spans;
}
```

This avoids unnecessary span-1 fillers except for a true one-cell run.

- [ ] **Step 6: Rebuild resolution around tile IDs**

For each cascade generation:
1. `findMatches(current,bank)`;
2. score;
3. collect unique `tileIds`;
4. `removeTiles`;
5. `settleGravity`;
6. `refillEmptyRuns`;
7. detect next matches.

Keep the existing `CascadeLimitError` behavior.

- [ ] **Step 7: Make controller refill span-aware**

`chooseRefillWord(span)` filters contextual bank words through `spanForWord(word)===span`; if empty, use stable fillers:
```js
const FALLBACK_BY_SPAN={
  1:'OF',
  2:'LOOK',
  3:'COFFEE',
  4:'ATTENTION'
};
```

Tests assert returned words always match the requested span.

- [ ] **Step 8: Run Task 5 tests GREEN**

Run:
```bash
node --test Wordy/tests/board.test.mjs Wordy/tests/resolution.test.mjs Wordy/tests/controller.test.mjs
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add Wordy/engine/board.mjs Wordy/engine/resolution.mjs Wordy/engine/controller.mjs Wordy/tests/board.test.mjs Wordy/tests/resolution.test.mjs Wordy/tests/controller.test.mjs
git commit -m "feat(wordy): add rigid gravity and exact-run refill"
```

---

### Task 6: 12-column renderer and tile-ID input

**Files:**
- Rewrite: `Wordy/ui/render.mjs`
- Rewrite: `Wordy/ui/input.mjs`
- Modify: `Wordy/styles.css`
- Modify: `Wordy/tests/input.test.mjs`
- Modify: `Wordy/tests/ui-contract.test.mjs`

**Interfaces:**
- Renderer reads `state.board.tiles`.
- Each DOM tile exposes:
  - `data-tile-id`
  - `data-row`
  - `data-start-column`
  - `data-span`
- Input:
```js
bindBoardInput(boardElement,{
  getNeighbor:(tileId,direction)=>tileIdOrNull,
  areNeighbors:(aId,bId)=>boolean,
  onSwap:(fromTileId,toTileId)=>void
})
```

- [ ] **Step 1: Write CSS-grid contract tests**

```js
test('board renders one 12-column by 7-row CSS grid',()=>{
  assert.match(css,/grid-template-columns:\s*repeat\(12/);
  assert.match(css,/grid-template-rows:\s*repeat\(7/);
  assert.doesNotMatch(css,/\.wordy-row\{/);
  assert.doesNotMatch(css,/\.wordy-tile\.size-xs/);
});

test('renderGame places tiles from logical start/span coordinates',()=>{
  const root=new FakeDocument();
  renderGame(root,{
    levelId:'T',levelTitle:'Grid',movesLeft:5,score:0,instruction:'Test',
    phase:'playing',eventLabel:'',
    board:{
      rows:7,columns:12,
      tiles:[{id:'attention',word:'ATTENTION',row:0,startColumn:3,span:4}]
    },
    readyMatches:[]
  });
  const tile=root.querySelector('#wordyBoard').children[0];
  assert.equal(tile.dataset.tileId,'attention');
  assert.equal(tile.dataset.startColumn,'3');
  assert.equal(tile.dataset.span,'4');
  assert.equal(tile.style.gridColumn,'4 / span 4');
});
```

- [ ] **Step 2: Write tile-ID gesture tests**

```js
test('swipe resolves the actual geometric neighbor before requesting a swap',()=>{
  const board=fakeBoard();
  const swaps=[];
  bindBoardInput(board,{
    getNeighbor:(id,direction)=>id==='wide'&&direction==='right'?'small':null,
    areNeighbors:(a,b)=>a==='wide'&&b==='small',
    onSwap:(from,to)=>swaps.push([from,to])
  });
  const tile=fakeTile('wide');
  board.dispatch('pointerdown',{target:tile,pointerId:1,clientX:0,clientY:0});
  board.dispatch('pointerup',{target:tile,pointerId:1,clientX:40,clientY:0});
  assert.deepEqual(swaps,[['wide','small']]);
});
```

- [ ] **Step 3: Verify RED**

Run:
```bash
node --test Wordy/tests/input.test.mjs Wordy/tests/ui-contract.test.mjs
```

Expected: FAIL because UI still emits matrix cells and renders flex rows.

- [ ] **Step 4: Render the canonical microgrid directly**

```js
button.dataset.tileId=tile.id;
button.dataset.row=String(tile.row);
button.dataset.startColumn=String(tile.startColumn);
button.dataset.span=String(tile.span);
button.style.gridRow=String(tile.row+1);
button.style.gridColumn=`${tile.startColumn+1} / span ${tile.span}`;
```

Ready/cross highlighting maps matches by `tileIds`.

- [ ] **Step 5: Replace flex sizing CSS**

Core board CSS:
```css
.wordy-board{
  width:min(96vw,720px);
  height:min(70dvh,680px);
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  grid-template-rows:repeat(7,minmax(0,1fr));
  gap:clamp(4px,.8vw,7px);
  touch-action:none;
  user-select:none;
}
.wordy-tile{
  min-width:0;
  min-height:0;
  white-space:nowrap;
  overflow:hidden;
  font-size:clamp(13px,2.7vw,19px);
}
```

Remove `.wordy-row` and `.size-xs/.size-sm/.size-md/.size-lg/.size-xl`.

- [ ] **Step 6: Run Task 6 tests GREEN**

Run:
```bash
node --test Wordy/tests/input.test.mjs Wordy/tests/ui-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Wordy/ui/render.mjs Wordy/ui/input.mjs Wordy/styles.css Wordy/tests/input.test.mjs Wordy/tests/ui-contract.test.mjs
git commit -m "refactor(wordy): render and control the discrete word grid"
```

---

### Task 7: Accepted-swap FLIP and rejected-swap rebound animation

**Files:**
- Create: `Wordy/ui/swap-animation.mjs`
- Modify: `Wordy/app.mjs`
- Modify: `Wordy/styles.css`
- Create: `Wordy/tests/swap-animation.test.mjs`
- Modify: `Wordy/tests/local-preview.test.mjs` only if app-contract assertions reference the old swap API.

**Interfaces:**
- Consumes controller `attemptSwap`.
- Produces:
  - `captureTileRects(boardElement,tileIds): Map<string,Rect>`
  - `animateAcceptedSwap(boardElement,beforeRects,tileIds,{duration=150}={}): Promise<void>`
  - `animateRejectedSwap(boardElement,tileIds,{duration=110}={}): Promise<void>`
- If DOM `.animate` is unavailable, helpers resolve immediately after applying no transforms; rules still work.

- [ ] **Step 1: Write pure animation-geometry tests**

```js
test('translation from old to new rect is the inverse FLIP delta',()=>{
  assert.deepEqual(
    translationBetween(
      {left:10,top:20,width:40,height:40},
      {left:70,top:20,width:80,height:40}
    ),
    {x:-60,y:0}
  );
});
```

- [ ] **Step 2: Verify RED**

Run:
```bash
node --test Wordy/tests/swap-animation.test.mjs
```

Expected: FAIL because animation helpers do not exist.

- [ ] **Step 3: Implement animation helpers**

Accepted swap:
1. app captures old tile rects;
2. `controller.attemptSwap` commits and synchronous subscription re-renders;
3. helper locates same tile IDs at new coordinates;
4. applies inverse FLIP transforms and animates to zero.

Rejected swap:
1. canonical DOM never changes;
2. compute the two tile rect deltas;
3. animate each tile to the other position;
4. animate both back.

- [ ] **Step 4: Lock interaction during motion**

In `app.mjs`:
```js
let inputLocked=false;

async function handleSwap(fromTileId,toTileId){
  if(inputLocked||timelinePlaying)return;
  inputLocked=true;
  try{
    const before=captureTileRects(boardElement,[fromTileId,toTileId]);
    const result=controller.attemptSwap(fromTileId,toTileId);
    if(result.status==='accepted'){
      await animateAcceptedSwap(boardElement,before,[fromTileId,toTileId]);
    }else if(result.status==='rebound'){
      await animateRejectedSwap(boardElement,[fromTileId,toTileId]);
    }
  }finally{
    inputLocked=false;
  }
}
```

POP and additional swap gestures return immediately while `inputLocked`.

- [ ] **Step 5: Add app contract regression**

Assert `app.mjs` contains `inputLocked`, calls `attemptSwap`, and branches on both `accepted` and `rebound`.

- [ ] **Step 6: Run Task 7 tests GREEN**

Run:
```bash
node --test Wordy/tests/swap-animation.test.mjs Wordy/tests/input.test.mjs Wordy/tests/local-preview.test.mjs
node --check Wordy/app.mjs
```

Expected: all PASS; syntax check exits 0.

- [ ] **Step 7: Commit**

```bash
git add Wordy/ui/swap-animation.mjs Wordy/app.mjs Wordy/styles.css Wordy/tests/swap-animation.test.mjs Wordy/tests/local-preview.test.mjs
git commit -m "feat(wordy): animate accepted swaps and Candy-style rebounds"
```

---

### Task 8: Tile-centric review replay, resolution events, and regression cleanup

**Files:**
- Modify: `Wordy/ui/render.mjs`
- Modify: `Wordy/engine/review.mjs`
- Modify: `Wordy/engine/resolution-events.mjs` only if match-shape assumptions remain.
- Modify: `Wordy/tests/ui-contract.test.mjs`
- Modify: `Wordy/tests/review.test.mjs`
- Modify: `Wordy/tests/resolution-events.test.mjs`
- Modify: any remaining Wordy tests that access `board[row][col]`, `match.cells`, `from.row/col`, or 5-column CSS.

**Interfaces:**
- Missed review item:
```js
{
  boardSnapshot:{rows,columns,tiles},
  relationshipId,
  suggestedSwap:{fromTileId,toTileId},
  projectedScore,
  relationship
}
```

- [ ] **Step 1: Write tile-centric replay test**

```js
test('missed-opportunity replay uses the saved 12-column tile geometry',()=>{
  const root=new FakeDocument();
  renderResult(root,{
    newLearning:[],
    missed:[{
      relationshipId:'look-after',
      projectedScore:170,
      boardSnapshot:{
        rows:7,columns:12,
        tiles:[
          {id:'look',word:'LOOK',row:0,startColumn:0,span:2},
          {id:'x',word:'WENT',row:0,startColumn:2,span:2},
          {id:'after',word:'AFTER',row:0,startColumn:4,span:2}
        ]
      },
      suggestedSwap:{fromTileId:'x',toTileId:'after'},
      relationship:{tokens:['LOOK','AFTER'],meaning:'take care of'}
    }]
  });
  const suggested=root.querySelector('#replayBoard').children
    .filter(tile=>tile.classList.contains('is-suggested'));
  assert.equal(suggested.length,2);
});
```

- [ ] **Step 2: Verify RED**

Run:
```bash
node --test Wordy/tests/review.test.mjs Wordy/tests/ui-contract.test.mjs Wordy/tests/resolution-events.test.mjs
```

Expected: FAIL on old row/cell snapshots.

- [ ] **Step 3: Render replay with the same microgrid coordinates**

Replay remains miniature but uses:
```css
.replay-board{
  display:grid;
  grid-template-columns:repeat(12,minmax(0,1fr));
  grid-template-rows:repeat(7,minmax(0,1fr));
}
```

Suggested tiles are found by tile ID.

- [ ] **Step 4: Sweep stale matrix assumptions**

Search:
```bash
grep -R "board\[" Wordy/engine Wordy/ui Wordy/tests
grep -R "\.cells" Wordy/engine Wordy/ui Wordy/tests
grep -R "col:" Wordy/tests
grep -R "repeat(5" Wordy
```

Every remaining occurrence must be either intentionally unrelated to canonical board geometry or migrated.

- [ ] **Step 5: Run the complete Wordy suite**

Run:
```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Expected: all Wordy tests PASS, syntax check 0.

- [ ] **Step 6: Commit**

```bash
git add Wordy
git commit -m "test(wordy): complete tile-centric regression migration"
```

---

### Task 9: End-to-end gameplay validation and documentation handoff

**Files:**
- Modify: `docs/superpowers/handoffs/WORDY-CURRENT.md`
- Modify: `docs/superpowers/progress/2026-09-20-wordy-validation-prototype.md` or create a new progress addendum if the old ledger is closed.
- Test: complete Wordy suite.

**Interfaces:**
- No new runtime interface.
- Establishes the new architecture as the only authoritative implementation state.

- [ ] **Step 1: Add an end-to-end integration test**

The integration test must execute:
1. load level A;
2. resolve the two target tile IDs for `WENT` and `AFTER`;
3. verify a known unrelated geometric pair returns `rebound`;
4. verify the target pair returns `accepted`;
5. verify exactly one move is spent;
6. verify `LOOK AFTER` is ready;
7. POP;
8. verify removal/gravity/refill returns a fully occupied 12×7 board;
9. verify the round remains playable or finishes by objective, never in an invalid geometry state.

- [ ] **Step 2: Run full verification**

Run:
```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Also programmatically assert:
- every stable board has occupancy for all 84 microcells;
- every tile span is 1–4;
- no overlaps;
- no out-of-bounds tiles;
- every generated board exposes at least four productive swaps across at least three regions.

- [ ] **Step 3: Update handoff and delete stale guidance**

The handoff must state:
- discrete 12×7 architecture is authoritative;
- no free-flex rows;
- all geometric swaps are attemptable;
- nonproductive valid swaps rebound;
- vertical swap = exact footprint;
- vertical match = common microcolumn;
- rigid gravity + cavity refill;
- githack is forbidden for this project;
- user reviews Wordy through the existing Classroom Online Games site;
- development source remains `feature/wordy-game`.

Remove/mark superseded any handoff text that says:
- only productive swaps are interactable;
- Wordy is local-only;
- githack preview branch is the preview path.

- [ ] **Step 4: Commit documentation**

```bash
git add docs/superpowers/handoffs/WORDY-CURRENT.md docs/superpowers/progress
git commit -m "docs(wordy): hand off discrete-grid rebuild"
```

---

### Task 10: Publish the verified runtime to the existing Classroom Online Games site

**Files on `main`:**
- Sync only verified Wordy runtime files:
  - `Wordy/index.html`
  - `Wordy/app.mjs`
  - `Wordy/styles.css`
  - `Wordy/data/**`
  - `Wordy/engine/**`
  - `Wordy/ui/**`
- Keep the existing COG landing-page Wordy card.
- Keep the existing Cloudflare build inclusion of `Wordy`.

**Interfaces:**
- Public review route remains exactly:
  - `https://classroom-online-games.pages.dev/Wordy/`

- [ ] **Step 1: Verify feature runtime one final time before promotion**

Run:
```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Expected: PASS / exit 0.

- [ ] **Step 2: Copy only the verified runtime blobs from `feature/wordy-game` to `main`**

Do not merge unrelated feature-branch docs/devcontainer/history into `main`. Create one atomic main commit whose tree changes only the Wordy runtime files required by the site.

- [ ] **Step 3: Wait for the existing COG Cloudflare workflow**

Require:
- workflow `Deploy Classroom Online Games to Cloudflare Pages`;
- head SHA equals the promotion commit;
- conclusion `success`.

- [ ] **Step 4: Verify the canonical COG route**

Check the deployment log confirms project:
```text
classroom-online-games
```

User-facing route remains:
```text
https://classroom-online-games.pages.dev/Wordy/
```

Do not introduce or mention githack, Vercel, Codespaces, or alternate mirrors.

- [ ] **Step 5: Record the production commit in the handoff**

Include feature HEAD, promotion commit, test count, workflow run ID, and successful deployment confirmation.

---

## Self-Review Notes

- **Spec coverage:** Tasks 1–10 cover all approved geometry, swap, matching, gravity/refill, generation, UI, replay, telemetry compatibility, and COG publication requirements.
- **Geometry correction incorporated:** vertical matching uses a shared microcolumn, allowing mixed-width phrases; only vertical swapping requires identical footprints.
- **Cavity correction incorporated:** rigid gravity may leave holes; exact-run refill closes every remaining run without pretending blocks pass through occupied geometry.
- **Type consistency:** all runtime swap interfaces use tile IDs; matches use `tileIds`; review snapshots use the canonical board object.
- **Review Focus coverage:** all five high-risk cases have explicit tests in Tasks 2, 4, and 5.
- **No parallel geometry:** CSS, input, matcher, gravity, and replay all consume the same `row/startColumn/span` board model.
