(function(global){
  function moveLane(lane,delta){return Math.max(0,Math.min(2,Number(lane)+Number(delta)));}
  function speedForMomentum(momentum){return Math.round(210+Math.max(0,Math.min(100,Number(momentum)||0))*1.2);}
  function isDesktopViewport(width,height,finePointer){
    const w=Math.max(0,Number(width)||0),h=Math.max(1,Number(height)||1);
    return Boolean(finePointer)&&w>=700&&h>=360&&w/h>=1.25;
  }
  function displayScaleForViewport(width,height,finePointer){
    const w=Math.max(0,Number(width)||0);
    if(!isDesktopViewport(w,height,finePointer))return 1;
    return Math.round(Math.min(1.85,1.7+Math.max(0,w-900)*0.00018)*100)/100;
  }
  function hitsObstacle(obstacle,player){
    if(obstacle?.type==='crate') return !player?.jumping;
    if(obstacle?.type==='barrier') return !player?.sliding;
    return true;
  }
  const api={moveLane,speedForMomentum,isDesktopViewport,displayScaleForViewport,hitsObstacle};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  global.VerbRunnerRunnerCore=api;
})(typeof window!=='undefined'?window:globalThis);
