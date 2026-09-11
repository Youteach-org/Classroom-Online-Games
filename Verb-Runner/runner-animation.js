(function(global){
  const FRAME_COUNT=4;
  const FRAME_RATE=10;
  const SPRINT_RATE=13;
  const FRAME_KEYS=Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-red-frame-${i}`);
  const FRAME_URLS=Array.from({length:FRAME_COUNT},(_,i)=>`assets/sprites/runner-red-frame-${i}.webp.b64`);
  const ANIMATION_KEY='vr-run-red-clean';

  function ensureAnimation(scene){
    if(scene.anims.exists(ANIMATION_KEY))return;
    scene.anims.create({
      key:ANIMATION_KEY,
      frames:FRAME_KEYS.map(key=>({key,frame:'__BASE'})),
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

    const sprite=scene.add.sprite(0,8,FRAME_KEYS[0])
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

  async function ensureTextures(scene,done){
    if(FRAME_KEYS.every(key=>scene.textures.exists(key))){
      FRAME_KEYS.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
      done();
      return;
    }

    try{
      const encodedFrames=await Promise.all(FRAME_URLS.map(async url=>{
        const response=await fetch(url,{cache:'no-store'});
        if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
        const encoded=(await response.text()).replace(/\s+/g,'');
        if(!encoded.startsWith('UklG'))throw new Error(`${url}: invalid WebP payload`);
        return encoded;
      }));

      FRAME_KEYS.forEach((key,index)=>{
        if(!scene.textures.exists(key)){
          scene.load.image(key,`data:image/webp;base64,${encodedFrames[index]}`);
        }
      });

      scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
        if(FRAME_KEYS.every(key=>scene.textures.exists(key))){
          FRAME_KEYS.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
          done();
        }else if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
        console.error('Verb Runner clean frame failed to load',file?.src||'unknown frame');
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.start();
    }catch(error){
      console.error('Verb Runner clean animation frames failed',error);
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
        if(scene.characterIndex===0)ensureTextures(scene,()=>installVisibleRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__redRunnerPatched=true;
  });
})(window);
