import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

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
let targetSkin=null;
const actions={};
let activeAction=null;
let runnerState='LOADING';

const baseScale=new THREE.Vector3();
const basePosition=new THREE.Vector3();
const baseRotation=new THREE.Euler();

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

function firstSkinnedMesh(root){
  let found=null;
  root.traverse(o=>{if(!found && o.isSkinnedMesh)found=o;});
  return found;
}

function getClip(clips,name){
  return clips.find(c=>c.name.toLowerCase()===name.toLowerCase())
    || clips.find(c=>c.name.toLowerCase().includes(name.toLowerCase()));
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

function resetSoldierPoseTransform(){
  if(!model)return;
  model.scale.copy(baseScale);
  model.position.copy(basePosition);
  model.rotation.copy(baseRotation);
}

function setState(state){
  runnerState=state;

  if(state==='RUN')play('run',{fade:.12,speed:1});
  else if(state==='SPRINT')play('run',{fade:.10,speed:1.34});
  else if(state==='JUMP')play('jump',{fade:.07,speed:1,reset:true});
  else if(state==='AIR')play('jumpIdle',{fade:.06,speed:1,reset:true});
  else if(state==='LAND')play('jumpLand',{fade:.06,speed:1.08,reset:true});
  else if(state==='CROUCH')play('idle',{fade:.05,speed:1,reset:true});
  else if(state==='STUMBLE')play('hitReact',{fade:.045,speed:1.05,reset:true});
  else if(state==='RECOVERY')play('jumpLand',{fade:.07,speed:1.3,reset:true});

  modelStatus.textContent='Soldier hybrid · '+state;
}

function buildRetargetOptions(targetScale){
  const rotateCW45=new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(45));
  const rotateCCW180=new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(-180));
  const rotateCW180=new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(180));
  const rotateFoot=new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(45),
      THREE.MathUtils.degToRad(180),
      0
    )
  );

  return {
    hip:'Hips',
    hipInfluence:new THREE.Vector3(0,1,0),
    scale:1/targetScale,
    localOffsets:{
      mixamorigLeftShoulder:rotateCW45,
      mixamorigRightShoulder:rotateCCW180,
      mixamorigLeftArm:rotateCW45,
      mixamorigRightArm:rotateCCW180,
      mixamorigLeftForeArm:rotateCW45,
      mixamorigRightForeArm:rotateCCW180,
      mixamorigLeftUpLeg:rotateCW180,
      mixamorigRightUpLeg:rotateCW180,
      mixamorigLeftLeg:rotateCW180,
      mixamorigRightLeg:rotateCW180,
      mixamorigLeftFoot:rotateFoot,
      mixamorigRightFoot:rotateFoot
    },
    names:{
      mixamorigHips:'Hips',
      mixamorigSpine:'Abdomen',
      mixamorigSpine1:'Torso',
      mixamorigNeck:'Neck',
      mixamorigHead:'Head',

      mixamorigLeftShoulder:'Shoulder.L',
      mixamorigRightShoulder:'Shoulder.R',
      mixamorigLeftArm:'UpperArm.L',
      mixamorigRightArm:'UpperArm.R',
      mixamorigLeftForeArm:'LowerArm.L',
      mixamorigRightForeArm:'LowerArm.R',

      mixamorigLeftUpLeg:'UpperLeg.L',
      mixamorigRightUpLeg:'UpperLeg.R',
      mixamorigLeftLeg:'LowerLeg.L',
      mixamorigRightLeg:'LowerLeg.R',
      mixamorigLeftFoot:'Foot.L',
      mixamorigRightFoot:'Foot.R'
    }
  };
}

function sourceSkeletonFrom(root){
  const helper=new THREE.SkeletonHelper(root);
  return new THREE.Skeleton(helper.bones);
}

async function loadModel(url){
  const loader=new GLTFLoader();
  return await new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
}

async function initRunner(){
  try{
    const [soldier,source]=await Promise.all([
      loadModel('https://threejs.org/examples/models/gltf/Soldier.glb'),
      loadModel('https://cdn.jsdelivr.net/gh/danvanderboom/Aetherium@main/samples/unity/Aphelion/Assets/ThirdParty/Quaternius/Animated/reclaimer-rae.gltf')
    ]);

    model=soldier.scene;
    model.rotation.y=0;
    model.traverse(o=>{
      if(o.isMesh){
        o.castShadow=true;
        o.receiveShadow=true;
      }
    });

    fitToHeight(model,2.35);
    baseScale.copy(model.scale);
    basePosition.copy(model.position);
    baseRotation.copy(model.rotation);

    runnerRoot.add(model);
    targetSkin=firstSkinnedMesh(model);
    if(!targetSkin)throw new Error('Soldier skinned mesh not found');

    mixer=new THREE.AnimationMixer(targetSkin);

    const soldierRun=getClip(soldier.animations,'Run') || soldier.animations[1];
    const soldierIdle=getClip(soldier.animations,'Idle') || soldier.animations[0];

    addAction('run',soldierRun);
    addAction('idle',soldierIdle);

    source.scene.updateMatrixWorld(true);
    const sourceSkeleton=sourceSkeletonFrom(source.scene);
    const opts=buildRetargetOptions(baseScale.y);

    const srcJump=getClip(source.animations,'Jump');
    const srcJumpIdle=getClip(source.animations,'Jump_Idle');
    const srcJumpLand=getClip(source.animations,'Jump_Land');
    const srcHit=getClip(source.animations,'HitReact');

    const jumpClip=SkeletonUtils.retargetClip(targetSkin,sourceSkeleton,srcJump,opts);
    const jumpIdleClip=SkeletonUtils.retargetClip(targetSkin,sourceSkeleton,srcJumpIdle,opts);
    const jumpLandClip=SkeletonUtils.retargetClip(targetSkin,sourceSkeleton,srcJumpLand,opts);
    const hitClip=SkeletonUtils.retargetClip(targetSkin,sourceSkeleton,srcHit,opts);

    addAction('jump',jumpClip,{once:true});
    addAction('jumpIdle',jumpIdleClip);
    addAction('jumpLand',jumpLandClip,{once:true});
    addAction('hitReact',hitClip,{once:true});

    setState('RUN');
    modelStatus.textContent='Soldier RUN + Soldier crouch + retargeted jump/hit';
  }catch(err){
    console.error(err);
    modelStatus.textContent='Hybrid Soldier setup failed to load';
  }
}
initRunner();

const lanes=[-3,0,3];
let lane=1;
let targetX=0;

let jumpTime=0;
const jumpDuration=.82;

let crouchTime=0;
const crouchDuration=.68;

let stumbleTime=0;
const stumbleDuration=.46;

let recoveryTime=0;
const recoveryDuration=.30;

let sprintHeld=false;
let distance=0;
let speed=18;
let nextSpawn=20;
let hitCooldown=0;

function busy(){
  return jumpTime>0 || crouchTime>0 || stumbleTime>0 || recoveryTime>0;
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
  resetSoldierPoseTransform();
  setState('JUMP');
}

function crouch(){
  if(busy())return;
  crouchTime=.001;
  setState('CROUCH');
}

addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code))moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code))moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code))jump();
  if(['ArrowDown','KeyS'].includes(e.code))crouch();
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
canvas.addEventListener('pointerdown',e=>touchStart={x:e.clientX,y:e.clientY});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart)return;
  const dx=e.clientX-touchStart.x;
  const dy=e.clientY-touchStart.y;
  touchStart=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  if(Math.abs(dx)>Math.abs(dy))moveLane(dx>0?1:-1);
  else if(dy<0)jump();
  else crouch();
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
  const type=Math.random()<.56?'jump':'crouch';
  const laneIndex=Math.floor(Math.random()*3);
  const mesh=new THREE.Mesh(
    type==='jump'?geoLow:geoHigh,
    type==='jump'?matLow:matHigh
  );

  mesh.castShadow=true;
  mesh.position.x=lanes[laneIndex];
  mesh.position.z=-74;
  mesh.position.y=type==='jump'?.43:2.35;

  if(type==='crouch'){
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
  crouchTime=0;
  recoveryTime=0;
  stumbleTime=.001;

  resetSoldierPoseTransform();
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
      resetSoldierPoseTransform();
      setState(locomotionState());
    }
  }else if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;

    if(t>=.26 && t<.72 && runnerState!=='AIR')setState('AIR');
    else if(t>=.72 && t<1 && runnerState!=='LAND')setState('LAND');

    if(t>=1){
      jumpTime=0;
      resetSoldierPoseTransform();
      setState(locomotionState());
      y=0;
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }else if(crouchTime>0){
    crouchTime+=dt;
    const t=Math.min(1,crouchTime/crouchDuration);
    const fold=t<.18?t/.18:t>.78?(1-t)/.22:1;

    // This is the exact crouch treatment from the Soldier test,
    // applied to Soldier itself rather than transplanted onto another rig.
    if(model){
      model.scale.set(
        baseScale.x,
        baseScale.y*(1-.38*fold),
        baseScale.z
      );
      model.rotation.set(
        baseRotation.x+.30*fold,
        baseRotation.y,
        baseRotation.z
      );
      model.position.set(
        basePosition.x,
        basePosition.y-.06*fold,
        basePosition.z
      );
    }

    if(crouchTime>=crouchDuration){
      crouchTime=0;
      resetSoldierPoseTransform();
      setState(locomotionState());
    }
  }else{
    const wanted=locomotionState();
    if(runnerState!==wanted)setState(wanted);
  }

  runnerRoot.position.y=y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45)));
  shadow.material.opacity=THREE.MathUtils.lerp(.34,.1,Math.min(1,y/2.45));
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
      const same=o.laneIndex===lane && Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(same){
        const safe=o.type==='jump'?runnerRoot.position.y>1.05:crouchTime>0;
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
  camera.position.x=THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  rim.intensity=THREE.MathUtils.damp(rim.intensity,18+sprint*12,5,dt);

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