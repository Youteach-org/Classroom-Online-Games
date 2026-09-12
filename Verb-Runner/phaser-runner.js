(function(global){
  class VerbRunnerScene extends Phaser.Scene{
    constructor(){super('VerbRunnerScene');}
    init(data){
      this.callbacks=data.callbacks||{};this.runState=data.runState;this.characterIndex=data.characterIndex||0;
      this.lane=1;this.jumping=false;this.sliding=false;this.answers=[];this.obstacles=[];this.lastAnswerLane=1;this.nextObstacleAt=650;this.active=true;this.paused=false;this.roadOffset=0;this.displayScale=1;this.desktopMode=Boolean(data.desktop);this.runnerState='run';
    }
    preload(){
      this.load.svg('vr-coastal','assets/coastal-city.svg');
      this.load.svg('vr-jump','assets/obstacle-jump.svg');
      this.load.svg('vr-slide','assets/obstacle-slide.svg');
      const sprites=window.VERB_RUNNER_SPRITES||{};
      if(this.characterIndex!==0){
        this.load.svg('vr-run-sheet',sprites.run||'assets/sprites/runner-run-sheet.svg',{width:360,height:93});
      }
      this.load.svg('vr-slide-sheet',sprites.slide||'assets/sprites/runner-slide-sheet.svg',{width:360,height:54});
    }
    isFinePointer(){return Boolean(window.matchMedia&&window.matchMedia('(pointer:fine)').matches);}
    horizonY(){return this.scale.height*(this.desktopMode?.25:.22);}
    baseY(){return this.scale.height*(this.desktopMode?.86:.82);}
    runnerScale(){return .56*this.displayScale;}
    syncViewportMode(){
      this.desktopMode=VerbRunnerRunnerCore.isDesktopViewport(this.scale.width,this.scale.height,this.isFinePointer());
      this.displayScale=VerbRunnerRunnerCore.displayScaleForViewport(this.scale.width,this.scale.height,this.isFinePointer());
      if(this.backgroundArt)this.backgroundArt.setPosition(this.scale.width/2,this.scale.height/2).setDisplaySize(this.scale.width,this.scale.height);
      if(this.player){this.player.setScale(this.runnerScale());this.player.y=this.baseY();this.player.x=this.laneX(this.lane);}
    }
    create(){
      this.syncViewportMode();this.cameras.main.setBackgroundColor('#63c9ee');this.drawWorld();
      this.player=this.makeRunner(this.scale.width/2,this.baseY(),this.characterIndex);this.player.setScale(this.runnerScale());
      this.bindControls();this.scale.on('resize',()=>this.syncViewportMode());
      this.events.on('shutdown',()=>{this.input.keyboard.removeAllKeys(true);this.scale.off('resize');});this.callbacks.ready?.(this);
    }
    drawWorld(){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();
      this.backgroundArt=this.add.image(w/2,h/2,'vr-coastal').setDepth(0).setDisplaySize(w,h);
      this.drawCoastalDetails(w,h,hy);
      this.road=this.add.graphics().setDepth(4);this.road.fillStyle(0x273647,.98);this.road.beginPath();this.road.moveTo(w*.39,hy);this.road.lineTo(w*.61,hy);this.road.lineTo(w*.92,h);this.road.lineTo(w*.08,h);this.road.closePath();this.road.fillPath();
      this.road.lineStyle(7,0x40d8ff,.68);this.road.lineBetween(w*.39,hy,w*.08,h);this.road.lineBetween(w*.61,hy,w*.92,h);
      this.road.lineStyle(3,0xffd966,.88);this.road.lineBetween(w*.395,hy,w*.1,h);this.road.lineBetween(w*.605,hy,w*.9,h);
      this.drawRoadDetails(w,h,hy);this.drawStreetLights(w,h,hy);
      this.laneGraphics=this.add.graphics().setDepth(8);this.speedLines=this.add.graphics().setDepth(8);this.drawMovingRoad(0);
    }
    drawCoastalDetails(w,h,hy){
      this.coastalGlow=this.add.graphics().setDepth(2);this.coastalGlow.fillStyle(0x69e8ff,.08);this.coastalGlow.fillRect(0,hy,w,h*.25);
      this.coastalGlow.lineStyle(2,0xffffff,.18);for(let i=0;i<5;i++)this.coastalGlow.lineBetween(0,hy+30+i*22,w*.28,hy+28+i*24);
    }
    drawRoadDetails(w,h,hy){
      this.roadDetails=this.add.graphics().setDepth(5);
      this.roadDetails.fillStyle(0xffffff,.055);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.405,hy+4);this.roadDetails.lineTo(w*.48,hy+4);this.roadDetails.lineTo(w*.43,h);this.roadDetails.lineTo(w*.15,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      this.roadDetails.fillStyle(0x00d5ff,.05);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.52,hy+4);this.roadDetails.lineTo(w*.595,hy+4);this.roadDetails.lineTo(w*.85,h);this.roadDetails.lineTo(w*.57,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      for(let i=0;i<9;i++){const t=(i+1)/10,y=Phaser.Math.Linear(hy+18,h-18,t),lx=Phaser.Math.Linear(w*.38,w*.075,t),rx=Phaser.Math.Linear(w*.62,w*.925,t),r=2+t*4;this.roadDetails.fillStyle(i%2?0x69e8ff:0xffd95c,.9);this.roadDetails.fillCircle(lx,y,r);this.roadDetails.fillCircle(rx,y,r);}
    }
    drawStreetLights(w,h,hy){
      this.streetLights=this.add.graphics().setDepth(6);for(let i=0;i<5;i++){const t=i/4,y=Phaser.Math.Linear(hy+62,h*.76,t),right=Phaser.Math.Linear(w*.69,w*.95,t),pole=32+55*t;this.streetLights.lineStyle(3+3*t,0x263f56,.95);this.streetLights.lineBetween(right,y,right,y-pole);this.streetLights.lineBetween(right,y-pole,right-15-10*t,y-pole);this.streetLights.fillStyle(0xffe889,.18);this.streetLights.fillCircle(right-16-10*t,y-pole,11+8*t);this.streetLights.fillStyle(0xffe889,.98);this.streetLights.fillCircle(right-16-10*t,y-pole,4+3*t);}
    }
    laneX(index,y=this.baseY()){const h=this.scale.height,w=this.scale.width,hy=this.horizonY(),t=Math.max(0,Math.min(1,(y-hy)/(h-hy)));const left=Phaser.Math.Linear(w*.43,w*.25,t),right=Phaser.Math.Linear(w*.57,w*.75,t);return Phaser.Math.Linear(left,right,index/2);}
    drawMovingRoad(delta){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();this.roadOffset=(this.roadOffset+delta*.38)%96;this.laneGraphics.clear();
      this.laneGraphics.lineStyle(3,0xffffff,.78);for(const factor of [1/3,2/3]){this.laneGraphics.beginPath();this.laneGraphics.moveTo(Phaser.Math.Linear(w*.39,w*.61,factor),hy);this.laneGraphics.lineTo(Phaser.Math.Linear(w*.08,w*.92,factor),h);this.laneGraphics.strokePath();}
      for(let y=hy+25+(this.roadOffset%68);y<h;y+=74){const ratio=(y-hy)/(h-hy),half=5+ratio*26;this.laneGraphics.lineStyle(5,0xffffff,.34+ratio*.44);this.laneGraphics.lineBetween(w/2-half,y,w/2+half,y);}
      this.speedLines.clear();this.speedLines.lineStyle(3,0x8aefff,.40);for(let i=0;i<12;i++){const yy=((i*102+this.roadOffset*4)%h);this.speedLines.lineBetween(w*.045,yy,w*.13,yy+38);this.speedLines.lineBetween(w*.955,yy,w*.87,yy+38);}
    }
    makeRunner(x,y,index){
      const frame=(index%6+6)%6,artKey=frame===0?'vr-slide-sheet':'vr-run-sheet',c=this.add.container(x,y).setDepth(20),shadow=this.add.ellipse(0,8,110,22,0x04111f,.30),art=this.add.image(0,8,artKey).setOrigin(.5,1);c.add([shadow,art]);c.runnerArt=art;c.shadow=shadow;this.setRunnerFrame(c,'run',index);return c;
    }
    setRunnerFrame(container,state='run',index=this.characterIndex){
      const art=container?.runnerArt;if(!art)return;const frame=(index%6+6)%6;
      if(state==='slide'){
        art.setTexture('vr-slide-sheet');art.setCrop(frame*60,0,60,54);art.setScale(4.8);art.y=8;art.setVisible(true);
      }else if(frame===0){
        art.setVisible(false);
      }else{
        art.setTexture('vr-run-sheet');art.setCrop(frame*60,0,60,93);art.setScale(state==='sprint'?4.35:4.05);art.y=8;art.setVisible(true);
      }
      this.runnerState=state;
    }
    setRunnerState(state='run'){this.setRunnerFrame(this.player,state,this.characterIndex);}
    bindControls(){const keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE'),press=(key,fn)=>key.on('down',fn);press(keys.LEFT,()=>this.shift(-1));press(keys.A,()=>this.shift(-1));press(keys.RIGHT,()=>this.shift(1));press(keys.D,()=>this.shift(1));press(keys.UP,()=>this.jump());press(keys.W,()=>this.jump());press(keys.SPACE,()=>this.jump());press(keys.DOWN,()=>this.slide());press(keys.S,()=>this.slide());let start=null;this.input.on('pointerdown',p=>{start={x:p.x,y:p.y};});this.input.on('pointerup',p=>{if(!start)return;const dx=p.x-start.x,dy=p.y-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;if(Math.abs(dx)>Math.abs(dy))this.shift(dx>0?1:-1);else if(dy<0)this.jump();else this.slide();});}
    shift(delta){if(!this.active)return;this.lane=VerbRunnerRunnerCore.moveLane(this.lane,delta);const lean=delta*.085;this.tweens.killTweensOf(this.player);this.tweens.add({targets:this.player,x:this.laneX(this.lane),rotation:lean,duration:110,ease:'Sine.easeOut',onComplete:()=>this.tweens.add({targets:this.player,rotation:0,duration:95})});}
    jump(){if(!this.active||this.jumping||this.sliding)return;this.jumping=true;this.setRunnerState('run');const baseY=this.baseY();this.tweens.add({targets:this.player,y:baseY-118*this.displayScale,scaleX:this.runnerScale()*1.04,scaleY:this.runnerScale()*1.04,duration:220,yoyo:true,ease:'Sine.easeOut',onComplete:()=>{this.jumping=false;this.player.y=baseY;this.player.setScale(this.runnerScale());this.setRunnerState(this.runState.momentum>=80?'sprint':'run');}});}
    slide(){if(!this.active||this.sliding||this.jumping)return;this.sliding=true;this.setRunnerState('slide');const baseY=this.baseY();this.tweens.add({targets:this.player,y:baseY+this.scale.height*.018,duration:75,yoyo:true,hold:330,onComplete:()=>{this.sliding=false;this.player.y=baseY;this.setRunnerState(this.runState.momentum>=80?'sprint':'run');}});}
    pickAnswerLane(){let lane=Phaser.Math.Between(0,2);if(lane===this.lastAnswerLane&&Math.random()<.7)lane=(lane+1+Phaser.Math.Between(0,1))%3;this.lastAnswerLane=lane;return lane;}
    spawnAnswer(item){
      if(!this.active)return;const y=this.horizonY()+10,lane=this.pickAnswerLane(),x=this.laneX(lane,y),box=this.add.container(x,y).setDepth(13);box.lane=lane;box.correct=item.correct;box.value=item.value;box.resolved=false;
      const width=Math.max(104,item.value.length*15),glow=this.add.rectangle(0,0,width+16,58,0x0b80ff,.2).setStrokeStyle(6,0x4acfff,.42),bg=this.add.rectangle(0,0,width,48,0x082e54,.97).setStrokeStyle(3,0x64e3ff,1),top=this.add.rectangle(0,-21,width-12,4,0xb4f6ff,.86),leftCap=this.add.rectangle(-width/2+4,0,4,30,0xff5bd5,.95),rightCap=this.add.rectangle(width/2-4,0,4,30,0x41dfff,.95),text=this.add.text(0,1,String(item.value).toUpperCase(),{fontFamily:'Arial',fontSize:'20px',fontStyle:'bold',color:'#ffffff',stroke:'#06182c',strokeThickness:4}).setOrigin(.5);box.add([glow,bg,top,leftCap,rightCap,text]);box.bg=bg;box.glow=glow;this.answers.push(box);this.callbacks.answerSpawned?.(item);
    }
    clearAnswers(){for(const answer of this.answers){if(answer?.active)answer.destroy();}this.answers=[];}
    removeAnswer(answer){if(!answer)return;if(answer.active)answer.destroy();this.answers=this.answers.filter(item=>item!==answer);}
    pickObstacleLane(){let lane=Phaser.Math.Between(0,2);const nearby=new Set(this.answers.filter(a=>a?.active&&a.y<this.scale.height*.48).map(a=>a.lane));if(nearby.has(lane)){for(let step=1;step<=2;step++){const candidate=(lane+step)%3;if(!nearby.has(candidate)){lane=candidate;break;}}}return lane;}
    spawnObstacle(){
      const type=Math.random()<.52?'crate':'barrier',key=type==='crate'?'vr-jump':'vr-slide',y=this.horizonY()+12,lane=this.pickObstacleLane(),x=this.laneX(lane,y),c=this.add.container(x,y).setDepth(12),shadow=this.add.ellipse(0,20,type==='crate'?92:120,18,0x06111c,.30),art=this.add.image(0,type==='crate'?-6:-48,key).setOrigin(.5,.5);c.type=type;c.lane=lane;c.hit=false;c.add([shadow,art]);this.obstacles.push(c);
    }
    feedbackBurst(color,stars=false){const ring=this.add.circle(this.player.x,this.player.y-22,42*this.displayScale,color,.28).setDepth(19);this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:320,onComplete:()=>ring.destroy()});if(stars){for(let i=0;i<3;i++){const s=this.add.text(this.player.x-24+i*24,this.player.y-112-i*7,'★',{fontSize:'22px',color:'#ffd84a',fontStyle:'bold'}).setDepth(25);this.tweens.add({targets:s,y:s.y-30,alpha:0,duration:520,delay:i*55,onComplete:()=>s.destroy()});}}}
    pauseRun(){if(!this.active||this.paused)return;this.paused=true;this.active=false;this.tweens.pauseAll();this.time.paused=true;this.input.enabled=false;}
    resumeRun(){if(!this.paused)return;this.time.paused=false;this.tweens.resumeAll();this.input.enabled=true;this.paused=false;this.active=true;this.nextObstacleAt=this.time.now+450;}
    update(time,delta){
      if(!this.active)return;this.drawMovingRoad(delta);const speed=VerbRunnerRunnerCore.speedForMomentum(this.runState.momentum)*1.14,dy=speed*(delta/1000),hy=this.horizonY(),h=this.scale.height;
      if(!this.jumping&&!this.sliding){const desired=this.runState.momentum>=80?'sprint':'run';if(this.runnerState!==desired)this.setRunnerState(desired);}
      for(const answer of [...this.answers]){if(!answer?.active){this.answers=this.answers.filter(item=>item!==answer);continue;}answer.y+=dy;answer.x=this.laneX(answer.lane,answer.y);const scale=.44+((answer.y-hy)/(h-hy))*.72;answer.setScale(Math.max(.42,Math.min(1.12,scale))*this.displayScale);if(!answer.resolved&&answer.y>h*.70&&answer.y<h*.9&&answer.lane===this.lane){answer.resolved=true;const item={value:answer.value,correct:answer.correct};answer.bg.setFillStyle(item.correct?0x0c5b35:0x6b1c31,1);answer.bg.setStrokeStyle(4,item.correct?0x58ff93:0xff526d,1);answer.glow.setStrokeStyle(6,item.correct?0x45ff87:0xff3d5c,.55);this.feedbackBurst(item.correct?0x46f6a7:0xff4f7a,false);this.callbacks.answerHit?.(item);this.time.delayedCall(110,()=>this.removeAnswer(answer));}else if(answer.y>h+95){const missed={value:answer.value,correct:answer.correct};this.removeAnswer(answer);this.callbacks.answerMissed?.(missed);}}
      for(const obstacle of [...this.obstacles]){obstacle.y+=dy*.96;obstacle.x=this.laneX(obstacle.lane,obstacle.y);const scale=.42+((obstacle.y-hy)/(h-hy))*.76;obstacle.setScale(Math.max(.42,Math.min(1.14,scale))*this.displayScale);if(!obstacle.hit&&obstacle.y>h*.70&&obstacle.y<h*.9&&obstacle.lane===this.lane){obstacle.hit=true;if(VerbRunnerRunnerCore.hitsObstacle(obstacle,{jumping:this.jumping,sliding:this.sliding})){this.feedbackBurst(0xffc14f,true);this.callbacks.obstacleHit?.(obstacle.type);}}if(obstacle.y>h+140){obstacle.destroy();this.obstacles=this.obstacles.filter(o=>o!==obstacle);}}
      if(time>this.nextObstacleAt){this.spawnObstacle();this.nextObstacleAt=time+780+Math.random()*360;}if(!this.jumping&&!this.sliding)this.player.rotation+=Math.sin(time/82)*.0015;
    }
    stopRun(){this.paused=false;this.active=false;this.time.paused=false;this.input.enabled=false;this.clearAnswers();for(const o of this.obstacles)o.destroy();this.obstacles=[];}
  }
  function createVerbRunnerGame(mount,options){const config={type:Phaser.AUTO,parent:mount,transparent:true,resolution:Math.min(global.devicePixelRatio||1,2),scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:VerbRunnerScene,render:{antialias:true,pixelArt:false,roundPixels:false}};const game=new Phaser.Game(config);game.scene.start('VerbRunnerScene',options);return game;}
  global.VerbRunnerPhaser={createVerbRunnerGame};
})(window);
