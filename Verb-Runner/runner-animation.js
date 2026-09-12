(function(global){
  const FRAME_COUNT=4;
  const FRAME_RATE=10;
  const SPRINT_RATE=13;
  const ATLAS_KEY='vr-run-clean-atlas';
  const ATLAS_URL='assets/sprites/runner-run-atlas.svg';
  const CELL_W=128;
  const CELL_H=192;

  function frameKeysFor(characterIndex){
    return Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-${characterIndex}-${i}`);
  }

  function animationKeyFor(characterIndex){
    return `vr-run-clean-${characterIndex}`;
  }

  function ensureAtlasFrames(scene,characterIndex){
    const texture=scene.textures.get(ATLAS_KEY);
    if(!texture||texture.key==='__MISSING')return false;

    const row=(characterIndex%6+6)%6;
    const keys=frameKeysFor(row);
    keys.forEach((name,frame)=>{
      if(!texture.has(name)){
        texture.add(name,0,frame*CELL_W,row*CELL_H,CELL_W,CELL_H);
      }
    });
    texture.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    return keys.every(name=>texture.has(name));
  }

  function ensureAnimation(scene,characterIndex){
    const row=(characterIndex%6+6)%6;
    const key=animationKeyFor(row);
    if(scene.anims.exists(key))return key;

    const frames=frameKeysFor(row).map(frame=>({key:ATLAS_KEY,frame}));
    scene.anims.create({
      key,
      frames,
      frameRate:FRAME_RATE,
      repeat:-1
    });
    return key;
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__cleanAnimatedRunnerInstalled)return;
    scene.__cleanAnimatedRunnerInstalled=true;

    const characterIndex=(scene.characterIndex%6+6)%6;
    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt||!ensureAtlasFrames(scene,characterIndex))return;

    const animationKey=ensureAnimation(scene,characterIndex);
    const firstFrame=frameKeysFor(characterIndex)[0];
    const sprite=scene.add.sprite(0,8,ATLAS_KEY,firstFrame);

    const baseScale=1.72;
    const sprintScale=1.82;

    sprite.setOrigin(.5,1).setScale(baseScale).setVisible(true);
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
      const current=sprite.anims.currentAnim;
      if(current&&current.frameRate!==targetRate)current.frameRate=targetRate;
      if(!sprite.anims.isPlaying)sprite.play(animationKey);
    };

    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  function ensureAtlas(scene,done){
    const characterIndex=(scene.characterIndex%6+6)%6;

    if(scene.textures.exists(ATLAS_KEY)){
      if(ensureAtlasFrames(scene,characterIndex))done();
      return;
    }

    scene.load.svg(ATLAS_KEY,ATLAS_URL,{width:512,height:1152});
    scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
      if(ensureAtlasFrames(scene,characterIndex))done();
      else if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });
    scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
      console.error('Verb Runner clean atlas failed to load',file?.src||ATLAS_URL);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });
    scene.load.start();
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__cleanRunnerPatched)return;

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
        ensureAtlas(scene,()=>installVisibleRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__cleanRunnerPatched=true;
  });
})(window);
