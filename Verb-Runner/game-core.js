(function(global){
  function clampMomentum(value){return Math.max(0,Math.min(100,Math.round(Number(value)||0)));}
  function createRunState(total=12){
    return {total:Number(total)||12,completed:0,correct:0,grammarErrors:0,obstacleHits:0,streak:0,bestStreak:0,momentum:75};
  }
  function applyEvent(state,event){
    const next={...state};
    if(event==='correct'){
      next.completed+=1;next.correct+=1;next.streak+=1;next.bestStreak=Math.max(next.bestStreak,next.streak);next.momentum=clampMomentum(next.momentum+8);
    }else if(event==='grammar-error'){
      next.grammarErrors+=1;next.streak=0;next.momentum=clampMomentum(next.momentum-15);
    }else if(event==='obstacle-hit'){
      next.obstacleHits+=1;next.momentum=clampMomentum(next.momentum-5);
    }
    return next;
  }
  function summarize(state,timeMs){
    const attempts=Number(state.correct||0)+Number(state.grammarErrors||0);
    const accuracy=attempts?Math.round((Number(state.correct||0)/attempts)*100):0;
    return {accuracy,correctLabel:`${Number(state.correct||0)} / ${attempts}`,obstacleHits:Number(state.obstacleHits||0),bestStreak:Number(state.bestStreak||0),momentum:clampMomentum(state.momentum),timeMs:Math.max(0,Math.round(Number(timeMs)||0))};
  }
  const api={createRunState,applyEvent,summarize,clampMomentum};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  global.VerbRunnerGameCore=api;
})(typeof window!=='undefined'?window:globalThis);
