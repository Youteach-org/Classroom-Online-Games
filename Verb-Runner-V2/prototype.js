import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
renderer.toneMappingExposure = 1.22;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060713);
scene.fog = new THREE.FogExp2(0x070817, 0.026);

const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 180);
camera.position.set(0, 4.8, 10.8);
camera.lookAt(0, 1.55, -18);

scene.add(new THREE.HemisphereLight(0x9aefff,0x17121f,2.1));
const key = new THREE.DirectionalLight(0xffc6d3,3.4);
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

function hashName(name='mesh'){
  let h=0;
  for(const c of name) h=(h*31+c.charCodeAt(0))|0;
  return Math.abs(h);
}
function toonify(root){
  root.traverse(obj=>{
    if(!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const n = hashName(obj.name);
    const palette = [0xd91f45,0x1b1b25,0x2b2f3f,0xe7eef5,0x8b1028];
    obj.material = new THREE.MeshToonMaterial({
      color:palette[n%palette.length],
      emissive:n%5===0?0x22010b:0x000000,
      emissiveIntensity:.6
    });
  });
}
function chooseClip(clips, words){
  return clips.find(c=>words.some(w=>c.name.toLowerCase().includes(w)));
}
function registerAction(name,clip,{once=false}={}){
  if(!clip) return null;
  const action = mixer.clipAction(clip);
  action.enabled = true;
  action.clampWhenFinished = once;
  action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
  actions[name] = action;
  return action;
}
function actionForState(state){
  if(state==='SPRINT') return actions.run;
  if(state==='SLIDE') return actions.slide || actions.idle || actions.run;
  if(state==='STUMBLE') return actions.stumble || actions.recovery || actions.idle || actions.run;
  if(state==='RECOVERY') return actions.recovery || actions.idle || actions.run;
  return actions[state.toLowerCase()] || actions.run;
}
function actionSpeedForState(state){
  if(state==='SPRINT') return 1.72;
  if(state==='RUN') return 1.24;
  if(state==='JUMP') return 1.15;
  if(state==='SLIDE') return 1.9;
  if(state==='STUMBLE') return 1.35;
  if(state==='RECOVERY') return 1.55;
  return 1;
}
function updateStatus(){
  if(!clipsReady){
    modelStatus.textContent = 'Loading rigged runner…';
    return;
  }
  modelStatus.textContent = 'Animation: '+(STATE_LABELS[runnerState] || runnerState)+' · skeletal state machine';
}
function setRunnerState(state,fade=.12,{force=false}={}){
  if(!clipsReady) return;
  const next = actionForState(state);
  if(!next) return;

  const previousState = runnerState;
  runnerState = state;
  next.timeScale = actionSpeedForState(state);

  if(next===activeAction){
    if(force || previousState!==state){
      next.enabled = true;
      if(force) next.reset().play();
    }
    updateStatus();
    return;
  }

  next.enabled = true;
  next.reset().fadeIn(fade).play();
  if(activeAction) activeAction.fadeOut(fade);
  activeAction = next;
  updateStatus();
}

const loader = new GLTFLoader();
loader.load(
  'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  gltf=>{
    model = gltf.scene;
    model.scale.setScalar(.72);
    model.rotation.set(0,Math.PI,0);
    model.position.y = 0;
    toonify(model);
    runnerRoot.add(model);

    mixer = new THREE.AnimationMixer(model);

    const runClip = chooseClip(gltf.animations,['running','run']) || gltf.animations[0];
    const jumpClip = chooseClip(gltf.animations,['jump']);
    const slideClip = chooseClip(gltf.animations,['sitting','sit','crouch']);
    const stumbleClip = chooseClip(gltf.animations,['death','punch','no']);
    const recoveryClip = chooseClip(gltf.animations,['standing','idle','yes']);
    const idleClip = chooseClip(gltf.animations,['idle','standing']);

    registerAction('run',runClip);
    registerAction('jump',jumpClip,{once:true});
    registerAction('slide',slideClip);
    registerAction('stumble',stumbleClip,{once:true});
    registerAction('recovery',recoveryClip,{once:true});
    registerAction('idle',idleClip);

    clipsReady = true;
    setRunnerState('RUN',0,{force:true});

    const mapping = {
      RUN:runClip?.name,
      JUMP:jumpClip?.name || 'procedural fallback',
      SLIDE:slideClip?.name || 'procedural fallback',
      STUMBLE:stumbleClip?.name || 'procedural fallback',
      RECOVERY:recoveryClip?.name || 'procedural fallback',
      SPRINT:(runClip?.name || 'RUN')+' @ faster playback'
    };
    console.table(mapping);
  },
  undefined,
  err=>{
    console.error(err);
    modelStatus.textContent = 'Model failed to load — check network/CDN';
  }
);

const lanes = [-3,0,3];
let lane = 1;
let targetX = lanes[lane];
let jumpTime = 0;
const jumpDuration = .78;
let sliding = false;
let slideTime = 0;
const slideDuration = .68;
let stumbleTime = 0;
const stumbleDuration = .42;
let recoveryTime = 0;
const recoveryDuration = .34;
let sprintHeld = false;
let distance = 0;
let speed = 18;
let nextSpawn = 20;
let hitCooldown = 0;

function isBusy(){
  return jumpTime>0 || sliding || stumbleTime>0 || recoveryTime>0;
}
function desiredLocomotion(){
  return (sprintHeld || speed>=25.7) ? 'SPRINT' : 'RUN';
}
function returnToLocomotion(){
  setRunnerState(desiredLocomotion(),.11);
}
function moveLane(dir){
  if(stumbleTime>0) return;
  lane = THREE.MathUtils.clamp(lane+dir,0,2);
  targetX = lanes[lane];
}
function jump(){
  if(isBusy()) return;
  jumpTime = .001;
  setRunnerState('JUMP',.08,{force:true});
}
function slide(){
  if(isBusy()) return;
  sliding = true;
  slideTime = .001;
  setRunnerState('SLIDE',.08,{force:true});
}

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code)) moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code)) moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code)) jump();
  if(['ArrowDown','KeyS'].includes(e.code)) slide();
  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld = true;
    if(!isBusy()) setRunnerState('SPRINT',.1);
  }
});
window.addEventListener('keyup',e=>{
  if(['ShiftLeft','ShiftRight'].includes(e.code)){
    sprintHeld = false;
    if(!isBusy()) returnToLocomotion();
  }
});

let touchStart = null;
canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart) return;
  const dx=e.clientX-touchStart.x, dy=e.clientY-touchStart.y;
  touchStart=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24) return;
  if(Math.abs(dx)>Math.abs(dy)) moveLane(dx>0?1:-1);
  else if(dy<0) jump();
  else slide();
});

const obstacles = [];
const geoLow = new THREE.BoxGeometry(2.3,.85,.65);
const geoHigh = new THREE.BoxGeometry(2.5,.45,.7);
const matLow = new THREE.MeshStandardMaterial({color:0xff315f,emissive:0x7b071f,emissiveIntensity:1.8,roughness:.35,metalness:.5});
const matHigh = new THREE.MeshStandardMaterial({color:0x18d9ff,emissive:0x045c7c,emissiveIntensity:1.6,roughness:.28,metalness:.52});

function spawnObstacle(){
  const type = Math.random()<.56?'jump':'slide';
  const laneIndex = Math.floor(Math.random()*3);
  const mesh = new THREE.Mesh(type==='jump'?geoLow:geoHigh,type==='jump'?matLow:matHigh);
  mesh.castShadow = true;
  mesh.position.x = lanes[laneIndex];
  mesh.position.z = -74;
  mesh.position.y = type==='jump'?.43:2.35;

  if(type==='slide'){
    const posts = new THREE.Group();
    for(const x of [-1.1,1.1]){
      const p = new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),matHigh);
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

  if(model){
    model.scale.setScalar(.72);
    model.rotation.x=0;
  }

  setRunnerState('STUMBLE',.045,{force:true});
  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);
  distance=Math.max(0,distance-35);
}

function hit(){
  beginStumble();
}

function updateRunner(dt){
  runnerRoot.position.x = THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);
  const laneLean = (targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z = THREE.MathUtils.damp(runnerRoot.rotation.z,laneLean,8,dt);

  let y=0;

  if(stumbleTime>0){
    stumbleTime += dt;
    const t=Math.min(1,stumbleTime/stumbleDuration);
    if(model){
      model.rotation.z = Math.sin(t*Math.PI)*-.34;
      model.rotation.x = Math.sin(t*Math.PI)*.16;
      model.position.y = -Math.sin(t*Math.PI)*.16;
    }
    if(t>=1){
      stumbleTime=0;
      recoveryTime=.001;
      setRunnerState('RECOVERY',.08,{force:true});
    }
  }else if(recoveryTime>0){
    recoveryTime += dt;
    const t=Math.min(1,recoveryTime/recoveryDuration);
    if(model){
      model.rotation.z = THREE.MathUtils.lerp(-.08,0,t);
      model.rotation.x = THREE.MathUtils.lerp(.08,0,t);
      model.position.y = THREE.MathUtils.lerp(-.08,0,t);
    }
    if(t>=1){
      recoveryTime=0;
      if(model){
        model.rotation.set(0,Math.PI,0);
        model.position.y=0;
      }
      returnToLocomotion();
    }
  }else{
    if(model){
      model.rotation.z = THREE.MathUtils.damp(model.rotation.z,0,12,dt);
      model.rotation.x = THREE.MathUtils.damp(model.rotation.x,0,12,dt);
      model.rotation.y = Math.PI;
      model.position.y = THREE.MathUtils.damp(model.position.y,0,12,dt);
    }

    if(jumpTime>0){
      jumpTime += dt;
      const t=jumpTime/jumpDuration;
      if(t>=1){
        jumpTime=0;
        returnToLocomotion();
      }else{
        y = Math.sin(Math.PI*t)*2.45;
      }
    }

    if(sliding){
      slideTime += dt;
      const t=Math.min(1,slideTime/slideDuration);
      const s = t<.16
        ? THREE.MathUtils.lerp(1,.58,t/.16)
        : t>.78
          ? THREE.MathUtils.lerp(.58,1,(t-.78)/.22)
          : .58;

      if(model){
        model.scale.set(.72,.72*s,.72);
        model.position.y = -.05*(1-s);
        model.rotation.x = -.18*(1-s);
      }

      if(slideTime>=slideDuration){
        sliding=false;
        slideTime=0;
        if(model){
          model.scale.setScalar(.72);
          model.rotation.set(0,Math.PI,0);
          model.position.y=0;
        }
        returnToLocomotion();
      }
    }

    if(jumpTime<=0 && !sliding){
      const wanted = desiredLocomotion();
      if(runnerState!==wanted) setRunnerState(wanted,.14);
    }
  }

  runnerRoot.position.y = y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45)));
  shadow.material.opacity = THREE.MathUtils.lerp(.34,.1,Math.min(1,y/2.45));
}

function frameTravelSpeed(){
  let mult = runnerState==='SPRINT' ? 1.12 : 1;
  if(stumbleTime>0) mult*=.42;
  if(recoveryTime>0) mult*=.72;
  return speed*mult;
}

function updateWorld(dt,travelSpeed){
  const travel = travelSpeed*dt;
  for(const m of laneMarkers){
    m.position.z += travel;
    if(m.position.z>8) m.position.z -= 160;
  }
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z += travel;
    if(!o.passed && o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane = o.laneIndex===lane && Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe = o.type==='jump' ? runnerRoot.position.y>1.05 : sliding;
        if(!safe) hit();
      }
    }
    if(o.mesh.position.z>13){
      scene.remove(o.mesh);
      obstacles.splice(i,1);
    }
  }

  nextSpawn -= travel;
  if(nextSpawn<=0){
    spawnObstacle();
    nextSpawn = 22 + Math.random()*18;
  }
}

const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if(mixer) mixer.update(dt);
  hitCooldown=Math.max(0,hitCooldown-dt);

  speed = Math.min(29,18+distance/620);
  updateRunner(dt);

  const travelSpeed = frameTravelSpeed();
  distance += travelSpeed*dt;
  updateWorld(dt,travelSpeed);

  distanceEl.textContent = String(Math.floor(distance)).padStart(4,'0');
  speedEl.textContent = (travelSpeed/18).toFixed(2)+'×';

  const sprintVisual = runnerState==='SPRINT' ? 1 : 0;
  camera.fov = THREE.MathUtils.damp(camera.fov,52+sprintVisual*5.5,4.5,dt);
  camera.updateProjectionMatrix();
  camera.position.x = THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  rim.intensity = THREE.MathUtils.damp(rim.intensity,18+sprintVisual*12,5,dt);

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
