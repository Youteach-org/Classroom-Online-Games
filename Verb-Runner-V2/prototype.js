import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROBOT_URL='https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

const variants=[
  {name:'RED',accent:0xe43c3c,secondary:0x821b2a,dark:0x171922,light:0xf0f2f6},
  {name:'BLUE',accent:0x2475d1,secondary:0x123c73,dark:0x151922,light:0xddeeff},
  {name:'GREEN',accent:0x29a65a,secondary:0x145f37,dark:0x141b18,light:0xe2f5e8},
  {name:'PINK',accent:0xef4c78,secondary:0x8d2345,dark:0x1d151a,light:0xffe1ea},
  {name:'WHITE / BLACK',accent:0xe8ebf2,secondary:0x8d94a3,dark:0x111319,light:0xffffff},
  {name:'PURPLE',accent:0x9a4de0,secondary:0x57258d,dark:0x18131e,light:0xf0e2ff}
];

const canvas=document.querySelector('#game');
const distanceEl=document.querySelector('#distance');
const speedEl=document.querySelector('#speed');
const modelStatus=document.querySelector('#modelStatus');
const flash=document.querySelector('#flash');
const picker=document.querySelector('#picker');
const startButton=document.querySelector('#startButton');
const runnerChip=document.querySelector('#runnerChip');
const runnerName=document.querySelector('#runnerName');
const runnerDot=document.querySelector('#runnerDot');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.22;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x10131b);
scene.fog=new THREE.FogExp2(0x11141d,0.021);

const camera=new THREE.PerspectiveCamera(52,1,.1,180);
camera.position.set(0,4.8,10.8);
camera.lookAt(0,1.55,-18);

scene.add(new THREE.HemisphereLight(0x9aefff,0x17121f,2.1));
const key=new THREE.DirectionalLight(0xffc6d3,3.4);
key.position.set(-6,12,8);
key.castShadow=true;
scene.add(key);

const rim=new THREE.PointLight(0x16d9ff,18,34,2);
rim.position.set(5,5,3);
scene.add(rim);

const magenta=new THREE.PointLight(0xff245f,16,30,2);
magenta.position.set(-6,3,-4);
scene.add(magenta);

const world=new THREE.Group();
scene.add(world);

const environmentMovers=[];
const farMovers=[];

function addMover(object,{speedFactor=1,span=180,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  environmentMovers.push({object,speedFactor,span,initialZ});
}

function addFarMover(object,{speedFactor=.28,span=210,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  farMovers.push({object,speedFactor,span,initialZ});
}

const road=new THREE.Mesh(
  new THREE.PlaneGeometry(12,170),
  new THREE.MeshStandardMaterial({color:0x24262b,roughness:.92,metalness:.04})
);
road.rotation.x=-Math.PI/2;
road.position.z=-68;
road.receiveShadow=true;
world.add(road);

const roadGlow=new THREE.MeshBasicMaterial({color:0xe8e2c9,transparent:true,opacity:.65});
for(const x of [-6,6]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.025,170),roadGlow);
  rail.position.set(x,.03,-68);
  world.add(rail);
}

const sidewalkMat=new THREE.MeshStandardMaterial({color:0x5b5d60,roughness:.94,metalness:.02});
for(const x of [-7.2,7.2]){
  const sidewalk=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,170),sidewalkMat);
  sidewalk.position.set(x,.08,-68);
  sidewalk.receiveShadow=true;
  world.add(sidewalk);
}

const seamMat=new THREE.MeshBasicMaterial({color:0xd9d4bf,transparent:true,opacity:.55});
for(const x of [-5.65,5.65]){
  for(let i=0;i<18;i++){
    const seam=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,3.2),seamMat);
    seam.position.set(x,.04,-i*9.5);
    seam.userData.loopSpan=171;
    environmentMovers.push({object:seam,speedFactor:1,span:171,initialZ:seam.position.z});
    world.add(seam);
  }
}

const laneMarkers=[];
const markerMat=new THREE.MeshBasicMaterial({color:0xf1ecd7,transparent:true,opacity:.86});
for(const x of [-1.5,1.5]){
  for(let i=0;i<20;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,2.5),markerMat);
    m.position.set(x,.035,-i*8);
    laneMarkers.push(m);
    world.add(m);
  }
}

const city=new THREE.Group();
world.add(city);

const facadeMaterials=[
  new THREE.MeshStandardMaterial({color:0x343846,roughness:.86,metalness:.05}),
  new THREE.MeshStandardMaterial({color:0x3f2d32,roughness:.9,metalness:.02}),
  new THREE.MeshStandardMaterial({color:0x293642,roughness:.84,metalness:.08}),
  new THREE.MeshStandardMaterial({color:0x423b34,roughness:.9,metalness:.02}),
  new THREE.MeshStandardMaterial({color:0x2d3040,roughness:.82,metalness:.12})
];

const glassMat=new THREE.MeshStandardMaterial({
  color:0x21394a,
  emissive:0x071624,
  emissiveIntensity:.5,
  roughness:.28,
  metalness:.18
});
const warmWindowMat=new THREE.MeshBasicMaterial({color:0xffd37a});
const coolWindowMat=new THREE.MeshBasicMaterial({color:0x7edcff});
const dimWindowMat=new THREE.MeshBasicMaterial({color:0x44546a});
const concreteMat=new THREE.MeshStandardMaterial({color:0x242832,roughness:.92,metalness:.02});
const curbMat=new THREE.MeshStandardMaterial({color:0x8f9299,roughness:.9,metalness:0});
const signNames=['CAFE','MARKET','ARCADE','HOTEL','METRO','PIZZA','BOOKS','SHOP'];

function makeSignTexture(text,bg,fg='#ffffff'){
  const c=document.createElement('canvas');
  c.width=256;c.height=96;
  const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=6;ctx.strokeRect(5,5,c.width-10,c.height-10);
  ctx.fillStyle=fg;
  ctx.font='900 46px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,c.width/2,c.height/2+2);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function createFacadeBuilding(side,index,z){
  const group=new THREE.Group();
  const floors=3+(index%5);
  const floorH=1.25;
  const h=floors*floorH+1.25;
  const w=3.4+(index%3)*.65;
  const d=5.2+(index%4)*.9;

  const body=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    facadeMaterials[index%facadeMaterials.length]
  );
  body.position.y=h/2;
  body.castShadow=true;
  body.receiveShadow=true;
  group.add(body);

  const roadFaceX=-side*w/2-side*.035;

  const store=new THREE.Mesh(new THREE.BoxGeometry(.08,1.05,d*.78),glassMat);
  store.position.set(roadFaceX,.68,0);
  group.add(store);

  const storeFrame=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,d*.84),concreteMat);
  storeFrame.position.set(roadFaceX-side*.03,1.23,0);
  group.add(storeFrame);

  const signText=signNames[index%signNames.length];
  const signColors=['#b51f3d','#1669a8','#6d35a4','#a85a16','#127b6f'];
  const signTex=makeSignTexture(signText,signColors[index%signColors.length]);
  const sign=new THREE.Mesh(
    new THREE.PlaneGeometry(1.55,.58),
    new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide})
  );
  sign.rotation.y=side>0?-Math.PI/2:Math.PI/2;
  sign.position.set(roadFaceX-side*.075,1.72,-d*.18);
  group.add(sign);

  const rows=Math.max(2,floors-1);
  const cols=3;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const win=new THREE.Mesh(
        new THREE.BoxGeometry(.055,.48,.62),
        (index+r+c)%4===0?warmWindowMat:((index+r+c)%3===0?dimWindowMat:coolWindowMat)
      );
      win.position.set(
        roadFaceX-side*.04,
        2.45+r*1.05,
        THREE.MathUtils.lerp(-d*.3,d*.3,c/(cols-1))
      );
      group.add(win);
    }
  }

  if(index%3===0){
    const awning=new THREE.Mesh(
      new THREE.BoxGeometry(.55,.08,d*.7),
      new THREE.MeshStandardMaterial({color:index%2?0x9a2744:0x1c6c8e,roughness:.74})
    );
    awning.position.set(roadFaceX-side*.28,1.38,0);
    awning.rotation.z=side*.08;
    group.add(awning);
  }

  if(index%4===0){
    const roofUnit=new THREE.Mesh(new THREE.BoxGeometry(w*.42,.55,d*.34),concreteMat);
    roofUnit.position.set(0,h+.28,0);
    group.add(roofUnit);
  }

  group.position.set(side*(8.65+w/2),0,z);
  return group;
}

for(let i=0;i<19;i++){
  const z=-4-i*9.2;
  for(const side of [-1,1]){
    const building=createFacadeBuilding(side,i+(side>0?2:0),z-(side>0?3.8:0));
    city.add(building);
    addMover(building,{speedFactor:.9,span:175,startZ:building.position.z});
  }
}

const skyline=new THREE.Group();
world.add(skyline);
for(let i=0;i<18;i++){
  const side=i%2?-1:1;
  const h=10+(i%6)*2.8;
  const w=3.2+(i%4)*.8;
  const d=3.6+(i%3);
  const z=-28-i*10.2;
  const tower=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color:i%2?0x141827:0x1b1b29,
      emissive:i%3===0?0x07172a:0x140915,
      emissiveIntensity:.36,
      roughness:.88
    })
  );
  tower.position.set(side*(15.5+(i%3)*3.4),h/2,z);
  skyline.add(tower);
  addFarMover(tower,{speedFactor:.2,span:208,startZ:z});
}

const streetProps=new THREE.Group();
world.add(streetProps);

const lampPostMat=new THREE.MeshStandardMaterial({color:0x242934,roughness:.48,metalness:.58});
const lampGlowMat=new THREE.MeshBasicMaterial({color:0xffe39b});
for(let i=0;i<18;i++){
  const z=-5-i*9.6;
  for(const side of [-1,1]){
    const pole=new THREE.Group();
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,3.1,8),lampPostMat);
    stem.position.y=1.55;
    pole.add(stem);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.48,.06,.06),lampPostMat);
    arm.position.set(-side*.2,2.98,0);
    pole.add(arm);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.32),lampGlowMat);
    lamp.position.set(-side*.42,2.91,0);
    pole.add(lamp);
    pole.position.set(side*6.55,0,z);
    streetProps.add(pole);
    addMover(pole,{speedFactor:1,span:173,startZ:z});
  }
}

function createParkedCar(side,index,z){
  const car=new THREE.Group();
  const bodyColor=[0x9c263b,0x285f98,0x5f6770,0xb3b5b8,0x315b43][index%5];
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(1.05,.46,2.15),
    new THREE.MeshStandardMaterial({color:bodyColor,roughness:.58,metalness:.25})
  );
  body.position.y=.42;
  car.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(.86,.4,1.05),glassMat);
  cabin.position.set(0,.76,-.08);
  car.add(cabin);
  const tireMat=new THREE.MeshStandardMaterial({color:0x08090b,roughness:.98});
  for(const x of [-.55,.55]){
    for(const zz of [-.64,.64]){
      const tire=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.12,10),tireMat);
      tire.rotation.z=Math.PI/2;
      tire.position.set(x,.22,zz);
      car.add(tire);
    }
  }
  car.position.set(side*7.25,0,z);
  car.rotation.y=side>0?Math.PI:0;
  return car;
}

for(let i=0;i<12;i++){
  const side=i%2?-1:1;
  const z=-12-i*13.5;
  const car=createParkedCar(side,i,z);
  streetProps.add(car);
  addMover(car,{speedFactor:1,span:176,startZ:z});
}

const crosswalkMat=new THREE.MeshBasicMaterial({color:0xf4f1df,transparent:true,opacity:.82});
const intersectionMat=new THREE.MeshStandardMaterial({color:0x17191e,roughness:.94,metalness:.02});
for(let k=0;k<6;k++){
  const baseZ=-26-k*29;
  const intersection=new THREE.Mesh(new THREE.BoxGeometry(16,.035,6.8),intersectionMat);
  intersection.position.set(0,.022,baseZ);
  world.add(intersection);
  addMover(intersection,{speedFactor:1,span:174,startZ:baseZ});

  for(let s=0;s<7;s++){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(10.8,.045,.34),crosswalkMat);
    stripe.position.set(0,.045,baseZ-2.2+s*.7);
    world.add(stripe);
    addMover(stripe,{speedFactor:1,span:174,startZ:stripe.position.z});
  }

  for(const side of [-1,1]){
    const lightGroup=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,3.4,8),lampPostMat);
    pole.position.y=1.7;
    lightGroup.add(pole);

    const box=new THREE.Mesh(new THREE.BoxGeometry(.3,.72,.28),new THREE.MeshStandardMaterial({color:0x17191c,roughness:.55,metalness:.35}));
    box.position.set(-side*.18,2.75,0);
    lightGroup.add(box);

    const redLamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0xff394f}));
    redLamp.position.set(-side*.34,2.94,0);
    lightGroup.add(redLamp);
    const greenLamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0x56ff89}));
    greenLamp.position.set(-side*.34,2.57,0);
    lightGroup.add(greenLamp);

    lightGroup.position.set(side*6.55,0,baseZ+1.7);
    streetProps.add(lightGroup);
    addMover(lightGroup,{speedFactor:1,span:174,startZ:lightGroup.position.z});
  }
}

for(const side of [-1,1]){
  const curb=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,170),curbMat);
  curb.position.set(side*6.08,.11,-68);
  curb.castShadow=true;
  world.add(curb);
}

const horizonGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(58,20),
  new THREE.MeshBasicMaterial({
    color:0x152243,
    transparent:true,
    opacity:.16,
    side:THREE.DoubleSide,
    depthWrite:false
  })
);
horizonGlow.position.set(0,9,-96);
world.add(horizonGlow);

const runnerRoot=new THREE.Group();
runnerRoot.position.set(0,0,2);
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.72,32),
  new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.34,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.025;
runnerRoot.add(shadow);

let model=null;
let baseScale=null;
let mixer=null;
let actions={};
let activeAction=null;
let selectedVariant=0;
let gameStarted=false;

function hashName(name='mesh'){
  let h=0;
  for(const c of name)h=(h*31+c.charCodeAt(0))|0;
  return Math.abs(h);
}

function applyRobotPalette(index){
  selectedVariant=index;
  const cfg=variants[index];
  const palette=[cfg.accent,cfg.dark,cfg.secondary,cfg.light,cfg.dark,cfg.accent];

  if(model){
    model.traverse(obj=>{
      if(!obj.isMesh)return;
      const n=hashName(obj.name);
      if(obj.material?.dispose)obj.material.dispose();
      obj.material=new THREE.MeshToonMaterial({
        color:palette[n%palette.length],
        emissive:n%6===0?cfg.secondary:0x000000,
        emissiveIntensity:n%6===0?.35:0
      });
      obj.castShadow=true;
      obj.receiveShadow=true;
    });
  }

  const hex='#'+cfg.accent.toString(16).padStart(6,'0');
  document.documentElement.style.setProperty('--runner-accent',hex);
  runnerName.textContent=cfg.name;
  runnerDot.style.background=hex;
  runnerDot.style.boxShadow='0 0 15px '+hex;

  document.querySelectorAll('.robot-option').forEach((btn,i)=>btn.classList.toggle('active',i===index));
}

function fitToHeight(root,target=2.35){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0)return;
  const s=target/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
}

function chooseClip(clips,words){
  return clips.find(c=>words.some(w=>c.name.toLowerCase().includes(w)));
}

function play(name,fade=.16){
  const next=actions[name];
  if(!next||next===activeAction)return;
  next.reset().fadeIn(fade).play();
  if(activeAction)activeAction.fadeOut(fade);
  activeAction=next;
}

const loader=new GLTFLoader();
loader.load(
  ROBOT_URL,
  gltf=>{
    model=gltf.scene;
    fitToHeight(model,2.35);
    baseScale=model.scale.clone();
    model.rotation.y=Math.PI;
    model.position.y=0;
    runnerRoot.add(model);

    mixer=new THREE.AnimationMixer(model);
    const runClip=chooseClip(gltf.animations,['running','run'])||gltf.animations[0];
    const jumpClip=chooseClip(gltf.animations,['jump']);
    const idleClip=chooseClip(gltf.animations,['idle','standing']);

    actions.run=mixer.clipAction(runClip);
    if(jumpClip)actions.jump=mixer.clipAction(jumpClip);
    if(idleClip)actions.idle=mixer.clipAction(idleClip);

    actions.run.timeScale=1.2;
    if(actions.jump){
      actions.jump.setLoop(THREE.LoopOnce,1);
      actions.jump.clampWhenFinished=false;
    }

    applyRobotPalette(selectedVariant);
    play('idle',0);
    startButton.disabled=false;
    modelStatus.textContent='Robot ready · choose a color and start';
  },
  undefined,
  err=>{
    console.error(err);
    modelStatus.textContent='Robot failed to load — check network/CDN';
  }
);

document.querySelectorAll('.robot-option').forEach((btn,index)=>{
  btn.addEventListener('click',()=>applyRobotPalette(index));
});

startButton.addEventListener('click',()=>{
  picker.classList.add('hidden');
  gameStarted=true;
  play('run',.12);
  modelStatus.textContent=variants[selectedVariant].name+' robot · CITY AVENUE';
});

runnerChip.addEventListener('click',()=>{
  gameStarted=false;
  picker.classList.remove('hidden');
  play('idle',.12);
});

const lanes=[-3,0,3];
let lane=1;
let targetX=lanes[lane];
let jumpTime=0;
const jumpDuration=.78;
let sliding=false;
let slideTime=0;
const slideDuration=.68;
let distance=0;
let speed=18;
let nextSpawn=26;
let hitCooldown=0;

function moveLane(dir){
  if(!gameStarted)return;
  lane=THREE.MathUtils.clamp(lane+dir,0,2);
  targetX=lanes[lane];
}

function jump(){
  if(!gameStarted||jumpTime>0||sliding)return;
  jumpTime=.001;
  if(actions.jump)play('jump',.08);
}

function slide(){
  if(!gameStarted||sliding||jumpTime>0)return;
  sliding=true;
  slideTime=.001;
}

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code))moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code))moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code))jump();
  if(['ArrowDown','KeyS'].includes(e.code))slide();
});

let touchStart=null;
canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart)return;
  const dx=e.clientX-touchStart.x;
  const dy=e.clientY-touchStart.y;
  touchStart=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  if(Math.abs(dx)>Math.abs(dy))moveLane(dx>0?1:-1);
  else if(dy<0)jump();
  else slide();
});

const obstacles=[];
const geoLow=new THREE.BoxGeometry(2.3,.85,.65);
const geoHigh=new THREE.BoxGeometry(2.5,.45,.7);
const matLow=new THREE.MeshStandardMaterial({color:0xff315f,emissive:0x7b071f,emissiveIntensity:1.8,roughness:.35,metalness:.5});
const matHigh=new THREE.MeshStandardMaterial({color:0x18d9ff,emissive:0x045c7c,emissiveIntensity:1.6,roughness:.28,metalness:.52});

function spawnObstacle(){
  const type=Math.random()<.56?'jump':'slide';
  const laneIndex=Math.floor(Math.random()*3);
  const mesh=new THREE.Mesh(type==='jump'?geoLow:geoHigh,type==='jump'?matLow:matHigh);
  mesh.castShadow=true;
  mesh.position.x=lanes[laneIndex];
  mesh.position.z=-74;
  mesh.position.y=type==='jump'?.43:2.35;

  if(type==='slide'){
    const posts=new THREE.Group();
    for(const x of [-1.1,1.1]){
      const p=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),matHigh);
      p.position.set(x,-1.1,0);
      posts.add(p);
    }
    mesh.add(posts);
  }

  scene.add(mesh);
  obstacles.push({mesh,type,laneIndex,passed:false});
}

function hit(){
  if(hitCooldown>0)return;
  hitCooldown=.9;
  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);
  distance=Math.max(0,distance-35);
}

function updateRunner(dt){
  runnerRoot.position.x=THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);
  const lean=(targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z=THREE.MathUtils.damp(runnerRoot.rotation.z,lean,8,dt);

  let y=0;

  if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;
    if(t>=1){
      jumpTime=0;
      if(gameStarted)play('run',.1);
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }

  if(sliding){
    slideTime+=dt;
    const t=Math.min(1,slideTime/slideDuration);
    const s=t<.16?THREE.MathUtils.lerp(1,.62,t/.16):t>.78?THREE.MathUtils.lerp(.62,1,(t-.78)/.22):.62;

    if(model&&baseScale){
      model.scale.set(baseScale.x,baseScale.y*s,baseScale.z);
      model.rotation.x=-.24*(1-s);
    }

    if(slideTime>=slideDuration){
      sliding=false;
      slideTime=0;
      if(model&&baseScale){
        model.scale.copy(baseScale);
        model.rotation.x=0;
      }
    }
  }

  runnerRoot.position.y=y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45)));
  shadow.material.opacity=THREE.MathUtils.lerp(.34,.1,Math.min(1,y/2.45));
}

function updateWorld(dt){
  const travel=speed*dt;

  for(const mover of environmentMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>16)mover.object.position.z-=mover.span;
  }

  for(const mover of farMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>8)mover.object.position.z-=mover.span;
  }

  for(const m of laneMarkers){
    m.position.z+=travel;
    if(m.position.z>8)m.position.z-=160;
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z+=travel;

    if(!o.passed&&o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane=o.laneIndex===lane&&Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe=o.type==='jump'?runnerRoot.position.y>1.05:sliding;
        if(!safe)hit();
      }
    }

    if(o.mesh.position.z>13){
      scene.remove(o.mesh);
      obstacles.splice(i,1);
    }
  }

  nextSpawn-=travel;
  if(nextSpawn<=0){
    spawnObstacle();
    nextSpawn=22+Math.random()*18;
  }
}

const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);

  if(mixer)mixer.update(dt);
  hitCooldown=Math.max(0,hitCooldown-dt);

  if(gameStarted){
    speed=Math.min(29,18+distance/620);
    distance+=speed*dt;
    updateRunner(dt);
    updateWorld(dt);
  }

  distanceEl.textContent=String(Math.floor(distance)).padStart(4,'0');
  speedEl.textContent=(speed/18).toFixed(2)+'×';

  camera.position.x=THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  renderer.render(scene,camera);
}

animate();

function resize(){
  const w=innerWidth;
  const h=innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}

addEventListener('resize',resize);
resize();
