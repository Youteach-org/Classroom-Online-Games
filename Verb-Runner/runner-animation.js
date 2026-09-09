(function(global){
  const PALETTES=[
    {main:0xe6424c,accent:0x8d2630,hair:0x6b3a2a,type:'short'},
    {main:0x2475d1,accent:0x174a8a,hair:0x17284b,type:'long'},
    {main:0x218c4b,accent:0x155d31,hair:0x18231d,type:'headphones'},
    {main:0xf0b51e,accent:0xb87c0d,hair:0x704025,type:'ponytail'},
    {main:0xf0f2f7,accent:0xbcc5d2,hair:0xe0b45e,type:'cap'},
    {main:0x8d3fc7,accent:0x5f248e,hair:0xc34d35,type:'longHeadphones'}
  ];

  function segment(scene,color,width){
    return scene.add.rectangle(0,0,24,width,color).setOrigin(0,.5);
  }
  function placeSegment(part,x1,y1,x2,y2,thickness){
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy);
    part.setPosition(x1,y1).setDisplaySize(len,thickness).setRotation(Math.atan2(dy,dx));
  }
  function addRounded(scene,x,y,w,h,color){
    return scene.add.rectangle(x,y,w,h,color).setStrokeStyle(1,0x0d1421,.55);
  }

  function makeRig(scene,index){
    const p=PALETTES[(index%PALETTES.length+PALETTES.length)%PALETTES.length];
    const rig=scene.add.container(0,8).setScale(4.05);
    const backHair=scene.add.container(0,0);

    if(p.type==='long'){
      backHair.add([
        scene.add.ellipse(0,-64,28,40,p.hair),
        scene.add.ellipse(-9,-50,11,37,p.hair).setRotation(.12),
        scene.add.ellipse(9,-50,11,37,p.hair).setRotation(-.12)
      ]);
    }else if(p.type==='ponytail'){
      backHair.add([
        scene.add.ellipse(10,-70,17,29,p.hair).setRotation(-.25),
        scene.add.ellipse(17,-54,12,34,p.hair).setRotation(-.35)
      ]);
    }else if(p.type==='longHeadphones'){
      backHair.add([
        scene.add.ellipse(0,-61,31,42,p.hair),
        scene.add.ellipse(-10,-45,11,43,p.hair).setRotation(.14),
        scene.add.ellipse(10,-45,11,43,p.hair).setRotation(-.14)
      ]);
    }

    const thighL=segment(scene,0x1d2230,9),shinL=segment(scene,0x1d2230,8);
    const thighR=segment(scene,0x1d2230,9),shinR=segment(scene,0x1d2230,8);
    const shoeL=scene.add.ellipse(0,0,12,7,p.main).setStrokeStyle(1.4,0xffffff,.95);
    const shoeR=scene.add.ellipse(0,0,12,7,p.main).setStrokeStyle(1.4,0xffffff,.95);
    const armL=segment(scene,p.main,7),foreL=segment(scene,p.main,6);
    const armR=segment(scene,p.main,7),foreR=segment(scene,p.main,6);
    const handL=scene.add.circle(0,0,3.2,0xf1b69c),handR=scene.add.circle(0,0,3.2,0xf1b69c);

    const torso=scene.add.container(0,0);
    const jacket=addRounded(scene,0,-49,34,34,p.main);
    jacket.setStrokeStyle(2,p.accent,1);
    const hood=scene.add.ellipse(0,-62,25,13,p.accent);
    const backpack=addRounded(scene,0,-46,22,27,0x232838);
    backpack.setStrokeStyle(2,0x0c1320,1);
    const pocket=addRounded(scene,0,-45,14,6,0x39445a);
    const neck=scene.add.rectangle(0,-68,7,8,0xf0b69b);
    const head=scene.add.circle(0,-78,11,0xf0b69b);
    const hairTop=scene.add.ellipse(0,-84,23,14,p.hair);
    const hairFringeL=scene.add.triangle(-6,-80,-9,-3,0,8,5,-4,p.hair);
    const hairFringeR=scene.add.triangle(6,-80,-5,-4,0,8,9,-3,p.hair);
    torso.add([jacket,hood,backpack,pocket,neck,head,hairTop,hairFringeL,hairFringeR]);

    let accessory=null;
    if(p.type==='headphones'||p.type==='longHeadphones'){
      accessory=scene.add.container(0,0);
      const band=scene.add.arc(0,-82,12,195,345,false,p.type==='headphones'?0x35d978:0xa45cf0).setStrokeStyle(2.4,p.type==='headphones'?0x35d978:0xa45cf0,1);
      const earL=scene.add.circle(-11,-77,4,p.type==='headphones'?0x174a32:0x5f248e);
      const earR=scene.add.circle(11,-77,4,p.type==='headphones'?0x174a32:0x5f248e);
      accessory.add([band,earL,earR]);
    }else if(p.type==='cap'){
      accessory=scene.add.container(0,0);
      const cap=scene.add.ellipse(0,-85,26,11,0xf7f8fb).setStrokeStyle(1.4,0x252936,1);
      const brim=scene.add.rectangle(8,-81,12,3,0xf7f8fb).setRotation(.15).setStrokeStyle(1,0x252936,1);
      const opening=scene.add.ellipse(0,-83,9,4,0x252936);
      accessory.add([cap,brim,opening]);
    }

    rig.add([backHair,thighL,shinL,thighR,shinR,shoeL,shoeR,armL,foreL,armR,foreR,handL,handR,torso]);
    if(accessory)rig.add(accessory);
    rig.parts={p,backHair,thighL,shinL,thighR,shinR,shoeL,shoeR,armL,foreL,armR,foreR,handL,handR,torso,accessory};
    return rig;
  }

  function animateRig(scene,time){
    const rig=scene.__runnerRig,parts=rig?.parts;
    if(!rig||!parts)return;
    const art=scene.player?.runnerArt;
    if(scene.sliding){rig.setVisible(false);if(art)art.setVisible(true);return;}
    rig.setVisible(true);if(art)art.setVisible(false);

    const sprint=scene.runState?.momentum>=80;
    const phase=time*(sprint?.021:.017);
    const s=Math.sin(phase),c=Math.cos(phase);
    const liftL=Math.max(0,s),liftR=Math.max(0,-s);
    const bob=Math.abs(s)*2.3;

    const hipL={x:-6,y:-31+bob},hipR={x:6,y:-31+bob};
    const kneeL={x:-7-5*s,y:-17-10*liftL+bob};
    const kneeR={x:7+5*s,y:-17-10*liftR+bob};
    const ankleL={x:-7-8*s,y:-1-19*liftL};
    const ankleR={x:7+8*s,y:-1-19*liftR};
    placeSegment(parts.thighL,hipL.x,hipL.y,kneeL.x,kneeL.y,8.5);
    placeSegment(parts.shinL,kneeL.x,kneeL.y,ankleL.x,ankleL.y,7.2);
    placeSegment(parts.thighR,hipR.x,hipR.y,kneeR.x,kneeR.y,8.5);
    placeSegment(parts.shinR,kneeR.x,kneeR.y,ankleR.x,ankleR.y,7.2);
    parts.shoeL.setPosition(ankleL.x,ankleL.y+1).setRotation(-.25*s);
    parts.shoeR.setPosition(ankleR.x,ankleR.y+1).setRotation(.25*s);

    const arm=-s;
    const shL={x:-16,y:-57+bob},shR={x:16,y:-57+bob};
    const elL={x:-19+8*arm,y:-43+bob-Math.abs(arm)*2};
    const elR={x:19-8*arm,y:-43+bob-Math.abs(arm)*2};
    const handL={x:-20+13*arm,y:-29+bob-5*Math.max(0,arm)};
    const handR={x:20-13*arm,y:-29+bob-5*Math.max(0,-arm)};
    placeSegment(parts.armL,shL.x,shL.y,elL.x,elL.y,6.6);
    placeSegment(parts.foreL,elL.x,elL.y,handL.x,handL.y,5.8);
    placeSegment(parts.armR,shR.x,shR.y,elR.x,elR.y,6.6);
    placeSegment(parts.foreR,elR.x,elR.y,handR.x,handR.y,5.8);
    parts.handL.setPosition(handL.x,handL.y);parts.handR.setPosition(handR.x,handR.y);

    parts.torso.y=bob;parts.torso.rotation=s*.045;
    parts.backHair.y=bob;parts.backHair.rotation=-s*.025;
    if(parts.accessory){parts.accessory.y=bob;parts.accessory.rotation=s*.02;}
    rig.scaleX=sprint?4.28:4.05;rig.scaleY=sprint?4.28:4.05;
  }

  function attach(scene){
    if(!scene||scene.__articulatedRunAttached)return;
    scene.__articulatedRunAttached=true;
    if(scene.animateRunnerStride){scene.events.off('update',scene.animateRunnerStride);scene.animateRunnerStride=null;}
    scene.__runnerRig=makeRig(scene,scene.characterIndex||0);
    scene.player.add(scene.__runnerRig);
    if(scene.player.runnerArt)scene.player.runnerArt.setVisible(false);
    const update=time=>animateRig(scene,time);
    scene.events.on('update',update);
    scene.events.once('shutdown',()=>scene.events.off('update',update));
    animateRig(scene,0);
  }

  global.addEventListener('load',()=>{
    const api=global.VerbRunnerPhaser;
    if(!api||api.__articulatedRunnerPatched)return;
    const originalCreate=api.createVerbRunnerGame;
    api.createVerbRunnerGame=function(mount,options){
      const game=originalCreate(mount,options);
      const wait=()=>{
        const scene=game?.scene?.getScene?.('VerbRunnerScene');
        if(!scene||!scene.sys?.isActive?.()){setTimeout(wait,30);return;}
        attach(scene);
      };
      setTimeout(wait,0);
      return game;
    };
    api.__articulatedRunnerPatched=true;
  });
})(window);
