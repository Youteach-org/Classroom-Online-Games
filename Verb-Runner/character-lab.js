import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/nikhilswain/Vercord/314cda6ff31e98ae8db86626ff559976a71d708a/public/game-assets/three-characters/hoodie-character.glb';

const C={
  red:0xd83a3b,
  redDark:0xa8242b,
  redHi:0xf15346,
  black:0x141923,
  black2:0x222a39,
  pants:0x171e2c,
  pantsHi:0x263247,
  white:0xf5f3ee,
  sole:0xe7e4de,
  skin:0xe0a17d,
  skinShade:0xbf775e,
  hair:0x17171c,
  hairHi:0x4a2921,
  eye:0x2c1d19,
  brow:0x211919,
  metal:0xb8c2cc
};

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce9ef);
scene.fog=new THREE.Fog(0xdce9ef,18,35);

const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.05,80);
camera.position.set(3.15,1.56,-3.15);

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
controls.target.set(0,1.25,0);
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

const fill=new THREE.DirectionalLight(0xffffff,2.15);
fill.position.set(0,3,-5);
scene.add(fill);

const rim=new THREE.DirectionalLight(0x9bdcff,1.6);
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
  new THREE.CircleGeometry(.59,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.16,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

function stdMat(color,rough=.72){
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
    stdMat(color,rough)
  );
  mesh.castShadow=true;
  return mesh;
}

function segment(a,b,radius,color,radial=24){
  const dir=b.clone().sub(a);
  const len=Math.max(.001,dir.length());
  const mesh=new THREE.Mesh(
    new THREE.CylinderGeometry(radius*.96,radius,len,radial,2,false),
    stdMat(color,.76)
  );
  mesh.position.copy(a.clone().add(b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0,1,0),
    dir.clone().normalize()
  );
  mesh.castShadow=true;
  runnerRoot.add(mesh);
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

function addFaceEnhancement(head){
  // Keep the model's own face; only enlarge/read the eyes in an anime direction.
  for(const x of [-.075,.075]){
    const white=new THREE.Mesh(
      new THREE.SphereGeometry(.034,24,16),
      stdMat(C.white,.48)
    );
    white.scale.set(1.12,.77,.28);
    white.position.set(head.x+x,head.y+.035,head.z-.203);
    runnerRoot.add(white);

    const iris=new THREE.Mesh(
      new THREE.SphereGeometry(.0165,20,14),
      stdMat(C.eye,.48)
    );
    iris.scale.set(.92,1.05,.42);
    iris.position.set(head.x+x,head.y+.033,head.z-.224);
    runnerRoot.add(iris);

    const glint=new THREE.Mesh(
      new THREE.SphereGeometry(.0045,10,8),
      new THREE.MeshBasicMaterial({color:0xffffff})
    );
    glint.position.set(head.x+x-.004,head.y+.043,head.z-.236);
    runnerRoot.add(glint);
  }

  // Friendly subtle smile.
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(head.x-.050,head.y-.060,head.z-.214),
    new THREE.Vector3(head.x,head.y-.072,head.z-.220),
    new THREE.Vector3(head.x+.050,head.y-.060,head.z-.214)
  ]);
  const smile=new THREE.Mesh(
    new THREE.TubeGeometry(curve,14,.006,7,false),
    stdMat(0x8c4540,.64)
  );
  runnerRoot.add(smile);
}

function addHairEnhancement(head){
  // The native hair remains visible. These tufts only add the longer,
  // tousled silhouette of the red reference character.
  const tufts=[
    [-.160,.205,-.055,.078,.235,.070, .40,0],
    [-.085,.255,-.095,.080,.265,.068, .20,0],
    [ .000,.278,-.112,.082,.285,.066, .02,1],
    [ .090,.255,-.095,.080,.255,.068,-.22,0],
    [ .165,.205,-.052,.075,.225,.070,-.42,1],
    [-.195,.145,.025,.065,.185,.075, .58,0],
    [ .195,.145,.025,.065,.185,.075,-.58,0]
  ];

  for(const [x,y,z,rx,hy,rz,rot,hi] of tufts){
    const tuft=new THREE.Mesh(
      new THREE.ConeGeometry(rx,hy,8,1,false),
      stdMat(hi?C.hairHi:C.hair,.78)
    );
    tuft.position.set(head.x+x,head.y+y,head.z+z);
    tuft.rotation.z=rot;
    tuft.rotation.x=z<0?-.14:.10;
    tuft.scale.z=rz/rx;
    tuft.castShadow=true;
    runnerRoot.add(tuft);
  }
}

function addOpenJacketDetail(chest,neck,hips){
  const center=chest.clone().lerp(hips,.30);

  // White T-shirt panel laid just above the native red hoodie surface.
  const tee=rounded(.285,.49,.026,C.white,.018,.76);
  tee.position.set(center.x,center.y-.025,center.z-.184);
  runnerRoot.add(tee);

  // Dark inner jacket edges make the red hoodie read as open.
  for(const x of [-.165,.165]){
    const edge=rounded(.026,.48,.025,C.black,.008,.80);
    edge.position.set(center.x+x,center.y-.010,center.z-.203);
    edge.rotation.z=x<0?-.025:.025;
    runnerRoot.add(edge);

    const zip=rounded(.010,.43,.012,C.metal,.003,.54);
    zip.position.set(center.x+(x<0?-0.145:0.145),center.y-.005,center.z-.218);
    runnerRoot.add(zip);
  }

  // Black hood/collar volume around the neck.
  const hood=new THREE.Mesh(
    new THREE.TorusGeometry(.205,.052,14,34,Math.PI*1.62),
    stdMat(C.black,.82)
  );
  hood.position.set(neck.x,neck.y+.018,neck.z+.028);
  hood.rotation.set(Math.PI*.53,0,Math.PI*.18);
  hood.castShadow=true;
  runnerRoot.add(hood);

  // White undershirt hem below the jacket.
  const hem=rounded(.34,.060,.035,C.white,.018,.76);
  hem.position.set(center.x,hips.y+.105,center.z-.162);
  runnerRoot.add(hem);
}

function addGlove(hand,side){
  const glove=rounded(.125,.105,.110,C.black,.032,.82);
  glove.position.copy(hand);
  glove.position.y+=.005;
  glove.position.z-=.008;
  glove.rotation.z=side==='L'?.08:-.08;
  runnerRoot.add(glove);

  const wrist=rounded(.132,.036,.116,C.redDark,.012,.72);
  wrist.position.copy(hand);
  wrist.position.y+=.067;
  runnerRoot.add(wrist);
}

function addCargoExtension(side,knee,foot,hip){
  // Extend the native shorts into the cropped baggy cargo silhouette.
  const end=knee.clone().lerp(foot,.57);
  segment(knee,end,.115,C.pants,24);

  const cuff=rounded(.235,.055,.190,C.black,.020,.84);
  cuff.position.copy(end);
  runnerRoot.add(cuff);

  const sign=side==='L'?-1:1;
  const pocket=rounded(.115,.155,.042,C.pantsHi,.022,.80);
  pocket.position.copy(hip.clone().lerp(knee,.56));
  pocket.position.x+=sign*.108;
  pocket.position.z-=.040;
  runnerRoot.add(pocket);

  const tab=rounded(.024,.060,.020,C.red,.007,.70);
  tab.position.copy(pocket.position);
  tab.x+=sign*.070;
  tab.y-=.020;
  tab.z-=.028;
  runnerRoot.add(tab);
}

function addHighTopCollar(foot){
  // Native White/Purple shoe is now already white/red. Add only the taller collar.
  const collar=rounded(.165,.145,.160,C.red,.035,.66);
  collar.position.copy(foot);
  collar.y+=.050;
  collar.z+=.005;
  runnerRoot.add(collar);
}

function buildReferenceDetails(human){
  const headBone=findBone(human,[/head/i]);
  const neckBone=findBone(human,[/neck/i]);
  const chestBone=findBone(human,[/upper.?chest/i,/chest/i,/spine.?2/i,/spine.?1/i,/spine/i]);
  const hipsBone=findBone(human,[/hips/i,/pelvis/i]);

  const lHand=findBone(human,[/left.*hand/i,/hand.*left/i,/hand.*l/i]);
  const rHand=findBone(human,[/right.*hand/i,/hand.*right/i,/hand.*r/i]);

  const lHip=findBone(human,[/left.*up.*leg/i,/left.*thigh/i,/thigh.*left/i,/upleg.*l/i]);
  const lKnee=findBone(human,[/left.*leg/i,/left.*shin/i,/shin.*left/i,/leg.*l/i]);
  const lFoot=findBone(human,[/left.*foot/i,/foot.*left/i,/foot.*l/i]);

  const rHip=findBone(human,[/right.*up.*leg/i,/right.*thigh/i,/thigh.*right/i,/upleg.*r/i]);
  const rKnee=findBone(human,[/right.*leg/i,/right.*shin/i,/shin.*right/i,/leg.*r/i]);
  const rFoot=findBone(human,[/right.*foot/i,/foot.*right/i,/foot.*r/i]);

  // Small head scale adjustment: reference is youthful, not super-deformed.
  if(headBone)headBone.scale.multiplyScalar(1.045);
  scene.updateMatrixWorld(true);

  const head=wpos(headBone,new THREE.Vector3(0,2.10,0));
  const neck=wpos(neckBone,new THREE.Vector3(0,1.91,0));
  const chest=wpos(chestBone,new THREE.Vector3(0,1.66,0));
  const hips=wpos(hipsBone,new THREE.Vector3(0,1.20,0));

  const LH=wpos(lHand,new THREE.Vector3(-.43,1.10,0));
  const RH=wpos(rHand,new THREE.Vector3(.43,1.10,0));

  const LHip=wpos(lHip,new THREE.Vector3(-.14,1.10,0));
  const LKnee=wpos(lKnee,new THREE.Vector3(-.14,.68,0));
  const LFoot=wpos(lFoot,new THREE.Vector3(-.14,.12,0));

  const RHip=wpos(rHip,new THREE.Vector3(.14,1.10,0));
  const RKnee=wpos(rKnee,new THREE.Vector3(.14,.68,0));
  const RFoot=wpos(rFoot,new THREE.Vector3(.14,.12,0));

  addFaceEnhancement(head);
  addHairEnhancement(head);
  addOpenJacketDetail(chest,neck,hips);
  addGlove(LH,'L');
  addGlove(RH,'R');
  addCargoExtension('L',LKnee,LFoot,LHip);
  addCargoExtension('R',RKnee,RFoot,RHip);
  addHighTopCollar(LFoot);
  addHighTopCollar(RFoot);

  document.body.dataset.look='red-runner-static-v2';
}

function setCameraView(view){
  const radius=4.35;
  const y=1.46;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.08,y,-3.08);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.23,0);
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