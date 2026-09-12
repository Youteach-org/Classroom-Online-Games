(function(global){
  const FRAME_COUNT=4;
  const FRAME_RATE=10;
  const SPRINT_RATE=13;
  const ATLAS_KEY='vr-run-raster-atlas';
  const PART_URLS=Array.from({length:6},(_,i)=>`assets/sprites/runner-hd-atlas.part${i}.b64`);
  const CELL_W=128;
  const CELL_H=192;
  // Existing raster atlas rows: blue, green, pink, white, purple.
  // Red is rebuilt from the female pink row and recolored so it can never fall back to the old red boy.
  const ROW_BY_CHARACTER=[2,0,1,2,3,4];

  function frameKey(characterIndex,frame){return `vr-raster-${characterIndex}-${frame}`;}
  function animationKey(characterIndex){return `vr-raster-run-${characterIndex}`;}

  function rgbToHsv(r,g,b){
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0;
    if(d){
      if(max===r)h=((g-b)/d)%6;
      else if(max===g)h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h*=60;if(h<0)h+=360;
    }
    return [h,max?d/max:0,max];
  }
  function hsvToRgb(h,s,v){
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    let r=0,g=0,b=0;
    if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
    return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
  }
  function colorDistance(a,b){
    const dr=a[0]-b[0],dg=a[1]-b[1],db=a[2]-b[2];
    return Math.sqrt(dr*dr+dg*dg+db*db);
  }

  function processFrame(source,row,frame,characterIndex){
    const raw=document.createElement('canvas');
    raw.width=CELL_W;raw.height=CELL_H;
    const rctx=raw.getContext('2d',{willReadFrequently:true});
    rctx.clearRect(0,0,CELL_W,CELL_H);
    rctx.drawImage(source,frame*CELL_W,row*CELL_H,CELL_W,CELL_H,0,0,CELL_W,CELL_H);

    const image=rctx.getImageData(0,0,CELL_W,CELL_H);
    const d=image.data;
    const cornerAt=(x,y)=>{
      const p=(y*CELL_W+x)*4;
      return [d[p],d[p+1],d[p+2]];
    };
    const corners=[cornerAt(2,2),cornerAt(CELL_W-3,2),cornerAt(2,CELL_H-3),cornerAt(CELL_W-3,CELL_H-3)];
    const whiteCharacter=characterIndex===4;
    const bgThreshold=whiteCharacter?62:48;

    for(let y=0;y<CELL_H;y++){
      for(let x=0;x<CELL_W;x++){
        const p=(y*CELL_W+x)*4;
        if(d[p+3]===0)continue;
        const rgb=[d[p],d[p+1],d[p+2]];
        const closest=Math.min(...corners.map(c=>colorDistance(rgb,c)));
        if(closest<bgThreshold){
          d[p+3]=0;
          continue;
        }

        // Red girl: same female sprite geometry as pink, but rebuilt with brown hair + red clothes.
        if(characterIndex===0){
          const [h,s,v]=rgbToHsv(d[p],d[p+1],d[p+2]);
          if(s>.20 && (h>305 || h<20)){
            const upper=y<92;
            const nrgb=upper?hsvToRgb(18,.58,Math.max(.18,v*.72)):hsvToRgb(354,.78,Math.max(.26,v*.94));
            d[p]=nrgb[0];d[p+1]=nrgb[1];d[p+2]=nrgb[2];
          }
        }
      }
    }
    rctx.putImageData(image,0,0);

    const canvas=document.createElement('canvas');
    canvas.width=176;canvas.height=236;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Extra transparent room prevents the head or shoes from being cut by the game sprite bounds.
    const drawW=142,drawH=213,dx=(canvas.width-drawW)/2,dy=8;
    ctx.save();
    // Mirror alternating poses so both arms and both legs alternate instead of looking like a skateboard push.
    if(frame%2===1){
      ctx.translate(canvas.width,0);
      ctx.scale(-1,1);
      ctx.drawImage(raw,0,0,CELL_W,CELL_H,canvas.width-dx-drawW,dy,drawW,drawH);
    }else{
      ctx.drawImage(raw,0,0,CELL_W,CELL_H,dx,dy,drawW,drawH);
    }
    ctx.restore();
    return canvas;
  }

  function createProcessedFrames(scene,characterIndex){
    const texture=scene.textures.get(ATLAS_KEY);
    if(!texture||texture.key==='__MISSING')return false;
    const source=texture.getSourceImage();
    const row=ROW_BY_CHARACTER[characterIndex];

    for(let frame=0;frame<FRAME_COUNT;frame++){
      const key=frameKey(characterIndex,frame);
      if(scene.textures.exists(key))continue;
      const canvas=processFrame(source,row,frame,characterIndex);
      const tex=scene.textures.addCanvas(key,canvas);
      tex?.setFilter?.(Phaser.Textures.FilterMode.LINEAR);
    }
    return Array.from({length:FRAME_COUNT},(_,i)=>scene.textures.exists(frameKey(characterIndex,i))).every(Boolean);
  }

  function ensureAnimation(scene,characterIndex){
    const key=animationKey(characterIndex);
    if(scene.anims.exists(key))return key;
    scene.anims.create({
      key,
      frames:Array.from({length:FRAME_COUNT},(_,i)=>({key:frameKey(characterIndex,i)})),
      frameRate:FRAME_RATE,
      repeat:-1
    });
    return key;
  }

  function installRunner(scene){
    if(!scene||scene.__rasterRunnerInstalled)return;
    const characterIndex=(scene.characterIndex%6+6)%6;
    if(!createProcessedFrames(scene,characterIndex))return;

    const player=scene.player,oldArt=player?.runnerArt;
    if(!player||!oldArt)return;
    scene.__rasterRunnerInstalled=true;

    const sprite=scene.add.sprite(0,8,frameKey(characterIndex,0));
    const animKey=ensureAnimation(scene,characterIndex);
    const baseScale=1.30,sprintScale=1.38;
    sprite.setOrigin(.5,1).setScale(baseScale).setVisible(true);
    player.add(sprite);
    player.animatedRunner=sprite;
    oldArt.setVisible(false);
    sprite.play(animKey);

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
      const rate=scene.runState?.momentum>=80?SPRINT_RATE:FRAME_RATE;
      if(sprite.anims.currentAnim&&sprite.anims.currentAnim.frameRate!==rate)sprite.anims.currentAnim.frameRate=rate;
      if(!sprite.anims.isPlaying)sprite.play(animKey);
    };
    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    update();
  }

  async function loadAtlas(scene,done){
    if(scene.textures.exists(ATLAS_KEY)){done();return;}
    try{
      const parts=await Promise.all(PART_URLS.map(async url=>{
        const response=await fetch(url,{cache:'no-store'});
        if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
        return (await response.text()).replace(/\s+/g,'');
      }));
      const encoded=parts.join('');
      if(!encoded.startsWith('UklG'))throw new Error('Invalid raster runner atlas');
      scene.load.image(ATLAS_KEY,`data:image/webp;base64,${encoded}`);
      scene.load.once(Phaser.Loader.Events.COMPLETE,done);
      scene.load.once(Phaser.Loader.Events.LOAD_ERROR,file=>{
        console.error('Verb Runner raster atlas failed',file?.src||'atlas');
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
      });
      scene.load.start();
    }catch(error){
      console.error('Verb Runner raster runner failed',error);
      if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
    }
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__rasterRunnerPatched)return;
    const originalCreate=api.createVerbRunnerGame;
    api.createVerbRunnerGame=function(mount,options){
      const game=originalCreate(mount,options);
      const waitForScene=()=>{
        const scene=game?.scene?.getScene?.('VerbRunnerScene');
        if(!scene||!scene.sys?.isActive?.()){setTimeout(waitForScene,30);return;}
        if(scene.player?.runnerArt)scene.player.runnerArt.setVisible(true);
        loadAtlas(scene,()=>installRunner(scene));
      };
      setTimeout(waitForScene,0);
      return game;
    };
    api.__rasterRunnerPatched=true;
  });
})(window);
