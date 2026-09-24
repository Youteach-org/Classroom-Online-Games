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

function sharedTokenCount(relation,tokens){
  let count=0;
  for(const token of new Set(relation.tokens)){
    if(tokens.has(token))count++;
  }
  return count;
}

function relationDegree(relation,relations){
  const own=new Set(relation.tokens);
  let degree=0;
  for(const other of relations){
    if(other.id===relation.id)continue;
    if(other.tokens.some(token=>own.has(token)))degree++;
  }
  return degree;
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
  const selected=[];
  const selectedIds=new Set();
  const tokens=new Set();
  const categories=new Set();

  for(const id of requiredRelationshipIds??[]){
    const relation=bank?.byId?.get?.(id);
    if(!relation)throw new Error('unknown required relationship id: '+id);
    if(relationCategoryWeight(relation,categoryWeights)<=0)throw new Error('required relationship is disabled by category weights: '+id);
    if(selectedIds.has(id))continue;
    selected.push(relation);
    selectedIds.add(id);
    relation.tokens.forEach(token=>tokens.add(token));
    categories.add(relation.category);
    if(selected.length>=target)return selected.map(relation=>relation.id);
  }

  if(selected.length===0){
    const seed=weightedPick(
      relations,
      relation=>relationCategoryWeight(relation,categoryWeights)*(1+relationDegree(relation,relations)*0.2)*(relation.tokens.length===2?1.25:1),
      rng
    );
    selected.push(seed);
    selectedIds.add(seed.id);
    seed.tokens.forEach(token=>tokens.add(token));
    categories.add(seed.category);
  }

  while(selected.length<target){
    const remaining=relations.filter(relation=>!selectedIds.has(relation.id));
    if(remaining.length===0)break;
    const connected=remaining.filter(relation=>sharedTokenCount(relation,tokens)>0);
    const pool=connected.length?connected:remaining;
    const choice=weightedPick(pool,relation=>{
      const shared=sharedTokenCount(relation,tokens);
      const categoryBonus=categories.has(relation.category)?1:1.45;
      const shortBonus=relation.tokens.length===2?1.2:1;
      return relationCategoryWeight(relation,categoryWeights)*(1+shared*6)*categoryBonus*shortBonus;
    },rng);
    selected.push(choice);
    selectedIds.add(choice.id);
    choice.tokens.forEach(token=>tokens.add(token));
    categories.add(choice.category);
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
    for(const token of new Set(relation.tokens)){
      if(!byWord.has(token))byWord.set(token,[]);
      byWord.get(token).push(relation);
    }
  }
  const counts=new Map();
  for(const tile of board.tiles)counts.set(tile.word,(counts.get(tile.word)??0)+1);

  let covered=0;
  for(const tile of board.tiles){
    const relationsForWord=byWord.get(tile.word)??[];
    const hasPartner=relationsForWord.some(relation=>{
      const tokenCounts=new Map();
      for(const token of relation.tokens)tokenCounts.set(token,(tokenCounts.get(token)??0)+1);
      for(const [token,needed] of tokenCounts){
        const available=counts.get(token)??0;
        const required=token===tile.word?Math.min(needed,2):1;
        if(available>=required && (token!==tile.word||needed>1||relation.tokens.some(other=>other!==tile.word)))return true;
      }
      return relation.tokens.some(token=>token!==tile.word&&(counts.get(token)??0)>0);
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
  maxTokenCopies
}){
  if(!allowStartingMatches&&findMatches(board,bank).length>0)return false;
  if(!duplicateLimitOkay(board,maxTokenCopies))return false;
  if(relationshipCoverage(board,bank,relationshipIds)<minRelationshipCoverage)return false;
  const moves=findImmediateScoringMoves(board,bank);
  const spread=productiveDimensions(board,moves);
  return moves.length>=minScoringMoves&&
    spread.rows>=minProductiveRows&&
    spread.columns>=minProductiveColumns;
}

function relationshipDeck({relations,total,rng,maxTokenCopies}){
  const deck=[];
  const counts=new Map();
  let copyLimit=Math.max(2,maxTokenCopies);
  let safety=0;

  while(deck.length<total&&safety++<500){
    let progressed=false;
    for(const relation of shuffled(relations,rng)){
      const bundleCounts=new Map();
      for(const token of relation.tokens)bundleCounts.set(token,(bundleCounts.get(token)??0)+1);
      const fits=[...bundleCounts].every(([token,needed])=>(counts.get(token)??0)+needed<=copyLimit);
      if(!fits)continue;
      for(const token of relation.tokens){
        deck.push(token);
        counts.set(token,(counts.get(token)??0)+1);
      }
      progressed=true;
      if(deck.length>=total)break;
    }
    if(!progressed){
      copyLimit++;
      if(copyLimit>maxTokenCopies+2)break;
    }
  }

  if(deck.length<total){
    const words=[...new Set(relations.flatMap(relation=>relation.tokens))];
    if(words.length===0)throw new Error('relationship neighborhood has no playable words');
    while(deck.length<total)deck.push(words[Math.floor(clampRng(rng())*words.length)]);
  }

  return shuffled(deck,rng).slice(0,total);
}

function wordRowsFromDeck({rows,columns,relations,rng,maxTokenCopies}){
  const deck=relationshipDeck({relations,total:rows*columns,rng,maxTokenCopies});
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

function seedProductiveMoves(wordRows,relations,count,rng){
  if(count<=0||relations.length===0)return 0;
  const rows=wordRows.length,columns=wordRows[0].length;
  const reserved=new Set();
  let placed=0;
  const ordered=[
    ...relations.filter(relation=>relation.tokens.length===2),
    ...relations.filter(relation=>relation.tokens.length!==2)
  ];

  for(const relation of ordered){
    if(placed>=count)break;
    const tokens=[...relation.tokens];
    if(tokens.length<2||tokens.length>Math.max(rows,columns))continue;
    const possible=shuffled(placementsFor(rows,columns,tokens.length),rng)
      .find(placement=>cellsForPlacement(placement,tokens.length).every(cell=>!reserved.has(placementKey(cell.row,cell.column))));
    if(!possible)continue;

    [tokens[tokens.length-2],tokens[tokens.length-1]]=[tokens[tokens.length-1],tokens[tokens.length-2]];
    const cells=cellsForPlacement(possible,tokens.length);
    cells.forEach((cell,index)=>{
      wordRows[cell.row][cell.column]=tokens[index];
      reserved.add(placementKey(cell.row,cell.column));
    });
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
  maxTokenCopies=4
}){
  const minimum=Math.max(0,Number(minScoringMoves)||0);
  const minimumRows=Math.max(1,Number(minProductiveRows)||1);
  const minimumColumns=Math.max(1,Number(minProductiveColumns)||1);
  const minimumCoverage=Math.min(1,Math.max(0,Number(minRelationshipCoverage)||0));
  const relations=activeRelations(bank,relationshipIds)
    .filter(relation=>relation.tokens.length>=2&&relation.tokens.length<=Math.max(rows,columns));
  if(relations.length===0)throw new Error('relationship neighborhood has no playable relationships');
  const uniqueWords=new Set(relations.flatMap(relation=>relation.tokens));
  const requestedMaxCopies=Math.max(2,Number(maxTokenCopies)||4);
  const maxCopies=Math.max(requestedMaxCopies,Math.ceil((rows*columns)/Math.max(1,uniqueWords.size)));

  for(let attempt=0;attempt<360;attempt++){
    const wordRows=wordRowsFromDeck({rows,columns,relations,rng,maxTokenCopies:maxCopies});
    const naturalBoard=createBoard(wordRows,{columns});
    if(isProductiveEnough(naturalBoard,bank,{
      minScoringMoves:minimum,
      minProductiveRows:minimumRows,
      minProductiveColumns:minimumColumns,
      allowStartingMatches,
      relationshipIds,
      minRelationshipCoverage:minimumCoverage,
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
  maxTokenCopies=4
}){
  if(hasViablePlay(board,bank))return {board,reset:false};
  const replacement=createControlledBoard({
    bank,rows:board.rows,columns:board.columns,rng,
    minScoringMoves,minProductiveRows,minProductiveColumns,
    allowStartingMatches:false,fallbackBoard,
    relationshipIds,minRelationshipCoverage,maxTokenCopies
  });
  return {board:replacement,reset:true};
}
