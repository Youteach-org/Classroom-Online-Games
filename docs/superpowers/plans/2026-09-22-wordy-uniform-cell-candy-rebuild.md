# Wordy Uniform-Cell Candy Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Wordy's variable-span microgrid with a true equal-cell Candy-style board and relationship-aware falling/refill so swaps, gravity, and generated opportunities feel predictable and linguistically useful.

**Architecture:** The canonical board becomes a rectangular `rows × columns` grid where each physical word tile occupies exactly one `{row,column}` cell. Movement, matching, gravity, refill, generation, UI rendering, and replay all derive from that single geometry. Refill and initial generation use the approved relationship bank plus local-placement scoring rather than word length/span compatibility.

**Tech Stack:** Vanilla JavaScript ES modules, Node.js `node:test`, DOM/CSS Grid, Web Animations API, GitHub branch `feature/wordy-game`, existing Cloudflare Pages production route after separate publication approval.

**Spec:** `docs/superpowers/specs/2026-09-22-wordy-uniform-cell-candy-architecture.md`

## Global Constraints

- Every playable word occupies exactly one logical board cell.
- Word length affects typography only; it never changes board physics.
- Swaps are orthogonal, adjacent, two-tile exchanges.
- Nonproductive swaps animate forward and rebound without mutating canonical state or consuming a move.
- Productive swaps remain and consume exactly one move.
- Horizontal matches use consecutive columns in one row.
- Vertical matches use consecutive rows in one column.
- Global POP resolves all currently ready relationships and costs no extra move.
- Gravity compacts surviving tiles vertically within each column only.
- Refill creates tiles only in top-of-column empty cells.
- Runtime relationship validity comes only from the approved relationship bank; no live LLM.
- Cascades created by gravity/refill auto-resolve until stable.
- Do not publish to `main` or production as part of implementation; publication is a separate explicit step.

## Review Focus

1. **Long words in equal cells:** words such as `ATTENTION` must remain readable without changing geometry; Task 5 adds typography-contract tests.
2. **No hidden holes after gravity:** every stable column must be bottom-packed with empty cells only above occupied cells; Task 3 adds a column-integrity regression.
3. **Refill usefulness without rigging:** local candidate scoring must prefer useful relation tokens but still permit distractors; Task 4 adds deterministic weighted-selection tests.
4. **Existing ready relations during failed swaps:** rebound must preserve all prior ready matches, score, moves, and coordinates; Task 2 adds regression coverage.
5. **Generated-board quality:** boards must have a minimum productive-swap floor distributed across multiple rows/columns and no accidental starting match unless explicitly allowed; Task 4 adds generation invariants.

---

### Task 1: Replace span geometry with uniform-cell board authority

**Files:**
- Rewrite: `Wordy/engine/board.mjs`
- Modify: `Wordy/tests/board.test.mjs`
- Modify: `Wordy/tests/helpers.mjs`
- Delete after migration: `Wordy/engine/tile-size.mjs`

**Interfaces:**
- Produces:
  - `createBoard(wordRows, {columns?}) -> {rows,columns,tiles[]}`
  - tile shape `{id,word,row,column}`
  - `tileById(board,id)`
  - `tilesInRow(board,row)`
  - `neighborForDirection(board,tileId,direction)`
  - `areSwapNeighbors(board,aId,bId)`
  - `swapTiles(board,aId,bId)`
  - `removeTiles(board,tileIds)`
  - `settleGravity(board)`
  - `emptyCellsByColumn(board)`
  - `boardKey(board)`

- [ ] **Step 1: Rewrite board tests to describe one-cell geometry**

```js
test('every tile occupies one row/column cell',()=>{
  const board=createBoard([
    ['LOOK','AFTER','GO'],
    ['MAKE','A','DECISION']
  ]);
  assert.deepEqual(
    board.tiles.map(({word,row,column})=>({word,row,column})),
    [
      {word:'LOOK',row:0,column:0},
      {word:'AFTER',row:0,column:1},
      {word:'GO',row:0,column:2},
      {word:'MAKE',row:1,column:0},
      {word:'A',row:1,column:1},
      {word:'DECISION',row:1,column:2}
    ]
  );
  assert.ok(board.tiles.every(tile=>!('span' in tile)&&!('startColumn' in tile)));
});

test('interior tile has four conventional neighbors',()=>{
  const board=createBoard([
    ['A','B','C'],
    ['D','E','F'],
    ['G','H','I']
  ]);
  const e=board.tiles.find(tile=>tile.word==='E');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'left')).word,'D');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'right')).word,'F');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'up')).word,'B');
  assert.equal(tileById(board,neighborForDirection(board,e.id,'down')).word,'H');
});

test('gravity bottom-packs each column without lateral movement',()=>{
  const board=createBoard([
    ['A','B'],
    ['C','D'],
    ['E','F']
  ]);
  const removed=removeTiles(board,[
    board.tiles.find(t=>t.word==='C').id,
    board.tiles.find(t=>t.word==='F').id
  ]);
  const settled=settleGravity(removed);
  assert.deepEqual(
    settled.tiles.filter(t=>t.column===0).sort((a,b)=>a.row-b.row).map(t=>[t.word,t.row]),
    [['A',1],['E',2]]
  );
  assert.deepEqual(
    settled.tiles.filter(t=>t.column===1).sort((a,b)=>a.row-b.row).map(t=>[t.word,t.row]),
    [['B',1],['D',2]]
  );
});
```

- [ ] **Step 2: Run board tests and confirm they fail against span geometry**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: failures referencing `startColumn/span`, vertical-neighbor restrictions, or rigid-block gravity.

- [ ] **Step 3: Implement the uniform-cell board model**

Core rules:

```js
function rawTileById(board,id){
  return board.tiles.find(tile=>tile.id===id)??null;
}

export function areSwapNeighbors(board,aId,bId){
  const a=rawTileById(board,aId);
  const b=rawTileById(board,bId);
  if(!a||!b||a.id===b.id)return false;
  return Math.abs(a.row-b.row)+Math.abs(a.column-b.column)===1;
}

export function swapTiles(board,aId,bId){
  if(!areSwapNeighbors(board,aId,bId))throw new Error('invalid non-adjacent swap');
  const next=cloneBoard(board);
  const a=rawTileById(next,aId);
  const b=rawTileById(next,bId);
  [a.row,b.row]=[b.row,a.row];
  [a.column,b.column]=[b.column,a.column];
  validateBoard(next);
  return next;
}

export function settleGravity(board){
  const next=cloneBoard(board);
  for(let column=0;column<next.columns;column++){
    const tiles=next.tiles
      .filter(tile=>tile.column===column)
      .sort((a,b)=>b.row-a.row);
    let targetRow=next.rows-1;
    for(const tile of tiles)tile.row=targetRow--;
  }
  validateBoard(next,{allowHoles:true});
  return next;
}
```

`validateBoard` must enforce exactly one tile per occupied `row,column` pair and no coordinate outside bounds.

- [ ] **Step 4: Run board tests**

Run:
```bash
node --test Wordy/tests/board.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/board.mjs Wordy/tests/board.test.mjs Wordy/tests/helpers.mjs
git commit -m "refactor(wordy): use uniform cell board geometry"
```

---

### Task 2: Rebuild matching and Candy-style swap semantics on row/column cells

**Files:**
- Rewrite: `Wordy/engine/matcher.mjs`
- Modify: `Wordy/engine/controller.mjs`
- Modify: `Wordy/engine/review.mjs`
- Modify: `Wordy/tests/matcher.test.mjs`
- Modify: `Wordy/tests/controller.test.mjs`
- Modify: `Wordy/tests/review-telemetry.test.mjs`

**Interfaces:**
- Consumes Task 1 board tile shape.
- Produces:
  - `findMatches(board,bank)`
  - `findCrossings(matches)`
  - controller `attemptSwap(fromTileId,toTileId) -> {status:'invalid'|'rebound'|'accepted',...}`

- [ ] **Step 1: Add failing horizontal/vertical/crossing tests**

```js
test('horizontal match uses consecutive columns',()=>{
  const board=createBoard([
    ['LOOK','AFTER','X'],
    ['X','X','X']
  ]);
  assert.ok(findMatches(board,bank).some(match=>
    match.relationshipId==='phrasal.look-after' &&
    match.orientation==='horizontal'
  ));
});

test('vertical match uses one exact column',()=>{
  const board=createBoard([
    ['TAKE','X'],
    ['A','X'],
    ['BREAK','X']
  ]);
  assert.ok(findMatches(board,bank).some(match=>
    match.tokens.join(' ')==='TAKE A BREAK' &&
    match.orientation==='vertical'
  ));
});
```

- [ ] **Step 2: Add failed-swap preservation regression**

```js
test('rebound preserves existing ready state and coordinates',()=>{
  const game=createGameController({bank,levels:[fixtureLevelWithReadyMatch]});
  const before=game.state();
  const result=game.attemptSwap(nonProductiveA,nonProductiveB);
  const after=game.state();
  assert.equal(result.status,'rebound');
  assert.equal(after.movesLeft,before.movesLeft);
  assert.equal(after.score,before.score);
  assert.deepEqual(after.readyMatches,before.readyMatches);
  assert.deepEqual(after.board,before.board);
});
```

- [ ] **Step 3: Run focused tests and confirm failure**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs Wordy/tests/controller.test.mjs Wordy/tests/review-telemetry.test.mjs
```

Expected: failures caused by span/microcolumn matching and old coordinate snapshots.

- [ ] **Step 4: Implement row/column matching**

Matcher strategy:
- build a lookup `cellKey(row,column) -> tile`;
- for each relationship token sequence, scan every possible horizontal start and vertical start;
- accept only exact token order;
- return physical `tileIds`;
- dedupe by `relationshipId|orientation|tileIds.join(',')`.

Crossings remain intersection of physical tile IDs.

- [ ] **Step 5: Adapt controller/review coordinate snapshots**

Replace any `startColumn/span` references with `column`. Rebound continues to compare pre/post matches but must never write the temporary swapped board into canonical state when no new relationship is created.

- [ ] **Step 6: Run focused tests**

Run:
```bash
node --test Wordy/tests/matcher.test.mjs Wordy/tests/controller.test.mjs Wordy/tests/review-telemetry.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Wordy/engine/matcher.mjs Wordy/engine/controller.mjs Wordy/engine/review.mjs Wordy/tests/matcher.test.mjs Wordy/tests/controller.test.mjs Wordy/tests/review-telemetry.test.mjs
git commit -m "refactor(wordy): match and swap on uniform cells"
```

---

### Task 3: Replace rigid gravity and cavity refill with column fall/refill

**Files:**
- Rewrite: `Wordy/engine/resolution.mjs`
- Modify: `Wordy/engine/resolution-events.mjs`
- Modify: `Wordy/tests/resolution.test.mjs`
- Modify: `Wordy/tests/timeline.test.mjs`

**Interfaces:**
- Consumes Task 1 `settleGravity`.
- Produces refill callback request:
  - `refillTile({row,column,board,cascadeDepth}) -> {id,word}`

- [ ] **Step 1: Add a failing column-refill test**

```js
test('POP leaves holes only at top and refills from top',()=>{
  const result=resolvePlayerActivation({
    board,
    bank,
    discoveredIds:new Set(),
    refillTile:({row,column})=>({id:`new-${row}-${column}`,word:'SAFE'})
  });
  for(let column=0;column<result.board.columns;column++){
    const rows=result.board.tiles
      .filter(tile=>tile.column===column)
      .map(tile=>tile.row)
      .sort((a,b)=>a-b);
    assert.deepEqual(rows,[0,1,2,3,4,5,6]);
  }
});
```

Add a regression that no tile changes column during gravity.

- [ ] **Step 2: Run resolution tests and confirm failure**

Run:
```bash
node --test Wordy/tests/resolution.test.mjs Wordy/tests/timeline.test.mjs
```

Expected: failures around `emptyRuns/partitionRun/span` refill behavior.

- [ ] **Step 3: Implement column refill**

After removal:
1. call `settleGravity(board)`;
2. for each column, compute missing count;
3. create new cells in rows `0..missing-1`;
4. ask `refillTile` for the word/id at each new cell;
5. validate full occupancy;
6. detect cascade matches;
7. auto-resolve while cascade matches exist, bounded by existing cascade-limit safety.

No horizontal cavity partitioning remains.

- [ ] **Step 4: Run resolution/timeline tests**

Run:
```bash
node --test Wordy/tests/resolution.test.mjs Wordy/tests/timeline.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Wordy/engine/resolution.mjs Wordy/engine/resolution-events.mjs Wordy/tests/resolution.test.mjs Wordy/tests/timeline.test.mjs
git commit -m "refactor(wordy): use column gravity and top refill"
```

---

### Task 4: Build relationship-aware generation and refill

**Files:**
- Rewrite: `Wordy/engine/generator.mjs`
- Create: `Wordy/engine/refill.mjs`
- Modify: `Wordy/engine/controller.mjs`
- Modify: `Wordy/data/levels.mjs`
- Modify: `Wordy/tests/generator.test.mjs`
- Create: `Wordy/tests/refill.test.mjs`
- Modify: `Wordy/tests/levels.test.mjs`

**Interfaces:**
- Produces:
  - `enumerateSwaps(board)`
  - `findImmediateScoringMoves(board,bank)`
  - `createControlledBoard({bank,rows,columns,rng,minScoringMoves,minProductiveRows,minProductiveColumns,allowStartingMatches})`
  - `buildRelationshipBag(bank,{relationshipIds?,categoryWeights?})`
  - `scoreRefillCandidate({word,row,column,board,bank})`
  - `chooseRefillWord({row,column,board,bank,bag,rng,profile})`

- [ ] **Step 1: Add generation invariants**

```js
test('generated board is full, match-free, and has distributed productive swaps',()=>{
  const board=createControlledBoard({
    bank,rows:7,columns:7,rng:seededRng(42),
    minScoringMoves:4,minProductiveRows:3,minProductiveColumns:3,
    allowStartingMatches:false
  });
  assert.equal(board.tiles.length,49);
  assert.equal(findMatches(board,bank).length,0);
  const moves=findImmediateScoringMoves(board,bank);
  assert.ok(moves.length>=4);
  assert.ok(new Set(moves.flatMap(move=>[
    tileById(board,move.swap.fromTileId).row,
    tileById(board,move.swap.toTileId).row
  ])).size>=3);
  assert.ok(new Set(moves.flatMap(move=>[
    tileById(board,move.swap.fromTileId).column,
    tileById(board,move.swap.toTileId).column
  ])).size>=3);
});
```

- [ ] **Step 2: Add deterministic refill usefulness tests**

```js
test('local refill score prefers a word that completes a nearby approved relation',()=>{
  const board=createBoard([
    ['X','X','X'],
    ['LOOK',null,'X'],
    ['X','X','X']
  ],{allowEmpty:true});
  const after=scoreRefillCandidate({word:'AFTER',row:1,column:1,board,bank});
  const unrelated=scoreRefillCandidate({word:'MONEY',row:1,column:1,board,bank});
  assert.ok(after>unrelated);
});

test('weighted refill can still choose distractors',()=>{
  const profile={cascadeWeight:0.2,opportunityWeight:0.5,distractorWeight:0.3};
  const seen=new Set();
  for(let seed=1;seed<=60;seed++){
    seen.add(chooseRefillWord({
      row:0,column:2,board,bank,bag,
      rng:seededRng(seed),profile
    }));
  }
  assert.ok(seen.has('AFTER'));
  assert.ok([...seen].some(word=>word!=='AFTER'));
});
```

- [ ] **Step 3: Run generator/refill tests and confirm failure**

Run:
```bash
node --test Wordy/tests/generator.test.mjs Wordy/tests/refill.test.mjs Wordy/tests/levels.test.mjs
```

Expected: old generator depends on span pools; `refill.mjs` does not exist.

- [ ] **Step 4: Implement relationship bag**

`buildRelationshipBag` expands approved relations into weighted token records:

```js
[
  {word:'LOOK',relationshipId:'phrasal.look-after',weight:1},
  {word:'AFTER',relationshipId:'phrasal.look-after',weight:1},
  ...
]
```

Deduplicate candidate words only after summing relationship connectivity weights.

- [ ] **Step 5: Implement local candidate scoring**

Score candidate placement with explicit additive signals:

```js
const SCORE={
  completesRelation:100,
  createsOneSwapOpportunity:30,
  adjacentRelationToken:12,
  duplicatePenalty:-10,
  excessiveDuplicatePenalty:-30
};
```

Evaluate the temporary board with the candidate inserted. Count immediate matches and one-swap opportunities local to the candidate's row/column. Penalize excessive duplicates.

- [ ] **Step 6: Implement weighted selection profile**

The selector forms three candidate buckets:
- immediate-cascade candidates;
- one-swap/local-opportunity candidates;
- distractors.

Choose a bucket by profile weights, then weighted-random within that bucket. If a bucket is empty, renormalize over available buckets.

Initial prototype profile:

```js
export const DEFAULT_REFILL_PROFILE={
  cascadeWeight:0.18,
  opportunityWeight:0.57,
  distractorWeight:0.25
};
```

These are prototype tuning constants, not final game balance.

- [ ] **Step 7: Rewrite initial-board generation**

Generate 7×7 boards from relationship-bag tokens plus controlled distractors. Reject candidates that:
- contain starting matches when `allowStartingMatches===false`;
- have fewer than `minScoringMoves`;
- concentrate productive swaps in too few rows/columns;
- exceed duplicate-token limits.

- [ ] **Step 8: Convert level fixtures to 7×7 equal-cell rows**

Keep tutorial intent A–G, but every authored row must have exactly 7 word cells. Remove all assumptions that row width is a sum of spans.

- [ ] **Step 9: Run generator/refill/level tests**

Run:
```bash
node --test Wordy/tests/generator.test.mjs Wordy/tests/refill.test.mjs Wordy/tests/levels.test.mjs
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add Wordy/engine/generator.mjs Wordy/engine/refill.mjs Wordy/engine/controller.mjs Wordy/data/levels.mjs Wordy/tests/generator.test.mjs Wordy/tests/refill.test.mjs Wordy/tests/levels.test.mjs
git commit -m "feat(wordy): add relationship-aware generation and refill"
```

---

### Task 5: Rebuild input, rendering, and typography for equal-size Candy tiles

**Files:**
- Modify: `Wordy/ui/input.mjs`
- Modify: `Wordy/ui/render.mjs`
- Modify: `Wordy/ui/swap-animation.mjs`
- Modify: `Wordy/styles.css`
- Modify: `Wordy/app.mjs`
- Modify: `Wordy/tests/input.test.mjs`
- Modify: `Wordy/tests/swap-animation.test.mjs`
- Modify: `Wordy/tests/ui-contract.test.mjs`
- Modify: `Wordy/tests/entrypoint.test.mjs`

**Interfaces:**
- Rendering consumes only `row,column`.
- Input translates gesture direction directly to the conventional neighboring cell.
- Typography class is visual only.

- [ ] **Step 1: Add UI contract tests that ban span geometry**

```js
test('rendered tile coordinates use row/column only',()=>{
  const source=readFileSync(new URL('../ui/render.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/startColumn|spanForWord|gridColumnEnd/);
});

test('CSS uses equal board columns and typography classes for long words',()=>{
  const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css,/\.wordy-tile\.text-long/);
});
```

- [ ] **Step 2: Run UI tests and confirm failure**

Run:
```bash
node --test Wordy/tests/input.test.mjs Wordy/tests/swap-animation.test.mjs Wordy/tests/ui-contract.test.mjs Wordy/tests/entrypoint.test.mjs
```

Expected: failures because rendering still uses 12-column span coordinates.

- [ ] **Step 3: Render a true 7×7 CSS grid**

Tile placement:

```js
tileElement.style.gridRow=String(tile.row+1);
tileElement.style.gridColumn=String(tile.column+1);
```

CSS:

```css
.wordy-board{
  display:grid;
  grid-template-columns:repeat(7,minmax(0,1fr));
  grid-template-rows:repeat(7,minmax(0,1fr));
}
.wordy-tile{min-width:0;min-height:0;}
.wordy-tile.text-medium{font-size:clamp(.72rem,2.7vw,1rem);}
.wordy-tile.text-long{font-size:clamp(.60rem,2.25vw,.86rem);}
.wordy-tile.text-xlong{font-size:clamp(.52rem,1.95vw,.76rem);}
```

Class assignment may use normalized character-count thresholds, but must not affect tile dimensions.

- [ ] **Step 4: Simplify gesture-neighbor lookup**

Remove any footprint matching. Swipes call `neighborForDirection(board,tileId,direction)`; every in-bounds orthogonal cell can produce one neighbor.

- [ ] **Step 5: Keep FLIP/rebound animation but derive movement from equal cell rectangles**

No animation rule may depend on word span.

- [ ] **Step 6: Run UI tests**

Run:
```bash
node --test Wordy/tests/input.test.mjs Wordy/tests/swap-animation.test.mjs Wordy/tests/ui-contract.test.mjs Wordy/tests/entrypoint.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add Wordy/ui/input.mjs Wordy/ui/render.mjs Wordy/ui/swap-animation.mjs Wordy/styles.css Wordy/app.mjs Wordy/tests/input.test.mjs Wordy/tests/swap-animation.test.mjs Wordy/tests/ui-contract.test.mjs Wordy/tests/entrypoint.test.mjs
git commit -m "refactor(wordy): render equal size Candy tiles"
```

---

### Task 6: End-to-end gameplay regression and removal of old span engine

**Files:**
- Modify: `Wordy/tests/gameplay-integration.test.mjs`
- Modify: `Wordy/tests/scoring.test.mjs` only if coordinate fixtures require it
- Modify: `Wordy/tests/local-preview.test.mjs` only if static assumptions require it
- Delete: `Wordy/engine/tile-size.mjs`
- Update imports anywhere under `Wordy/`
- Update: `docs/superpowers/handoffs/WORDY-CURRENT.md`
- Update: `docs/superpowers/progress/2026-09-21-wordy-discrete-grid-rebuild.md`

**Interfaces:**
- Final engine has no runtime `span`, `startColumn`, `partitionRun`, or `spanForWord`.

- [ ] **Step 1: Rewrite integration scenario**

Test one full round segment:

1. load an equal-cell Level A board;
2. perform a nonproductive adjacent swap and verify rebound/no move;
3. perform a productive `WENT ↔ AFTER`-style fixture swap and verify exactly one move spent;
4. verify relationship becomes ready;
5. press POP;
6. verify tiles are removed once;
7. verify each affected column falls vertically;
8. verify replacement words enter at column tops;
9. verify any cascade-created relation auto-resolves;
10. verify final stable board contains exactly `rows × columns` tiles;
11. verify no holes and at least one productive future swap or automatic dead-board recovery.

- [ ] **Step 2: Add forbidden-geometry source scan**

```js
test('runtime contains no legacy span geometry',()=>{
  for(const path of runtimeModulePaths){
    const source=readFileSync(path,'utf8');
    assert.doesNotMatch(source,/\bstartColumn\b|\bspanForWord\b|\bpartitionRun\b/);
  }
});
```

A plain `span` used as an HTML element is not forbidden; only gameplay geometry identifiers are.

- [ ] **Step 3: Run full Wordy test suite**

Run:
```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Expected: all tests PASS and syntax check exits 0.

- [ ] **Step 4: Delete `tile-size.mjs` and any stale imports, then rerun everything**

Run:
```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Expected: all PASS.

- [ ] **Step 5: Review production-facing diff**

Verify the branch changes only:
- Wordy runtime;
- Wordy tests;
- Wordy Superpowers plan/spec/handoff/progress documentation.

No unrelated Classroom Online Games files should change.

- [ ] **Step 6: Update handoff/progress**

Record:
- uniform-cell architecture supersedes 12-microcolumn span architecture;
- exact final test count/result;
- branch HEAD commit;
- production remains unchanged until separately authorized.

- [ ] **Step 7: Commit**

```bash
git add -A Wordy docs/superpowers/handoffs/WORDY-CURRENT.md docs/superpowers/progress/2026-09-21-wordy-discrete-grid-rebuild.md
git commit -m "test(wordy): verify uniform cell Candy gameplay"
```

---

## Final Verification Gate

Before requesting publication:

```bash
node --test Wordy/tests/*.test.mjs
node --check Wordy/app.mjs
```

Then verify:
- every tile has `row,column` and no gameplay span fields;
- 7×7 stable board has 49 tiles;
- normal four-direction swaps work;
- rejected swaps rebound;
- productive swaps remain;
- POP/global-ready behavior remains;
- gravity is vertical-only;
- refill enters at tops of columns;
- generated boards meet opportunity floor;
- refill produces useful candidates without guaranteeing cascades;
- no alternate hosting path was introduced.

Publication to `main`/Cloudflare is not part of this plan's implementation phase and requires a separate explicit deployment step.
