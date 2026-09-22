import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const MODEL_URL='https://raw.githubusercontent.com/nikhilswain/Vercord/314cda6ff31e98ae8db86626ff559976a71d708a/public/game-assets/three-characters/hoodie-character.glb';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce9ef);
scene.fog=new THREE.Fog(0xdce9ef,18,35);

const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.05,80);
camera.position.set(3.35,1.62,-3.35);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#stage').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.30,0);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.enableZoom=true;
controls.minDistance=2.9;
controls.maxDistance=7.0;
controls.minPolarAngle=.50;
controls.maxPolarAngle=1.72;
controls.rotateSpeed=.7;
controls.zoomSpeed=.8;
controls.update();

scene.add(new THREE.HemisphereLight(0xf7fbff,0x78858e,2.6));

const key=new THREE.DirectionalLight(0xffefd7,4.4);
key.position.set(-4.5,8,5);
key.castShadow=true;
key.shadow.mapSize.set(4096,4096);
key.shadow.camera.left=-5;
key.shadow.camera.right=5;
key.shadow.camera.top=7;
key.shadow.camera.bottom=-2;
key.shadow.bias=-0.00012;
key.shadow.normalBias=0.018;
key.shadow.radius=2.5;
scene.add(key);

const faceLight=new THREE.DirectionalLight(0xffffff,2.0);
faceLight.position.set(0,3,-5);
scene.add(faceLight);

const rim=new THREE.DirectionalLight(0x9bdcff,1.8);
rim.position.set(4,5,4);
scene.add(rim);

const floor=new THREE.Mesh(
  new THREE.CircleGeometry(5.4,96),
  new THREE.MeshStandardMaterial({color:0xc8d3d9,roughness:.9,metalness:0})
);
floor.rotation.x=-Math.PI/2;
floor.receiveShadow=true;
scene.add(floor);

const runnerRoot=new THREE.Group();
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.62,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.17,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

const clock=new THREE.Clock();
let mixer=null;
let actions=[];
let running=true;

function fitToHeight(root,targetHeight){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  const scale=targetHeight/Math.max(size.y,.001);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
}

function tuneMaterials(root){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const tuned=source.map(mat=>{
      if(!mat)return mat;
      const m=mat.clone();
      m.roughness=.72;
      m.metalness=0;
      m.dithering=true;
      const name=(m.name||'').toLowerCase();

      if(/hood|shirt|top|jacket|sweater|body/.test(name)){
        m.color?.setHex(0xc94b40);
      }else if(/pant|trouser|jean|bottom/.test(name)){
        m.color?.setHex(0x315f94);
      }else if(/shoe|boot|sneaker/.test(name)){
        m.color?.setHex(0xf5f2ea);
      }else if(/hair/.test(name)){
        m.color?.setHex(0x2a1d19);
      }
      m.needsUpdate=true;
      return m;
    });
    obj.material=Array.isArray(obj.material)?tuned:tuned[0];
  });
}

function setCameraView(view){
  const radius=4.6;
  const y=1.52;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.25,y,-3.25);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.28,0);
  controls.update();
}

function startCompactRun(gltf,human){
  mixer=new THREE.AnimationMixer(human);
  const clips=gltf.animations||[];
  const walk=clips.find(c=>/\|Walk$/.test(c.name)||/^Walk$/i.test(c.name));
  const run=clips.find(c=>/\|Run$/.test(c.name)||/^Run$/i.test(c.name));
  actions=[];

  // Faster walk + lighter run produces a narrower, more game-like stride
  // than the stock full run with legs thrown wide apart.
  if(walk){
    const a=mixer.clipAction(walk);
    a.enabled=true;
    a.setEffectiveWeight(run?.62:1);
    a.timeScale=1.55;
    a.play();
    actions.push(a);
  }
  if(run){
    const a=mixer.clipAction(run);
    a.enabled=true;
    a.setEffectiveWeight(walk?.38:1);
    a.timeScale=.92;
    a.play();
    actions.push(a);
  }
}

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click',()=>setCameraView(btn.dataset.view));
});

document.querySelector('#motionToggle').addEventListener('click',event=>{
  running=!running;
  actions.forEach(a=>a.paused=!running);
  event.currentTarget.textContent=running?'PAUSE JOG':'RESUME JOG';
});

new GLTFLoader().load(
  MODEL_URL,
  gltf=>{
    const human=gltf.scene;
    fitToHeight(human,2.52);
    human.rotation.y=Math.PI;
    tuneMaterials(human);
    runnerRoot.add(human);

    startCompactRun(gltf,human);
    document.body.dataset.characterReady='true';
  },
  undefined,
  err=>{
    console.error(err);
    document.body.dataset.characterReady='error';
  }
);

setCameraView('three');

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  mixer?.update(dt);
  controls.update();
  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,3));
  renderer.setSize(innerWidth,innerHeight);
});