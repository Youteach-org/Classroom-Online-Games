import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const canvas = document.querySelector('#game');
const distanceEl = document.querySelector('#distance');
const speedEl = document.querySelector('#speed');
const modelStatus = document.querySelector('#modelStatus');
const flash = document.querySelector('#flash');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060713);
scene.fog = new THREE.FogExp2(0x070817, 0.026);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 180);
camera.position.set(0, 4.8, 10.8);
camera.lookAt(0, 1.55, -18);

scene.add(new THREE.HemisphereLight(0xb6efff,0x18111f,2.35));
const key = new THREE.DirectionalLight(0xffd1dc,3.2);
key.position.set(-6,12,8);
key.castShadow = true;
scene.add(key);

const rim = new THREE.PointLight(0x16d9ff,18,34,2);
rim.position.set(5,5,3);
scene.add(rim);
const magenta = new THREE.PointLight(0xff245f,16,30,2);
magenta.position.set(-6,3,-4);
scene.add(magenta);

const world = new THREE.Group();
scene.add(world);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12,170),
  new THREE.MeshStandardMaterial({color:0x101424,roughness:.78,metalness:.2})
);
road.rotation.x = -Math.PI/2;
road.position.z = -68;
road.receiveShadow = true;
world.add(road);

const edgeMat = new THREE.MeshBasicMaterial({color:0x23d9ff});
for(const x of [-6,6]){
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.08,.025,170),edgeMat);
  rail.position.set(x,.03,-68);
  world.add(rail);
}

const laneMarkers = [];
const markerMat = new THREE.MeshBasicMaterial({color:0x9eecff,transparent:true,opacity:.72});
for(const x of [-1.5,1.5]){
  for(let i=0;i<20;i++){
    const m = new THREE.Mesh(new THREE.BoxGeometry(.07,.02,2.5),markerMat);
    m.position.set(x,.035,-i*8);
    laneMarkers.push(m);
    world.add(m);
  }
}

const city = new THREE.Group();
for(let i=0;i<34;i++){
  const side = i%2 ? -1 : 1;
  const h = 3 + (i%7)*1.25;
  const w = 1.4 + (i%4)*.45;
  const b = new THREE.Mesh(
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

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(.05,h*.72,.05),
    new THREE.MeshBasicMaterial({color:i%2?0xff285f:0x24dfff})
  );
  strip.position.set(b.position.x-side*w*.28,h*.52,b.position.z+w*.51);
  city.add(strip);
}
world.add(city);

const runnerRoot = new THREE.Group();
runnerRoot.position.set(0,0,2);
scene.add(runnerRoot);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(.72,32),
  new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.34,depthWrite:false})
);
shadow.rotation.x = -Math.PI/2;
shadow.position.y = .025;
runnerRoot.add(shadow);

let model = null;
let vrm = null;
let mixer = null;
const actions = {};
let activeAction = null;
let runnerState = 'LOADING';
let clipsReady = false;

const STATE_LABELS = {
  RUN:'RUN',
  JUMP:'JUMP',
  SLIDE:'SLIDE / CROUCH',
  STUMBLE:'STUMBLE',
  RECOVERY:'RECOVERY',
  SPRINT:'SPRINT'
};

const deg = THREE.MathUtils.degToRad;

function qFromDeg([x=0,y=0,z=0]){
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(deg(x),deg(y),deg(z),'XYZ')
  );
}

function quatTrack(boneName,times,poses){
  if(!vrm?.humanoid) return null;
  const node = vrm.humanoid.getNormalizedBoneNode(boneName);
  if(!node) return null;
  const values = [];
  for(const pose of poses) values.push(...qFromDeg(pose).toArray());
  return new THREE.QuaternionKeyframeTrack(node.name+'.quaternion',times,values);
}

function makeClip(name,duration,definition){
  const tracks = [];
  for(const [bone,entry] of Object.entries(definition)){
    const tr = quatTrack(bone,entry.times,entry.poses);
    if(tr) tracks.push(tr);
  }
  return new THREE.AnimationClip(name,duration,tracks);
}

function cyclePoses(values){
  return values.map(v=>Array.isArray(v)?v:[v,0,0]);
}

function buildRunClip(name='Run',sprint=false){
  const t=[0,.125,.25,.375,.5,.625,.75,.875,1];
  const amp=sprint?1.22:1;
  const lean=sprint?-10:-5;

  const rLeg=[-28,-12,18,42,26,4,-20,-40,-28].map(x=>[x*amp,0,0]);
  const lLeg=[26,4,-20,-40,-28,-12,18,42,26].map(x=>[x*amp,0,0]);

  const rKnee=[54,74,62,30,16,30,64,80,54].map(x=>[x,0,0]);
  const lKnee=[16,30,64,80,54,74,62,30,16].map(x=>[x,0,0]);

  const rArm=[34,20,-2,-28,-38,-22,2,28,34].map(x=>[x*amp,0,-5]);
  const lArm=[-38,-22,2,28,34,20,-2,-28,-38].map(x=>[x*amp,0,5]);

  const spineTw=[6,4,1,-4,-6,-4,-1,4,6];
  const chestTw=spineTw.map(v=>-v*.65);

  return makeClip(name,1,{
    hips:{times:t,poses:spineTw.map(v=>[0,v*.35,0])},
    spine:{times:t,poses:spineTw.map(v=>[lean,v,0])},
    chest:{times:t,poses:chestTw.map(v=>[lean*.45,v,0])},
    rightUpperLeg:{times:t,poses:rLeg},
    leftUpperLeg:{times:t,poses:lLeg},
    rightLowerLeg:{times:t,poses:rKnee},
    leftLowerLeg:{times:t,poses:lKnee},
    rightFoot:{times:t,poses:[[6,0,0],[14,0,0],[0,0,0],[-8,0,0],[-3,0,0],[8,0,0],[14,0,0],[-4,0,0],[6,0,0]]},
    leftFoot:{times:t,poses:[[-3,0,0],[8,0,0],[14,0,0],[-4,0,0],[6,0,0],[14,0,0],[0,0,0],[-8,0,0],[-3,0,0]]},
    rightUpperArm:{times:t,poses:rArm},
    leftUpperArm:{times:t,poses:lArm},
    rightLowerArm:{times:t,poses:t.map((_,i)=>[-52-(i%4)*5,0,-4])},
    leftLowerArm:{times:t,poses:t.map((_,i)=>[-52-((i+2)%4)*5,0,4])},
    neck:{times:t,poses:spineTw.map(v=>[-lean*.15,-v*.28,0])}
  });
}

function buildJumpClip(){
  const t=[0,.14,.32,.52,.72,.88,1];
  return makeClip('Jump',1,{
    spine:{times:t,poses:[[0,0,0],[-12,0,0],[-5,0,0],[-2,0,0],[-4,0,0],[-10,0,0],[0,0,0]]},
    chest:{times:t,poses:[[0,0,0],[-8,0,0],[-3,0,0],[0,0,0],[-2,0,0],[-6,0,0],[0,0,0]]},
    rightUpperLeg:{times:t,poses:[[0,0,0],[22,0,0],[-6,0,0],[18,0,0],[10,0,0],[24,0,0],[0,0,0]]},
    leftUpperLeg:{times:t,poses:[[0,0,0],[22,0,0],[8,0,0],[26,0,0],[16,0,0],[24,0,0],[0,0,0]]},
    rightLowerLeg:{times:t,poses:[[0,0,0],[45,0,0],[24,0,0],[62,0,0],[48,0,0],[52,0,0],[0,0,0]]},
    leftLowerLeg:{times:t,poses:[[0,0,0],[45,0,0],[34,0,0],[66,0,0],[54,0,0],[52,0,0],[0,0,0]]},
    rightUpperArm:{times:t,poses:[[10,0,-5],[-28,0,-10],[-58,0,-16],[-42,0,-12],[-18,0,-8],[4,0,-5],[10,0,-5]]},
    leftUpperArm:{times:t,poses:[[-10,0,5],[-28,0,10],[-58,0,16],[-42,0,12],[-18,0,8],[-4,0,5],[-10,0,5]]}
  });
}

function buildSlideClip(){
  const t=[0,.14,.36,.64,.84,1];
  return makeClip('Slide',1,{
    hips:{times:t,poses:[[0,0,0],[0,-7,0],[0,-9,0],[0,-8,0],[0,-4,0],[0,0,0]]},
    spine:{times:t,poses:[[0,0,0],[-28,0,0],[-46,0,0],[-48,0,0],[-24,0,0],[0,0,0]]},
    chest:{times:t,poses:[[0,0,0],[-14,0,0],[-25,0,0],[-28,0,0],[-12,0,0],[0,0,0]]},
    rightUpperLeg:{times:t,poses:[[0,0,0],[35,0,0],[55,0,0],[54,0,0],[28,0,0],[0,0,0]]},
    leftUpperLeg:{times:t,poses:[[0,0,0],[18,0,0],[28,0,0],[32,0,0],[18,0,0],[0,0,0]]},
    rightLowerLeg:{times:t,poses:[[0,0,0],[66,0,0],[96,0,0],[92,0,0],[55,0,0],[0,0,0]]},
    leftLowerLeg:{times:t,poses:[[0,0,0],[48,0,0],[74,0,0],[78,0,0],[46,0,0],[0,0,0]]},
    rightUpperArm:{times:t,poses:[[8,0,-6],[-14,0,-18],[-28,0,-32],[-30,0,-28],[-10,0,-12],[8,0,-6]]},
    leftUpperArm:{times:t,poses:[[-8,0,6],[-14,0,18],[-28,0,32],[-30,0,28],[-10,0,12],[-8,0,6]]}
  });
}

function buildStumbleClip(){
  const t=[0,.12,.28,.46,.62,1];
  return makeClip('Stumble',1,{
    hips:{times:t,poses:[[0,0,0],[-4,8,3],[-10,14,8],[-8,8,5],[-4,4,2],[0,0,0]]},
    spine:{times:t,poses:[[0,0,0],[-18,8,6],[-36,15,12],[-28,8,7],[-16,4,3],[-8,0,0]]},
    chest:{times:t,poses:[[0,0,0],[-12,-8,-8],[-24,-12,-14],[-18,-8,-8],[-8,-4,-3],[-4,0,0]]},
    rightUpperLeg:{times:t,poses:[[0,0,0],[18,0,4],[38,0,8],[24,0,4],[10,0,2],[0,0,0]]},
    leftUpperLeg:{times:t,poses:[[0,0,0],[-10,0,-4],[-24,0,-8],[-16,0,-4],[-6,0,-2],[0,0,0]]},
    rightUpperArm:{times:t,poses:[[0,0,-4],[-18,0,-35],[-42,0,-72],[-34,0,-55],[-18,0,-28],[0,0,-6]]},
    leftUpperArm:{times:t,poses:[[0,0,4],[-8,0,32],[-18,0,68],[-12,0,50],[-6,0,26],[0,0,6]]}
  });
}

function buildRecoveryClip(){
  const t=[0,.22,.48,.72,1];
  return makeClip('Recovery',1,{
    hips:{times:t,poses:[[-6,6,3],[-4,4,2],[-2,2,1],[0,0,0],[0,0,0]]},
    spine:{times:t,poses:[[-24,8,8],[-16,5,5],[-10,3,3],[-4,1,1],[-5,0,0]]},
    chest:{times:t,poses:[[-14,-6,-7],[-10,-4,-4],[-6,-2,-2],[-2,0,0],[-2,0,0]]},
    rightUpperLeg:{times:t,poses:[[28,0,4],[18,0,3],[10,0,2],[2,0,0],[-18,0,0]]},
    leftUpperLeg:{times:t,poses:[[-16,0,-4],[-8,0,-3],[-2,0,-2],[8,0,0],[20,0,0]]},
    rightUpperArm:{times:t,poses:[[-30,0,-45],[-20,0,-30],[-8,0,-18],[8,0,-10],[26,0,-5]]},
    leftUpperArm:{times:t,poses:[[-12,0,42],[-8,0,28],[0,0,16],[-8,0,9],[-28,0,5]]}
  });
}

function registerAction(name,clip,{once=false}={}){
  if(!clip) return null;
  const action=mixer.clipAction(clip);
  action.enabled=true;
  action.clampWhenFinished=once;
  action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  actions[name]=action;
  return action;
}

function actionForState(state){
  return actions[state.toLowerCase()] || actions.run;
}

function updateStatus(){
  if(!clipsReady){
    modelStatus.textContent='Loading humanoid VRM…';
    return;
  }
  modelStatus.textContent='Humanoid VRM · '+(STATE_LABELS[runnerState] || runnerState);
}

function setRunnerState(state,fade=.12,{force=false}={}){
  if(!clipsReady) return;
  const next=actionForState(state);
  if(!next) return;

  const previousState=runnerState;
  runnerState=state;

  if(next===activeAction){
    if(force || previousState!==state){
      next.enabled=true;
      if(force) next.reset().play();
    }
    updateStatus();
    return;
  }

  next.enabled=true;
  next.reset().fadeIn(fade).play();
  if(activeAction) activeAction.fadeOut(fade);
  activeAction=next;
  updateStatus();
}

function fitModelToHeight(root,targetHeight=2.25){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0) return;
  const s=targetHeight/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const box2=new THREE.Box3().setFromObject(root);
  root.position.y -= box2.min.y;
}

const loader=new GLTFLoader();
loader.crossOrigin='anonymous';
loader.register(parser=>new VRMLoaderPlugin(parser));

loader.load(
  'https://cdn.jsdelivr.net/gh/pixiv/three-vrm@dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm',
  gltf=>{
    vrm=gltf.userData.vrm;

    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);

    model=vrm.scene;
    model.rotation.y=Math.PI;
    model.traverse(obj=>{
      obj.frustumCulled=false;
      if(obj.isMesh){
        obj.castShadow=true;
        obj.receiveShadow=true;
      }
    });

    fitModelToHeight(model,2.3);
    runnerRoot.add(model);

    mixer=new THREE.AnimationMixer(model);

    registerAction('run',buildRunClip('Run',false));
    registerAction('sprint',buildRunClip('Sprint',true));
    registerAction('jump',buildJumpClip(),{once:true});
    registerAction('slide',buildSlideClip(),{once:true});
    registerAction('stumble',buildStumbleClip(),{once:true});
    registerAction('recovery',buildRecoveryClip(),{once:true});

    clipsReady=true;
    setRunnerState('RUN',0,{force:true});
    modelStatus.textContent='Humanoid VRM loaded · skeletal RUN active';
  },
  undefined,
  err=>{
    console.error(err);
    modelStatus.textContent='Humanoid VRM failed to load';
  }
);

const lanes=[-3,0,3];
let lane=1;
let targetX=lanes[lane];
let jumpTime=0;
const jumpDuration=.78;
let sliding=false;
let slideTime=0;
const slideDuration=.68;
let stumbleTime=0;
const stumbleDuration=.50;
let recoveryTime=0;
const recoveryDuration=.42;
let sprintHeld=false;
let distance=0;
let speed=18;
let nextSpawn=20;
let hitCooldown=0;

function isBusy(){
  return jumpTime>0 || sliding || stumbleTime>0 || recoveryTime>0;
}
function desiredLocomotion(){
  return (sprintHeld || speed>=25.7)?'SPRINT':'RUN';
}
function returnToLocomotion(){
  setRunnerState(desiredLocomotion(),.11);
}
function moveLane(dir){
  if(stumbleTime>0) return;
  lane=THREE.MathUtils.clamp(lane+dir,0,2);
  targetX=lanes[lane];
}
function jump(){
  if(isBusy()) return;
  jumpTime=.001;
  setRunnerState('JUMP',.07,{force:true});
}
function slide(){
  if(isBusy()) return;
  sliding=true;
  slideTime=.001;
  setRunnerState('SLIDE',.07,{force:true});
}

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code)) moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code)) moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code)) jump();
  if(['ArrowDown','KeyS'].includes(e.code)) slide();
  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld=true;
    if(!isBusy()) setRunnerState('SPRINT',.09);
  }
});
window.addEventListener('keyup',e=>{
  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld=false;
    if(!isBusy()) returnToLocomotion();
  }
});

let touchStart=null;
canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart) return;
  const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;
  touchStart=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24) return;
  if(Math.abs(dx)>Math.abs(dy)) moveLane(dx>0?1:-1);
  else if(dy<0) jump();
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

function beginStumble(){
  if(hitCooldown>0) return;
  hitCooldown=1.05;
  jumpTime=0;
  sliding=false;
  slideTime=0;
  recoveryTime=0;
  stumbleTime=.001;

  setRunnerState('STUMBLE',.045,{force:true});
  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);
  distance=Math.max(0,distance-35);
}

function hit(){
  beginStumble();
}

function locomotionBounce(){
  if(!activeAction || !['RUN','SPRINT'].includes(runnerState)) return 0;
  const cycle=activeAction.time%1;
  const amp=runnerState==='SPRINT'?.095:.065;
  return Math.abs(Math.sin(cycle*Math.PI*2))*amp;
}

function updateRunner(dt){
  runnerRoot.position.x=THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);
  const laneLean=(targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z=THREE.MathUtils.damp(runnerRoot.rotation.z,laneLean,8,dt);

  let y=locomotionBounce();

  if(stumbleTime>0){
    stumbleTime+=dt;
    const t=Math.min(1,stumbleTime/stumbleDuration);
    runnerRoot.rotation.z+=Math.sin(t*Math.PI)*-.14;
    y=Math.sin(t*Math.PI)*.03;

    if(t>=1){
      stumbleTime=0;
      recoveryTime=.001;
      setRunnerState('RECOVERY',.07,{force:true});
    }
  }else if(recoveryTime>0){
    recoveryTime+=dt;
    const t=Math.min(1,recoveryTime/recoveryDuration);
    y=THREE.MathUtils.lerp(.02,.05,t);
    if(t>=1){
      recoveryTime=0;
      returnToLocomotion();
    }
  }else if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;
    if(t>=1){
      jumpTime=0;
      returnToLocomotion();
      y=0;
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }else if(sliding){
    slideTime+=dt;
    y=-.02;
    if(slideTime>=slideDuration){
      sliding=false;
      slideTime=0;
      returnToLocomotion();
    }
  }else{
    const wanted=desiredLocomotion();
    if(runnerState!==wanted) setRunnerState(wanted,.13);
  }

  runnerRoot.position.y=y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,Math.max(0,y)/2.45)));
  shadow.material.opacity=THREE.MathUtils.lerp(.34,.1,Math.min(1,Math.max(0,y)/2.45));
}

function frameTravelSpeed(){
  let mult=runnerState==='SPRINT'?1.12:1;
  if(stumbleTime>0) mult*=.42;
  if(recoveryTime>0) mult*=.72;
  return speed*mult;
}

function updateWorld(dt,travelSpeed){
  const travel=travelSpeed*dt;
  for(const m of laneMarkers){
    m.position.z+=travel;
    if(m.position.z>8) m.position.z-=160;
  }
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z+=travel;

    if(!o.passed && o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane=o.laneIndex===lane && Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe=o.type==='jump'?runnerRoot.position.y>1.05:sliding;
        if(!safe) hit();
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

  if(mixer) mixer.update(dt);
  if(vrm) vrm.update(dt);

  hitCooldown=Math.max(0,hitCooldown-dt);
  speed=Math.min(29,18+distance/620);

  updateRunner(dt);

  const travelSpeed=frameTravelSpeed();
  distance+=travelSpeed*dt;
  updateWorld(dt,travelSpeed);

  distanceEl.textContent=String(Math.floor(distance)).padStart(4,'0');
  speedEl.textContent=(travelSpeed/18).toFixed(2)+'×';

  const sprintVisual=runnerState==='SPRINT'?1:0;
  camera.fov=THREE.MathUtils.damp(camera.fov,52+sprintVisual*5.5,4.5,dt);
  camera.updateProjectionMatrix();
  camera.position.x=THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  rim.intensity=THREE.MathUtils.damp(rim.intensity,18+sprintVisual*12,5,dt);

  renderer.render(scene,camera);
}
animate();

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();