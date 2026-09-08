(function(global){
  class VerbRunnerScene extends Phaser.Scene{
    constructor(){super('VerbRunnerScene');}
    init(data){
      this.callbacks=data.callbacks||{};this.runState=data.runState;this.characterIndex=data.characterIndex||0;
      this.lane=1;this.jumping=false;this.sliding=false;this.answers=[];this.obstacles=[];this.lastAnswerLane=1;this.nextObstacleAt=900;this.active=true;this.paused=false;this.roadOffset=0;this.displayScale=1;this.desktopMode=Boolean(data.desktop);
    }
    isFinePointer(){return Boolean(window.matchMedia&&window.matchMedia('(pointer:fine)').matches);}
    horizonY(){return this.scale.height*(this.desktopMode?.25:.22);}
    baseY(){return this.scale.height*(this.desktopMode?.84:.80);}
    syncViewportMode(){
      this.desktopMode=VerbRunnerRunnerCore.isDesktopViewport(this.scale.width,this.scale.height,this.isFinePointer());
      this.displayScale=VerbRunnerRunnerCore.displayScaleForViewport(this.scale.width,this.scale.height,this.isFinePointer());
      if(this.player){this.player.setScale(this.displayScale);this.player.y=this.baseY();this.player.x=this.laneX(this.lane);}
    }
    create(){
      this.syncViewportMode();this.cameras.main.setBackgroundColor('#72cef3');this.drawWorld();
      this.player=this.makeRunner(this.scale.width/2,this.baseY(),this.characterIndex);this.player.setScale(this.displayScale);
      this.bindControls();this.scale.on('resize',()=>this.syncViewportMode());
      this.events.on('shutdown',()=>{this.input.keyboard.removeAllKeys(true);this.scale.off('resize');});this.callbacks.ready?.(this);
    }
    drawWorld(){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();
      this.sky=this.add.graphics().setDepth(0);this.sky.fillGradientStyle(0x35afe9,0x54c8f4,0xbfeeff,0xf1fbff,1);this.sky.fillRect(0,0,w,h);
      this.sky.fillStyle(0xfff1a8,.92);this.sky.fillCircle(w*.13,h*.12,42);this.sky.fillStyle(0xffffff,.8);for(const c of [[w*.24,h*.115,42],[w*.29,h*.105,28],[w*.72,h*.1,38],[w*.77,h*.09,25]])this.sky.fillCircle(...c);
      this.mountains=this.add.graphics().setDepth(1);this.mountains.fillStyle(0x7f9ac6,1);this.mountains.beginPath();this.mountains.moveTo(0,hy+34);this.mountains.lineTo(w*.11,hy-30);this.mountains.lineTo(w*.22,hy+7);this.mountains.lineTo(w*.36,hy-66);this.mountains.lineTo(w*.51,hy+8);this.mountains.lineTo(w*.66,hy-48);this.mountains.lineTo(w*.81,hy+7);this.mountains.lineTo(w,hy-26);this.mountains.lineTo(w,hy+78);this.mountains.lineTo(0,hy+78);this.mountains.closePath();this.mountains.fillPath();
      this.drawCoastalDetails(w,h,hy);
      this.road=this.add.graphics().setDepth(4);this.road.fillStyle(0x465362,1);this.road.beginPath();this.road.moveTo(w*.39,hy);this.road.lineTo(w*.61,hy);this.road.lineTo(w*.9,h);this.road.lineTo(w*.1,h);this.road.closePath();this.road.fillPath();this.road.lineStyle(6,0xf5cb3d,.96);this.road.lineBetween(w*.39,hy,w*.1,h);this.road.lineBetween(w*.61,hy,w*.9,h);
      this.roadShade=this.add.graphics().setDepth(4);this.roadShade.fillStyle(0x14202d,.17);this.roadShade.fillTriangle(w*.39,hy,w*.5,h,w*.1,h);this.roadShade.fillTriangle(w*.61,hy,w*.5,h,w*.9,h);
      this.drawRoadDetails(w,h,hy);this.drawStreetLights(w,h,hy);
      this.rails=this.add.graphics().setDepth(7);this.rails.lineStyle(8,0xf5fafc,1);this.rails.lineBetween(0,hy+80,w*.35,h);this.rails.lineBetween(w,hy+80,w*.65,h);this.rails.lineStyle(3,0x365a70,1);this.rails.lineBetween(0,hy+90,w*.35,h);this.rails.lineBetween(w,hy+90,w*.65,h);
      this.laneGraphics=this.add.graphics().setDepth(8);this.speedLines=this.add.graphics().setDepth(8);this.drawMovingRoad(0);
    }
    drawCoastalDetails(w,h,hy){
      this.coastalDetails=this.add.graphics().setDepth(2);
      this.coastalDetails.fillStyle(0x178ed0,1);this.coastalDetails.fillRect(0,hy+16,w*.31,h-hy);
      this.coastalDetails.fillStyle(0x49c8ed,.7);for(let y=hy+35;y<h;y+=31)this.coastalDetails.fillRect(0,y,w*.28,3);
      this.coastalDetails.fillStyle(0xf0d39b,1);this.coastalDetails.beginPath();this.coastalDetails.moveTo(0,hy+90);this.coastalDetails.lineTo(w*.31,hy+48);this.coastalDetails.lineTo(w*.24,h);this.coastalDetails.lineTo(0,h);this.coastalDetails.closePath();this.coastalDetails.fillPath();
      this.coastalDetails.fillStyle(0xffffff,.8);for(const boat of [[w*.07,hy+62],[w*.18,hy+88]]){this.coastalDetails.fillTriangle(boat[0],boat[1]-14,boat[0],boat[1]+5,boat[0]+20,boat[1]+5);this.coastalDetails.fillStyle(0x184a68,.9);this.coastalDetails.fillRect(boat[0]-3,boat[1]+5,27,4);this.coastalDetails.fillStyle(0xffffff,.8);}
      this.city=this.add.graphics().setDepth(3);for(let i=0;i<14;i++){const x=w*.69+i*w*.024,bw=w*.028,bh=42+(i%5)*23;this.city.fillStyle(i%3===0?0xf2b982:i%3===1?0xf4d4a7:0xdce9ef,1);this.city.fillRoundedRect(x,hy+10-bh,bw,bh,2);this.city.fillStyle(0x3b6f8e,.75);for(let yy=hy+20-bh;yy<hy;yy+=13)for(let xx=x+5;xx<x+bw-3;xx+=9)this.city.fillRect(xx,yy,4,5);}
      this.palms=this.add.graphics().setDepth(6);for(let i=0;i<6;i++){const t=i/5,y=Phaser.Math.Linear(hy+45,h*.76,t),left=Phaser.Math.Linear(w*.32,w*.08,t);this.palms.lineStyle(4+7*t,0x6b4930,1);this.palms.lineBetween(left,y,left+5,y-50*(.65+t*.6));this.palms.lineStyle(7,0x19724e,.96);for(let a=-2;a<=2;a++)this.palms.lineBetween(left+5,y-50*(.65+t*.6),left+5+a*15,y-65*(.65+t*.6)+Math.abs(a)*6);}
    }
    drawRoadDetails(w,h,hy){
      this.roadDetails=this.add.graphics().setDepth(5);
      this.roadDetails.fillStyle(0xffffff,.08);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.405,hy+6);this.roadDetails.lineTo(w*.48,hy+6);this.roadDetails.lineTo(w*.43,h);this.roadDetails.lineTo(w*.16,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      this.roadDetails.fillStyle(0xffffff,.04);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.52,hy+6);this.roadDetails.lineTo(w*.595,hy+6);this.roadDetails.lineTo(w*.84,h);this.roadDetails.lineTo(w*.57,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      this.roadDetails.lineStyle(2,0xa7d6e8,.28);this.roadDetails.lineBetween(w*.38,hy+18,w*.075,h);this.roadDetails.lineBetween(w*.62,hy+18,w*.925,h);
      for(let i=0;i<8;i++){const t=(i+1)/9,y=Phaser.Math.Linear(hy+20,h-20,t),lx=Phaser.Math.Linear(w*.37,w*.08,t),rx=Phaser.Math.Linear(w*.63,w*.92,t),r=2+t*4;this.roadDetails.fillStyle(i%2?0xffd84c:0xf7fbff,.88);this.roadDetails.fillCircle(lx,y,r);this.roadDetails.fillCircle(rx,y,r);}
    }
    drawStreetLights(w,h,hy){
      this.streetLights=this.add.graphics().setDepth(6);
      for(let i=0;i<5;i++){
        const t=i/4,y=Phaser.Math.Linear(hy+58,h*.74,t),right=Phaser.Math.Linear(w*.7,w*.94,t),pole=30+50*t;
        this.streetLights.lineStyle(3+3*t,0x38566b,1);this.streetLights.lineBetween(right,y,right,y-pole);this.streetLights.lineBetween(right,y-pole,right-13-9*t,y-pole);
        this.streetLights.fillStyle(0xffe47c,.95);this.streetLights.fillCircle(right-14-9*t,y-pole,4+3*t);
      }
    }
    laneX(index,y=this.baseY()){
      const h=this.scale.height,w=this.scale.width,hy=this.horizonY(),t=Math.max(0,Math.min(1,(y-hy)/(h-hy)));
      const left=Phaser.Math.Linear(w*.43,w*.26,t),right=Phaser.Math.Linear(w*.57,w*.74,t);return Phaser.Math.Linear(left,right,index/2);
    }
    drawMovingRoad(delta){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();this.roadOffset=(this.roadOffset+delta*.36)%96;this.laneGraphics.clear();
      this.laneGraphics.lineStyle(3,0xffffff,.76);for(const factor of [1/3,2/3]){this.laneGraphics.beginPath();this.laneGraphics.moveTo(Phaser.Math.Linear(w*.39,w*.61,factor),hy);this.laneGraphics.lineTo(Phaser.Math.Linear(w*.1,w*.9,factor),h);this.laneGraphics.strokePath();}
      for(let y=hy+25+(this.roadOffset%72);y<h;y+=78){const ratio=(y-hy)/(h-hy),half=5+ratio*26;this.laneGraphics.lineStyle(5,0xffffff,.34+ratio*.42);this.laneGraphics.lineBetween(w/2-half,y,w/2+half,y);}
      this.speedLines.clear();this.speedLines.lineStyle(3,0xc4f6ff,.34);for(let i=0;i<10;i++){const yy=((i*118+this.roadOffset*4)%h);this.speedLines.lineBetween(w*.045,yy,w*.13,yy+36);this.speedLines.lineBetween(w*.955,yy,w*.87,yy+36);}
    }
    makeRunner(x,y,index){
      const accents=[0xff3f58,0xff48c7,0x36b9ff,0xffc52f,0x45e082,0xb94cff],accent=accents[index%accents.length];const c=this.add.container(x,y).setDepth(20),shadow=this.add.ellipse(0,44,78,17,0x000000,.32),g=this.add.graphics();
      g.fillStyle(0x121925,1);g.fillEllipse(0,-72,34,30);g.fillStyle(0xe9b58b,1);g.fillCircle(0,-63,15);g.fillStyle(0x121925,1);g.fillEllipse(0,-72,33,18);
      g.fillStyle(0x15253a,1);g.fillRoundedRect(-28,-51,56,72,17);g.fillStyle(accent,1);g.fillRoundedRect(-24,-48,48,28,12);g.fillStyle(0x0e1828,1);g.fillRoundedRect(-19,-38,38,43,10);g.lineStyle(4,accent,.95);g.strokeRoundedRect(-19,-38,38,43,10);
      g.lineStyle(10,0x1a2940,1);g.lineBetween(-21,-32,-38,2);g.lineBetween(21,-32,38,2);g.lineBetween(-13,13,-20,44);g.lineBetween(13,13,20,44);g.lineStyle(6,accent,1);g.lineBetween(-22,43,-6,43);g.lineBetween(6,43,22,43);c.add([shadow,g]);return c;
    }
    bindControls(){
      const keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE'),press=(key,fn)=>key.on('down',fn);press(keys.LEFT,()=>this.shift(-1));press(keys.A,()=>this.shift(-1));press(keys.RIGHT,()=>this.shift(1));press(keys.D,()=>this.shift(1));press(keys.UP,()=>this.jump());press(keys.W,()=>this.jump());press(keys.SPACE,()=>this.jump());press(keys.DOWN,()=>this.slide());press(keys.S,()=>this.slide());let start=null;this.input.on('pointerdown',p=>{start={x:p.x,y:p.y};});this.input.on('pointerup',p=>{if(!start)return;const dx=p.x-start.x,dy=p.y-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;if(Math.abs(dx)>Math.abs(dy))this.shift(dx>0?1:-1);else if(dy<0)this.jump();else this.slide();});
    }
    shift(delta){if(!this.active)return;this.lane=VerbRunnerRunnerCore.moveLane(this.lane,delta);this.tweens.add({targets:this.player,x:this.laneX(this.lane),duration:110,ease:'Sine.easeOut'});}
    jump(){if(!this.active||this.jumping||this.sliding)return;this.jumping=true;const baseY=this.baseY();this.tweens.add({targets:this.player,y:baseY-108*this.displayScale,duration:215,yoyo:true,ease:'Sine.easeOut',onComplete:()=>{this.jumping=false;this.player.y=baseY;}});}
    slide(){if(!this.active||this.sliding||this.jumping)return;this.sliding=true;const baseY=this.baseY();this.tweens.add({targets:this.player,scaleY:this.displayScale*.48,y:baseY+this.scale.height*.025,duration:85,yoyo:true,hold:330,onComplete:()=>{this.sliding=false;this.player.setScale(this.displayScale);this.player.y=baseY;}});}
    pickAnswerLane(){let lane=Phaser.Math.Between(0,2);if(lane===this.lastAnswerLane&&Math.random()<.7)lane=(lane+1+Phaser.Math.Between(0,1))%3;this.lastAnswerLane=lane;return lane;}
    spawnAnswer(item){
      if(!this.active)return;const y=this.horizonY()+10,lane=this.pickAnswerLane(),x=this.laneX(lane,y),box=this.add.container(x,y).setDepth(13);box.lane=lane;box.correct=item.correct;box.value=item.value;box.resolved=false;
      const width=Math.max(122,item.value.length*18),glow=this.add.rectangle(0,0,width+14,66,0x0b80ff,.17).setStrokeStyle(6,0x4acfff,.3),bg=this.add.rectangle(0,0,width,56,0x0a3157,.97).setStrokeStyle(3,0x64e3ff,1),top=this.add.rectangle(0,-25,width-12,4,0x9af2ff,.7),text=this.add.text(0,1,String(item.value).toUpperCase(),{fontFamily:'Arial',fontSize:'23px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);box.add([glow,bg,top,text]);box.bg=bg;box.glow=glow;this.answers.push(box);this.callbacks.answerSpawned?.(item);
    }
    clearAnswers(){for(const answer of this.answers){if(answer?.active)answer.destroy();}this.answers=[];}
    removeAnswer(answer){if(!answer)return;if(answer.active)answer.destroy();this.answers=this.answers.filter(item=>item!==answer);}
    spawnObstacle(){
      const type=Math.random()<.52?'crate':'barrier',y=this.horizonY()+12,lane=Phaser.Math.Between(0,2),x=this.laneX(lane,y),c=this.add.container(x,y).setDepth(12),g=this.add.graphics();c.type=type;c.lane=lane;c.hit=false;
      if(type==='crate'){
        g.fillStyle(0x243343,1);g.fillRoundedRect(-36,-32,72,64,7);g.lineStyle(4,0xff5a48,1);g.strokeRoundedRect(-36,-32,72,64,7);g.fillStyle(0xff4f43,.95);g.fillRect(-31,-27,62,8);g.lineStyle(7,0xffd24b,1);g.lineBetween(-18,-15,18,17);g.lineBetween(18,-15,-18,17);
      }else{
        g.fillStyle(0x203445,1);g.fillRoundedRect(-54,-51,108,15,4);for(let i=0;i<6;i++){g.fillStyle(i%2?0x1d2b37:0xffc338,1);g.fillRect(-54+i*18,-51,18,15);}g.fillStyle(0x31495c,1);g.fillRect(-47,-36,9,53);g.fillRect(38,-36,9,53);g.fillStyle(0x67dfff,.65);g.fillCircle(-43,15,5);g.fillCircle(43,15,5);
      }c.add(g);this.obstacles.push(c);
    }
    feedbackBurst(color,stars=false){
      const ring=this.add.circle(this.player.x,this.player.y-22,42*this.displayScale,color,.28).setDepth(19);this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:320,onComplete:()=>ring.destroy()});
      if(stars){for(let i=0;i<3;i++){const s=this.add.text(this.player.x-24+i*24,this.player.y-98-i*7,'★',{fontSize:'22px',color:'#ffd84a',fontStyle:'bold'}).setDepth(25);this.tweens.add({targets:s,y:s.y-30,alpha:0,duration:520,delay:i*55,onComplete:()=>s.destroy()});}}
    }
    pauseRun(){
      if(!this.active||this.paused)return;
      this.paused=true;this.active=false;this.tweens.pauseAll();this.time.paused=true;this.input.enabled=false;
    }
    resumeRun(){
      if(!this.paused)return;
      this.time.paused=false;this.tweens.resumeAll();this.input.enabled=true;this.paused=false;this.active=true;this.nextObstacleAt=this.time.now+650;
    }
    update(time,delta){
      if(!this.active)return;this.drawMovingRoad(delta);const speed=VerbRunnerRunnerCore.speedForMomentum(this.runState.momentum)*1.14,dy=speed*(delta/1000),hy=this.horizonY(),h=this.scale.height;
      for(const answer of [...this.answers]){
        if(!answer?.active){this.answers=this.answers.filter(item=>item!==answer);continue;}
        answer.y+=dy;answer.x=this.laneX(answer.lane,answer.y);const scale=.46+((answer.y-hy)/(h-hy))*.78;answer.setScale(Math.max(.44,Math.min(1.2,scale))*this.displayScale);
        if(!answer.resolved&&answer.y>h*.70&&answer.y<h*.9&&answer.lane===this.lane){
          answer.resolved=true;const item={value:answer.value,correct:answer.correct};answer.bg.setFillStyle(item.correct?0x0c5b35:0x6b1c31,1);answer.bg.setStrokeStyle(4,item.correct?0x58ff93:0xff526d,1);answer.glow.setStrokeStyle(6,item.correct?0x45ff87:0xff3d5c,.45);this.feedbackBurst(item.correct?0x46f6a7:0xff4f7a,false);this.callbacks.answerHit?.(item);this.time.delayedCall(110,()=>this.removeAnswer(answer));
        }else if(answer.y>h+95){const missed={value:answer.value,correct:answer.correct};this.removeAnswer(answer);this.callbacks.answerMissed?.(missed);}
      }
      for(const obstacle of [...this.obstacles]){
        obstacle.y+=dy*.96;obstacle.x=this.laneX(obstacle.lane,obstacle.y);const scale=.44+((obstacle.y-hy)/(h-hy))*.84;obstacle.setScale(Math.max(.45,Math.min(1.24,scale))*this.displayScale);
        if(!obstacle.hit&&obstacle.y>h*.70&&obstacle.y<h*.9&&obstacle.lane===this.lane){obstacle.hit=true;if(VerbRunnerRunnerCore.hitsObstacle(obstacle,{jumping:this.jumping,sliding:this.sliding})){this.feedbackBurst(0xffc14f,true);this.callbacks.obstacleHit?.(obstacle.type);}}
        if(obstacle.y>h+110){obstacle.destroy();this.obstacles=this.obstacles.filter(o=>o!==obstacle);}
      }
      if(time>this.nextObstacleAt){this.spawnObstacle();this.nextObstacleAt=time+1150+Math.random()*450;}
      this.player.rotation=Math.sin(time/82)*.016;
    }
    stopRun(){this.paused=false;this.active=false;this.time.paused=false;this.input.enabled=false;this.clearAnswers();for(const o of this.obstacles)o.destroy();this.obstacles=[];}
  }
  function createVerbRunnerGame(mount,options){const config={type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:VerbRunnerScene,render:{antialias:true,pixelArt:false}};const game=new Phaser.Game(config);game.scene.start('VerbRunnerScene',options);return game;}
  global.VerbRunnerPhaser={createVerbRunnerGame};
})(window);
