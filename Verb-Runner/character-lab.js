import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/dpwhittaker/avatar-city/c21f285f84a35be7f7f1f8e9827e9e897ea55de1/public/characters/Casual2_Male.gltf';

const TARGET={
  hoodie:0xc94b40,
  hoodieDark:0xa93632,
  jeans:0x315f94,
  jeansDark:0x244d7c,
  shoes:0xf6f2ea,
  sole:0xd7d4cf,
  hair:0x2a1d19,
  hairHi:0x3c2922,
  skin:0xd59a75,
  eye:0x2a211e,
  brow:0x3a2721,
  mouth:0x8d4743
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

const faceLight=new THREE.DirectionalLight(0xffffff,2.1);
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
        m.transparent=true;
        m.opacity=0;
        m.depthWrite=false;
      }else if(name==='face' || /face/.test(name)){
        m.color?.setHex(TARGET.skin);
      }else if(name==='skin' || /skin/.test(name)){
        m.color?.setHex(TARGET.eye);
      }else if(/head/.test(name)){
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

function childBone(bone){
  return bone?.children?.find(c=>c.isBone)||null;
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

function stylizeSkeleton(root){
  const head=bestBone(root,/head/i);
  const neck=bestBone(root,/neck/i);
  const leftHand=bestBone(root,/left.*hand|hand.*left|hand[._-]?l/i);
  const rightHand=bestBone(root,/right.*hand|hand.*right|hand[._-]?r/i);

  if(head)head.scale.multiplyScalar(.94);
  if(neck)neck.scale.multiplyScalar(.98);
  if(leftHand)leftHand.scale.multiplyScalar(.88);
  if(rightHand)rightHand.scale.multiplyScalar(.88);

  root.scale.x*=.965;
  root.scale.z*=.965;

  return {head,neck};
}

function addTargetHair(headBone){
  if(!headBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  headBone.getWorldPosition(p);

  const hair=new THREE.Group();
  hair.name='TargetHair';
  attachGroupAtWorld(headBone,hair,new THREE.Vector3(0,2.335,.005));

  const baseMat=smoothMat(TARGET.hair,.75);
  const hiMat=smoothMat(TARGET.hairHi,.73);

  const crown=new THREE.Mesh(
    new THREE.SphereGeometry(.335,40,28,0,Math.PI*2,0,Math.PI*.62),
    baseMat
  );
  crown.scale.set(1.02,.82,.98);
  crown.position.set(0,.015,.020);
  crown.rotation.x=.06;
  crown.castShadow=true;
  hair.add(crown);

  const tufts=[
    {p:[-.18,.16,-.12],s:[.14,.18,.09],rz:.46,mat:hiMat},
    {p:[-.075,.215,-.15],s:[.14,.20,.085],rz:.20,mat:baseMat},
    {p:[ .045,.225,-.16],s:[.15,.21,.085],rz:-.10,mat:hiMat},
    {p:[ .165,.17,-.12],s:[.13,.18,.09],rz:-.42,mat:baseMat},
    {p:[ .00,.16,-.22],s:[.18,.13,.08],rz:-.04,mat:baseMat},
    {p:[-.18,.08,.11],s:[.13,.15,.10],rz:.28,mat:baseMat},
    {p:[ .18,.08,.11],s:[.13,.15,.10],rz:-.28,mat:hiMat},
    {p:[ .00,.10,.18],s:[.19,.14,.11],rz:.00,mat:baseMat}
  ];

  for(const spec of tufts){
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),spec.mat);
    mesh.position.set(...spec.p);
    mesh.scale.set(...spec.s);
    mesh.rotation.z=spec.rz;
    mesh.castShadow=true;
    hair.add(mesh);
  }
}

function createFaceTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=512;
  const ctx=canvas.getContext('2d');

  ctx.clearRect(0,0,512,512);
  ctx.lineCap='round';

  // Brows
  ctx.strokeStyle='#3a2721';
  ctx.lineWidth=22;
  ctx.beginPath();
  ctx.moveTo(110,152); ctx.quadraticCurveTo(165,126,212,148);
  ctx.moveTo(300,148); ctx.quadraticCurveTo(347,126,402,152);
  ctx.stroke();

  // Eyes
  const drawEye=(cx)=>{
    ctx.fillStyle='#fffaf2';
    ctx.beginPath();
    ctx.ellipse(cx,220,48,35,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle='#2a211e';
    ctx.beginPath();
    ctx.ellipse(cx,222,24,27,0,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.arc(cx-8,212,7,0,Math.PI*2);
    ctx.fill();
  };
  drawEye(168);
  drawEye(344);

  // Small stylized nose
  ctx.strokeStyle='#b97659';
  ctx.lineWidth=16;
  ctx.beginPath();
  ctx.moveTo(258,250);
  ctx.quadraticCurveTo(246,286,263,300);
  ctx.stroke();

  // Friendly closed smile
  ctx.strokeStyle='#8d4743';
  ctx.lineWidth=18;
  ctx.beginPath();
  ctx.moveTo(205,352);
  ctx.quadraticCurveTo(256,386,307,352);
  ctx.stroke();

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.needsUpdate=true;
  return texture;
}

function addTargetFace(headBone){
  if(!headBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  headBone.getWorldPosition(p);

  const face=new THREE.Group();
  face.name='TargetFace';
  attachGroupAtWorld(headBone,face,new THREE.Vector3(0,2.145,-.305));

  const plane=new THREE.Mesh(
    new THREE.PlaneGeometry(.36,.34,1,1),
    new THREE.MeshBasicMaterial({
      map:createFaceTexture(),
      transparent:true,
      depthWrite:false,
      side:THREE.DoubleSide,
      alphaTest:.02
    })
  );
  plane.rotation.y=Math.PI;
  plane.renderOrder=5;
  face.add(plane);
}

function addSleeve(armBone){
  if(!armBone)return;
  const next=childBone(armBone);
  if(!next)return;

  scene.updateMatrixWorld(true);
  const a=new THREE.Vector3();
  const b=new THREE.Vector3();
  armBone.getWorldPosition(a);
  next.getWorldPosition(b);

  const dir=b.clone().sub(a);
  const fullLen=dir.length();
  if(fullLen<.05)return;

  const covered=.82;
  const sleeveDir=dir.clone().multiplyScalar(covered);
  const center=a.clone().add(sleeveDir.clone().multiplyScalar(.50));

  const sleeve=new THREE.Mesh(
    new THREE.CylinderGeometry(.115,.135,sleeveDir.length(),28,3,false),
    smoothMat(TARGET.hoodie,.72)
  );
  sleeve.position.copy(center);
  sleeve.quaternion.setFromUnitVectors(
    new THREE.Vector3(0,1,0),
    sleeveDir.clone().normalize()
  );
  sleeve.castShadow=true;

  scene.add(sleeve);
  scene.updateMatrixWorld(true);
  armBone.attach(sleeve);
}

function addHoodieSleeves(root){
  const left=bestBone(root,/left.*(upper)?arm|(upper)?arm.*left|upper.?arm[._-]?l/i);
  const right=bestBone(root,/right.*(upper)?arm|(upper)?arm.*right|upper.?arm[._-]?r/i);
  addSleeve(left);
  addSleeve(right);
}

function addHoodieCollar(neckBone){
  if(!neckBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  neckBone.getWorldPosition(p);

  const group=new THREE.Group();
  group.name='HoodieCollar';
  attachGroupAtWorld(neckBone,group,p.clone().add(new THREE.Vector3(0,-.055,.015)));

  const mat=smoothMat(TARGET.hoodieDark,.74);
  const left=new THREE.Mesh(new RoundedBoxGeometry(.17,.09,.10,8,.045),mat);
  const right=left.clone();
  left.position.set(-.085,0,0);
  right.position.set(.085,0,0);
  left.rotation.z=-.14;
  right.rotation.z=.14;
  left.castShadow=right.castShadow=true;
  group.add(left,right);
}

function addShoe(footBone,side){
  if(!footBone)return;

  scene.updateMatrixWorld(true);
  const p=new THREE.Vector3();
  footBone.getWorldPosition(p);

  const shoe=new THREE.Group();
  shoe.name=side+'TargetShoe';
  attachGroupAtWorld(
    footBone,
    shoe,
    p.clone().add(new THREE.Vector3(0,-.045,-.060))
  );

  const upper=new THREE.Mesh(
    new RoundedBoxGeometry(.19,.095,.28,10,.045),
    smoothMat(TARGET.shoes,.58)
  );
  upper.position.set(0,0,-.025);
  upper.castShadow=true;
  shoe.add(upper);

  const sole=new THREE.Mesh(
    new RoundedBoxGeometry(.195,.045,.29,8,.020),
    smoothMat(TARGET.sole,.64)
  );
  sole.position.set(0,-.058,-.025);
  sole.castShadow=true;
  shoe.add(sole);
}

function addTargetShoes(root){
  const left=bestBone(root,/left.*foot|foot.*left|foot[._-]?l/i);
  const right=bestBone(root,/right.*foot|foot.*right|foot[._-]?r/i);
  addShoe(left,'Left');
  addShoe(right,'Right');
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
    a.setEffectiveWeight(run?.72:1);
    a.timeScale=1.72;
    a.play();
    actions.push(a);
  }

  if(run){
    const a=mixer.clipAction(run);
    a.enabled=true;
    a.setEffectiveWeight(walk?.28:1);
    a.timeScale=1.03;
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

    fitToHeight(human,2.62);
    human.rotation.y=Math.PI;
    styleBase(human);
    runnerRoot.add(human);

    const bones=stylizeSkeleton(human);
    scene.updateMatrixWorld(true);

    addTargetHair(bones.head);
    addHoodieCollar(bones.neck);
    addTargetShoes(human);

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
