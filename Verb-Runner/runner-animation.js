(function(global){
  const FRAME_W=164;
  const FRAME_H=272;
  const FRAMES=8;
  const ROWS=6;
  const FRAME_MS=88;
  const SPRINT_MS=68;
  const TEXTURE_KEY='vr-run-animated';
  const TEXTURE_URL='assets/sprites/runner-run-animated-sheet.webp';

  function frameCrop(scene,frame){
    const art=scene?.player?.runnerArt;
    if(!art||scene.sliding)return;
    const row=((scene.characterIndex||0)%ROWS+ROWS)%ROWS;
    art.setTexture(TEXTURE_KEY);
    art.setCrop(frame*FRAME_W,row*FRAME_H,FRAME_W,FRAME_H);
    art.setScale(scene.runState?.momentum>=80?1.52:1.42);
    art.y=8;
    art.rotation=0;
  }

  function attachAnimation(scene){
    if(!scene||scene.__realRunAnimationAttached)return;
    scene.__realRunAnimationAttached=true;
    scene.__runFrame=0;
    scene.__runFrameAt=0;

    const update=(time)=>{
      if(!scene.active||scene.sliding)return;
      const interval=scene.runState?.momentum>=80?SPRINT_MS:FRAME_MS;
      if(time-scene.__runFrameAt<interval)return;
      scene.__runFrameAt=time;
      scene.__runFrame=(scene.__runFrame+1)%FRAMES;
      frameCrop(scene,scene.__runFrame);
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    frameCrop(scene,0);
  }

  function ensureTexture(scene,done){
    if(scene.textures.exists(TEXTURE_KEY)){done();return;}
    scene.load.image(TEXTURE_KEY,TEXTURE_URL);
    scene.load.once(Phaser.Loader.Events.COMPLETE,done);
    scene.load.start();
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__realFrameAnimationPatched)return;
    const originalCreate=api.createVerbRunnerGame;

    api.createVerbRunnerGame=function(mount,options){
      const game=originalCreate(mount,options);
      const waitForScene=()=>{
        const scene=game?.scene?.getScene?.('VerbRunnerScene');
        if(!scene||!scene.sys?.isActive?.()){setTimeout(waitForScene,30);return;}
        // Remove the previous fake bobbing animation if it was attached.
        if(scene.animateRunnerStride){scene.events.off('update',scene.animateRunnerStride);scene.animateRunnerStride=null;}
        ensureTexture(scene,()=>attachAnimation(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__realFrameAnimationPatched=true;
  });
})(window);
