import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const ROBOT_URL='https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
const variants=[
  {name:'RED',accent:0xe43c3c,secondary:0x821b2a,dark:0x171922,light:0xf0f2f6},
  {name:'BLUE',accent:0x2475d1,secondary:0x123c73,dark:0x151922,light:0xddeeff},
  {name:'GREEN',accent:0x29a65a,secondary:0x145f37,dark:0x141b18,light:0xe2f5e8},
  {name:'PINK',accent:0xef4c78,secondary:0x8d2345,dark:0x1d151a,light:0xffe1ea},
  {name:'WHITE / BLACK',accent:0xe8ebf2,secondary:0x8d94a3,dark:0x111319,light:0xffffff},
  {name:'PURPLE',accent:0x9a4de0,secondary:0x57258d,dark:0x18131e,light:0xf0e2ff}
];
const loader=new GLTFLoader();
const stages=[];
let selectedAnimation='run';

function hashName(name='mesh'){let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)}
function paintRobot(root,cfg){
  const palette=[cfg.accent,cfg.dark,cfg.secondary,cfg.light,cfg.dark,cfg.accent];
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;obj.receiveShadow=true;
    const n=hashName(obj.name);
    obj.material=new THREE.MeshToonMaterial({color:palette[n%palette.length],emissive:n%6===0?cfg.secondary:0x000000,emissiveIntensity:n%6===0?.35:0});
  });
}
function findClip(clips,words){return clips.find(c=>words.some(w=>c.name.toLowerCase().includes(w)))}
function fitToHeight(root,target=2.35){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);
  if(size.y<=0)return;
  const s=target/size.y;root.scale.setScalar(s);root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);root.position.y-=fitted.min.y;
}
function playState(state,name){
  const next=state.actions[name];if(!next)return;
  next.reset().fadeIn(.12).play();
  if(state.active&&state.active!==next)state.active.fadeOut(.12);
  state.active=next;
}
function buildStage(index,cfg,source,clips){
  const canvas=document.querySelector('#model-'+index),status=document.querySelector('#status-'+index);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.shadowMap.enabled=true;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);
  camera.position.set(0,1.28,5);camera.lookAt(0,1.15,0);
  scene.add(new THREE.HemisphereLight(0xe7f8ff,0x17121f,2.5));
  const key=new THREE.DirectionalLight(0xffffff,3.3);key.position.set(-3,6,4);key.castShadow=true;scene.add(key);
  const rim=new THREE.DirectionalLight(new THREE.Color(cfg.accent),2.3);rim.position.set(4,3,-3);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.3,48),new THREE.ShadowMaterial({opacity:.25}));floor.rotation.x=-Math.PI/2;floor.position.y=.003;floor.receiveShadow=true;scene.add(floor);

  const model=cloneSkeleton(source);paintRobot(model,cfg);fitToHeight(model,2.35);model.rotation.y=Math.PI;scene.add(model);
  const mixer=new THREE.AnimationMixer(model);
  const found={idle:findClip(clips,['idle','standing']),run:findClip(clips,['running','run']),jump:findClip(clips,['jump'])},actions={};
  for(const [name,clip] of Object.entries(found)){
    if(!clip)continue;
    const action=mixer.clipAction(clip);
    if(name==='jump'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=false}
    if(name==='run')action.timeScale=1.2;
    actions[name]=action;
  }
  const state={canvas,renderer,scene,camera,model,mixer,actions,active:null,drag:false,lastX:0,yaw:Math.PI};stages.push(state);
  canvas.addEventListener('pointerdown',e=>{state.drag=true;state.lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!state.drag)return;state.yaw+=(e.clientX-state.lastX)*.012;state.lastX=e.clientX;model.rotation.y=state.yaw});
  canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
  mixer.addEventListener('finished',()=>playState(state,'idle'));
  playState(state,selectedAnimation);
  status.textContent='RobotExpressive · same geometry · '+cfg.name+' palette';status.classList.add('ready');
}
function playAll(name){
  selectedAnimation=name;
  document.querySelectorAll('[data-animation]').forEach(btn=>btn.classList.toggle('active',btn.dataset.animation===name));
  stages.forEach(stage=>playState(stage,name));
}
document.querySelectorAll('[data-animation]').forEach(btn=>btn.addEventListener('click',()=>playAll(btn.dataset.animation)));
loader.load(ROBOT_URL,gltf=>variants.forEach((cfg,index)=>buildStage(index,cfg,gltf.scene,gltf.animations||[])),undefined,err=>{
  console.error(err);
  variants.forEach((_,index)=>{const s=document.querySelector('#status-'+index);s.textContent='Robot failed to load';s.classList.add('error')});
});
function resize(stage){
  const w=Math.max(1,stage.canvas.clientWidth),h=Math.max(1,stage.canvas.clientHeight),dpr=stage.renderer.getPixelRatio();
  if(stage.canvas.width!==Math.round(w*dpr)||stage.canvas.height!==Math.round(h*dpr)){stage.renderer.setSize(w,h,false);stage.camera.aspect=w/h;stage.camera.updateProjectionMatrix()}
}
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);
  for(const stage of stages){resize(stage);stage.mixer.update(dt);stage.renderer.render(stage.scene,stage.camera)}
}
animate();
