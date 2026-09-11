(function(global){
  const FRAME_COUNT=4;
  const FRAME_RATE=10;
  const SPRINT_RATE=13;

  const RED_FRAME_KEYS=Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-red-frame-${i}`);
  const RED_FRAME_URLS=Array.from({length:FRAME_COUNT},(_,i)=>`assets/sprites/runner-red-frame-${i}.webp.b64`);

  const HD_ATLAS_KEY='vr-run-hd-atlas';
  const HD_PART_URLS=Array.from({length:6},(_,i)=>`assets/sprites/runner-hd-atlas.part${i}.b64`);
  const HD_CELL_W=128;
  const HD_CELL_H=192;
  const HD_ROW_BY_CHARACTER={1:0,2:1,3:2,4:3,5:4};

  function frameKeysFor(characterIndex){
    if(characterIndex===0)return RED_FRAME_KEYS;
    return Array.from({length:FRAME_COUNT},(_,i)=>`vr-run-hd-${characterIndex}-${i}`);
  }

  function animationKeyFor(characterIndex){
    return characterIndex===0?'vr-run-red-clean':`vr-run-hd-${characterIndex}`;
  }

  function ensureAtlasFrames(scene,characterIndex){
    const row=HD_ROW_BY_CHARACTER[characterIndex];
    if(row===undefined)return false;
    const texture=scene.textures.get(HD_ATLAS_KEY);
    if(!texture||texture.key==='__MISSING')return false;
    const keys=frameKeysFor(characterIndex);
    keys.forEach((name,frame)=>{
      if(!texture.has(name))texture.add(name,0,frame*HD_CELL_W,row*HD_CELL_H,HD_CELL_W,HD_CELL_H);
    });
    texture.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    return keys.every(name=>texture.has(name));
  }

  function ensureAnimation(scene,characterIndex){
    const key=animationKeyFor(characterIndex);
    if(scene.anims.exists(key))return key;
    const frameKeys=frameKeysFor(characterIndex);
    const frames=characterIndex===0
      ?frameKeys.map(textureKey=>({key:textureKey,frame:'__BASE'}))
      :frameKeys.map(frame=>({key:HD_ATLAS_KEY,frame}));
    scene.anims.create({key,frames,frameRate:FRAME_RATE,repeat:-1});
    return key;
  }

  function installVisibleRunner(scene){
    if(!scene||scene.__hdAnimatedRunnerInstalled)return;
    scene.__hdAnimatedRunnerInstalled=true;

    const characterIndex=(scene.characterIndex%6+6)%6;
    const player=scene.player;
    const oldArt=player?.runnerArt;
    if(!player||!oldArt)return;

    const animationKey=ensureAnimation(scene,characterIndex);
    const firstFrame=frameKeysFor(characterIndex)[0];
    const sprite=characterIndex===0
      ?scene.add.sprite(0,8,firstFrame)
      :scene.add.sprite(0,8,HD_ATLAS_KEY,firstFrame);

    const baseScale=characterIndex===0?1.38:1.95;
    const sprintScale=characterIndex===0?1.46:2.06;

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

  function ensureRedTextures(scene,done){
    if(RED_FRAME_KEYS.every(key=>scene.textures.exists(key))){
      RED_FRAME_KEYS.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
      done();
      return;
    }

    Promise.all(RED_FRAME_URLS.map(async url=>{
      const response=await fetch(url,{cache:'no-store'});
      if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
      const encoded=(await response.text()).replace(/\s+/g,'');
      if(!encoded.startsWith('UklG'))throw new Error(`${url}: invalid WebP payload`);
      return encoded;
    })).then(encodedFrames=>{
      RED_FRAME_KEYS.forEach((key,index)=>{
        if(!scene.textures.exists(key))scene.load.image(key,`data:image/webp;base64,${encodedFrames[index]}`);
      });
      scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
        if(RED_FRAME_KEYS.every(key=>scene.textures.exists(key))){
          RED_FRAME_KEYS.forEach(key=>scene.textures.get(key)?.setFilter?.(Phaser.Textures.FilterMode.LINEAR));
          done();
        }else if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
        console.error('Verb Runner red frame failed to load',file?.src||'unknown frame');
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.start();
    }).catch(error=>{
      console.error('Verb Runner red animation failed',error);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    });
  }

  async function ensureHdAtlas(scene,characterIndex,done){
    if(scene.textures.exists(HD_ATLAS_KEY)){
      if(ensureAtlasFrames(scene,characterIndex))done();
      return;
    }

    try{
      const parts=await Promise.all(HD_PART_URLS.map(async url=>{
        const response=await fetch(url,{cache:'no-store'});
        if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
        return (await response.text()).replace(/\s+/g,'');
      }));
      const encoded=parts.join('');
      if(!encoded.startsWith('UklG'))throw new Error('HD runner atlas has an invalid WebP payload');

      scene.load.image(HD_ATLAS_KEY,`data:image/webp;base64,${encoded}`);
      scene.load.once(Phaser.Loader.Events.COMPLETE,()=>{
        if(ensureAtlasFrames(scene,characterIndex))done();
        else if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
        console.error('Verb Runner HD atlas failed to load',file?.src||'unknown atlas');
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.start();
    }catch(error){
      console.error('Verb Runner HD animation failed',error);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    }
  }

  function ensureTextures(scene,done){
    const characterIndex=(scene.characterIndex%6+6)%6;
    if(characterIndex===0)ensureRedTextures(scene,done);
    else ensureHdAtlas(scene,characterIndex,done);
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__hdRunnerPatched)return;

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
        ensureTextures(scene,()=>installVisibleRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };

    api.__hdRunnerPatched=true;
  });
})(window);
