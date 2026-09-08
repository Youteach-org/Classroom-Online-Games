(function(global){
  class VerbRunnerScene extends Phaser.Scene{
    constructor(){super('VerbRunnerScene');}
    init(data){
      this.callbacks=data.callbacks||{};this.runState=data.runState;this.characterIndex=data.characterIndex||0;
      this.lane=1;this.jumping=false;this.sliding=false;this.answers=[];this.obstacles=[];this.lastAnswerLane=1;this.nextObstacleAt=650;this.active=true;this.paused=false;this.roadOffset=0;this.displayScale=1;this.desktopMode=Boolean(data.desktop);
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
      this.sky=this.add.graphics().setDepth(0);this.sky.fillGradientStyle(0x2aa8e4,0x54c8f4,0xbfeeff,0xf5fcff,1);this.sky.fillRect(0,0,w,h);
      this.sky.fillStyle(0xfff2a3,.95);this.sky.fillCircle(w*.13,h*.115,44);
      this.drawAtmosphereDetails(w,h,hy);
      this.mountains=this.add.graphics().setDepth(1);this.mountains.fillStyle(0x7894bf,1);this.mountains.beginPath();this.mountains.moveTo(0,hy+34);this.mountains.lineTo(w*.1,hy-28);this.mountains.lineTo(w*.2,hy+8);this.mountains.lineTo(w*.35,hy-70);this.mountains.lineTo(w*.5,hy+8);this.mountains.lineTo(w*.65,hy-50);this.mountains.lineTo(w*.8,hy+7);this.mountains.lineTo(w,hy-28);this.mountains.lineTo(w,hy+80);this.mountains.lineTo(0,hy+80);this.mountains.closePath();this.mountains.fillPath();
      this.mountains.fillStyle(0xaec5dc,.7);this.mountains.fillTriangle(w*.31,hy-51,w*.35,hy-70,w*.39,hy-48);this.mountains.fillTriangle(w*.62,hy-39,w*.65,hy-50,w*.69,hy-32);
      this.drawCoastalDetails(w,h,hy);this.drawBoardwalkDetails(w,h,hy);
      this.road=this.add.graphics().setDepth(4);this.road.fillStyle(0x3f4c5b,1);this.road.beginPath();this.road.moveTo(w*.39,hy);this.road.lineTo(w*.61,hy);this.road.lineTo(w*.9,h);this.road.lineTo(w*.1,h);this.road.closePath();this.road.fillPath();this.road.lineStyle(6,0xf5cb3d,.96);this.road.lineBetween(w*.39,hy,w*.1,h);this.road.lineBetween(w*.61,hy,w*.9,h);
      this.roadShade=this.add.graphics().setDepth(4);this.roadShade.fillStyle(0x10202f,.18);this.roadShade.fillTriangle(w*.39,hy,w*.5,h,w*.1,h);this.roadShade.fillTriangle(w*.61,hy,w*.5,h,w*.9,h);
      this.drawRoadDetails(w,h,hy);this.drawStreetLights(w,h,hy);
      this.rails=this.add.graphics().setDepth(7);this.rails.lineStyle(8,0xf5fafc,1);this.rails.lineBetween(0,hy+80,w*.35,h);this.rails.lineBetween(w,hy+80,w*.65,h);this.rails.lineStyle(3,0x365a70,1);this.rails.lineBetween(0,hy+90,w*.35,h);this.rails.lineBetween(w,hy+90,w*.65,h);
      this.laneGraphics=this.add.graphics().setDepth(8);this.speedLines=this.add.graphics().setDepth(8);this.drawMovingRoad(0);
    }
    drawAtmosphereDetails(w,h,hy){
      this.cloudShadows=this.add.graphics().setDepth(.5);this.cloudShadows.fillStyle(0xffffff,.76);
      for(const cloud of [[w*.25,h*.1,56,16],[w*.72,h*.09,48,14],[w*.84,h*.145,34,11]]){const [x,y,rx,ry]=cloud;this.cloudShadows.fillEllipse(x,y,rx*2,ry*2);this.cloudShadows.fillCircle(x-rx*.45,y-ry*.45,ry*1.15);this.cloudShadows.fillCircle(x+rx*.28,y-ry*.62,ry*1.35);}
      this.cloudShadows.lineStyle(2,0x3a6d88,.45);for(let i=0;i<4;i++){const x=w*(.42+i*.035),y=hy*.48+(i%2)*8;this.cloudShadows.beginPath();this.cloudShadows.arc(x,y,7,Math.PI*1.08,Math.PI*1.92);this.cloudShadows.strokePath();}
      this.bridge=this.add.graphics().setDepth(1.5);this.bridge.lineStyle(3,0xd8edf5,.65);this.bridge.lineBetween(w*.02,hy+25,w*.22,hy+12);for(let i=0;i<5;i++){const x=w*(.03+i*.045);this.bridge.lineBetween(x,hy+24-i*3,x,hy+38);}
    }
    drawCoastalDetails(w,h,hy){
      this.coastalDetails=this.add.graphics().setDepth(2);this.coastalDetails.fillGradientStyle(0x0f78ba,0x1d9ddd,0x20a9e6,0x64d3f0,1);this.coastalDetails.fillRect(0,hy+16,w*.31,h-hy);
      this.coastalDetails.fillStyle(0xb9f3ff,.42);for(let y=hy+37;y<h;y+=31)this.coastalDetails.fillRect(0,y,w*.28,3);
      this.coastalDetails.fillStyle(0xf0d39b,1);this.coastalDetails.beginPath();this.coastalDetails.moveTo(0,hy+90);this.coastalDetails.lineTo(w*.31,hy+48);this.coastalDetails.lineTo(w*.24,h);this.coastalDetails.lineTo(0,h);this.coastalDetails.closePath();this.coastalDetails.fillPath();
      this.coastalDetails.fillStyle(0xffffff,.86);for(const boat of [[w*.07,hy+62],[w*.18,hy+88]]){this.coastalDetails.fillTriangle(boat[0],boat[1]-14,boat[0],boat[1]+5,boat[0]+20,boat[1]+5);this.coastalDetails.fillStyle(0x184a68,.9);this.coastalDetails.fillRect(boat[0]-3,boat[1]+5,27,4);this.coastalDetails.fillStyle(0xffffff,.86);}
      this.city=this.add.graphics().setDepth(3);for(let i=0;i<15;i++){const x=w*.685+i*w*.0235,bw=w*.027,bh=44+(i%5)*24;this.city.fillStyle(i%4===0?0xf5b87f:i%4===1?0xf4d4a7:i%4===2?0xe5eff3:0xd8c2e9,1);this.city.fillRoundedRect(x,hy+10-bh,bw,bh,3);this.city.fillStyle(0x39718f,.72);for(let yy=hy+20-bh;yy<hy;yy+=13)for(let xx=x+5;xx<x+bw-3;xx+=9)this.city.fillRect(xx,yy,4,5);}
      this.neonSigns=this.add.graphics().setDepth(3.5);for(const sign of [[w*.73,hy-55,30,11,0x38ddff],[w*.82,hy-76,34,12,0xff5ac8],[w*.91,hy-42,27,10,0xffc83d]]){this.neonSigns.fillStyle(sign[4],.28);this.neonSigns.fillRoundedRect(sign[0]-4,sign[1]-4,sign[2]+8,sign[3]+8,4);this.neonSigns.fillStyle(0x132a46,.96);this.neonSigns.fillRoundedRect(sign[0],sign[1],sign[2],sign[3],3);this.neonSigns.lineStyle(2,sign[4],1);this.neonSigns.strokeRoundedRect(sign[0],sign[1],sign[2],sign[3],3);}
      this.palms=this.add.graphics().setDepth(6);for(let i=0;i<6;i++){const t=i/5,y=Phaser.Math.Linear(hy+45,h*.76,t),left=Phaser.Math.Linear(w*.32,w*.08,t);this.palms.lineStyle(4+7*t,0x6b4930,1);this.palms.lineBetween(left,y,left+5,y-50*(.65+t*.6));this.palms.lineStyle(7,0x19724e,.96);for(let a=-2;a<=2;a++)this.palms.lineBetween(left+5,y-50*(.65+t*.6),left+5+a*15,y-65*(.65+t*.6)+Math.abs(a)*6);}
    }
    drawBoardwalkDetails(w,h,hy){
      this.boardwalkDetails=this.add.graphics().setDepth(5);this.boardwalkDetails.fillStyle(0xd9ba85,.95);this.boardwalkDetails.beginPath();this.boardwalkDetails.moveTo(w*.635,hy+34);this.boardwalkDetails.lineTo(w*.69,hy+28);this.boardwalkDetails.lineTo(w*.97,h);this.boardwalkDetails.lineTo(w*.91,h);this.boardwalkDetails.closePath();this.boardwalkDetails.fillPath();
      this.boardwalkDetails.lineStyle(2,0x9d744b,.48);for(let i=0;i<11;i++){const t=i/10,y=Phaser.Math.Linear(hy+44,h,t),lx=Phaser.Math.Linear(w*.65,w*.92,t),rx=Phaser.Math.Linear(w*.68,w*.97,t);this.boardwalkDetails.lineBetween(lx,y,rx,y);}
      for(let i=0;i<4;i++){const t=(i+1)/5,y=Phaser.Math.Linear(hy+70,h*.82,t),x=Phaser.Math.Linear(w*.72,w*.92,t);this.boardwalkDetails.fillStyle(i%2?0xff6d62:0x3cd5ff,.95);this.boardwalkDetails.fillTriangle(x-14,y,x+14,y,x,y-18);this.boardwalkDetails.lineStyle(3,0x6c5542,.9);this.boardwalkDetails.lineBetween(x,y,x,y+20);}
      this.boardwalkDetails.fillStyle(0x34536a,.9);for(let i=0;i<3;i++){const t=(i+1)/4,y=Phaser.Math.Linear(hy+90,h*.8,t),x=Phaser.Math.Linear(w*.73,w*.9,t);this.boardwalkDetails.fillRoundedRect(x-18,y,36,6,2);this.boardwalkDetails.fillRect(x-15,y+6,4,12);this.boardwalkDetails.fillRect(x+11,y+6,4,12);}
    }
    drawRoadDetails(w,h,hy){
      this.roadDetails=this.add.graphics().setDepth(5);this.roadDetails.fillStyle(0xffffff,.08);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.405,hy+6);this.roadDetails.lineTo(w*.48,hy+6);this.roadDetails.lineTo(w*.43,h);this.roadDetails.lineTo(w*.16,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      this.roadDetails.fillStyle(0xffffff,.04);this.roadDetails.beginPath();this.roadDetails.moveTo(w*.52,hy+6);this.roadDetails.lineTo(w*.595,hy+6);this.roadDetails.lineTo(w*.84,h);this.roadDetails.lineTo(w*.57,h);this.roadDetails.closePath();this.roadDetails.fillPath();
      this.roadDetails.lineStyle(2,0xa7d6e8,.28);this.roadDetails.lineBetween(w*.38,hy+18,w*.075,h);this.roadDetails.lineBetween(w*.62,hy+18,w*.925,h);
      for(let i=0;i<10;i++){const t=(i+1)/11,y=Phaser.Math.Linear(hy+20,h-20,t),lx=Phaser.Math.Linear(w*.37,w*.08,t),rx=Phaser.Math.Linear(w*.63,w*.92,t),r=2+t*4;this.roadDetails.fillStyle(i%2?0xffd84c:0xf7fbff,.9);this.roadDetails.fillCircle(lx,y,r);this.roadDetails.fillCircle(rx,y,r);}
      this.roadDetails.lineStyle(3,0x1b2c3b,.22);for(let i=1;i<5;i++){const y=Phaser.Math.Linear(hy+50,h-45,i/5);this.roadDetails.lineBetween(w*.2,y,w*.8,y+3);}
    }
    drawStreetLights(w,h,hy){
      this.streetLights=this.add.graphics().setDepth(6);for(let i=0;i<5;i++){const t=i/4,y=Phaser.Math.Linear(hy+58,h*.74,t),right=Phaser.Math.Linear(w*.7,w*.94,t),pole=30+50*t;this.streetLights.lineStyle(3+3*t,0x38566b,1);this.streetLights.lineBetween(right,y,right,y-pole);this.streetLights.lineBetween(right,y-pole,right-13-9*t,y-pole);this.streetLights.fillStyle(0xffe47c,.18);this.streetLights.fillCircle(right-14-9*t,y-pole,10+8*t);this.streetLights.fillStyle(0xffe47c,.98);this.streetLights.fillCircle(right-14-9*t,y-pole,4+3*t);}
    }
    laneX(index,y=this.baseY()){const h=this.scale.height,w=this.scale.width,hy=this.horizonY(),t=Math.max(0,Math.min(1,(y-hy)/(h-hy)));const left=Phaser.Math.Linear(w*.43,w*.26,t),right=Phaser.Math.Linear(w*.57,w*.74,t);return Phaser.Math.Linear(left,right,index/2);}
    drawMovingRoad(delta){
      const w=this.scale.width,h=this.scale.height,hy=this.horizonY();this.roadOffset=(this.roadOffset+delta*.38)%96;this.laneGraphics.clear();this.laneGraphics.lineStyle(3,0xffffff,.78);for(const factor of [1/3,2/3]){this.laneGraphics.beginPath();this.laneGraphics.moveTo(Phaser.Math.Linear(w*.39,w*.61,factor),hy);this.laneGraphics.lineTo(Phaser.Math.Linear(w*.1,w*.9,factor),h);this.laneGraphics.strokePath();}
      for(let y=hy+25+(this.roadOffset%68);y<h;y+=74){const ratio=(y-hy)/(h-hy),half=5+ratio*26;this.laneGraphics.lineStyle(5,0xffffff,.34+ratio*.44);this.laneGraphics.lineBetween(w/2-half,y,w/2+half,y);}this.speedLines.clear();this.speedLines.lineStyle(3,0xc4f6ff,.38);for(let i=0;i<12;i++){const yy=((i*102+this.roadOffset*4)%h);this.speedLines.lineBetween(w*.045,yy,w*.13,yy+38);this.speedLines.lineBetween(w*.955,yy,w*.87,yy+38);}
    }
    makeRunner(x,y,index){
      const accents=[0xff3f58,0xff48c7,0x36b9ff,0xffc52f,0x45e082,0xb94cff],accent=accents[index%accents.length];const c=this.add.container(x,y).setDepth(20),shadow=this.add.ellipse(0,44,78,17,0x000000,.32),g=this.add.graphics();g.fillStyle(0x121925,1);g.fillEllipse(0,-72,34,30);g.fillStyle(0xe9b58b,1);g.fillCircle(0,-63,15);g.fillStyle(0x121925,1);g.fillEllipse(0,-72,33,18);g.fillStyle(0x15253a,1);g.fillRoundedRect(-28,-51,56,72,17);g.fillStyle(accent,1);g.fillRoundedRect(-24,-48,48,28,12);g.fillStyle(0x0e1828,1);g.fillRoundedRect(-19,-38,38,43,10);g.lineStyle(4,accent,.95);g.strokeRoundedRect(-19,-38,38,43,10);g.lineStyle(10,0x1a2940,1);g.lineBetween(-21,-32,-38,2);g.lineBetween(21,-32,38,2);g.lineBetween(-13,13,-20,44);g.lineBetween(13,13,20,44);g.lineStyle(6,accent,1);g.lineBetween(-22,43,-6,43);g.lineBetween(6,43,22,43);c.add([shadow,g]);return c;
    }
    bindControls(){const keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE'),press=(key,fn)=>key.on('down',fn);press(keys.LEFT,()=>this.shift(-1));press(keys.A,()=>this.shift(-1));press(keys.RIGHT,()=>this.shift(1));press(keys.D,()=>this.shift(1));press(keys.UP,()=>this.jump());press(keys.W,()=>this.jump());press(keys.SPACE,()=>this.jump());press(keys.DOWN,()=>this.slide());press(keys.S,()=>this.slide());let start=null;this.input.on('pointerdown',p=>{start={x:p.x,y:p.y};});this.input.on('pointerup',p=>{if(!start)return;const dx=p.x-start.x,dy=p.y-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;if(Math.abs(dx)>Math.abs(dy))this.shift(dx>0?1:-1);else if(dy<0)this.jump();else this.slide();});}
    shift(delta){if(!this.active)return;this.lane=VerbRunnerRunnerCore.moveLane(this.lane,delta);this.tweens.add({targets:this.player,x:this.laneX(this.lane),duration:110,ease:'Sine.easeOut'});}
    jump(){if(!this.active||this.jumping||this.sliding)return;this.jumping=true;const baseY=this.baseY();this.tweens.add({targets:this.player,y:baseY-108*this.displayScale,duration:215,yoyo:true,ease:'Sine.easeOut',onComplete:()=>{this.jumping=false;this.player.y=baseY;}});}
    slide(){if(!this.active||this.sliding||this.jumping)return;this.sliding=true;const baseY=this.baseY();this.tweens.add({targets:this.player,scaleY:this.displayScale*.48,y:baseY+this.scale.height*.025,duration:85,yoyo:true,hold:330,onComplete:()=>{this.sliding=false;this.player.setScale(this.displayScale);this.player.y=baseY;}});}
    pickAnswerLane(){let lane=Phaser.Math.Between(0,2);if(lane===this.lastAnswerLane&&Math.random()<.7)lane=(lane+1+Phaser.Math.Between(0,1))%3;this.lastAnswerLane=lane;return lane;}
    spawnAnswer(item){
      if(!this.active)return;const y=this.horizonY()+10,lane=this.pickAnswerLane(),x=this.laneX(lane,y),box=this.add.container(x,y).setDepth(13);box.lane=lane;box.correct=item.correct;box.value=item.value;box.resolved=false;
      const width=Math.max(104,item.value.length*15),glow=this.add.rectangle(0,0,width+16,58,0x0b80ff,.2).setStrokeStyle(6,0x4acfff,.42),bg=this.add.rectangle(0,0,width,48,0x082e54,.97).setStrokeStyle(3,0x64e3ff,1),top=this.add.rectangle(0,-21,width-12,4,0xb4f6ff,.86),leftCap=this.add.rectangle(-width/2+4,0,4,30,0x41dfff,.9),rightCap=this.add.rectangle(width/2-4,0,4,30,0x41dfff,.9),text=this.add.text(0,1,String(item.value).toUpperCase(),{fontFamily:'Arial',fontSize:'20px',fontStyle:'bold',color:'#ffffff'}).setOrigin(.5);box.add([glow,bg,top,leftCap,rightCap,text]);box.bg=bg;box.glow=glow;this.answers.push(box);this.callbacks.answerSpawned?.(item);
    }
    clearAnswers(){for(const answer of this.answers){if(answer?.active)answer.destroy();}this.answers=[];}
    removeAnswer(answer){if(!answer)return;if(answer.active)answer.destroy();this.answers=this.answers.filter(item=>item!==answer);}
    pickObstacleLane(){let lane=Phaser.Math.Between(0,2);const nearby=new Set(this.answers.filter(a=>a?.active&&a.y<this.scale.height*.48).map(a=>a.lane));if(nearby.has(lane)){for(let step=1;step<=2;step++){const candidate=(lane+step)%3;if(!nearby.has(candidate)){lane=candidate;break;}}}return lane;}
    drawJumpObstacle(g){
      g.fillStyle(0xff9d24,.18);g.fillRoundedRect(-52,-30,104,60,12);g.fillStyle(0x17283b,1);g.fillRoundedRect(-46,-24,92,48,9);g.lineStyle(4,0xffad2f,1);g.strokeRoundedRect(-46,-24,92,48,9);g.lineStyle(8,0xffc83d,1);for(let x=-34;x<=34;x+=17)g.lineBetween(x,-16,x+12,16);g.fillStyle(0xff5c48,1);g.fillRoundedRect(-35,-7,70,14,4);g.fillStyle(0xffe66b,.92);g.fillCircle(-28,0,4);g.fillCircle(28,0,4);g.fillStyle(0x0c1826,1);g.fillRoundedRect(-39,20,18,8,3);g.fillRoundedRect(21,20,18,8,3);
    }
    drawSlideObstacle(g){
      g.fillStyle(0x33dfff,.12);g.fillRoundedRect(-68,-116,136,148,16);g.fillStyle(0x162d46,1);g.fillRoundedRect(-60,-108,120,18,8);g.lineStyle(4,0x66e7ff,1);g.strokeRoundedRect(-60,-108,120,18,8);g.fillStyle(0x203b56,1);g.fillRoundedRect(-58,-91,13,118,6);g.fillRoundedRect(45,-91,13,118,6);g.lineStyle(3,0xff56c7,1);g.strokeRoundedRect(-58,-91,13,118,6);g.strokeRoundedRect(45,-91,13,118,6);g.fillStyle(0x102338,.96);g.fillRoundedRect(-54,-68,108,22,6);g.lineStyle(4,0xff4fb8,1);g.strokeRoundedRect(-54,-68,108,22,6);g.fillStyle(0xff4fb8,.22);g.fillRoundedRect(-50,-64,100,14,5);g.fillStyle(0x9ff7ff,1);for(const x of [-38,-19,0,19,38])g.fillCircle(x,-57,3);g.fillStyle(0x0d1c2d,1);g.fillRoundedRect(-62,21,21,9,3);g.fillRoundedRect(41,21,21,9,3);
    }
    spawnObstacle(){const type=Math.random()<.52?'crate':'barrier',y=this.horizonY()+12,lane=this.pickObstacleLane(),x=this.laneX(lane,y),c=this.add.container(x,y).setDepth(12),shadow=this.add.ellipse(0,25,type==='crate'?92:118,18,0x07111c,.3),g=this.add.graphics();c.type=type;c.lane=lane;c.hit=false;if(type==='crate')this.drawJumpObstacle(g);else this.drawSlideObstacle(g);c.add([shadow,g]);this.obstacles.push(c);}
    feedbackBurst(color,stars=false){const ring=this.add.circle(this.player.x,this.player.y-22,42*this.displayScale,color,.28).setDepth(19);this.tweens.add({targets:ring,alpha:0,scale:1.8,duration:320,onComplete:()=>ring.destroy()});if(stars){for(let i=0;i<3;i++){const s=this.add.text(this.player.x-24+i*24,this.player.y-98-i*7,'★',{fontSize:'22px',color:'#ffd84a',fontStyle:'bold'}).setDepth(25);this.tweens.add({targets:s,y:s.y-30,alpha:0,duration:520,delay:i*55,onComplete:()=>s.destroy()});}}}
    pauseRun(){if(!this.active||this.paused)return;this.paused=true;this.active=false;this.tweens.pauseAll();this.time.paused=true;this.input.enabled=false;}
    resumeRun(){if(!this.paused)return;this.time.paused=false;this.tweens.resumeAll();this.input.enabled=true;this.paused=false;this.active=true;this.nextObstacleAt=this.time.now+450;}
    update(time,delta){
      if(!this.active)return;this.drawMovingRoad(delta);const speed=VerbRunnerRunnerCore.speedForMomentum(this.runState.momentum)*1.14,dy=speed*(delta/1000),hy=this.horizonY(),h=this.scale.height;
      for(const answer of [...this.answers]){if(!answer?.active){this.answers=this.answers.filter(item=>item!==answer);continue;}answer.y+=dy;answer.x=this.laneX(answer.lane,answer.y);const scale=.44+((answer.y-hy)/(h-hy))*.72;answer.setScale(Math.max(.42,Math.min(1.12,scale))*this.displayScale);if(!answer.resolved&&answer.y>h*.70&&answer.y<h*.9&&answer.lane===this.lane){answer.resolved=true;const item={value:answer.value,correct:answer.correct};answer.bg.setFillStyle(item.correct?0x0c5b35:0x6b1c31,1);answer.bg.setStrokeStyle(4,item.correct?0x58ff93:0xff526d,1);answer.glow.setStrokeStyle(6,item.correct?0x45ff87:0xff3d5c,.55);this.feedbackBurst(item.correct?0x46f6a7:0xff4f7a,false);this.callbacks.answerHit?.(item);this.time.delayedCall(110,()=>this.removeAnswer(answer));}else if(answer.y>h+95){const missed={value:answer.value,correct:answer.correct};this.removeAnswer(answer);this.callbacks.answerMissed?.(missed);}}
      for(const obstacle of [...this.obstacles]){obstacle.y+=dy*.96;obstacle.x=this.laneX(obstacle.lane,obstacle.y);const scale=.44+((obstacle.y-hy)/(h-hy))*.84;obstacle.setScale(Math.max(.45,Math.min(1.24,scale))*this.displayScale);if(!obstacle.hit&&obstacle.y>h*.70&&obstacle.y<h*.9&&obstacle.lane===this.lane){obstacle.hit=true;if(VerbRunnerRunnerCore.hitsObstacle(obstacle,{jumping:this.jumping,sliding:this.sliding})){this.feedbackBurst(0xffc14f,true);this.callbacks.obstacleHit?.(obstacle.type);}}if(obstacle.y>h+125){obstacle.destroy();this.obstacles=this.obstacles.filter(o=>o!==obstacle);}}
      if(time>this.nextObstacleAt){this.spawnObstacle();this.nextObstacleAt=time+780+Math.random()*360;}this.player.rotation=Math.sin(time/82)*.016;
    }
    stopRun(){this.paused=false;this.active=false;this.time.paused=false;this.input.enabled=false;this.clearAnswers();for(const o of this.obstacles)o.destroy();this.obstacles=[];}
  }
  function createVerbRunnerGame(mount,options){const config={type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:VerbRunnerScene,render:{antialias:true,pixelArt:false}};const game=new Phaser.Game(config);game.scene.start('VerbRunnerScene',options);return game;}
  global.VerbRunnerPhaser={createVerbRunnerGame};
})(window);
