import { areSwapNeighbors, cloneBoard, createBoard } from './board.mjs';
import { findMatches, findCrossings } from './matcher.mjs';
import { findImmediateScoringMoves, createControlledBoard } from './generator.mjs';
import { captureMissedOpportunity, buildRoundReview } from './review.mjs';
import { createTelemetryStore } from './telemetry.mjs';

const DISCOVERED_KEY='wordy.prototype.discovered.v1';

function cloneMatch(match){
  return {...match,tileIds:[...(match.tileIds??[])],tokens:[...(match.tokens??[])]};
}
function readDiscovered(storage){
  if(!storage?.getItem)return new Set();
  try{const value=JSON.parse(storage.getItem(DISCOVERED_KEY)||'[]');return new Set(Array.isArray(value)?value:[]);}catch{return new Set();}
}
function sameSwap(a,b){
  return !!a&&!!b&&(
    (a.fromTileId===b.fromTileId&&a.toTileId===b.toTileId)||
    (a.fromTileId===b.toTileId&&a.toTileId===b.fromTileId)
  );
}
function objectiveComplete(level,state){
  switch(level.goal?.type){
    case 'score': return state.score>=level.goal.target;
    case 'batch': return state.bestBatch>=level.goal.target;
    case 'cascade': return state.bestCascade>=level.goal.target;
    case 'long-relation': return state.longestRelation>=level.goal.target;
    case 'cross': return state.crossCount>=level.goal.target;
    default:return false;
  }
}

export function createGameController({bank,levels,initialLevelId,rng=Math.random,storage=null}={}){
  if(!bank?.byId)throw new Error('relationship bank is required');
  if(!Array.isArray(levels)||levels.length===0)throw new Error('levels are required');
  const telemetry=createTelemetryStore({storage});
  const listeners=new Set();
  const discoveredIds=readDiscovered(storage);
  let levelIndex=Math.max(0,levels.findIndex(level=>level.id===initialLevelId));
  let currentLevel=null;
  let state=null;
  let roundNewIds=new Set();

  function snapshot(){
    return {
      ...state,
      board:cloneBoard(state.board),
      readyMatches:state.readyMatches.map(cloneMatch),
      discoveredIds:new Set(state.discoveredIds),
      missedOpportunities:state.missedOpportunities.map(item=>({
        ...item,
        boardSnapshot:item.boardSnapshot?cloneBoard(item.boardSnapshot):undefined,
        suggestedSwap:item.suggestedSwap?{...item.suggestedSwap}:undefined
      })),
      review:state.review?{newLearning:[...(state.review.newLearning??[])],missed:[...(state.review.missed??[])]}:null
    };
  }
  function emit(){const view=snapshot();for(const listener of listeners)listener(view);}
  function initialBoard(level){
    const authored=createBoard(level.boardRows,{columns:12});
    if(!level.generated)return authored;
    return createControlledBoard({bank,rows:authored.rows,columns:authored.columns,rng,minScoringMoves:4,minProductiveRows:3,fallbackBoard:authored});
  }
  function refreshReady(){state.readyMatches=findMatches(state.board,bank);}
  function logReady(){
    telemetry.record('ready-change',{
      count:state.readyMatches.length,
      relationshipIds:[...new Set(state.readyMatches.map(match=>match.relationshipId))],
      crossCount:findCrossings(state.readyMatches).length
    });
  }
  function loadLevel(index,{preserveDiscoveries=true}={}){
    levelIndex=index; currentLevel=levels[index]; roundNewIds=new Set();
    state={
      levelId:currentLevel.id,levelTitle:currentLevel.title,instruction:currentLevel.instruction,
      board:initialBoard(currentLevel),movesLeft:currentLevel.moves,score:0,readyMatches:[],
      discoveredIds:preserveDiscoveries?new Set(discoveredIds):new Set(),bestBatch:0,bestCascade:0,
      longestRelation:0,crossCount:0,phase:'playing',missedOpportunities:[],resolutionEvents:[],
      eventLabel:'',success:null,review:null
    };
    refreshReady();
    telemetry.record('level-start',{levelId:currentLevel.id,moves:currentLevel.moves});
  }
  function finishRound(success){
    state.phase='result'; state.success=!!success;
    state.review=buildRoundReview({newRelationshipIds:[...roundNewIds],missedOpportunities:state.missedOpportunities,bank,limit:3});
    telemetry.record('level-end',{levelId:state.levelId,success:state.success,score:state.score,movesLeft:state.movesLeft});
  }

  function attemptSwap(fromTileId,toTileId){
    const resultBase={fromTileId:String(fromTileId??''),toTileId:String(toTileId??'')};
    if(state.phase!=='playing'||!areSwapNeighbors(state.board,resultBase.fromTileId,resultBase.toTileId)){
      return {status:'invalid',...resultBase};
    }

    const scoringMoves=findImmediateScoringMoves(state.board,bank);
    const chosenMove=scoringMoves.find(move=>sameSwap(move.swap,resultBase));
    if(!chosenMove){
      telemetry.record('swap-rebound',{...resultBase,movesLeft:state.movesLeft});
      return {status:'rebound',...resultBase};
    }

    state.resolutionEvents=[];
    const previousReadyIds=new Set(state.readyMatches.map(match=>match.relationshipId));
    const previousCrossCount=findCrossings(state.readyMatches).length;
    const missed=captureMissedOpportunity({board:state.board,scoringMoves,chosenSwap:resultBase,bank});
    if(missed){
      state.missedOpportunities.push(missed);
      telemetry.record('missed-opportunity',{
        relationshipId:missed.relationshipId,projectedScore:missed.projectedScore,suggestedSwap:missed.suggestedSwap
      });
    }

    state.board=chosenMove.board;
    state.movesLeft=Math.max(0,state.movesLeft-1);
    refreshReady();
    const nextReadyIds=new Set(state.readyMatches.map(match=>match.relationshipId));
    const createdRelationshipIds=[...nextReadyIds].filter(id=>!previousReadyIds.has(id));
    const brokenRelationshipIds=[...previousReadyIds].filter(id=>!nextReadyIds.has(id));
    const nextCrossCount=findCrossings(state.readyMatches).length;
    state.eventLabel=state.readyMatches.length?(state.readyMatches.length>1?`READY ×${state.readyMatches.length}`:'READY'):'';
    telemetry.record('swap',{...resultBase,movesLeft:state.movesLeft,createdRelationshipIds,immediatelyCreatedRelationship:createdRelationshipIds.length>0});
    if(createdRelationshipIds.length)telemetry.record('relationship-formed',{relationshipIds:createdRelationshipIds});
    if(brokenRelationshipIds.length)telemetry.record('relationship-broken',{relationshipIds:brokenRelationshipIds});
    if(nextCrossCount>previousCrossCount)telemetry.record('cross-created',{crossCount:nextCrossCount,relationshipIds:[...nextReadyIds]});
    logReady();
    if(state.movesLeft<=0&&state.readyMatches.length===0)finishRound(false);
    emit();
    return {status:'accepted',...resultBase};
  }

  function pop(){
    // Task 5 reconnects this to the tile-centric resolution engine.
    return false;
  }
  function replay(){telemetry.record('level-replay',{levelId:state.levelId,score:state.score});loadLevel(levelIndex);emit();return true;}
  function abandon(){if(state.phase==='result')return false;telemetry.record('level-abandon',{levelId:state.levelId,score:state.score,movesLeft:state.movesLeft,phase:state.phase});return true;}
  function next(){if(levelIndex>=levels.length-1)return false;loadLevel(levelIndex+1);emit();return true;}
  function subscribe(listener){if(typeof listener!=='function')throw new Error('listener must be a function');listeners.add(listener);listener(snapshot());return ()=>listeners.delete(listener);}

  loadLevel(levelIndex);
  return {state:snapshot,attemptSwap,pop,replay,next,abandon,subscribe,telemetryEvents:()=>telemetry.events()};
}
