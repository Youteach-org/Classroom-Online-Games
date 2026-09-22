import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/dpwhittaker/avatar-city/c21f285f84a35be7f7f1f8e9827e9e897ea55de1/public/characters/Casual3_Male.gltf';

const TARGET={
  hoodie:0xc84a3f,
  jeans:0x315d91,
  shoes:0xf4f1ea,
  hair:0x2a1c18,
  skin:0xd59a75,
  eye:0x241f1d,
  brow:0x34231e,
  mouth:0x8b3c38
};

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
renderer.domElement.style.imageRendering='auto';
document.querySelector('#stage').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.35,0);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.enableZoom=true;
controls.minDistance=3.0;
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
  new THREE.CircleGeometry(.64,64),
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

function cloneMaterial(mat){
  const m=mat.clone();
  if('roughness' in m)m.roughness=.68;
  if('metalness' in m)m.metalness=.01;
  m.dithering=true;
  if('flatShading' in m)m.flatShading=false;
  m.needsUpdate=true;
  return m;
}

function styleBase(root){
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
        m.color?.setHex(TARGET.hoodie);
      }else if(/pants|trouser|jean|bottom/.test(name)){
        m.color?.setHex(TARGET.jeans);
      }else if(/belt|shoe|boot|access/.test(name)){
        m.color?.setHex(TARGET.shoes);
      }else if(/hair/.test(name)){
        m.color?.setHex(TARGET.hair);
      }else if(/face|skin|head/.test(name)){
        m.color?.setHex(TARGET.skin);
      }
      return m;
    });
    obj.material=Array.isArray(obj.material)?styled:styled[0];
  });
}

function boneList(root){
  const list=[];
  root.traverse(obj=>{if(obj.isBone)list.push(obj);});
  return list;
}

function bestBone(root,regex){
  const list=boneList(root).filter(b=>regex.test(b.name||''));
  if(!list.length)return null;
  list.sort((a,b)=>{
    const ae=/end|tip/i.test(a.name||'')?1:0;
    const be=/end|tip/i.test(b.name||'')?1:0;
    return ae-be || (a.name||'').length-(b.name||'').length;
  });
  return list[0];
}

function stylizeSkeleton(root){
  const head=bestBone(root,/head/i);
  const neck=bestBone(root,/neck/i);

  if(head){
    head.scale.multiplyScalar(1.13);
  }
  if(neck){
    neck.scale.multiplyScalar(.96);
  }

  // Slightly reduce the adult/tall feel of the stock mesh.
  root.scale.x*=.96;
  root.scale.z*=.96;

  return {head,neck};
}

function smoothMat(color,roughness=.72){
  return new THREE.MeshStandardMaterial({color,roughness,metalness:0});
}

function attachGroupAtWorld(parent,group,position){
  scene.add(group);
  group.position.copy(position);
  scene.updateMatrixWorld(true);
  parent.attach(group);
}

function addTargetHair(headBone){
  if(!headBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  headBone.getWorldPosition(p);

  const hair=new THREE.Group();
  hair.name='TargetHair';
  attachGroupAtWorld(headBone,hair,p.clone().add(new THREE.Vector3(0,.10,.01)));

  const mat=smoothMat(TARGET.hair,.76);
  const pieces=[
    {p:[-.13,.08,.01],s:[.18,.16,.15],r:[0,0,.28]},
    {p:[ .00,.13,.02],s:[.20,.18,.16],r:[0,0,.00]},
    {p:[ .14,.09,.02],s:[.17,.15,.14],r:[0,0,-.25]},
    {p:[-.08,-.01,.08],s:[.18,.16,.14],r:[.1,0,.12]},
    {p:[ .09,-.01,.08],s:[.18,.16,.14],r:[.1,0,-.12]},
    {p:[-.10,.02,-.13],s:[.15,.13,.11],r:[-.25,0,.45]},
    {p:[ .02,.05,-.16],s:[.17,.14,.10],r:[-.35,0,.08]},
    {p:[ .12,.02,-.13],s:[.14,.12,.10],r:[-.25,0,-.35]}
  ];

  for(const spec of pieces){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat);
    mesh.position.set(...spec.p);
    mesh.scale.set(...spec.s);
    mesh.rotation.set(...spec.r);
    mesh.castShadow=true;
    hair.add(mesh);
  }

  const quiffMat=smoothMat(0x33221d,.74);
  const quiff=new THREE.Mesh(new THREE.SphereGeometry(1,30,22),quiffMat);
  quiff.position.set(.05,.15,-.13);
  quiff.scale.set(.16,.11,.08);
  quiff.rotation.z=-.38;
  quiff.castShadow=true;
  hair.add(quiff);
}

function addTargetFace(headBone){
  if(!headBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  headBone.getWorldPosition(p);

  const face=new THREE.Group();
  face.name='TargetFace';
  attachGroupAtWorld(headBone,face,p.clone().add(new THREE.Vector3(0,.015,-.205)));

  const eyeWhite=smoothMat(0xfaf9f4,.5);
  const eyeDark=smoothMat(TARGET.eye,.5);
  const browMat=smoothMat(TARGET.brow,.7);
  const mouthMat=smoothMat(TARGET.mouth,.65);
  const noseMat=smoothMat(0xc88362,.7);

  for(const x of [-.088,.088]){
    const white=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),eyeWhite);
    white.position.set(x,.055,0);
    white.scale.set(.055,.042,.018);
    face.add(white);

    const iris=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),eyeDark);
    iris.position.set(x,.054,-.017);
    iris.scale.set(.025,.027,.014);
    face.add(iris);

    const brow=new THREE.Mesh(new RoundedBoxGeometry(.105,.018,.012,5,.008),browMat);
    brow.position.set(x,.116,-.003);
    brow.rotation.z=x<0?.10:-.10;
    face.add(brow);
  }

  const nose=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),noseMat);
  nose.position.set(0,-.005,-.012);
  nose.scale.set(.030,.045,.025);
  face.add(nose);

  const mouth=new THREE.Mesh(new RoundedBoxGeometry(.095,.018,.012,5,.007),mouthMat);
  mouth.position.set(0,-.090,-.004);
  face.add(mouth);
}

function addHoodieCollar(neckBone){
  if(!neckBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  neckBone.getWorldPosition(p);

  const group=new THREE.Group();
  group.name='HoodieCollar';
  attachGroupAtWorld(neckBone,group,p.clone().add(new THREE.Vector3(0,-.045,.025)));

  const mat=smoothMat(TARGET.hoodie,.74);
  const left=new THREE.Mesh(new RoundedBoxGeometry(.18,.10,.12,8,.05),mat);
  const right=left.clone();
  left.position.set(-.095,0,0);
  right.position.set(.095,0,0);
  left.rotation.z=-.18;
  right.rotation.z=.18;
  left.castShadow=right.castShadow=true;
  group.add(left,right);
}

function setCameraView(view){
  const radius=4.75;
  const y=1.58;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.35,y,-3.35);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.34,0);
  controls.update();
}

function startCompactJog(gltf,human){
  mixer=new THREE.AnimationMixer(human);
  const clips=gltf.animations||[];
  const walk=clips.find(c=>c.name==='Walk'||/^walk$/i.test(c.name)||/walk/i.test(c.name));
  const run=clips.find(c=>c.name==='Run'||/^run$/i.test(c.name)||/run/i.test(c.name));

  actions=[];

  if(walk){
    const a=mixer.clipAction(walk);
    a.enabled=true;
    a.setEffectiveWeight(run?.35:1);
    a.timeScale=1.7;
    a.play();
    actions.push(a);
  }

  if(run){
    const a=mixer.clipAction(run);
    a.enabled=true;
    a.setEffectiveWeight(walk?.65:1);
    a.timeScale=1.05;
    a.play();
    actions.push(a);
  }

  if(!actions.length && clips[0]){
    const a=mixer.clipAction(clips[0]);
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

    fitToHeight(human,2.60);
    human.rotation.y=Math.PI;
    styleBase(human);
    runnerRoot.add(human);

    const bones=stylizeSkeleton(human);
    scene.updateMatrixWorld(true);

    addTargetHair(bones.head);
    addTargetFace(bones.head);
    addHoodieCollar(bones.neck);

    startCompactJog(gltf,human);

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
