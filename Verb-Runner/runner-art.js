window.VERB_RUNNER_ART = [
  {color:'#ff3f58',accent:'#ff8a54'},
  {color:'#ff48c7',accent:'#ff94de'},
  {color:'#36b9ff',accent:'#8ad8ff'},
  {color:'#ffc52f',accent:'#ffe27c'},
  {color:'#45e082',accent:'#8df0ae'},
  {color:'#b94cff',accent:'#dd9cff'}
];
window.VERB_RUNNER_SPRITES = {
  select:'assets/sprites/runner-select-sheet.svg',
  run:'assets/sprites/runner-run-sheet.svg',
  slide:'assets/sprites/runner-slide-sheet.svg',
  selectFrameWidth:180,
  selectFrameHeight:260,
  runFrameWidth:60,
  runFrameHeight:93,
  slideFrameWidth:60,
  slideFrameHeight:54
};

window.addEventListener('load',()=>{
  const api=window.VerbRunnerPhaser;
  if(!api||api.__runnerMotionPatched)return;
  const createGame=api.createVerbRunnerGame;

  function animateRunnerStride(scene,time){
    const player=scene?.player,runnerArt=player?.runnerArt,shadow=player?.shadow;
    if(!runnerArt||!shadow||scene.sliding)return;
    const sprint=scene.runState?.momentum>=80;
    const baseScale=sprint?4.35:4.05;
    const phase=time*(sprint?0.0205:0.0165);
    const step=Math.sin(phase*2);
    const sway=Math.sin(phase);

    if(scene.jumping){
      runnerArt.rotation=sway*.018;
      shadow.scaleX=.82;
      shadow.scaleY=.78;
      return;
    }

    runnerArt.y=8+step*4.4;
    runnerArt.rotation=sway*.035;
    runnerArt.scaleX=baseScale*(1+step*.025);
    runnerArt.scaleY=baseScale*(1-step*.018);
    shadow.scaleX=1-Math.abs(sway)*.11;
    shadow.scaleY=1+Math.abs(sway)*.07;
    shadow.alpha=.25+Math.abs(step)*.07;
  }

  api.createVerbRunnerGame=function(mount,options){
    const game=createGame(mount,options);
    const attach=()=>{
      const scene=game?.scene?.getScene?.('VerbRunnerScene');
      if(!scene||!scene.sys?.isActive?.()){setTimeout(attach,40);return;}
      if(scene.__runnerMotionAttached)return;
      scene.__runnerMotionAttached=true;
      scene.animateRunnerStride=time=>animateRunnerStride(scene,time);
      scene.events.on('update',scene.animateRunnerStride);
      scene.events.once('shutdown',()=>scene.events.off('update',scene.animateRunnerStride));
    };
    setTimeout(attach,0);
    return game;
  };
  api.__runnerMotionPatched=true;
});
