import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildCoastalWorld } from './coastal-world.mjs';

const canvas=document.querySelector('#scene');
const status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd4ef);
scene.fog=new THREE.FogExp2(0xd8edf0,.0048);

const camera=new THREE.PerspectiveCamera(50,1,.1,320);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.minDistance=3.5;
controls.maxDistance=95;
controls.maxPolarAngle=Math.PI*.495;

scene.add(new THREE.HemisphereLight(0xeaf8ff,0x83956f,2.15));
const sun=new THREE.DirectionalLight(0xfff0c8,4.0);
sun.position.set(-12,18,9);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-28;
sun.shadow.camera.right=28;
sun.shadow.camera.top=28;
sun.shadow.camera.bottom=-12;
sun.shadow.camera.near=.5;
sun.shadow.camera.far=90;
scene.add(sun);
const fill=new THREE.DirectionalLight(0xc8e7ff,1.05);
fill.position.set(12,8,-16);
scene.add(fill);

const world=new THREE.Group();
scene.add(world);
buildCoastalWorld({scene,world,isMobile:matchMedia('(pointer:coarse)').matches});

const views={
  game:{p:[0,4.9,10.6],t:[0,1.62,-22]},
  wide:{p:[15,13,25],t:[0,2,-55]},
  promenade:{p:[-18,8,7],t:[-8,2,-42]},
  village:{p:[18,8,6],t:[9,2.4,-38]}
};

function applyView(name='game'){
  const v=views[name]||views.game;
  camera.position.fromArray(v.p);
  controls.target.fromArray(v.t);
  controls.update();
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
}
applyView('game');

document.querySelectorAll('[data-view]').forEach(button=>{
  button.addEventListener('click',()=>applyView(button.dataset.view));
});
document.querySelector('#reset').addEventListener('click',()=>applyView('game'));

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
resize();

let firstFrame=true;
function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene,camera);
  if(firstFrame){
    firstFrame=false;
    status.textContent='3D preview ready · drag to inspect';
    setTimeout(()=>status.style.opacity='.72',1800);
  }
}
animate();
