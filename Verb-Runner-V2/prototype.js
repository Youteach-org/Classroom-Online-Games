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
scene.background=new THREE.Color(0x060713);
scene.fog=new THREE.FogExp2(0x070817,0.026);

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
  new THREE.MeshStandardMaterial({color:0x101424,roughness:.78,metalness:.2})
);
road.rotation.x=-Math.PI/2;
road.position.z=-68;
road.receiveShadow=true;
world.add(road);

const roadGlow=new THREE.MeshBasicMaterial({color:0x23d9ff});
for(const x of [-6,6]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.025,170),roadGlow);
  rail.position.set(x,.03,-68);
  world.add(rail);
}

const sidewalkMat=new THREE.MeshStandardMaterial({color:0x171b2a,roughness:.82,metalness:.18});
for(const x of [-7.2,7.2]){
  const sidewalk=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,170),sidewalkMat);
  sidewalk.position.set(x,.08,-68);
  sidewalk.receiveShadow=true;
  world.add(sidewalk);
}

const seamMat=new THREE.MeshBasicMaterial({color:0x2b7cff,transparent:true,opacity:.62});
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
const markerMat=new THREE.MeshBasicMaterial({color:0x9eecff,transparent:true,opacity:.72});
for(const x of [-1.5,1.5]){
  for(let i=0;i<20;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,2.5),markerMat);
    m.position.set(x,.035,-i*8);
    laneMarkers.push(m);
    world.add(m);
  }
}

const city=new THREE.Group();
const windowMats=[
  new THREE.MeshBasicMaterial({color:0x55dfff,transparent:true,opacity:.85}),
  new THREE.MeshBasicMaterial({color:0xff4f87,transparent:true,opacity:.78}),
  new THREE.MeshBasicMaterial({color:0xffcf66,transparent:true,opacity:.7})
];

for(let i=0;i<34;i++){
  const side=i%2?-1:1;
  const h=3+(i%7)*1.25;
  const w=1.4+(i%4)*.45;
  const z=-6-i*5.25;
  const group=new THREE.Group();

  const b=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,w),
    new THREE.MeshStandardMaterial({
      color:i%3===0?0x18192f:0x101525,
      emissive:i%3===0?0x250924:0x05101d,
      emissiveIntensity:.58,
      roughness:.78,
      metalness:.12
    })
  );
  b.position.y=h/2;
  b.castShadow=true;
  b.receiveShadow=true;
  group.add(b);

  const strip=new THREE.Mesh(
    new THREE.BoxGeometry(.07,h*.75,.08),
    new THREE.MeshBasicMaterial({color:i%2?0xff285f:0x24dfff})
  );
  strip.position.set(-side*w*.29,h*.52,w*.52);
  group.add(strip);

  const windowRows=Math.max(2,Math.floor(h/1.3));
  for(let r=0;r<windowRows;r++){
    const win=new THREE.Mesh(
      new THREE.BoxGeometry(w*.56,.11,.035),
      windowMats[(i+r)%windowMats.length]
    );
    win.position.set(0,.75+r*1.05,w*.505);
    group.add(win);
  }

  group.position.set(side*(8+(i%5)*1.35),0,z);
  city.add(group);
  addMover(group,{speedFactor:.82,span:178,startZ:z});
}
world.add(city);

const skyline=new THREE.Group();
for(let i=0;i<22;i++){
  const side=i%2?-1:1;
  const h=7+(i%6)*2.3;
  const w=2.5+(i%4)*.75;
  const z=-25-i*8.8;
  const tower=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,w),
    new THREE.MeshStandardMaterial({
      color:i%2?0x0c1020:0x121327,
      emissive:i%3===0?0x10234a:0x130b29,
      emissiveIntensity:.42,
      roughness:.9
    })
  );
  tower.position.set(side*(15+(i%3)*3.2),h/2,z);
  skyline.add(tower);
  addFarMover(tower,{speedFactor:.22,span:205,startZ:z});
}
world.add(skyline);

const propGroup=new THREE.Group();
world.add(propGroup);

const lampPostMat=new THREE.MeshStandardMaterial({color:0x262d3d,roughness:.5,metalness:.55});
const lampGlowMat=new THREE.MeshBasicMaterial({color:0x6de8ff});
for(let i=0;i<18;i++){
  const z=-5-i*9.6;
  for(const side of [-1,1]){
    const pole=new THREE.Group();
    const stem=new THREE.Mesh(new THREE.BoxGeometry(.08,2.7,.08),lampPostMat);
    stem.position.y=1.35;
    pole.add(stem);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.42),lampGlowMat);
    lamp.position.set(-side*.12,2.63,0);
    pole.add(lamp);
    pole.position.set(side*6.65,0,z);
    propGroup.add(pole);
    addMover(pole,{speedFactor:1,span:173,startZ:z});
  }
}

for(let i=0;i<7;i++){
  const z=-18-i*24;
  const arch=new THREE.Group();
  const archMat=new THREE.MeshStandardMaterial({color:0x20263a,metalness:.65,roughness:.36});
  const glowMat=new THREE.MeshBasicMaterial({color:i%2?0xff3d75:0x3ce6ff});

  for(const x of [-5.9,5.9]){
    const post=new THREE.Mesh(new THREE.BoxGeometry(.16,4.6,.16),archMat);
    post.position.set(x,2.3,0);
    arch.add(post);
  }

  const top=new THREE.Mesh(new THREE.BoxGeometry(12,.16,.16),archMat);
  top.position.y=4.55;
  arch.add(top);

  const glow=new THREE.Mesh(new THREE.BoxGeometry(10.4,.055,.08),glowMat);
  glow.position.set(0,4.48,.05);
  arch.add(glow);

  arch.position.z=z;
  propGroup.add(arch);
  addMover(arch,{speedFactor:1,span:168,startZ:z});
}

const horizonGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(54,18),
  new THREE.MeshBasicMaterial({
    color:0x10235c,
    transparent:true,
    opacity:.22,
    side:THREE.DoubleSide,
    depthWrite:false
  })
);
horizonGlow.position.set(0,8,-92);
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
  modelStatus.textContent=variants[selectedVariant].name+' robot · NEON CITY';
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
