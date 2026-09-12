(function(global){
  const FRAME_COUNT=4;
  const FRAME_RATE=8;
  const SPRINT_RATE=10;

  const CHARACTER_IDS=[
    'red-girl',
    'blue-boy',
    'green-boy',
    'pink-girl',
    'white-boy',
    'purple-girl'
  ];

  function characterId(index){
    return CHARACTER_IDS[(index%CHARACTER_IDS.length+CHARACTER_IDS.length)%CHARACTER_IDS.length];
  }

  function frameKeysFor(characterIndex){
    const id=characterId(characterIndex);
    return Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-${id}-${i}`);
  }

  function frameUrlsFor(characterIndex){
    const id=characterId(characterIndex);
    return Array.from({length:FRAME_COUNT},(_,i)=>`assets/sprites/run/${id}-${i}.svg`);
  }

  function animationKeyFor(characterIndex){
    return `vr-run-clean-${characterId(characterIndex)}`;
  }

  function ensureAnimation(scene,characterIndex){
    const key=animationKeyFor(characterIndex);
    if(scene.anims.exists(key))return key;

    const frames=frameKeysFor(characterIndex).map(textureKey=>({
      key:textureKey,
      frame:'__BASE'
    }));

    scene.anims.create({
      key,
      frames,
      frameRate:FRAME_RATE,
      repeat:-1
    });
    return key;
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__individualRunnerInstalled)return;
    scene.__individualRunnerInstalled=true;

    const characterIndex=(scene.characterIndex%6+6)%6;
    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt)return;

    const keys=frameKeysFor(characterIndex);
    if(!keys.every(key=>scene.textures.exists(key)))return;

    const animationKey=ensureAnimation(scene,characterIndex);
    const sprite=scene.add.sprite(0,8,keys[0]);

    const baseScale=1.72;
    const sprintScale=1.82;

    sprite.setOrigin(.5,1);
    sprite.setScale(baseScale);
    sprite.setVisible(true);
    player.add(sprite);

    player.animatedRunner=sprite;
    oldArt.setVisible(false);
    sprite.play(animationKey);

    const update=()=>{
      if(!scene.active)return;

      if(scene.sliding){
        sprite.setVisible(false);
        oldArt.setVisible(true);
        return;
      }

      oldArt.setVisible(false);
      sprite.setVisible(true);
      sprite.setScale(scene.runState?.momentum>=80?sprintScale:baseScale);

      const targetRate=scene.runState?.momentum>=80?SPRINT_RATE:FRAME_RATE;
      const anim=sprite.anims.currentAnim;
      if(anim&&anim.frameRate!==targetRate)anim.frameRate=targetRate;
      if(!sprite.anims.isPlaying)sprite.play(animationKey);
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  function ensureFrames(scene,done){
    const characterIndex=(scene.characterIndex%6+6)%6;
    const keys=frameKeysFor(characterIndex);
    const urls=frameUrlsFor(characterIndex);

    if(keys.every(key=>scene.textures.exists(key))){
      keys.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
      done();
      return;
    }

    keys.forEach((key,index)=>{
      if(!scene.textures.exists(key)){
        scene.load.svg(key,urls[index],{width:128,height:192});
      }
    });

    scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      if(keys.every(key=>scene.textures.exists(key))){
        keys.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
        done();
      }else if(scene.player?.runnerArt){
        scene.player.runnerArt.setVisible(true);
      }
    });

    scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
      console.error('Verb Runner individual frame failed to load',file?.src||'unknown frame');
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });

    scene.load.start();
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__individualRunnerPatched)return;

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
        ensureFrames(scene,()=>installVisibleRunner(scene));
      };

      setTimeout(waitForScene,0);
      return game;
    };

    api.__individualRunnerPatched=true;
  });
})(window);
