(function(global){
  const FRAMES=8;
  const FRAME_RATE=11;
  const SPRINT_RATE=14;
  const TEXTURE_KEY='vr-run-red-8';
  const TEXTURE_URL='assets/sprites/runner-run-red-8.webp';
  const ANIMATION_KEY='vr-run-red';

  function ensureAnimation(scene){
    if(scene.anims.exists(ANIMATION_KEY))return;
    scene.anims.create({
      key:ANIMATION_KEY,
      frames:scene.anims.generateFrameNumbers(TEXTURE_KEY,{start:0,end:FRAMES-1}),
      frameRate:FRAME_RATE,
      repeat:-1
    });
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__redAnimatedRunnerInstalled||scene.characterIndex!==0)return;
    scene.__redAnimatedRunnerInstalled=true;

    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt)return;

    ensureAnimation(scene);

    const sprite=scene.add.sprite(0,8,TEXTURE_KEY,0)
      .setOrigin(.5,1)
      .setScale(2.75)
      .setVisible(true);

    player.add(sprite);
    player.animatedRunner=sprite;
    oldArt.setVisible(false);
    sprite.play(ANIMATION_KEY);

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
      if(!sprite.anims.isPlaying)sprite.play(ANIMATION_KEY);
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
      frameWidth:82,
      frameHeight:136
    });

    scene.load.once(Phaser.Loader.Events.COMPLETE,done);
    scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
      console.error('Verb Runner red animation failed to load',file?.src||TEXTURE_URL);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });
    scene.load.start();
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__redRunnerPatched)return;

    const originalCreate=api.createVerbRunnerGame;
    api.createVerbRunnerGame=function(mount,options){
      const game=originalCreate(mount,options);
      const waitForScene=()=>{
        const scene=game?.scene?.getScene?.('VerbRunnerScene');
        if(!scene||!scene.sys?.isActive?.()){
          setTimeout(waitForScene,30);
          return;
        }

        // Keep the original rear runner visible while the animation loads.
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);

        if(scene.characterIndex===0){
          ensureTexture(scene,()=>installVisibleRunner(scene));
        }
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__redRunnerPatched=true;
  });
})(window);
