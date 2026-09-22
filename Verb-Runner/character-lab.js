import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/nikhilswain/Vercord/314cda6ff31e98ae8db86626ff559976a71d708a/public/game-assets/three-characters/hoodie-character.glb';

const C={
  red:0xd83a3b,
  redDark:0xa8242b,
  black:0x141923,
  black2:0x222a39,
  pants:0x171e2c,
  pantsHi:0x263247,
  white:0xf5f3ee,
  skin:0xe0a17d,
  hair:0x18171c,
  eye:0x2c1d19,
  brow:0x211919,
  metal:0xb8c2cc
};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce9ef);
scene.fog=new THREE.Fog(0xdce9ef,18,35);

const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,80);
camera.position.set(3.10,1.54,-3.10);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.10;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.querySelector('#stage').appendChild(renderer.domElement);

const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.24,0);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.enableZoom=true;
controls.minDistance=2.7;
controls.maxDistance=6.5;
controls.minPolarAngle=.46;
controls.maxPolarAngle=1.72;
controls.rotateSpeed=.7;
controls.zoomSpeed=.8;
controls.update();

scene.add(new THREE.HemisphereLight(0xf9fcff,0x7a858e,2.75));

const key=new THREE.DirectionalLight(0xffeed7,4.5);
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

const fill=new THREE.DirectionalLight(0xffffff,2.10);
fill.position.set(0,3,-5);
scene.add(fill);

const rim=new THREE.DirectionalLight(0x9bdcff,1.55);
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
  new THREE.CircleGeometry(.58,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.16,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

function material(color,rough=.72){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0});
}

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

function styleNativeMaterials(root){
  const map={
    purple:C.red,
    lightblue:C.pants,
    white:C.white,
    skin:C.skin,
    eyebrows:C.brow,
    eye:C.eye,
    hair:C.hair
  };

  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    const srcs=Array.isArray(obj.material)?obj.material:[obj.material];
    const styled=srcs.map(src=>{
      if(!src)return src;
      const m=src.clone();
      const key=(m.name||'').toLowerCase();
      if(m.color && map[key]!==undefined)m.color.setHex(map[key]);
      m.roughness=.72;
      m.metalness=0;
      m.dithering=true;
      m.needsUpdate=true;
      return m;
    });
    obj.material=Array.isArray(obj.material)?styled:styled[0];
  });
}

function allBones(root){
  const out=[];
  root.traverse(o=>{if(o.isBone)out.push(o);});
  return out;
}

function findBone(root,patterns){
  const bs=allBones(root);
  for(const regex of patterns){
    const matches=bs.filter(b=>regex.test(b.name||''));
    if(matches.length){
      matches.sort((a,b)=>(a.name||'').length-(b.name||'').length);
      return matches[0];
    }
  }
  return null;
}

function wpos(bone,fallback){
  if(!bone)return fallback.clone();
  const p=new THREE.Vector3();
  bone.getWorldPosition(p);
  return p;
}

function rounded(w,h,d,color,radius=.04,rough=.72){
  const mesh=new THREE.Mesh(
    new RoundedBoxGeometry(w,h,d,8,radius),
    material(color,rough)
  );
  mesh.castShadow=true;
  return mesh;
}

function poseStatic(human,gltf){
  const mixer=new THREE.AnimationMixer(human);
  const clips=gltf.animations||[];
  const idle=
    clips.find(c=>/Idle_Neutral$/i.test(c.name)) ||
    clips.find(c=>/\|Idle$/i.test(c.name)) ||
    clips.find(c=>/Idle/i.test(c.name));

  if(idle){
    const action=mixer.clipAction(idle);
    action.play();
    mixer.update(Math.min(.38,idle.duration*.22));
    action.paused=true;
  }
  scene.updateMatrixWorld(true);
}

function addShirtPanel(chest,hips){
  const center=chest.clone().lerp(hips,.31);

  const shape=new THREE.Shape();
  shape.moveTo(-.105,.235);
  shape.lineTo(.105,.235);
  shape.lineTo(.145,-.215);
  shape.lineTo(-.145,-.215);
  shape.closePath();

  const shirt=new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      color:C.white,
      roughness:.78,
      metalness:0,
      side:THREE.DoubleSide
    })
  );
  shirt.position.set(center.x,center.y-.025,center.z-.193);
  shirt.rotation.y=Math.PI;
  shirt.castShadow=false;
  runnerRoot.add(shirt);

  // Black V-neck / inner layer.
  const v=new THREE.Shape();
  v.moveTo(-.070,.055);
  v.lineTo(0,-.010);
  v.lineTo(.070,.055);
  v.lineTo(.048,.080);
  v.lineTo(0,.035);
  v.lineTo(-.048,.080);
  v.closePath();

  const vMesh=new THREE.Mesh(
    new THREE.ShapeGeometry(v),
    new THREE.MeshBasicMaterial({color:C.black,side:THREE.DoubleSide})
  );
  vMesh.position.set(center.x,center.y+.155,center.z-.199);
  vMesh.rotation.y=Math.PI;
  runnerRoot.add(vMesh);

  // Thin inner jacket edges.
  for(const x of [-.137,.137]){
    const edge=rounded(.018,.405,.022,C.black,.006,.82);
    edge.position.set(center.x+x,center.y-.018,center.z-.205);
    edge.rotation.z=x<0?-.025:.025;
    runnerRoot.add(edge);
  }

  // Small white undershirt hem.
  const hem=rounded(.30,.048,.026,C.white,.014,.78);
  hem.position.set(center.x,hips.y+.105,center.z-.178);
  runnerRoot.add(hem);
}

function addInnerHood(neck){
  // Small black inner collar behind the neck — no bulky ring.
  const back=rounded(.34,.080,.105,C.black,.032,.82);
  back.position.set(neck.x,neck.y-.035,neck.z+.085);
  runnerRoot.add(back);

  const left=rounded(.115,.050,.050,C.black,.018,.82);
  const right=left.clone();
  left.position.set(neck.x-.095,neck.y-.055,neck.z-.095);
  right.position.set(neck.x+.095,neck.y-.055,neck.z-.095);
  left.rotation.z=-.24;
  right.rotation.z=.24;
  runnerRoot.add(left,right);
}

function addStaticGloves(){
  // Appearance-only phase: fixed to the neutral pose so nothing can float.
  const specs=[
    {x:-.365,y:1.085,z:-.010,rz:.08},
    {x: .365,y:1.085,z:-.010,rz:-.08}
  ];
  for(const s of specs){
    const glove=rounded(.105,.105,.105,C.black,.030,.84);
    glove.position.set(s.x,s.y,s.z);
    glove.rotation.z=s.rz;
    runnerRoot.add(glove);

    const cuff=rounded(.115,.032,.110,C.redDark,.010,.74);
    cuff.position.set(s.x,s.y+.062,s.z);
    runnerRoot.add(cuff);
  }
}

function addCargoCapris(){
  for(const x of [-.125,.125]){
    const leg=new THREE.Mesh(
      new THREE.CylinderGeometry(.112,.128,.43,26,2,false),
      material(C.pants,.78)
    );
    leg.position.set(x,.615,.005);
    leg.castShadow=true;
    runnerRoot.add(leg);

    const cuff=rounded(.225,.055,.180,C.black,.020,.84);
    cuff.position.set(x,.398,.005);
    runnerRoot.add(cuff);
  }

  // Outer cargo pockets and red tabs.
  const leftPocket=rounded(.100,.145,.040,C.pantsHi,.020,.80);
  leftPocket.position.set(-.225,.820,-.050);
  runnerRoot.add(leftPocket);

  const rightPocket=rounded(.100,.145,.040,C.pantsHi,.020,.80);
  rightPocket.position.set(.225,.820,-.050);
  runnerRoot.add(rightPocket);

  for(const x of [-.275,.275]){
    const tab=rounded(.022,.055,.018,C.red,.006,.72);
    tab.position.set(x,.800,-.075);
    runnerRoot.add(tab);
  }
}

function addBelt(){
  const belt=rounded(.43,.050,.145,C.black,.018,.84);
  belt.position.set(0,1.115,-.002);
  runnerRoot.add(belt);

  const buckle=rounded(.052,.035,.018,C.metal,.006,.55);
  buckle.position.set(0,1.115,-.082);
  runnerRoot.add(buckle);
}

function buildReferenceDetails(human){
  const headBone=findBone(human,[/head/i]);
  const neckBone=findBone(human,[/neck/i]);
  const chestBone=findBone(human,[/upper.?chest/i,/chest/i,/spine.?2/i,/spine.?1/i,/spine/i]);
  const hipsBone=findBone(human,[/hips/i,/pelvis/i]);

  if(headBone)headBone.scale.multiplyScalar(1.045);
  scene.updateMatrixWorld(true);

  const neck=wpos(neckBone,new THREE.Vector3(0,1.90,0));
  const chest=wpos(chestBone,new THREE.Vector3(0,1.65,0));
  const hips=wpos(hipsBone,new THREE.Vector3(0,1.19,0));

  addShirtPanel(chest,hips);
  addInnerHood(neck);
  addStaticGloves();
  addCargoCapris();
  addBelt();

  document.body.dataset.look='red-runner-static-v3';
}

function setCameraView(view){
  const radius=4.30;
  const y=1.45;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.04,y,-3.04);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.22,0);
  controls.update();
}

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click',()=>setCameraView(btn.dataset.view));
});

new GLTFLoader().load(
  MODEL_URL,
  gltf=>{
    const human=gltf.scene;
    fitToHeight(human,2.40);
    human.rotation.y=Math.PI;
    human.scale.x*=.95;
    human.scale.z*=.95;

    styleNativeMaterials(human);
    runnerRoot.add(human);

    poseStatic(human,gltf);
    buildReferenceDetails(human);

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