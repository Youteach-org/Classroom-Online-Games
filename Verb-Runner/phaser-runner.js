(function(global){
  class VerbRunnerScene extends Phaser.Scene{
    constructor(){super('VerbRunnerScene');}
    init(data){
      this.callbacks=data.callbacks||{};
      this.runState=data.runState;
      this.characterIndex=data.characterIndex||0;
      this.lane=1;this.jumping=false;this.sliding=false;this.answer=null;this.obstacles=[];
      this.lastObstacleAt=0;this.active=true;this.roadOffset=0;
    }
    create(){
      this.cameras.main.setBackgroundColor('#06111f');
      this.drawWorld();
      this.player=this.makeRunner(this.scale.width/2,this.scale.height*0.79,this.characterIndex);
      this.bindControls();
      this.events.on('shutdown',()=>this.input.keyboard.removeAllKeys(true));
      this.callbacks.ready?.(this);
    }
    drawWorld(){
      const w=this.scale.width,h=this.scale.height;
      this.sky=this.add.graphics();
      this.sky.fillGradientStyle(0x071527,0x071527,0x164060,0x164060,1);this.sky.fillRect(0,0,w,h);
      this.city=this.add.graphics();
      for(let i=0;i<15;i++){
        const bw=30+(i%4)*14,bh=70+(i%5)*26,x=(i*83)%w;
        this.city.fillStyle(i%2?0x0c263c:0x102e49,1);this.city.fillRect(x,h*.18-bh,bw,bh);
        this.city.fillStyle(0x5de8ff,.45);for(let y=h*.18-bh+12;y<h*.18-10;y+=17)this.city.fillRect(x+7,y,4,5);
      }
      this.road=this.add.graphics();
      this.road.fillStyle(0x09111b,1);this.road.beginPath();this.road.moveTo(w*.25,h);this.road.lineTo(w*.43,h*.18);this.road.lineTo(w*.57,h*.18);this.road.lineTo(w*.75,h);this.road.closePath();this.road.fillPath();
      this.road.lineStyle(3,0x39d9ff,.2);this.road.strokePath();
      this.laneGraphics=this.add.graphics();
      this.speedLines=this.add.graphics();
      this.drawMovingRoad(0);
    }
    laneX(index,y=this.scale.height*.79){
      const h=this.scale.height,w=this.scale.width,t=Math.max(0,Math.min(1,(y-h*.18)/(h*.82)));
      const left=Phaser.Math.Linear(w*.45,w*.34,t),right=Phaser.Math.Linear(w*.55,w*.66,t);
      return Phaser.Math.Linear(left,right,index/2);
    }
    drawMovingRoad(delta){
      const w=this.scale.width,h=this.scale.height;
      this.roadOffset=(this.roadOffset+delta*.25)%90;
      this.laneGraphics.clear();this.laneGraphics.lineStyle(2,0x84ebff,.28);
      for(const factor of [1/3,2/3]){
        this.laneGraphics.beginPath();this.laneGraphics.moveTo(Phaser.Math.Linear(w*.43,w*.57,factor),h*.18);this.laneGraphics.lineTo(Phaser.Math.Linear(w*.25,w*.75,factor),h);this.laneGraphics.strokePath();
      }
      for(let y=h*.25+(this.roadOffset%70);y<h;y+=90){
        const ratio=(y-h*.18)/(h*.82),half=6+ratio*16;
        this.laneGraphics.lineStyle(4,0xffffff,.16+ratio*.15);
        this.laneGraphics.lineBetween(w/2-half,y,w/2+half,y);
      }
      this.speedLines.clear();this.speedLines.lineStyle(2,0x4be9ff,.14);
      for(let i=0;i<10;i++){const yy=((i*130+this.roadOffset*3)%h);this.speedLines.lineBetween(w*.12,yy,w*.18,yy+25);this.speedLines.lineBetween(w*.88,yy,w*.82,yy+25);}
    }
    makeRunner(x,y,index){
      const container=this.add.container(x,y);container.setDepth(20);
      const shadow=this.add.ellipse(0,34,48,12,0x000000,.38);
      const body=this.add.graphics();
      const accents=[0x29d7ff,0xff5d8f,0x7cf1a8,0xffc857,0xa98bff,0xff8f5a];const accent=accents[index%accents.length];
      body.fillStyle(0x101b2b,1);body.fillRoundedRect(-16,-34,32,48,10);body.fillStyle(accent,1);body.fillRoundedRect(-13,-29,26,18,7);
      body.fillStyle(0xe4b990,1);body.fillCircle(0,-48,12);body.fillStyle(0x10151f,1);body.fillEllipse(0,-54,24,14);
      body.lineStyle(7,0x1c2a3c,1);body.lineBetween(-10,10,-16,32);body.lineBetween(10,10,16,32);body.lineBetween(-13,-18,-25,4);body.lineBetween(13,-18,25,4);
      container.add([shadow,body]);container.bodyGraphic=body;return container;
    }
    bindControls(){
      const keys=this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE');
      const press=(key,fn)=>key.on('down',fn);
      press(keys.LEFT,()=>this.shift(-1));press(keys.A,()=>this.shift(-1));press(keys.RIGHT,()=>this.shift(1));press(keys.D,()=>this.shift(1));
      press(keys.UP,()=>this.jump());press(keys.W,()=>this.jump());press(keys.SPACE,()=>this.jump());press(keys.DOWN,()=>this.slide());press(keys.S,()=>this.slide());
      let start=null;
      this.input.on('pointerdown',p=>{start={x:p.x,y:p.y};});
      this.input.on('pointerup',p=>{if(!start)return;const dx=p.x-start.x,dy=p.y-start.y;start=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;if(Math.abs(dx)>Math.abs(dy))this.shift(dx>0?1:-1);else if(dy<0)this.jump();else this.slide();});
    }
    shift(delta){if(!this.active)return;this.lane=VerbRunnerRunnerCore.moveLane(this.lane,delta);this.tweens.add({targets:this.player,x:this.laneX(this.lane),duration:120,ease:'Sine.easeOut'});}
    jump(){if(!this.active||this.jumping||this.sliding)return;this.jumping=true;const baseY=this.scale.height*.79;this.tweens.add({targets:this.player,y:baseY-92,duration:230,yoyo:true,ease:'Sine.easeOut',onComplete:()=>{this.jumping=false;this.player.y=baseY;}});}
    slide(){if(!this.active||this.sliding||this.jumping)return;this.sliding=true;this.tweens.add({targets:this.player,scaleY:.52,y:this.scale.height*.81,duration:90,yoyo:true,hold:360,onComplete:()=>{this.sliding=false;this.player.setScale(1);this.player.y=this.scale.height*.79;}});}
    spawnAnswer(item){
      if(!this.active)return;const lane=Phaser.Math.Between(0,2),x=this.laneX(lane,this.scale.height*.23),y=this.scale.height*.22;
      const box=this.add.container(x,y);box.setDepth(12);box.lane=lane;box.correct=item.correct;box.value=item.value;box.resolved=false;
      const bg=this.add.rectangle(0,0,Math.max(104,item.value.length*15),54,0x10263b,.96).setStrokeStyle(2,0x7deaff,.72);bg.setOrigin(.5);
      const text=this.add.text(0,0,String(item.value).toUpperCase(),{fontFamily:'Arial',fontSize:'22px',fontStyle:'bold',color:'#f8fbff'}).setOrigin(.5);
      box.add([bg,text]);box.bg=bg;box.textNode=text;this.answer=box;this.callbacks.answerSpawned?.(item);
    }
    spawnObstacle(){
      const type=Math.random()<.5?'crate':'barrier',lane=Phaser.Math.Between(0,2),y=this.scale.height*.22,x=this.laneX(lane,y);const c=this.add.container(x,y);c.type=type;c.lane=lane;c.hit=false;c.setDepth(11);
      const g=this.add.graphics();
      if(type==='crate'){g.fillStyle(0xf08a4b,1);g.fillRoundedRect(-25,-25,50,50,7);g.lineStyle(3,0xffd09b,.8);g.strokeLineShape(new Phaser.Geom.Line(-17,-17,17,17));g.strokeLineShape(new Phaser.Geom.Line(17,-17,-17,17));}
      else{g.fillStyle(0xb44cff,1);g.fillRoundedRect(-44,-44,88,16,8);g.fillStyle(0x6c2b9b,1);g.fillRect(-38,-28,8,46);g.fillRect(30,-28,8,46);}
      c.add(g);this.obstacles.push(c);
    }
    flashPlayer(color){
      const ring=this.add.circle(this.player.x,this.player.y-18,38,color,.38).setDepth(19);this.tweens.add({targets:ring,alpha:0,scale:1.7,duration:300,onComplete:()=>ring.destroy()});
    }
    update(time,delta){
      if(!this.active)return;this.drawMovingRoad(delta);const speed=VerbRunnerRunnerCore.speedForMomentum(this.runState.momentum),dy=speed*(delta/1000);
      if(this.answer){
        this.answer.y+=dy;this.answer.x=this.laneX(this.answer.lane,this.answer.y);
        const scale=.52+((this.answer.y-this.scale.height*.18)/(this.scale.height*.82))*.72;this.answer.setScale(Math.max(.5,Math.min(1.15,scale)));
        if(!this.answer.resolved&&this.answer.y>this.scale.height*.72&&this.answer.y<this.scale.height*.89&&this.answer.lane===this.lane){
          this.answer.resolved=true;const item={value:this.answer.value,correct:this.answer.correct};
          this.answer.bg.setFillStyle(item.correct?0x124f3c:0x62213b,1);this.answer.bg.setStrokeStyle(3,item.correct?0x7cffc3:0xff6b8d,1);
          if(item.correct)this.flashPlayer(0x46f6a7);else this.flashPlayer(0xff4f7a);
          this.callbacks.answerHit?.(item);
          this.time.delayedCall(120,()=>{this.answer?.destroy();this.answer=null;});
        }else if(this.answer.y>this.scale.height+80){
          const missed=this.answer;this.answer=null;missed.destroy();this.callbacks.answerMissed?.({value:missed.value,correct:missed.correct});
        }
      }
      for(const obstacle of [...this.obstacles]){
        obstacle.y+=dy*.96;obstacle.x=this.laneX(obstacle.lane,obstacle.y);const scale=.5+((obstacle.y-this.scale.height*.18)/(this.scale.height*.82))*.8;obstacle.setScale(Math.max(.5,Math.min(1.2,scale)));
        if(!obstacle.hit&&obstacle.y>this.scale.height*.72&&obstacle.y<this.scale.height*.9&&obstacle.lane===this.lane){
          obstacle.hit=true;if(VerbRunnerRunnerCore.hitsObstacle(obstacle,{jumping:this.jumping,sliding:this.sliding})){this.flashPlayer(0xffc14f);this.callbacks.obstacleHit?.(obstacle.type);} }
        if(obstacle.y>this.scale.height+100){obstacle.destroy();this.obstacles=this.obstacles.filter(o=>o!==obstacle);}
      }
      if(time-this.lastObstacleAt>1700&&(!this.answer||this.answer.y>this.scale.height*.48)){this.lastObstacleAt=time;this.spawnObstacle();}
      this.player.rotation=Math.sin(time/90)*.015;
    }
    stopRun(){this.active=false;if(this.answer){this.answer.destroy();this.answer=null;}for(const o of this.obstacles)o.destroy();this.obstacles=[];}
  }

  function createVerbRunnerGame(mount,options){
    const config={type:Phaser.AUTO,parent:mount,transparent:true,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:VerbRunnerScene,render:{antialias:true,pixelArt:false}};
    const game=new Phaser.Game(config);game.scene.start('VerbRunnerScene',options);return game;
  }
  global.VerbRunnerPhaser={createVerbRunnerGame};
})(window);
