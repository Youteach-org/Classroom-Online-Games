(function(global){
  const FRAME_W=82;
  const FRAME_H=136;
  const FRAMES=8;
  const ROWS=6;
  const FRAME_RATE=11;
  const SPRINT_RATE=14;
  const TEXTURE_KEY='vr-run-animated-sheet';
  const TEXTURE_URL='assets/sprites/runner-run-animated-sheet.webp';

  function animationKey(index){
    return `vr-run-${index}`;
  }

  function ensureAnimations(scene){
    for(let row=0;row<ROWS;row++){
      const key=animationKey(row);
      if(scene.anims.exists(key))continue;
      scene.anims.create({
        key,
        frames:scene.anims.generateFrameNumbers(TEXTURE_KEY,{start:row*FRAMES,end:row*FRAMES+FRAMES-1}),
        frameRate:FRAME_RATE,
        repeat:-1
      });
    }
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__visibleAnimatedRunnerInstalled)return;
    scene.__visibleAnimatedRunnerInstalled=true;

    ensureAnimations(scene);

    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt)return;

    const row=((scene.characterIndex||0)%ROWS+ROWS)%ROWS;
    const sprite=scene.add.sprite(0,8,TEXTURE_KEY,row*FRAMES)
      .setOrigin(.5,1)
      .setScale(2.75);

    player.add(sprite);
    player.animatedRunner=sprite;
    oldArt.setVisible(false);
    sprite.play(animationKey(row));

    const update=()=>{
      if(!scene.active)return;

      if(scene.sliding){
        sprite.setVisible(false);
        oldArt.setVisible(true);
        return;
      }

      oldArt.setVisible(false);
      sprite.setVisible(true);
      sprite.setScale(scene.runState?.momentum>=80?2.92:2.75);

      const targetRate=scene.runState?.momentum>=80?SPRINT_RATE:FRAME_RATE;
      const current=sprite.anims.currentAnim;
      if(current&&current.frameRate!==targetRate)current.frameRate=targetRate;
      if(!sprite.anims.isPlaying)sprite.play(animationKey(row));
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  function ensureTexture(scene,done){
    if(scene.textures.exists(TEXTURE_KEY)){
      done();
      return;
    }

    scene.load.spritesheet(TEXTURE_KEY,TEXTURE_URL,{
      frameWidth:FRAME_W,
      frameHeight:FRAME_H
    });

    scene.load.once(Phaser.Loader.Events.COMPLETE,done);
    scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
      console.error('Verb Runner animated sprite failed to load',file?.src||TEXTURE_URL);
      // Keep the original rear runner visible if the animated asset cannot load.
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });
    scene.load.start();
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__visibleRunnerPatched)return;

    const originalCreate=api.createVerbRunnerGame;
    api.createVerbRunnerGame=function(mount,options){
      const game=originalCreate(mount,options);
      const waitForScene=()=>{
        const scene=game?.scene?.getScene?.('VerbRunnerScene');
        if(!scene||!scene.sys?.isActive?.()){
          setTimeout(waitForScene,30);
          return;
        }
        // Never leave gameplay blank while the animated sheet is loading.
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
        ensureTexture(scene,()=>installVisibleRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__visibleRunnerPatched=true;
  });
})(window);
