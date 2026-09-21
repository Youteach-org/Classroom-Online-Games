import { createBoard, areAdjacent, swapTiles } from './board.mjs';
import { findMatches } from './matcher.mjs';
import { resolvePlayerActivation, CascadeLimitError } from './resolution.mjs';
import {
  findImmediateScoringMoves,
  recoverDeadBoard,
  createControlledBoard
} from './generator.mjs';
import { captureMissedOpportunity, buildRoundReview } from './review.mjs';
import { createTelemetryStore } from './telemetry.mjs';

const DISCOVERED_KEY='wordy.prototype.discovered.v1';

function cloneBoard(board){
  return board.map(row=>row.map(tile=>tile==null?null:{...tile}));
}

function cloneMatch(match){
  return {
    ...match,
    cells:(match.cells??[]).map(cell=>({...cell})),
    tokens:[...(match.tokens??[])]
  };
}

function readDiscovered(storage){
  if(!storage?.getItem)return new Set();
  try{
    const value=JSON.parse(storage.getItem(DISCOVERED_KEY)||'[]');
    return new Set(Array.isArray(value)?value:[]);
  }catch{
    return new Set();
  }
}

function persistDiscovered(storage,ids){
  if(!storage?.setItem)return;
  try{ storage.setItem(DISCOVERED_KEY,JSON.stringify([...ids])); }catch{ /* non-fatal */ }
}

function objectiveComplete(level,state){
  switch(level.goal?.type){
    case 'score': return state.score>=level.goal.target;
    case 'batch': return state.bestBatch>=level.goal.target;
    case 'cascade': return state.bestCascade>=level.goal.target;
    case 'long-relation': return state.longestRelation>=level.goal.target;
    case 'cross': return state.crossCount>=level.goal.target;
    default: return false;
  }
}

function inside(board,cell){
  return Number.isInteger(cell?.row)&&Number.isInteger(cell?.col)&&
    cell.row>=0&&cell.row<board.length&&cell.col>=0&&cell.col<board[0].length;
}

function boardWords(board){
  return new Set(board.flatMap(row=>row.map(tile=>tile?.word).filter(Boolean)));
}

function contextualWords(board,bank){
  const present=boardWords(board);
  const connected=[];
  const fallback=[];
  for(const relation of bank.byId.values()){
    fallback.push(...relation.tokens);
    if(relation.tokens.some(token=>present.has(token)))connected.push(...relation.tokens);
  }
  return connected.length?connected:fallback;
}

export function createGameController({
  bank,
  levels,
  initialLevelId,
  rng=Math.random,
  storage=null,
  refillWord=null
}){
  if(!bank?.byId)throw new Error('relationship bank is required');
  if(!Array.isArray(levels)||levels.length===0)throw new Error('levels are required');
  const telemetry=createTelemetryStore({storage});
  const listeners=new Set();
  const discoveredIds=readDiscovered(storage);
  let refillCounter=0;
  let levelIndex=Math.max(0,levels.findIndex(level=>level.id===initialLevelId));
  if(levelIndex<0)levelIndex=0;
  let currentLevel=null;
  let state=null;
  let roundNewIds=new Set();

  function snapshot(){
    return {
      ...state,
      board:cloneBoard(state.board),
      readyMatches:state.readyMatches.map(cloneMatch),
      discoveredIds:new Set(state.discoveredIds),
      missedOpportunities:state.missedOpportunities.map(item=>({...item})),
      review:state.review?{
        newLearning:[...(state.review.newLearning??[])],
        missed:[...(state.review.missed??[])]
      }:null
    };
  }

  function emit(){
    const view=snapshot();
    for(const listener of listeners)listener(view);
  }

  function fallbackBoard(){
    const current=createBoard(currentLevel.boardRows);
    if(findImmediateScoringMoves(current,bank).length>=2)return current;
    for(const level of levels){
      const candidate=createBoard(level.boardRows);
      if(findImmediateScoringMoves(candidate,bank).length>=2)return candidate;
    }
    return current;
  }

  function initialBoard(level){
    const authored=createBoard(level.boardRows);
    if(!level.generated)return authored;
    return createControlledBoard({
      bank,
      rows:authored.length,
      cols:authored[0].length,
      rng,
      minScoringMoves:2,
      fallbackBoard:authored
    });
  }

  function refreshReady(){
    state.readyMatches=findMatches(state.board,bank);
  }

  function logReady(){
    telemetry.record('ready-change',{count:state.readyMatches.length});
  }

  function loadLevel(index,{preserveDiscoveries=true}={}){
    levelIndex=index;
    currentLevel=levels[levelIndex];
    roundNewIds=new Set();
    state={
      levelId:currentLevel.id,
      levelTitle:currentLevel.title,
      instruction:currentLevel.instruction,
      board:initialBoard(currentLevel),
      movesLeft:currentLevel.moves,
      score:0,
      readyMatches:[],
      discoveredIds:preserveDiscoveries?new Set(discoveredIds):new Set(),
      bestBatch:0,
      bestCascade:0,
      longestRelation:0,
      crossCount:0,
      phase:'playing',
      missedOpportunities:[],
      eventLabel:'',
      success:null,
      review:null
    };
    refreshReady();
    telemetry.record('level-start',{levelId:currentLevel.id,moves:currentLevel.moves});
    return state;
  }

  function finishRound(success){
    state.phase='result';
    state.success=!!success;
    state.review=buildRoundReview({
      newRelationshipIds:[...roundNewIds],
      missedOpportunities:state.missedOpportunities,
      bank,
      limit:3
    });
    telemetry.record('level-end',{
      levelId:state.levelId,
      success:state.success,
      score:state.score,
      movesLeft:state.movesLeft
    });
  }

  function chooseRefillWord(){
    if(typeof refillWord==='function')return String(refillWord({state:snapshot(),bank,rng})).trim().toUpperCase();
    const words=contextualWords(state.board,bank);
    if(words.length===0)return 'WORD';
    return words[Math.floor(rng()*words.length)];
  }

  function refillTile(){
    const word=chooseRefillWord();
    return {id:'refill-'+(++refillCounter),word:word||'WORD'};
  }

  function recoverIfDead(){
    const recovered=recoverDeadBoard({
      board:state.board,
      bank,
      rng,
      fallbackBoard:fallbackBoard()
    });
    if(recovered.reset){
      state.board=recovered.board;
      refreshReady();
      telemetry.record('dead-board-reset',{levelId:state.levelId});
      logReady();
    }
  }

  function safeCascadeRecovery(){
    state.board=createControlledBoard({
      bank,
      rows:state.board.length,
      cols:state.board[0].length,
      rng,
      minScoringMoves:2,
      fallbackBoard:fallbackBoard()
    });
    refreshReady();
    telemetry.record('dead-board-reset',{levelId:state.levelId,reason:'cascade-limit'});
    logReady();
  }

  function swap(from,to){
    if(state.phase!=='playing')return false;
    if(!inside(state.board,from)||!inside(state.board,to)||!areAdjacent(from,to))return false;

    const scoringMoves=findImmediateScoringMoves(state.board,bank);
    const missed=captureMissedOpportunity({
      board:state.board,
      scoringMoves,
      chosenSwap:{from,to},
      bank
    });
    if(missed)state.missedOpportunities.push(missed);

    state.board=swapTiles(state.board,from,to);
    state.movesLeft=Math.max(0,state.movesLeft-1);
    refreshReady();
    state.eventLabel=state.readyMatches.length
      ?(state.readyMatches.length>1?`READY ×${state.readyMatches.length}`:'READY')
      :'';
    telemetry.record('swap',{from:{...from},to:{...to},movesLeft:state.movesLeft});
    logReady();

    if(state.movesLeft<=0&&state.readyMatches.length===0)finishRound(false);
    emit();
    return true;
  }

  function applyResolutionStats(result){
    state.score+=result.totalScore;
    const first=result.generations[0];
    state.bestBatch=Math.max(state.bestBatch,first?.matches?.length??0);
    for(const generation of result.generations){
      state.bestCascade=Math.max(state.bestCascade,generation.cascadeDepth??0);
      state.crossCount+=generation.score?.crossCount??0;
      for(const match of generation.matches??[]){
        state.longestRelation=Math.max(state.longestRelation,match.cells?.length??0);
      }
      if((generation.cascadeDepth??0)>0){
        telemetry.record('cascade',{
          depth:generation.cascadeDepth,
          relationshipIds:generation.matches.map(match=>match.relationshipId)
        });
      }
    }

    for(const id of result.newlyDiscoveredIds){
      discoveredIds.add(id);
      state.discoveredIds.add(id);
      roundNewIds.add(id);
    }
    persistDiscovered(storage,discoveredIds);
  }

  function pop(){
    if(state.phase!=='playing'||state.readyMatches.length===0)return false;
    const readyCount=state.readyMatches.length;
    state.phase='resolving';
    emit();
    telemetry.record('pop',{readyCount,movesLeft:state.movesLeft});

    try{
      const result=resolvePlayerActivation({
        board:state.board,
        bank,
        discoveredIds:state.discoveredIds,
        refillTile
      });
      state.board=result.board;
      applyResolutionStats(result);
      state.eventLabel=result.generations.length>1
        ?`COMBO ×${result.generations.length}`
        :(result.generations[0]?.score?.crossCount>0?'CROSS!':(result.newlyDiscoveredIds.length?'NEW!':''));
      refreshReady();
    }catch(error){
      if(!(error instanceof CascadeLimitError)){
        state.phase='playing';
        emit();
        throw error;
      }
      telemetry.record('cascade-limit',{levelId:state.levelId});
      safeCascadeRecovery();
      state.eventLabel='BOARD RESET';
    }

    if(objectiveComplete(currentLevel,state)){
      finishRound(true);
    }else if(state.movesLeft<=0){
      finishRound(false);
    }else{
      state.phase='playing';
      recoverIfDead();
    }
    emit();
    return true;
  }

  function replay(){
    loadLevel(levelIndex);
    emit();
    return true;
  }

  function next(){
    if(levelIndex>=levels.length-1)return false;
    loadLevel(levelIndex+1);
    emit();
    return true;
  }

  function subscribe(listener){
    if(typeof listener!=='function')throw new Error('listener must be a function');
    listeners.add(listener);
    listener(snapshot());
    return ()=>listeners.delete(listener);
  }

  loadLevel(levelIndex);

  return {
    state:snapshot,
    swap,
    pop,
    replay,
    next,
    subscribe,
    telemetryEvents:()=>telemetry.events()
  };
}
