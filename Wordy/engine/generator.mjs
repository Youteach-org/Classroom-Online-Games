import {
  areSwapNeighbors,
  cloneBoard,
  createBoard,
  neighborForDirection,
  swapTiles,
  tileById
} from './board.mjs';
import { findMatches } from './matcher.mjs';
import { scoreResolution } from './scoring.mjs';
import { buildRelationshipBag } from './refill.mjs';
import { canonicalTileToken } from './relationship-bank.mjs';

function matchKey(match){
  return `${match.relationshipId}|${match.orientation}|${(match.tileIds??[]).join(',')}`;
}

function swapSortKey(board,swap){
  const a=tileById(board,swap.fromTileId);
  const b=tileById(board,swap.toTileId);
  return [a?.row??99,a?.column??99,b?.row??99,b?.column??99];
}

function clampRng(value){
  return Math.min(0.999999999,Math.max(0,Number(value)||0));
}

function shuffled(values,rng){
  const out=[...values];
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(clampRng(rng())*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

function weightedPick(items,weightFor,rng){
  if(items.length===0)return null;
  const weights=items.map(item=>Math.max(0.001,Number(weightFor(item))||0.001));
  const total=weights.reduce((sum,value)=>sum+value,0);
  let roll=clampRng(rng())*total;
  for(let i=0;i<items.length;i++){
    roll-=weights[i];
    if(roll<0)return items[i];
  }
  return items.at(-1);
}

function relationCategoryWeight(relation,categoryWeights){
  return Math.max(0,Number(categoryWeights?.[relation.category]??1));
}

function allRelations(bank){
  return [...(bank?.byId?.values?.()??[])];
}

function activeRelations(bank,relationshipIds=null){
  if(!relationshipIds)return allRelations(bank);
  const seen=new Set();
  const relations=[];
  for(const id of relationshipIds){
    if(seen.has(id))continue;
    const relation=bank?.byId?.get?.(id);
    if(!relation)throw new Error('unknown relationship id: '+id);
    seen.add(id);
    relations.push(relation);
  }
  return relations;
}

function relationBoardTokens(relation){
  return relation.tokens.map(canonicalTileToken);
}

function sharedTokenCount(relation,tokens){
  let count=0;
  for(const token of new Set(relationBoardTokens(relation))){
    if(tokens.has(token))count++;
  }
  return count;
}

function relationDegree(relation,relations){
  const own=new Set(relationBoardTokens(relation));
  let degree=0;
  for(const other of relations){
    if(other.id===relation.id)continue;
    if(relationBoardTokens(other).some(token=>own.has(token)))degree++;
  }
  return degree;
}

function buildRelationGraph(relations){
  const graph=new Map(relations.map(relation=>[relation.id,new Set()]));
  const byToken=new Map();
  for(const relation of relations){
    for(const token of new Set(relationBoardTokens(relation))){
      if(!byToken.has(token))byToken.set(token,[]);
      byToken.get(token).push(relation.id);
    }
  }
  for(const ids of byToken.values()){
    for(let i=0;i<ids.length;i++){
      for(let j=i+1;j<ids.length;j++){
        graph.get(ids[i]).add(ids[j]);
        graph.get(ids[j]).add(ids[i]);
      }
    }
  }
  return graph;
}

function graphComponents(graph){
  const unseen=new Set(graph.keys());
  const components=[];
  while(unseen.size){
    const seed=unseen.values().next().value;
    unseen.delete(seed);
    const queue=[seed];
    const component=[];
    while(queue.length){
      const id=queue.shift();
      component.push(id);
      for(const neighbor of graph.get(id)??[]){
        if(!unseen.has(neighbor))continue;
        unseen.delete(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
}

function shortestPathFromSet(graph,startIds,targetId,allowedIds){
  if(startIds.has(targetId))return [targetId];
  const allowed=new Set(allowedIds);
  const queue=[];
  const parent=new Map();
  for(const id of startIds){
    if(!allowed.has(id))continue;
    queue.push(id);
    parent.set(id,null);
  }
  while(queue.length){
    const id=queue.shift();
    for(const neighbor of graph.get(id)??[]){
      if(!allowed.has(neighbor)||parent.has(neighbor))continue;
      parent.set(neighbor,id);
      if(neighbor===targetId){
        const path=[neighbor];
        let cursor=id;
        while(cursor!=null){
          path.push(cursor);
          cursor=parent.get(cursor);
        }
        return path.reverse();
      }
      queue.push(neighbor);
    }
  }
  return null;
}

export function selectRelationshipNeighborhood({
  bank,
  rng=Math.random,
  size=16,
  requiredRelationshipIds=[],
  categoryWeights={}
}={}){
  const relations=allRelations(bank).filter(relation=>relationCategoryWeight(relation,categoryWeights)>0);
  if(relations.length===0)throw new Error('relationship bank has no selectable relationships');

  const target=Math.min(relations.length,Math.max(1,Number(size)||1));
  const relationById=new Map(relations.map(relation=>[relation.id,relation]));
  const required=[...new Set(requiredRelationshipIds??[])];

  for(const id of required){
    const relation=bank?.byId?.get?.(id);
    if(!relation)throw new Error('unknown required relationship id: '+id);
    if(!relationById.has(id))throw new Error('required relationship is disabled by category weights: '+id);
  }

  const graph=buildRelationGraph(relations);
  const components=graphComponents(graph);
  const requiredSet=new Set(required);
  const eligibleComponents=components.filter(component=>
    component.length>=target &&
    [...requiredSet].every(id=>component.includes(id))
  );
  if(eligibleComponents.length===0){
    throw new Error(`unable to select connected relationship neighborhood of size ${target}`);
  }

  const component=weightedPick(
    eligibleComponents,
    ids=>ids.length,
    rng
  );
  const componentSet=new Set(component);
  const selected=[];
  const selectedIds=new Set();
  const tokens=new Set();
  const categories=new Set();

  function addRelation(id){
    if(selectedIds.has(id)||selected.length>=target)return;
    const relation=relationById.get(id);
    if(!relation||!componentSet.has(id))return;
    selected.push(relation);
    selectedIds.add(id);
    relationBoardTokens(relation).forEach(token=>tokens.add(token));
    categories.add(relation.category);
  }

  if(required.length){
    addRelation(required[0]);
    for(const requiredId of required.slice(1)){
      const path=shortestPathFromSet(graph,selectedIds,requiredId,component);
      if(!path)throw new Error('required relationships cannot be connected');
      const additions=path.filter(id=>!selectedIds.has(id));
      if(selected.length+additions.length>target){
        throw new Error('relationship neighborhood size is too small to connect required relationships');
      }
      for(const id of additions)addRelation(id);
    }
  }else{
    const seedCandidates=component.map(id=>relationById.get(id));
    const seed=weightedPick(
      seedCandidates,
      relation=>relationCategoryWeight(relation,categoryWeights)*
        (1+relationDegree(relation,seedCandidates)*0.2)*
        (relation.tokens.length===2?1.25:1),
      rng
    );
    addRelation(seed.id);
  }

  while(selected.length<target){
    const connected=component
      .filter(id=>!selectedIds.has(id))
      .filter(id=>[...(graph.get(id)??[])].some(neighbor=>selectedIds.has(neighbor)))
      .map(id=>relationById.get(id));

    if(connected.length===0){
      throw new Error('connected relationship component exhausted unexpectedly');
    }

    const choice=weightedPick(connected,relation=>{
      const shared=sharedTokenCount(relation,tokens);
      const categoryBonus=categories.has(relation.category)?1:1.45;
      const shortBonus=relation.tokens.length===2?1.2:1;
      return relationCategoryWeight(relation,categoryWeights)*(1+shared*6)*categoryBonus*shortBonus;
    },rng);
    addRelation(choice.id);
  }

  return selected.map(relation=>relation.id);
}

export function enumerateSwaps(board){
  if(!board?.tiles)return [];
  const swaps=[];
  for(const tile of board.tiles){
    for(const direction of ['right','down']){
      const neighborId=neighborForDirection(board,tile.id,direction);
      if(neighborId&&areSwapNeighbors(board,tile.id,neighborId)){
        swaps.push({fromTileId:tile.id,toTileId:neighborId});
      }
    }
  }
  return swaps.sort((a,b)=>{
    const ak=swapSortKey(board,a),bk=swapSortKey(board,b);
    for(let i=0;i<ak.length;i++)if(ak[i]!==bk[i])return ak[i]-bk[i];
    return a.fromTileId.localeCompare(b.fromTileId)||a.toTileId.localeCompare(b.toTileId);
  });
}

export function findImmediateScoringMoves(board,bank){
  const before=new Set(findMatches(board,bank).map(matchKey));
  const allKnown=new Set(bank?.byId?.keys?.()??[]);
  const scoring=[];
  for(const swap of enumerateSwaps(board)){
    const next=swapTiles(board,swap.fromTileId,swap.toTileId);
    const matches=findMatches(next,bank);
    const created=matches.filter(match=>!before.has(matchKey(match)));
    if(created.length===0)continue;
    const score=scoreResolution({matches:created,bank,discoveredIds:allKnown,cascadeDepth:0});
    scoring.push({swap,matches:created,projectedScore:score.total,board:next});
  }
  return scoring.sort((a,b)=>b.projectedScore-a.projectedScore);
}

export function hasViablePlay(board,bank){
  if(findMatches(board,bank).length>0)return true;
  return findImmediateScoringMoves(board,bank).length>0;
}

function productiveDimensions(board,moves){
  const rows=new Set(),columns=new Set();
  for(const move of moves){
    for(const id of [move.swap.fromTileId,move.swap.toTileId]){
      const tile=tileById(board,id);
      if(tile){rows.add(tile.row);columns.add(tile.column);}
    }
  }
  return {rows:rows.size,columns:columns.size};
}

export function relationshipCoverage(board,bank,relationshipIds=null){
  if(!board?.tiles?.length)return 0;
  const relations=activeRelations(bank,relationshipIds);
  const byWord=new Map();
  for(const relation of relations){
    for(const token of new Set(relationBoardTokens(relation))){
      if(!byWord.has(token))byWord.set(token,[]);
      byWord.get(token).push(relation);
    }
  }
  const counts=new Map();
  for(const tile of board.tiles){
    const word=canonicalTileToken(tile.word);
    counts.set(word,(counts.get(word)??0)+1);
  }

  let covered=0;
  for(const tile of board.tiles){
    const tileWord=canonicalTileToken(tile.word);
    const relationsForWord=byWord.get(tileWord)??[];
    const hasPartner=relationsForWord.some(relation=>{
      const boardTokens=relationBoardTokens(relation);
      const tokenCounts=new Map();
      for(const token of boardTokens)tokenCounts.set(token,(tokenCounts.get(token)??0)+1);
      for(const [token,needed] of tokenCounts){
        const available=counts.get(token)??0;
        const required=token===tileWord?Math.min(needed,2):1;
        if(available>=required && (token!==tileWord||needed>1||boardTokens.some(other=>other!==tileWord)))return true;
      }
      return boardTokens.some(token=>token!==tileWord&&(counts.get(token)??0)>0);
    });
    if(hasPartner)covered++;
  }
  return covered/board.tiles.length;
}

function duplicateLimitOkay(board,maxTokenCopies){
  const counts=new Map();
  for(const tile of board.tiles){
    const count=(counts.get(tile.word)??0)+1;
    counts.set(tile.word,count);
    if(count>maxTokenCopies)return false;
  }
  return true;
}

function isProductiveEnough(board,bank,{
  minScoringMoves,
  minProductiveRows,
  minProductiveColumns,
  allowStartingMatches,
  relationshipIds,
  minRelationshipCoverage,
  minUniqueWords,
  maxTokenCopies
}){
  if(!allowStartingMatches&&findMatches(board,bank).length>0)return false;
  if(!duplicateLimitOkay(board,maxTokenCopies))return false;
  if(new Set(board.tiles.map(tile=>tile.word)).size<minUniqueWords)return false;
  if(relationshipCoverage(board,bank,relationshipIds)<minRelationshipCoverage)return false;
  const moves=findImmediateScoringMoves(board,bank);
  const spread=productiveDimensions(board,moves);
  return moves.length>=minScoringMoves&&
    spread.rows>=minProductiveRows&&
    spread.columns>=minProductiveColumns;
}

function relationshipDeck({relations,total,rng,maxTokenCopies,minUniqueWords}){
  const words=shuffled([...new Set(relations.flatMap(relation=>relationBoardTokens(relation)))],rng);
  if(words.length===0)throw new Error('relationship neighborhood has no playable words');
  if(words.length<minUniqueWords){
    throw new Error(`relationship neighborhood exposes only ${words.length} unique words; need ${minUniqueWords}`);
  }
  if(words.length*maxTokenCopies<total){
    throw new Error('relationship neighborhood cannot fill board within copy cap');
  }

  const deck=words.slice(0,Math.min(total,words.length));
  const counts=new Map(deck.map(word=>[word,1]));

  while(deck.length<total){
    const candidates=words.filter(word=>(counts.get(word)??0)<maxTokenCopies);
    if(candidates.length===0)throw new Error('unable to fill diversity deck within copy cap');
    const minCount=Math.min(...candidates.map(word=>counts.get(word)??0));
    const leastUsed=candidates.filter(word=>(counts.get(word)??0)===minCount);
    const word=leastUsed[Math.floor(clampRng(rng())*leastUsed.length)];
    deck.push(word);
    counts.set(word,(counts.get(word)??0)+1);
  }

  return shuffled(deck,rng);
}

function wordRowsFromDeck({rows,columns,relations,rng,maxTokenCopies,minUniqueWords}){
  const deck=relationshipDeck({relations,total:rows*columns,rng,maxTokenCopies,minUniqueWords});
  const out=[];
  for(let row=0;row<rows;row++)out.push(deck.slice(row*columns,(row+1)*columns));
  return out;
}

function placementKey(row,column){
  return `${row}:${column}`;
}

function placementsFor(rows,columns,length){
  const placements=[];
  if(length<=columns){
    for(let row=0;row<rows;row++){
      for(let column=0;column<=columns-length;column++){
        placements.push({orientation:'horizontal',row,column});
      }
    }
  }
  if(length<=rows){
    for(let column=0;column<columns;column++){
      for(let row=0;row<=rows-length;row++){
        placements.push({orientation:'vertical',row,column});
      }
    }
  }
  return placements;
}

function cellsForPlacement(placement,length){
  return Array.from({length},(_,offset)=>({
    row:placement.row+(placement.orientation==='vertical'?offset:0),
    column:placement.column+(placement.orientation==='horizontal'?offset:0)
  }));
}

function findSourceCell(wordRows,word,locked){
  for(let row=0;row<wordRows.length;row++){
    for(let column=0;column<wordRows[0].length;column++){
      const key=placementKey(row,column);
      if(locked.has(key))continue;
      if(wordRows[row][column]===word)return {row,column};
    }
  }
  return null;
}

function arrangePatternBySwapping(wordRows,cells,desired,locked){
  const trial=wordRows.map(row=>[...row]);
  const trialLocked=new Set(locked);

  for(let index=0;index<cells.length;index++){
    const target=cells[index];
    const targetKey=placementKey(target.row,target.column);
    const word=desired[index];

    if(trial[target.row][target.column]!==word){
      const source=findSourceCell(trial,word,trialLocked);
      if(!source)return null;
      [trial[target.row][target.column],trial[source.row][source.column]]=
        [trial[source.row][source.column],trial[target.row][target.column]];
    }
    trialLocked.add(targetKey);
  }
  return trial;
}

function seedProductiveMoves(wordRows,relations,count,rng){
  if(count<=0||relations.length===0)return 0;
  const rows=wordRows.length,columns=wordRows[0].length;
  const reserved=new Set();
  let placed=0;
  const ordered=shuffled(relations,rng).sort((a,b)=>
    a.tokens.length-b.tokens.length||
    new Set(b.tokens).size-new Set(a.tokens).size
  );

  for(const relation of ordered){
    if(placed>=count)break;
    const desired=[...relationBoardTokens(relation)];
    if(desired.length<2||desired.length>Math.max(rows,columns))continue;
    [desired[desired.length-2],desired[desired.length-1]]=
      [desired[desired.length-1],desired[desired.length-2]];

    let arranged=null;
    let chosenCells=null;
    for(const placement of shuffled(placementsFor(rows,columns,desired.length),rng)){
      const cells=cellsForPlacement(placement,desired.length);
      if(cells.some(cell=>reserved.has(placementKey(cell.row,cell.column))))continue;
      const trial=arrangePatternBySwapping(wordRows,cells,desired,reserved);
      if(!trial)continue;
      arranged=trial;
      chosenCells=cells;
      break;
    }
    if(!arranged)continue;

    for(let row=0;row<rows;row++)wordRows[row]=arranged[row];
    for(const cell of chosenCells)reserved.add(placementKey(cell.row,cell.column));
    placed++;
  }
  return placed;
}

export function createControlledBoard({
  bank,
  rows=7,
  columns=7,
  rng=Math.random,
  minScoringMoves=4,
  minProductiveRows=3,
  minProductiveColumns=3,
  allowStartingMatches=false,
  fallbackBoard=null,
  relationshipIds=null,
  minRelationshipCoverage=0,
  minUniqueWords=0,
  maxTokenCopies=null
}){
  const minimum=Math.max(0,Number(minScoringMoves)||0);
  const minimumRows=Math.max(1,Number(minProductiveRows)||1);
  const minimumColumns=Math.max(1,Number(minProductiveColumns)||1);
  const minimumCoverage=Math.min(1,Math.max(0,Number(minRelationshipCoverage)||0));
  const minimumUnique=Math.max(0,Number(minUniqueWords)||0);
  const relations=activeRelations(bank,relationshipIds)
    .filter(relation=>relation.tokens.length>=2&&relation.tokens.length<=Math.max(rows,columns));
  if(relations.length===0)throw new Error('relationship neighborhood has no playable relationships');
  const uniqueWords=new Set(relations.flatMap(relation=>relationBoardTokens(relation)));
  const explicitCopyCap=Number(maxTokenCopies);
  const maxCopies=Number.isFinite(explicitCopyCap)&&explicitCopyCap>0
    ?Math.max(1,explicitCopyCap)
    :Math.max(4,Math.ceil((rows*columns)/Math.max(1,uniqueWords.size)));
  if(uniqueWords.size<minimumUnique)throw new Error('relationship neighborhood is not diverse enough');
  if(uniqueWords.size*maxCopies<rows*columns)throw new Error('relationship neighborhood cannot fill board within copy cap');

  for(let attempt=0;attempt<480;attempt++){
    const wordRows=wordRowsFromDeck({
      rows,columns,relations,rng,maxTokenCopies:maxCopies,minUniqueWords:minimumUnique
    });
    const naturalBoard=createBoard(wordRows,{columns});
    if(isProductiveEnough(naturalBoard,bank,{
      minScoringMoves:minimum,
      minProductiveRows:minimumRows,
      minProductiveColumns:minimumColumns,
      allowStartingMatches,
      relationshipIds,
      minRelationshipCoverage:minimumCoverage,
      minUniqueWords:minimumUnique,
      maxTokenCopies:maxCopies
    }))return naturalBoard;

    if(minimum>0){
      const seededRows=wordRows.map(row=>[...row]);
      seedProductiveMoves(seededRows,shuffled(relations,rng),minimum,rng);
      const seededBoard=createBoard(seededRows,{columns});
      if(isProductiveEnough(seededBoard,bank,{
        minScoringMoves:minimum,
        minProductiveRows:minimumRows,
        minProductiveColumns:minimumColumns,
        allowStartingMatches,
        relationshipIds,
        minRelationshipCoverage:minimumCoverage,
        minUniqueWords:minimumUnique,
        maxTokenCopies:maxCopies
      }))return seededBoard;
    }
  }

  if(fallbackBoard){
    const fallback=cloneBoard(fallbackBoard);
    if(fallback.rows!==rows||fallback.columns!==columns)throw new Error('fallback board dimensions do not match request');
    if(!isProductiveEnough(fallback,bank,{
      minScoringMoves:minimum,
      minProductiveRows:minimumRows,
      minProductiveColumns:minimumColumns,
      allowStartingMatches,
      relationshipIds,
      minRelationshipCoverage:minimumCoverage,
      minUniqueWords:minimumUnique,
      maxTokenCopies:maxCopies
    }))throw new Error('fallback board is not productive enough');
    return fallback;
  }
  throw new Error('unable to generate a productive board');
}

export function recoverDeadBoard({
  board,
  bank,
  rng=Math.random,
  fallbackBoard=null,
  minScoringMoves=4,
  minProductiveRows=3,
  minProductiveColumns=3,
  relationshipIds=null,
  minRelationshipCoverage=0,
  minUniqueWords=0,
  maxTokenCopies=null
}){
  if(hasViablePlay(board,bank))return {board,reset:false};
  const replacement=createControlledBoard({
    bank,rows:board.rows,columns:board.columns,rng,
    minScoringMoves,minProductiveRows,minProductiveColumns,
    allowStartingMatches:false,fallbackBoard,
    relationshipIds,minRelationshipCoverage,minUniqueWords,maxTokenCopies
  });
  return {board:replacement,reset:true};
}
