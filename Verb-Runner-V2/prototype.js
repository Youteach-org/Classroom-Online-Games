import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas=document.querySelector('#game');
const distanceEl=document.querySelector('#distance');
const speedEl=document.querySelector('#speed');
const modelStatus=document.querySelector('#modelStatus');
const flash=document.querySelector('#flash');

const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x060713);
scene.fog=new THREE.FogExp2(0x070817,0.026);

const camera=new THREE.PerspectiveCamera(52,1,.1,180);
camera.position.set(0,4.8,10.8);
camera.lookAt(0,1.55,-18);

scene.add(new THREE.HemisphereLight(0xb6efff,0x18111f,2.35));
const key=new THREE.DirectionalLight(0xffd1dc,3.2);
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

const road=new THREE.Mesh(
  new THREE.PlaneGeometry(12,170),
  new THREE.MeshStandardMaterial({color:0x101424,roughness:.78,metalness:.2})
);
road.rotation.x=-Math.PI/2;
road.position.z=-68;
road.receiveShadow=true;
world.add(road);

for(const x of [-6,6]){
  const rail=new THREE.Mesh(
    new THREE.BoxGeometry(.08,.025,170),
    new THREE.MeshBasicMaterial({color:0x23d9ff})
  );
  rail.position.set(x,.03,-68);
  world.add(rail);
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
for(let i=0;i<34;i++){
  const side=i%2?-1:1;
  const h=3+(i%7)*1.25;
  const w=1.4+(i%4)*.45;

  const b=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,w),
    new THREE.MeshStandardMaterial({
      color:i%3===0?0x18192f:0x101525,
      emissive:i%3===0?0x2b0b28:0x061322,
      emissiveIntensity:.7,
      roughness:.8
    })
  );
  b.position.set(side*(8+(i%5)*1.4),h/2,-4-i*5.2);
  city.add(b);

  const strip=new THREE.Mesh(
    new THREE.BoxGeometry(.05,h*.72,.05),
    new THREE.MeshBasicMaterial({color:i%2?0xff285f:0x24dfff})
  );
  strip.position.set(b.position.x-side*w*.28,h*.52,b.position.z+w*.51);
  city.add(strip);
}
world.add(city);

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
let mixer=null;
const actions={};
let activeAction=null;
let runnerState='LOADING';

function fitToHeight(root,target=2.35){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0)return;

  const s=target/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);

  const box2=new THREE.Box3().setFromObject(root);
  root.position.y-=box2.min.y;
}

function getClip(clips,name){
  return clips.find(c=>c.name.toLowerCase()===name.toLowerCase())
    || clips.find(c=>c.name.toLowerCase().includes(name.toLowerCase()));
}

function styleAdaptedRunner(root){
  const colors={
    White:0xb51f2e,
    Orange:0x101218,
    Grey:0xe8e9ed,
    Hair_Blond:0x6b3026,
    Hair_Brown:0x6b3026,
    Brown:0x5b261f
  };

  root.traverse(o=>{
    if(!o.isMesh)return;

    const list=Array.isArray(o.material)?o.material:[o.material];
    const styled=list.map(mat=>{
      if(!mat)return mat;
      const clone=mat.clone();

      if(colors[clone.name]!==undefined){
        clone.color.setHex(colors[clone.name]);
      }

      if(clone.name==='White'){
        clone.roughness=.62;
        clone.metalness=.04;
      }else if(clone.name==='Orange'){
        clone.roughness=.8;
        clone.metalness=.02;
      }else if(clone.name==='Grey'){
        clone.roughness=.5;
        clone.metalness=.08;
      }

      return clone;
    });

    o.material=Array.isArray(o.material)?styled:styled[0];
    o.castShadow=true;
    o.receiveShadow=true;
  });
}

function addAction(name,clip,{once=false}={}){
  if(!clip)return null;
  const action=mixer.clipAction(clip);
  action.enabled=true;
  action.clampWhenFinished=once;
  action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  actions[name]=action;
  return action;
}

function play(name,{fade=.12,speed=1,reset=false}={}){
  const next=actions[name];
  if(!next)return;

  next.enabled=true;
  next.setEffectiveTimeScale(speed);
  next.setEffectiveWeight(1);

  if(next===activeAction && !reset)return;

  next.reset().fadeIn(fade).play();
  if(activeAction && activeAction!==next)activeAction.fadeOut(fade);
  activeAction=next;
}

function setState(state){
  runnerState=state;

  if(state==='RUN')play('run',{fade:.12,speed:1});
  else if(state==='SPRINT')play('run',{fade:.10,speed:1.32});
  else if(state==='JUMP')play('jump',{fade:.07,speed:1,reset:true});
  else if(state==='ROLL')play('roll',{fade:.055,speed:1.10,reset:true});
  else if(state==='STUMBLE')play('hit',{fade:.04,speed:1.05,reset:true});
  else if(state==='RECOVERY')play('idle',{fade:.07,speed:1,reset:true});

  modelStatus.textContent='Adapted red runner · '+state;
}

async function loadGLTF(url){
  const loader=new GLTFLoader();
  return await new Promise((resolve,reject)=>{
    loader.load(url,resolve,undefined,reject);
  });
}

async function loadFirst(urls){
  let lastError=null;
  for(const url of urls){
    try{
      return await loadGLTF(url);
    }catch(err){
      console.warn('Model source failed, trying fallback:',url,err);
      lastError=err;
    }
  }
  throw lastError || new Error('No model source available');
}

async function initRunner(){
  try{
    const adapted=await loadFirst([
      'https://cdn.jsdelivr.net/gh/nikhilswain/Vercord@961a12c08b71e46b0c4da760b2f7cb42ddfb0159/public/game-assets/three-characters/animated-woman.glb',
      'https://static.poly.pizza/ba7a1955-ea51-4cb9-a561-188bdef0a6c7.glb'
    ]);

    let jumpSource=null;
    try{
      jumpSource=await loadGLTF(
        'https://cdn.jsdelivr.net/gh/psqd12137-sudo/dream-channel@3d1f3c91810ac6b73146971d7d6297b12c8f3244/godot/assets/quaternius/animated_characters/Casual_Female.gltf'
      );
    }catch(err){
      console.warn('Jump source unavailable; continuing with native clips.',err);
    }

    model=adapted.scene;

    // Native forward is +Z; the runner travels toward -Z.
    model.rotation.y=Math.PI;

    styleAdaptedRunner(model);

    // Same approved runner height as before.
    fitToHeight(model,2.35);
    runnerRoot.add(model);

    mixer=new THREE.AnimationMixer(model);

    const native=adapted.animations;
    const bySuffix=suffix=>native.find(c=>c.name.endsWith('|'+suffix));
    const idleClip=bySuffix('Idle_Neutral') || bySuffix('Idle') || getClip(native,'Idle');
    const runClip=bySuffix('Run') || getClip(native,'Run');
    const rollClip=bySuffix('Roll') || getClip(native,'Roll');
    const hitClip=bySuffix('HitRecieve') || bySuffix('HitReceive') || getClip(native,'HitRecieve');
    const jumpClip=jumpSource ? getClip(jumpSource.animations,'Jump') : runClip;

    if(!runClip || !rollClip || !idleClip){
      throw new Error('Native movement clips missing: '+native.map(c=>c.name).join(', '));
    }

    // Native clips must stay untouched. Sanitizing them was preventing this
    // particular GLB from resolving its authored bone tracks correctly.
    addAction('idle',idleClip,{sanitize:false});
    addAction('run',runClip,{sanitize:false});
    addAction('jump',jumpClip,{once:true,sanitize:jumpSource!==null});
    addAction('roll',rollClip,{once:true,sanitize:false});
    addAction('hit',hitClip,{once:true,sanitize:false});

    if(rollClip){
      rollDuration=THREE.MathUtils.clamp(rollClip.duration/1.10,.68,1.05);
    }

    setState('RUN');
    modelStatus.textContent='Adapted woman · native animation active';

    console.table(native.map(c=>({
      name:c.name,
      duration:c.duration.toFixed(2)
    })));
  }catch(err){
    console.error(err);
    modelStatus.textContent='Adapted red runner failed to load';
  }
}
initRunner();

const lanes=[-3,0,3];
let lane=1;
let targetX=0;

let jumpTime=0;
const jumpDuration=.82;

let rollTime=0;
let rollDuration=.72;

let stumbleTime=0;
const stumbleDuration=.44;

let recoveryTime=0;
const recoveryDuration=.24;

let sprintHeld=false;
let distance=0;
let speed=18;
let nextSpawn=20;
let hitCooldown=0;

function busy(){
  return jumpTime>0 || rollTime>0 || stumbleTime>0 || recoveryTime>0;
}

function locomotionState(){
  return (sprintHeld || speed>=25.7)?'SPRINT':'RUN';
}

function moveLane(dir){
  if(stumbleTime>0)return;
  lane=THREE.MathUtils.clamp(lane+dir,0,2);
  targetX=lanes[lane];
}

function jump(){
  if(busy())return;
  jumpTime=.001;
  setState('JUMP');
}

function roll(){
  if(busy())return;
  rollTime=.001;
  setState('ROLL');
}

addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code))moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code))moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code))jump();
  if(['ArrowDown','KeyS'].includes(e.code))roll();

  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld=true;
    if(!busy())setState('SPRINT');
  }
});

addEventListener('keyup',e=>{
  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld=false;
    if(!busy())setState('RUN');
  }
});

let touchStart=null;
canvas.addEventListener('pointerdown',e=>{
  touchStart={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart)return;

  const dx=e.clientX-touchStart.x;
  const dy=e.clientY-touchStart.y;
  touchStart=null;

  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;

  if(Math.abs(dx)>Math.abs(dy))moveLane(dx>0?1:-1);
  else if(dy<0)jump();
  else roll();
});

const obstacles=[];
const geoLow=new THREE.BoxGeometry(2.3,.85,.65);
const geoHigh=new THREE.BoxGeometry(2.5,.45,.7);

const matLow=new THREE.MeshStandardMaterial({
  color:0xff315f,
  emissive:0x7b071f,
  emissiveIntensity:1.8,
  roughness:.35,
  metalness:.5
});

const matHigh=new THREE.MeshStandardMaterial({
  color:0x18d9ff,
  emissive:0x045c7c,
  emissiveIntensity:1.6,
  roughness:.28,
  metalness:.52
});

function spawnObstacle(){
  const type=Math.random()<.56?'jump':'roll';
  const laneIndex=Math.floor(Math.random()*3);

  const mesh=new THREE.Mesh(
    type==='jump'?geoLow:geoHigh,
    type==='jump'?matLow:matHigh
  );

  mesh.castShadow=true;
  mesh.position.x=lanes[laneIndex];
  mesh.position.z=-74;
  mesh.position.y=type==='jump'?.43:2.35;

  if(type==='roll'){
    for(const x of [-1.1,1.1]){
      const p=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),matHigh);
      p.position.set(x,-1.1,0);
      mesh.add(p);
    }
  }

  scene.add(mesh);
  obstacles.push({mesh,type,laneIndex,passed:false});
}

function hit(){
  if(hitCooldown>0)return;

  hitCooldown=1.0;
  jumpTime=0;
  rollTime=0;
  recoveryTime=0;
  stumbleTime=.001;

  setState('STUMBLE');

  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);

  distance=Math.max(0,distance-35);
}

function updateRunner(dt){
  runnerRoot.position.x=THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);

  const laneLean=(targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z=THREE.MathUtils.damp(runnerRoot.rotation.z,laneLean,8,dt);

  let y=0;

  if(stumbleTime>0){
    stumbleTime+=dt;

    if(stumbleTime>=stumbleDuration){
      stumbleTime=0;
      recoveryTime=.001;
      setState('RECOVERY');
    }
  }else if(recoveryTime>0){
    recoveryTime+=dt;

    if(recoveryTime>=recoveryDuration){
      recoveryTime=0;
      setState(locomotionState());
    }
  }else if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;

    if(t>=1){
      jumpTime=0;
      setState(locomotionState());
      y=0;
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }else if(rollTime>0){
    rollTime+=dt;

    if(rollTime>=rollDuration){
      rollTime=0;
      setState(locomotionState());
    }
  }else{
    const wanted=locomotionState();
    if(runnerState!==wanted)setState(wanted);
  }

  runnerRoot.position.y=y;

  shadow.scale.setScalar(
    THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45))
  );
  shadow.material.opacity=THREE.MathUtils.lerp(
    .34,.1,Math.min(1,y/2.45)
  );
}

function travelSpeed(){
  let m=runnerState==='SPRINT'?1.12:1;

  if(stumbleTime>0)m*=.42;
  if(recoveryTime>0)m*=.72;

  return speed*m;
}

function updateWorld(dt,v){
  const travel=v*dt;

  for(const m of laneMarkers){
    m.position.z+=travel;
    if(m.position.z>8)m.position.z-=160;
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z+=travel;

    if(!o.passed && o.mesh.position.z>1.1){
      o.passed=true;

      const sameLane=
        o.laneIndex===lane &&
        Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;

      if(sameLane){
        const safe=
          o.type==='jump'
            ? runnerRoot.position.y>1.05
            : rollTime>0;

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
  speed=Math.min(29,18+distance/620);

  updateRunner(dt);

  const v=travelSpeed();
  distance+=v*dt;
  updateWorld(dt,v);

  distanceEl.textContent=String(Math.floor(distance)).padStart(4,'0');
  speedEl.textContent=(v/18).toFixed(2)+'×';

  const sprint=runnerState==='SPRINT'?1:0;

  camera.fov=THREE.MathUtils.damp(camera.fov,52+sprint*5.5,4.5,dt);
  camera.updateProjectionMatrix();

  camera.position.x=THREE.MathUtils.damp(
    camera.position.x,
    runnerRoot.position.x*.15,
    3.5,
    dt
  );

  rim.intensity=THREE.MathUtils.damp(
    rim.intensity,
    18+sprint*12,
    5,
    dt
  );

  renderer.render(scene,camera);
}
animate();

function resize(){
  renderer.setSize(innerWidth,innerHeight,false);
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();
