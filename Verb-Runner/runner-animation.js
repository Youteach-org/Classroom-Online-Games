(function(global){
  const FRAME_COUNT=4;
  const STANDARD_RUN_FRAME_RATE=7;
  const DEFAULT_FRAME_RATE=8;
  const DEFAULT_SPRINT_RATE=10;
  const RED_CHARACTER_INDEX=0;
  const RED_FRAME_URLS=[
    'assets/sprites/run/red-girl-frame-0.webp',
    'assets/sprites/run/red-girl-frame-1.webp',
    'assets/sprites/run/red-girl-frame-2.webp',
    'assets/sprites/run/red-girl-frame-3.webp'
  ];

  const CHARACTER_IDS=[
    'red-girl',
    'blue-boy',
    'green-boy',
    'pink-girl',
    'white-boy',
    'purple-girl'
  ];

  function normalizedCharacterIndex(index){
    return (index%CHARACTER_IDS.length+CHARACTER_IDS.length)%CHARACTER_IDS.length;
  }

  function characterId(index){
    return CHARACTER_IDS[normalizedCharacterIndex(index)];
  }

  function isRedGirl(characterIndex){
    return normalizedCharacterIndex(characterIndex)===RED_CHARACTER_INDEX;
  }

  function frameKeysFor(characterIndex){
    const id=characterId(characterIndex);
    return Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-${id}-${i}`);
  }

  function frameUrlsFor(characterIndex){
    if(isRedGirl(characterIndex))return RED_FRAME_URLS;
    const id=characterId(characterIndex);
    return Array.from({length:FRAME_COUNT},(_,i)=>`assets/sprites/run/${id}-${i}.svg`);
  }

  function animationKeyFor(characterIndex){
    return `vr-run-clean-${characterId(characterIndex)}`;
  }

  function frameRateFor(characterIndex,momentum=0){
    if(isRedGirl(characterIndex))return STANDARD_RUN_FRAME_RATE;
    return momentum>=80?DEFAULT_SPRINT_RATE:DEFAULT_FRAME_RATE;
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
      frameRate:frameRateFor(characterIndex),
      repeat:-1
    });
    return key;
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__individualRunnerInstalled)return;
    scene.__individualRunnerInstalled=true;

    const characterIndex=normalizedCharacterIndex(scene.characterIndex);
    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt)return;

    const keys=frameKeysFor(characterIndex);
    if(!keys.every(key=>scene.textures.exists(key)))return;

    const animationKey=ensureAnimation(scene,characterIndex);
    const sprite=scene.add.sprite(0,8,keys[0]);

    const baseScale=isRedGirl(characterIndex)?1.15:1.72;
    const sprintScale=isRedGirl(characterIndex)?1.20:1.82;

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

      const targetRate=frameRateFor(characterIndex,scene.runState?.momentum||0);
      const anim=sprite.anims.currentAnim;
      if(anim&&anim.frameRate!==targetRate)anim.frameRate=targetRate;
      if(!sprite.anims.isPlaying)sprite.play(animationKey);
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  function ensureFrames(scene,done){
    const characterIndex=normalizedCharacterIndex(scene.characterIndex);
    const redGirl=isRedGirl(characterIndex);
    const keys=frameKeysFor(characterIndex);
    const urls=frameUrlsFor(characterIndex);

    if(keys.every(key=>scene.textures.exists(key))){
      keys.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
      done();
      return;
    }

    keys.forEach((key,index)=>{
      if(scene.textures.exists(key))return;
      if(redGirl)scene.load.image(key,urls[index]);
      else scene.load.svg(key,urls[index],{width:128,height:192});
    });

    scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      if(keys.every(key=>scene.textures.exists(key))){
        keys.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
        done();
      }else if(scene.player?.runnerArt&&!redGirl){
        scene.player.runnerArt.setVisible(true);
      }else if(scene.player?.runnerArt){
        scene.player.runnerArt.setVisible(false);
      }
    });

    scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
      console.error('Verb Runner individual frame failed to load',file?.src||'unknown frame');
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(!redGirl);
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

        const redGirl=isRedGirl(scene.characterIndex);
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(!redGirl);
        ensureFrames(scene,()=>installVisibleRunner(scene));
      };

      setTimeout(waitForScene,0);
      return game;
    };

    api.__individualRunnerPatched=true;
  });
})(window);
