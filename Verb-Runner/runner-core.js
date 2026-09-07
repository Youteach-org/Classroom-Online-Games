(function(global){
  function moveLane(lane,delta){return Math.max(0,Math.min(2,Number(lane)+Number(delta)));}
  function speedForMomentum(momentum){return Math.round(210+Math.max(0,Math.min(100,Number(momentum)||0))*1.2);}
  function hitsObstacle(obstacle,player){
    if(obstacle?.type==='crate') return !player?.jumping;
    if(obstacle?.type==='barrier') return !player?.sliding;
    return true;
  }
  const api={moveLane,speedForMomentum,hitsObstacle};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  global.VerbRunnerRunnerCore=api;
})(typeof window!=='undefined'?window:globalThis);
