(function(global){
  const FRAMES=8;
  const FRAME_W=164;
  const FRAME_H=272;
  const FRAME_RATE=11;
  const SPRINT_RATE=14;
  const TEXTURE_KEY='vr-run-red-clean-8';
  const PAYLOAD_URL='assets/sprites/runner-run-red-clean-strip.webp.b64';
  const ANIMATION_KEY='vr-run-red-clean';

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
      .setScale(1.38)
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
      sprite.setScale(scene.runState?.momentum>=80?1.46:1.38);

      const targetRate=scene.runState?.momentum>=80?SPRINT_RATE:FRAME_RATE;
      const current=sprite.anims.currentAnim;
      if(current&&current.frameRate!==targetRate)current.frameRate=targetRate;
      if(!sprite.anims.isPlaying)sprite.play(ANIMATION_KEY);
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  async function ensureTexture(scene,done){
    if(scene.textures.exists(TEXTURE_KEY)){
      done();
      return;
    }

    try{
      const response=await fetch(PAYLOAD_URL,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const encoded=(await response.text()).replace(/\s+/g,'');
      if(!encoded)throw new Error('empty runner sprite payload');

      const dataUrl=`data:image/webp;base64,${encoded}`;
      scene.load.spritesheet(TEXTURE_KEY,dataUrl,{
        frameWidth:FRAME_W,
        frameHeight:FRAME_H,
        endFrame:FRAMES-1
      });

      scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
        if(scene.textures.exists(TEXTURE_KEY))done();
        else if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
        console.error('Verb Runner clean red animation failed to load',file?.src||PAYLOAD_URL);
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.start();
    }catch(error){
      console.error('Verb Runner clean red animation payload failed',error);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    }
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

        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
        if(scene.characterIndex===0)ensureTexture(scene,()=>installVisibleRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__redRunnerPatched=true;
  });
})(window);
