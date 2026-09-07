(function(global){
  class VerbRunnerScene extends Phaser.Scene{
    constructor(){super('VerbRunnerScene');}
    init(data){
      this.callbacks=data.callbacks||{};this.runState=data.runState;this.characterIndex=data.characterIndex||0;
      this.lane=1;this.jumping=false;this.sliding=false;this.answer=null;this.obstacles=[];this.lastObstacleAt=0;this.active=true;this.roadOffset=0;this.displayScale=1;this.desktopMode=Boolean(data.desktop);
    }
    isFinePointer(){return Boolean(window.matchMedia&&window.matchMedia('(pointer:fine)').matches);}
    horizonY(){return this.scale.height*(this.desktopMode?.26:.23);}
    baseY(){return this.scale.height*(this.desktopMode?.84:.80);}
    syncViewportMode(){
      this.desktopMode=VerbRunnerRunnerCore.isDesktopViewport(this.scale.width,this.scale.height,this.isFinePointer());
      this.displayScale=VerbRunnerRunnerCore.displayScaleForViewport(this.scale.width,this.scale.height,this.isFinePointer());
      if(this.player){this.player.setScale(this.displayScale);this.player.y=this.baseY();this.player.x=this.laneX(this.lane);}
    }
    create(){
      this.syncViewportMode();this.cameras.main.setBackgroundColor('#66c6ef');this.drawWorld();
      this.player=this.makeRunner(this.scale.width/2,this.baseY(),this.characterIndex);this.player.setScale(this.displayScale);
      this.bindControls();this.scale.on('resize',()=>this.syncViewportMode());
      this.events.on('shutdown',()=>{this.input.keyboard.removeAllKeys(true);this.scale.off('resize');});this.callbacks.ready?.(this);
    }
    drawWorld(){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();
      this.sky=this.add.graphics().setDepth(0);this.sky.fillGradientStyle(0x46b8f1,0x4fc4f5,0xb6e7ff,0xdaf5ff,1);this.sky.fillRect(0,0,w,h);
      this.sky.fillStyle(0xffffff,.72);for(const c of [[w*.18,h*.12,48],[w*.24,h*.105,34],[w*.77,h*.12,45],[w*.83,h*.1,31]])this.sky.fillCircle(...c);
      this.mountains=this.add.graphics().setDepth(1);this.mountains.fillStyle(0x6c8fc2,1);this.mountains.beginPath();this.mountains.moveTo(0,hy+30);this.mountains.lineTo(w*.12,hy-35);this.mountains.lineTo(w*.22,hy+10);this.mountains.lineTo(w*.37,hy-70);this.mountains.lineTo(w*.51,hy+12);this.mountains.lineTo(w*.67,hy-55);this.mountains.lineTo(w*.82,hy+8);this.mountains.lineTo(w,hy-28);this.mountains.lineTo(w,hy+70);this.mountains.lineTo(0,hy+70);this.mountains.closePath();this.mountains.fillPath();
      this.water=this.add.graphics().setDepth(2);this.water.fillStyle(0x168fd4,1);this.water.fillRect(0,hy+18,w*.28,h-hy);this.water.lineStyle(2,0xbff4ff,.65);for(let y=hy+40;y<h;y+=36)this.water.lineBetween(0,y,w*.27,y+6);
      this.city=this.add.graphics().setDepth(3);for(let i=0;i<10;i++){const x=w*.72+i*w*.035,bw=w*.038,bh=45+(i%4)*28;this.city.fillStyle(i%2?0xe6a476:0xf0c09a,1);this.city.fillRect(x,hy+4-bh,bw,bh);this.city.fillStyle(0x4c728f,.8);for(let yy=hy+14-bh;yy<hy-5;yy+=15)this.city.fillRect(x+6,yy,4,6)}
      this.rails=this.add.graphics().setDepth(5);this.rails.lineStyle(7,0xe6eef3,1);this.rails.lineBetween(0,hy+74,w*.36,h);this.rails.lineBetween(w,hy+74,w*.64,h);this.rails.lineStyle(3,0x426b7f,1);this.rails.lineBetween(0,hy+82,w*.36,h);this.rails.lineBetween(w,hy+82,w*.64,h);
      this.road=this.add.graphics().setDepth(4);this.road.fillStyle(0x4d5967,1);this.road.beginPath();this.road.moveTo(w*.39,hy);this.road.lineTo(w*.61,hy);this.road.lineTo(w*.88,h);this.road.lineTo(w*.12,h);this.road.closePath();this.road.fillPath();this.road.lineStyle(5,0xf3c63b,.9);this.road.lineBetween(w*.39,hy,w*.12,h);this.road.lineBetween(w*.61,hy,w*.88,h);
      this.roadShade=this.add.graphics().setDepth(4);this.roadShade.fillStyle(0x1f2a35,.18);this.roadShade.fillTriangle(w*.39,hy,w*.5,h,w*.12,h);this.roadShade.fillTriangle(w*.61,hy,w*.5,h,w*.88,h);
      this.palms=this.add.graphics().setDepth(5);for(let i=0;i<5;i++){const t=i/4,y=Phaser.Math.Linear(hy+38,h*.75,t),left=Phaser.Math.Linear(w*.32,w*.12,t);this.palms.lineStyle(5+5*t,0x5c4429,1);this.palms.lineBetween(left,y,left+4,y-50*(.6+t*.5));this.palms.lineStyle(7,0x1a6b49,.95);for(let a=-2;a<=2;a++)this.palms.lineBetween(left+4,y-50*(.6+t*.5),left+4+a*15,y-62*(.6+t*.5)+Math.abs(a)*5)}
      this.laneGraphics=this.add.graphics().setDepth(6);this.speedLines=this.add.graphics().setDepth(6);this.drawMovingRoad(0);
    }
    laneX(index,y=this.baseY()){
      const h=this.scale.height,w=this.scale.width,hy=this.horizonY(),t=Math.max(0,Math.min(1,(y-hy)/(h-hy)));
      const left=Phaser.Math.Linear(w*.43,w*.27,t),right=Phaser.Math.Linear(w*.57,w*.73,t);return Phaser.Math.Linear(left,right,index/2);
    }
    drawMovingRoad(delta){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();this.roadOffset=(this.roadOffset+delta*.28)%92;this.laneGraphics.clear();
      this.laneGraphics.lineStyle(3,0xffffff,.72);for(const factor of [1/3,2/3]){this.laneGraphics.beginPath();this.laneGraphics.moveTo(Phaser.Math.Linear(w*.39,w*.61,factor),hy);this.laneGraphics.lineTo(Phaser.Math.Linear(w*.12,w*.88,factor),h);this.laneGraphics.strokePath();}
      for(let y=hy+35+(this.roadOffset%80);y<h;y+=88){const ratio=(y-hy)/(h-hy),half=4+ratio*22;this.laneGraphics.lineStyle(5,0xffffff,.4+ratio*.35);this.laneGraphics.lineBetween(w/2-half,y,w/2+half,y);}
      this.speedLines.clear();this.speedLines.lineStyle(3,0x9eeeff,.28);for(let i=0;i<8;i++){const yy=((i*145+this.roadOffset*3)%h);this.speedLines.lineBetween(w*.08,yy,w*.14,yy+30);this.speedLines.lineBetween(w*.92,yy,w*.86,yy+30);}
    }
    makeRunner(x,y,index){
      const accents=[0xff3f58,0xff48c7,0x36b9ff,0xffc52f,0x45e082,0xb94cff],accent=accents[index%accents.length];const c=this.add.container(x,y).setDepth(20),shadow=this.add.ellipse(0,44,74,16,0x000000,.35),g=this.add.graphics();
      g.fillStyle(0x121925,1);g.fillEllipse(0,-72,34,30);g.fillStyle(0xe9b58b,1);g.fillCircle(0,-63,15);g.fillStyle(0x121925,1);g.fillEllipse(0,-72,33,18);
      g.fillStyle(0x15253a,1);g.fillRoundedRect(-28,-51,56,72,17);g.fillStyle(accent,1);g.fillRoundedRect(-24,-48,48,28,12);g.fillStyle(0x0e1828,1);g.fillRoundedRect(-19,-38,38,43,10);g.lineStyle(4,accent,.95);g.strokeRoundedRect(-19,-38,38,43,10);
      g.lineStyle(10,0x1a2940,1);g.lineBetween(-21,-32,-38,2);g.lineBetween(21,-32,38,2);g.lineBetween(-13,13,-20,44);g.lineBetween(13,13,20,44);g.lineStyle(6,accent,1);g.lineBetween(-22,43,-6,43);g.lineBetween(6,43,22,43);c.add([shadow,g]);return c;
    }
    bindControls(){
      const keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE'),press=(key,fn)=>key.on('down',fn);press(keys.LEFT,()=>this.shift(-1));press(keys.A,()=>this.shift(-1));press(keys.RIGHT,()=>this.shift(1));press(keys.D,()=>this.shift(1));press(keys.UP,()=>this.jump());press(keys.W,()=>this.jump());press(keys.SPACE,()=>this.jump());press(keys.DOWN,()=>this.slide());press(keys.S,()=>this.slide());let start=null;this.input.on('pointerdown',p=>{start={x:p.x,y:p.y};});this.input.on('pointerup',p=>{if(!start)return;const dx=p.x-start.x,dy=p.y-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;if(Math.abs(dx)>Math.abs(dy))this.shift(dx>0?1:-1);else if(dy<0)this.jump();else this.slide();});
    }
    shift(delta){if(!this.active)return;this.lane=VerbRunnerRunnerCore.moveLane(this.lane,delta);this.tweens.add({targets:this.player,x:this.laneX(this.lane),duration:120,ease:'Sine.easeOut'});}
    jump(){if(!this.active||this.jumping||this.sliding)return;this.jumping=true;const baseY=this.baseY();this.tweens.add({targets:this.player,y:baseY-105*this.displayScale,duration:230,yoyo:true,ease:'Sine.easeOut',onComplete:()=>{this.jumping=false;this.player.y=baseY;}});}
    slide(){if(!this.active||this.sliding||this.jumping)return;this.sliding=true;const baseY=this.baseY();this.tweens.add({targets:this.player,scaleY:this.displayScale*.48,y:baseY+this.scale.height*.025,duration:90,yoyo:true,hold:350,onComplete:()=>{this.sliding=false;this.player.setScale(this.displayScale);this.player.y=baseY;}});}
    spawnAnswer(item){
      if(!this.active)return;const y=this.horizonY()+8,lane=Phaser.Math.Between(0,2),x=this.laneX(lane,y),box=this.add.container(x,y).setDepth(13);box.lane=lane;box.correct=item.correct;box.value=item.value;box.resolved=false;
      const glow=this.add.rectangle(0,0,Math.max(118,item.value.length*17)+10,62,0x0b80ff,.18).setStrokeStyle(5,0x34bfff,.28),bg=this.add.rectangle(0,0,Math.max(118,item.value.length*17),54,0x0b3158,.96).setStrokeStyle(3,0x4bd9ff,1),text=this.add.text(0,0,String(item.value).toUpperCase(),{fontFamily:'Arial',fontSize:'23px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);box.add([glow,bg,text]);box.bg=bg;box.glow=glow;this.answer=box;this.callbacks.answerSpawned?.(item);
    }
    spawnObstacle(){
      const type=Math.random()<.5?'crate':'barrier',y=this.horizonY()+8,lane=Phaser.Math.Between(0,2),x=this.laneX(lane,y),c=this.add.container(x,y).setDepth(12),g=this.add.graphics();c.type=type;c.lane=lane;c.hit=false;
      if(type==='crate'){g.fillStyle(0x3b2b26,1);g.fillRoundedRect(-34,-31,68,62,8);g.lineStyle(4,0xff5a48,1);g.strokeRoundedRect(-34,-31,68,62,8);g.lineStyle(8,0xff4037,1);g.lineBetween(-18,-17,18,17);g.lineBetween(18,-17,-18,17);}
      else{g.fillStyle(0x172333,1);g.fillRect(-50,-50,100,12);for(let i=0;i<5;i++){g.fillStyle(i%2?0x1c2733:0xffbd2e,1);g.fillRect(-50+i*20,-50,20,12)}g.fillStyle(0x26394b,1);g.fillRect(-45,-38,8,52);g.fillRect(37,-38,8,52);}c.add(g);this.obstacles.push(c);
    }
    feedbackBurst(color,stars=false){
      const ring=this.add.circle(this.player.x,this.player.y-22,42*this.displayScale,color,.28).setDepth(19);this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:320,onComplete:()=>ring.destroy()});
      if(stars){for(let i=0;i<3;i++){const s=this.add.text(this.player.x-24+i*24,this.player.y-98-i*7,'★',{fontSize:'22px',color:'#ffd84a',fontStyle:'bold'}).setDepth(25);this.tweens.add({targets:s,y:s.y-30,alpha:0,duration:520,delay:i*55,onComplete:()=>s.destroy()});}}
    }
    update(time,delta){
      if(!this.active)return;this.drawMovingRoad(delta);const speed=VerbRunnerRunnerCore.speedForMomentum(this.runState.momentum),dy=speed*(delta/1000),hy=this.horizonY(),h=this.scale.height;
      if(this.answer){this.answer.y+=dy;this.answer.x=this.laneX(this.answer.lane,this.answer.y);const scale=.48+((this.answer.y-hy)/(h-hy))*.75;this.answer.setScale(Math.max(.46,Math.min(1.18,scale))*this.displayScale);if(!this.answer.resolved&&this.answer.y>h*.72&&this.answer.y<h*.9&&this.answer.lane===this.lane){this.answer.resolved=true;const item={value:this.answer.value,correct:this.answer.correct};this.answer.bg.setFillStyle(item.correct?0x0c5b35:0x6b1c31,1);this.answer.bg.setStrokeStyle(4,item.correct?0x58ff93:0xff526d,1);this.answer.glow.setStrokeStyle(6,item.correct?0x45ff87:0xff3d5c,.45);this.feedbackBurst(item.correct?0x46f6a7:0xff4f7a,false);this.callbacks.answerHit?.(item);this.time.delayedCall(120,()=>{this.answer?.destroy();this.answer=null;});}else if(this.answer.y>h+90){const missed=this.answer;this.answer=null;missed.destroy();this.callbacks.answerMissed?.({value:missed.value,correct:missed.correct});}}
      for(const obstacle of [...this.obstacles]){obstacle.y+=dy*.96;obstacle.x=this.laneX(obstacle.lane,obstacle.y);const scale=.45+((obstacle.y-hy)/(h-hy))*.82;obstacle.setScale(Math.max(.46,Math.min(1.22,scale))*this.displayScale);if(!obstacle.hit&&obstacle.y>h*.72&&obstacle.y<h*.9&&obstacle.lane===this.lane){obstacle.hit=true;if(VerbRunnerRunnerCore.hitsObstacle(obstacle,{jumping:this.jumping,sliding:this.sliding})){this.feedbackBurst(0xffc14f,true);this.callbacks.obstacleHit?.(obstacle.type);}}if(obstacle.y>h+110){obstacle.destroy();this.obstacles=this.obstacles.filter(o=>o!==obstacle);}}
      if(time-this.lastObstacleAt>1850&&(!this.answer||this.answer.y>h*.5)){this.lastObstacleAt=time;this.spawnObstacle();}this.player.rotation=Math.sin(time/90)*.014;
    }
    stopRun(){this.active=false;if(this.answer){this.answer.destroy();this.answer=null;}for(const o of this.obstacles)o.destroy();this.obstacles=[];}
  }
  function createVerbRunnerGame(mount,options){const config={type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:VerbRunnerScene,render:{antialias:true,pixelArt:false}};const game=new Phaser.Game(config);game.scene.start('VerbRunnerScene',options);return game;}
  global.VerbRunnerPhaser={createVerbRunnerGame};
})(window);
