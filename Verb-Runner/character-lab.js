import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const ASSET_ROOT='https://raw.githubusercontent.com/dpwhittaker/avatar-city/c21f285f84a35be7f7f1f8e9827e9e897ea55de1/public/characters/';

const OPTIONS={
  street:{
    file:'Casual3_Male.gltf',
    title:'Street Runner',
    subtitle:'Sporty · contemporary · backpack',
    palette:{top:0xc7463f,bottom:0x315b8a,accent:0x2b3440,hair:0x2d211d,skin:0xd99c76}
  },
  young:{
    file:'Casual2_Male.gltf',
    title:'Young Runner',
    subtitle:'Young · agile · cleaner silhouette',
    palette:{top:0xe05b37,bottom:0x253f66,accent:0x202a33,hair:0x31231e,skin:0xd99c76}
  },
  adventure:{
    file:'Cowboy_Hair.gltf',
    title:'Adventure Runner',
    subtitle:'More hair · stronger face silhouette · adventurer',
    palette:{top:0xbd463a,bottom:0x314c63,accent:0x63452e,hair:0x2a1c17,skin:0xd99c76}
  },
  utility:{
    file:'Worker_Male.gltf',
    title:'Utility Runner',
    subtitle:'Robust · practical · more distinctive body',
    palette:{top:0xb94238,bottom:0x2f506c,accent:0x26313a,hair:0x2a201c,skin:0xd99c76}
  },
  sportF:{
    file:'Casual3_Female.gltf',
    title:'Sport Runner F',
    subtitle:'Sporty · contemporary · female option',
    palette:{top:0xc64f55,bottom:0x36577e,accent:0x293540,hair:0x34231f,skin:0xd99c76}
  }
};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce9ef);
scene.fog=new THREE.Fog(0xdce9ef,18,35);

const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.05,80);
camera.position.set(0,1.65,5.35);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.style.imageRendering='auto';
document.querySelector('#stage').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.38,0);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.enableZoom=true;
controls.minDistance=3.15;
controls.maxDistance=7.5;
controls.minPolarAngle=.55;
controls.maxPolarAngle=1.72;
controls.rotateSpeed=.7;
controls.zoomSpeed=.8;
controls.update();

scene.add(new THREE.HemisphereLight(0xf7fbff,0x78858e,2.55));

const key=new THREE.DirectionalLight(0xfff1db,4.2);
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

const faceLight=new THREE.DirectionalLight(0xffffff,1.45);
faceLight.position.set(0,3,-5);
scene.add(faceLight);

const rim=new THREE.DirectionalLight(0x9bdcff,2.0);
rim.position.set(4,5,-5);
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
  new THREE.CircleGeometry(.68,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.18,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

const modelRoot=new THREE.Group();
runnerRoot.add(modelRoot);

const loader=new GLTFLoader();
const clock=new THREE.Clock();

let mixer=null;
let activeAction=null;
let activeHuman=null;
let loadSerial=0;
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

function cloneMaterial(mat){
  const m=mat.clone();
  if('roughness' in m)m.roughness=.70;
  if('metalness' in m)m.metalness=.01;
  m.dithering=true;
  if('flatShading' in m)m.flatShading=false;
  m.needsUpdate=true;
  return m;
}

function styleRunner(root,palette){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    if(obj.geometry?.attributes?.normal)obj.geometry.normalizeNormals();

    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const styled=source.map(mat=>{
      if(!mat)return mat;
      const m=cloneMaterial(mat);
      const name=(m.name||'').toLowerCase();

      if(/shirt|top|jacket|coat|vest|body/.test(name)){
        m.color?.setHex(palette.top);
      }else if(/pants|trouser|jean|bottom/.test(name)){
        m.color?.setHex(palette.bottom);
      }else if(/belt|shoe|boot|access|strap/.test(name)){
        m.color?.setHex(palette.accent);
      }else if(/hair/.test(name)){
        m.color?.setHex(palette.hair);
      }else if(/face|skin|head/.test(name)){
        m.color?.setHex(palette.skin);
      }
      return m;
    });
    obj.material=Array.isArray(obj.material)?styled:styled[0];
  });
}

function findTorsoBone(root){
  root.updateMatrixWorld(true);
  const named=[];
  const all=[];
  const p=new THREE.Vector3();

  root.traverse(obj=>{
    if(!obj.isBone)return;
    obj.getWorldPosition(p);
    const item={bone:obj,pos:p.clone()};
    all.push(item);
    if(/upper.?chest|chest|spine.?2|spine.?1|spine|torso/i.test(obj.name||''))named.push(item);
  });

  const score=item=>{
    const {x,y,z}=item.pos;
    return Math.abs(x)*2.8+Math.abs(z)*1.4+Math.abs(y-1.55);
  };

  const pool=named.length?named:all;
  pool.sort((a,b)=>score(a)-score(b));
  return pool[0]?.bone||null;
}

function createBackpack(){
  const g=new THREE.Group();
  g.name='RunnerBackpack';

  const shellMat=new THREE.MeshStandardMaterial({color:0x26384d,roughness:.66,metalness:.03});
  const trimMat=new THREE.MeshStandardMaterial({color:0xb46f43,roughness:.64,metalness:.02});
  const strapMat=new THREE.MeshStandardMaterial({color:0x1d2936,roughness:.80,metalness:0});

  const shell=new THREE.Mesh(new RoundedBoxGeometry(.66,.78,.31,10,.13),shellMat);
  shell.position.set(0,0,.11);
  shell.rotation.x=-.08;
  shell.castShadow=true;
  g.add(shell);

  const flap=new THREE.Mesh(new RoundedBoxGeometry(.53,.27,.07,8,.07),trimMat);
  flap.position.set(0,.17,.29);
  flap.rotation.x=-.08;
  flap.castShadow=true;
  g.add(flap);

  for(const x of [-.25,.25]){
    const strap=new THREE.Mesh(new RoundedBoxGeometry(.075,.70,.07,6,.035),strapMat);
    strap.position.set(x,.015,-.075);
    strap.rotation.z=x<0?-.12:.12;
    strap.rotation.x=-.06;
    strap.castShadow=true;
    g.add(strap);
  }
  return g;
}

function attachBackpackToTorso(human){
  const backpack=createBackpack();
  backpack.position.set(0,1.48,-.24);
  modelRoot.add(backpack);

  scene.updateMatrixWorld(true);
  const torsoBone=findTorsoBone(human);

  if(torsoBone){
    torsoBone.attach(backpack);
    document.body.dataset.backpackAnchor=torsoBone.name||'unnamed-torso-bone';
  }else{
    document.body.dataset.backpackAnchor='model-root-fallback';
  }
}

function clearModel(){
  if(mixer){
    mixer.stopAllAction();
    if(activeHuman)mixer.uncacheRoot(activeHuman);
  }
  mixer=null;
  activeAction=null;
  activeHuman=null;

  while(modelRoot.children.length){
    const child=modelRoot.children.pop();
    child.traverse?.(obj=>{
      if(obj.geometry && obj.userData?.labOwnedGeometry)obj.geometry.dispose?.();
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      mats.forEach(m=>m?.dispose?.());
    });
  }
}

function setSelectedButton(id){
  document.querySelectorAll('[data-character]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.character===id);
  });
}

function setCameraView(view){
  const radius=5.1;
  const y=1.65;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.65,y,-3.65);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.38,0);
  controls.update();
}

async function loadCharacter(id){
  const option=OPTIONS[id];
  if(!option)return;

  const serial=++loadSerial;
  document.body.dataset.characterReady='loading';
  setSelectedButton(id);
  document.querySelector('#characterTitle').textContent=option.title;
  document.querySelector('#characterSubtitle').textContent=option.subtitle;

  loader.load(
    ASSET_ROOT+option.file,
    gltf=>{
      if(serial!==loadSerial)return;

      clearModel();

      const human=gltf.scene;
      activeHuman=human;
      fitToHeight(human,2.72);
      human.rotation.y=Math.PI;
      styleRunner(human,option.palette);
      modelRoot.add(human);

      scene.updateMatrixWorld(true);
      attachBackpackToTorso(human);

      mixer=new THREE.AnimationMixer(human);
      const run=(gltf.animations||[]).find(c=>c.name==='Run'||/run/i.test(c.name))||gltf.animations?.[0];
      if(run){
        activeAction=mixer.clipAction(run);
        activeAction.timeScale=1.12;
        activeAction.play();
        activeAction.paused=!running;
      }

      document.body.dataset.characterReady='true';
      document.body.dataset.characterId=id;
    },
    undefined,
    err=>{
      console.error(err);
      if(serial===loadSerial)document.body.dataset.characterReady='error';
    }
  );
}

document.querySelectorAll('[data-character]').forEach(btn=>{
  btn.addEventListener('click',()=>loadCharacter(btn.dataset.character));
});

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click',()=>setCameraView(btn.dataset.view));
});

document.querySelector('#motionToggle').addEventListener('click',event=>{
  running=!running;
  if(activeAction)activeAction.paused=!running;
  event.currentTarget.textContent=running?'PAUSE RUN':'RESUME RUN';
});

loadCharacter('street');
setCameraView('back');

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
