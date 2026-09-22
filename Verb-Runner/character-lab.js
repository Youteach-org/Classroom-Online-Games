import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/nikhilswain/Vercord/314cda6ff31e98ae8db86626ff559976a71d708a/public/game-assets/three-characters/hoodie-character.glb';

const C={
  red:0xd93435,
  redDark:0x9f252b,
  redHi:0xf04a3e,
  black:0x151a24,
  black2:0x242b38,
  pants:0x171e2c,
  pantsHi:0x273247,
  white:0xf5f3ee,
  sole:0xe8e5df,
  skin:0xe0a17d,
  skinShade:0xbf775e,
  hair:0x17171c,
  hairHi:0x3a2421,
  eye:0x261b18,
  brown:0x71432f,
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
controls.target.set(0,1.26,0);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.enableZoom=true;
controls.minDistance=2.75;
controls.maxDistance=6.6;
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
  new THREE.CircleGeometry(.62,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.17,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

function mat(color,rough=.72){
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

function neutralizeBase(root){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const tuned=source.map(src=>{
      if(!src)return src;
      const m=src.clone();
      m.roughness=.78;
      m.metalness=0;
      m.dithering=true;

      if(m.color){
        const hsl={};
        m.color.getHSL(hsl);

        const isSkin=
          hsl.h>0.035 && hsl.h<0.16 &&
          hsl.s>0.12 && hsl.l>0.38;

        const isVeryDark=hsl.l<0.17;

        if(isSkin){
          m.color.setHex(C.skin);
        }else if(isVeryDark){
          m.color.setHex(C.black);
        }else{
          // Everything that belongs to the original generic clothing becomes
          // a dark underlayer so the red-runner shell defines the visible look.
          m.color.setHex(C.black2);
        }
      }

      m.needsUpdate=true;
      return m;
    });
    obj.material=Array.isArray(obj.material)?tuned:tuned[0];
  });
}

function bones(root){
  const out=[];
  root.traverse(o=>{if(o.isBone)out.push(o);});
  return out;
}

function findBone(root,patterns){
  const bs=bones(root);
  for(const regex of patterns){
    const matches=bs.filter(b=>regex.test(b.name||''));
    if(matches.length){
      matches.sort((a,b)=>(a.name||'').length-(b.name||'').length);
      return matches[0];
    }
  }
  return null;
}

function worldPos(bone,fallback){
  if(!bone)return fallback.clone();
  const p=new THREE.Vector3();
  bone.getWorldPosition(p);
  return p;
}

function rounded(w,h,d,color,radius=.06,rough=.72){
  const mesh=new THREE.Mesh(
    new RoundedBoxGeometry(w,h,d,8,radius),
    mat(color,rough)
  );
  mesh.castShadow=true;
  return mesh;
}

function segment(a,b,radius,color,radial=24){
  const mid=a.clone().add(b).multiplyScalar(.5);
  const dir=b.clone().sub(a);
  const len=Math.max(.001,dir.length());
  const mesh=new THREE.Mesh(
    new THREE.CylinderGeometry(radius*.94,radius,len,radial,2,false),
    mat(color,.72)
  );
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0,1,0),
    dir.clone().normalize()
  );
  mesh.castShadow=true;
  runnerRoot.add(mesh);
  return mesh;
}

function localPoint(base,dx,dy,dz){
  return base.clone().add(new THREE.Vector3(dx,dy,dz));
}

function createSmile(center){
  const pts=[
    localPoint(center,-.070,-.055,-.276),
    localPoint(center,-.035,-.075,-.285),
    localPoint(center, .000,-.082,-.288),
    localPoint(center, .035,-.075,-.285),
    localPoint(center, .070,-.055,-.276)
  ];
  const curve=new THREE.CatmullRomCurve3(pts);
  const smile=new THREE.Mesh(
    new THREE.TubeGeometry(curve,20,.009,8,false),
    mat(0x8b3e3a,.64)
  );
  smile.castShadow=false;
  runnerRoot.add(smile);
}

function addHeadLook(headCenter){
  // Slightly oversized anime-style head hides the generic low-poly head.
  const head=new THREE.Mesh(
    new THREE.SphereGeometry(.285,48,32),
    mat(C.skin,.70)
  );
  head.scale.set(.96,1.10,.90);
  head.position.copy(headCenter);
  head.castShadow=true;
  runnerRoot.add(head);

  const earMat=mat(C.skinShade,.72);
  for(const x of [-.274,.274]){
    const ear=new THREE.Mesh(new THREE.SphereGeometry(.052,24,16),earMat);
    ear.scale.set(.62,1.0,.42);
    ear.position.copy(localPoint(headCenter,x,-.010,-.006));
    ear.castShadow=true;
    runnerRoot.add(ear);
  }

  // Eyes: large but not chibi; warm dark-brown iris.
  for(const x of [-.092,.092]){
    const eyeWhite=new THREE.Mesh(
      new THREE.SphereGeometry(.050,24,16),
      mat(C.white,.48)
    );
    eyeWhite.scale.set(1.12,.76,.30);
    eyeWhite.position.copy(localPoint(headCenter,x,.038,-.253));
    runnerRoot.add(eyeWhite);

    const iris=new THREE.Mesh(
      new THREE.SphereGeometry(.024,24,16),
      mat(C.eye,.46)
    );
    iris.scale.set(.92,1.08,.46);
    iris.position.copy(localPoint(headCenter,x,.035,-.282));
    runnerRoot.add(iris);

    const glint=new THREE.Mesh(
      new THREE.SphereGeometry(.006,12,8),
      new THREE.MeshBasicMaterial({color:0xffffff})
    );
    glint.position.copy(localPoint(headCenter,x-.006,.047,-.301));
    runnerRoot.add(glint);

    const brow=rounded(.105,.018,.018,C.hair,.007,.70);
    brow.position.copy(localPoint(headCenter,x,.105,-.257));
    brow.rotation.z=x<0?.11:-.11;
    runnerRoot.add(brow);
  }

  const nose=new THREE.Mesh(
    new THREE.SphereGeometry(.022,18,12),
    mat(C.skinShade,.70)
  );
  nose.scale.set(.70,1.05,.80);
  nose.position.copy(localPoint(headCenter,0,-.012,-.283));
  runnerRoot.add(nose);

  createSmile(headCenter);

  // Hair cap.
  const cap=new THREE.Mesh(
    new THREE.SphereGeometry(.300,48,28,0,Math.PI*2,0,Math.PI*.64),
    mat(C.hair,.78)
  );
  cap.position.copy(localPoint(headCenter,0,.080,.022));
  cap.scale.set(1.05,.92,1.02);
  cap.rotation.x=.06;
  cap.castShadow=true;
  runnerRoot.add(cap);

  // Messy layered tufts inspired by the reference, with a few warm highlights.
  const tufts=[
    [-.205,.235,-.050,.105,.205,.090, .34, 0],
    [-.125,.285,-.105,.115,.230,.085, .18, 0],
    [-.035,.305,-.125,.120,.240,.085, .08, 1],
    [ .060,.302,-.128,.120,.235,.083,-.09, 0],
    [ .145,.270,-.105,.110,.218,.086,-.22, 1],
    [ .220,.220,-.048,.100,.192,.090,-.36, 0],
    [-.235,.145,.020,.092,.168,.092, .55, 0],
    [ .235,.145,.020,.092,.168,.092,-.55, 0],
    [-.170,.115,.155,.105,.155,.115, .26, 0],
    [ .000,.115,.205,.135,.165,.120, .00, 0],
    [ .170,.115,.155,.105,.155,.115,-.26, 0],
    [-.020,.240,-.205,.115,.175,.068, .02, 1]
  ];

  for(const [x,y,z,sx,sy,sz,rz,hi] of tufts){
    const tuft=new THREE.Mesh(
      new THREE.ConeGeometry(.115,.36,9,1,false),
      mat(hi?C.hairHi:C.hair,.77)
    );
    tuft.position.copy(localPoint(headCenter,x,y,z));
    tuft.scale.set(sx/.115,sy/.36,sz/.115);
    tuft.rotation.z=rz;
    tuft.rotation.x=z<0?-.18:.12;
    tuft.castShadow=true;
    runnerRoot.add(tuft);
  }
}

function addTorsoLook(chest,hips,neck){
  const center=chest.clone().lerp(hips,.38);
  center.z-=.005;

  // Dark backing gives the open jacket depth.
  const backing=rounded(.73,.76,.32,C.black,.075,.78);
  backing.position.copy(localPoint(center,0,-.020,.010));
  runnerRoot.add(backing);

  // White tee visible through the open red jacket.
  const tee=rounded(.39,.59,.075,C.white,.040,.76);
  tee.position.copy(localPoint(center,0,-.015,-.183));
  runnerRoot.add(tee);

  // Red jacket side panels.
  for(const x of [-.235,.235]){
    const panel=rounded(.205,.67,.095,C.red,.045,.70);
    panel.position.copy(localPoint(center,x,-.010,-.205));
    panel.rotation.z=x<0?-.035:.035;
    runnerRoot.add(panel);

    const inner=rounded(.040,.57,.030,C.redDark,.012,.72);
    inner.position.copy(localPoint(center,x<0?-.128:.128,-.005,-.260));
    runnerRoot.add(inner);
  }

  // Lower white shirt hem.
  const hem=rounded(.46,.095,.10,C.white,.035,.76);
  hem.position.copy(localPoint(center,0,-.365,-.165));
  runnerRoot.add(hem);

  // Black hood volume + red outer collar, no backpack straps.
  const hoodBack=new THREE.Mesh(
    new THREE.TorusGeometry(.225,.075,16,36,Math.PI*1.65),
    mat(C.black,.80)
  );
  hoodBack.position.copy(localPoint(neck,0,.030,.040));
  hoodBack.rotation.set(Math.PI*.53,0,Math.PI*.17);
  hoodBack.castShadow=true;
  runnerRoot.add(hoodBack);

  const collarL=rounded(.18,.080,.10,C.red,.035,.70);
  const collarR=collarL.clone();
  collarL.position.copy(localPoint(neck,-.105,-.055,-.100));
  collarR.position.copy(localPoint(neck,.105,-.055,-.100));
  collarL.rotation.z=-.20;
  collarR.rotation.z=.20;
  collarL.castShadow=collarR.castShadow=true;
  runnerRoot.add(collarL,collarR);

  // Small jacket emblem/zip detail.
  const zipL=rounded(.015,.50,.016,C.metal,.004,.52);
  const zipR=zipL.clone();
  zipL.position.copy(localPoint(center,-.130,-.005,-.260));
  zipR.position.copy(localPoint(center,.130,-.005,-.260));
  runnerRoot.add(zipL,zipR);
}

function addArmLook(side,upper,lower,hand){
  const sign=side==='L'?-1:1;

  const u=upper;
  const l=lower;
  const h=hand;

  // Red hoodie sleeves.
  segment(u,l,.118,C.red,26);
  segment(l,h,.103,C.red,26);

  // Black cuff.
  const cuffStart=l.clone().lerp(h,.74);
  segment(cuffStart,h,.112,C.black,24);

  // Fingerless glove block around the hand; base fingers can remain visible.
  const glove=rounded(.155,.145,.135,C.black,.040,.82);
  glove.position.copy(localPoint(h,0,.005,-.005));
  glove.rotation.z=sign*.08;
  runnerRoot.add(glove);

  // Red wrist accent.
  const band=rounded(.165,.045,.145,C.redDark,.018,.72);
  band.position.copy(localPoint(h,0,.085,.005));
  runnerRoot.add(band);
}

function addLegLook(side,hip,knee,foot){
  const sign=side==='L'?-1:1;
  const thighEnd=hip.clone().lerp(knee,.94);

  // Baggy cargo upper leg.
  segment(hip,thighEnd,.175,C.pants,28);

  // Cropped lower leg / calf section, leaving a small ankle break.
  const calfEnd=knee.clone().lerp(foot,.64);
  segment(knee,calfEnd,.145,C.pants,28);

  // Cargo cuff.
  const cuff=rounded(.285,.075,.235,C.black,.028,.82);
  cuff.position.copy(calfEnd);
  runnerRoot.add(cuff);

  // Side cargo pocket.
  const pocket=rounded(.145,.205,.055,C.pantsHi,.030,.78);
  pocket.position.copy(
    hip.clone().lerp(knee,.52).add(new THREE.Vector3(sign*.165,0,-.035))
  );
  pocket.rotation.z=sign*.025;
  runnerRoot.add(pocket);

  const pocketTag=rounded(.035,.085,.025,C.red,.010,.70);
  pocketTag.position.copy(
    hip.clone().lerp(knee,.54).add(new THREE.Vector3(sign*.245,-.025,-.065))
  );
  runnerRoot.add(pocketTag);

  addShoe(side,foot);
}

function addShoe(side,foot){
  const sign=side==='L'?-1:1;

  // High-top red body.
  const ankle=rounded(.205,.245,.225,C.red,.050,.66);
  ankle.position.copy(localPoint(foot,0,.055,-.010));
  ankle.rotation.z=sign*.025;
  runnerRoot.add(ankle);

  const upper=rounded(.225,.135,.355,C.redHi,.052,.64);
  upper.position.copy(localPoint(foot,0,-.030,-.095));
  runnerRoot.add(upper);

  // White toe and sole.
  const toe=rounded(.205,.105,.145,C.white,.045,.60);
  toe.position.copy(localPoint(foot,0,-.018,-.255));
  runnerRoot.add(toe);

  const sole=rounded(.235,.050,.370,C.sole,.022,.60);
  sole.position.copy(localPoint(foot,0,-.110,-.100));
  runnerRoot.add(sole);

  // White side stripe/eyelet panel.
  const stripe=rounded(.050,.125,.245,C.white,.018,.60);
  stripe.position.copy(localPoint(foot,sign*.113,-.020,-.090));
  runnerRoot.add(stripe);
}

function setCameraView(view){
  const radius=4.45;
  const y=1.48;
  if(view==='front')camera.position.set(0,y,-radius);
  else if(view==='three')camera.position.set(3.15,y,-3.15);
  else camera.position.set(0,y,radius);
  controls.target.set(0,1.24,0);
  controls.update();
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
    mixer.update(Math.min(.42,idle.duration*.22));
    action.paused=true;
  }

  scene.updateMatrixWorld(true);
}

function buildRedLook(human){
  const headBone=findBone(human,[/head/i]);
  const neckBone=findBone(human,[/neck/i]);
  const chestBone=findBone(human,[/upper.?chest/i,/chest/i,/spine.?2/i,/spine.?1/i,/spine/i]);
  const hipsBone=findBone(human,[/hips/i,/pelvis/i]);

  const lUpper=findBone(human,[/left.*upper.*arm/i,/upper.*arm.*left/i,/upperarm.*l/i,/arm.*l/i]);
  const lLower=findBone(human,[/left.*fore.*arm/i,/left.*lower.*arm/i,/fore.*arm.*left/i,/lower.*arm.*left/i]);
  const lHand=findBone(human,[/left.*hand/i,/hand.*left/i,/hand.*l/i]);

  const rUpper=findBone(human,[/right.*upper.*arm/i,/upper.*arm.*right/i,/upperarm.*r/i,/arm.*r/i]);
  const rLower=findBone(human,[/right.*fore.*arm/i,/right.*lower.*arm/i,/fore.*arm.*right/i,/lower.*arm.*right/i]);
  const rHand=findBone(human,[/right.*hand/i,/hand.*right/i,/hand.*r/i]);

  const lHip=findBone(human,[/left.*up.*leg/i,/left.*thigh/i,/thigh.*left/i,/upleg.*l/i]);
  const lKnee=findBone(human,[/left.*leg/i,/left.*shin/i,/shin.*left/i,/leg.*l/i]);
  const lFoot=findBone(human,[/left.*foot/i,/foot.*left/i,/foot.*l/i]);

  const rHip=findBone(human,[/right.*up.*leg/i,/right.*thigh/i,/thigh.*right/i,/upleg.*r/i]);
  const rKnee=findBone(human,[/right.*leg/i,/right.*shin/i,/shin.*right/i,/leg.*r/i]);
  const rFoot=findBone(human,[/right.*foot/i,/foot.*right/i,/foot.*r/i]);

  const head=worldPos(headBone,new THREE.Vector3(0,2.12,0)).add(new THREE.Vector3(0,.105,0));
  const neck=worldPos(neckBone,new THREE.Vector3(0,1.92,0));
  const chest=worldPos(chestBone,new THREE.Vector3(0,1.67,0));
  const hips=worldPos(hipsBone,new THREE.Vector3(0,1.24,0));

  const LU=worldPos(lUpper,new THREE.Vector3(-.30,1.77,0));
  const LL=worldPos(lLower,new THREE.Vector3(-.45,1.42,0));
  const LH=worldPos(lHand,new THREE.Vector3(-.46,1.12,0));

  const RU=worldPos(rUpper,new THREE.Vector3(.30,1.77,0));
  const RL=worldPos(rLower,new THREE.Vector3(.45,1.42,0));
  const RH=worldPos(rHand,new THREE.Vector3(.46,1.12,0));

  const LHip=worldPos(lHip,new THREE.Vector3(-.16,1.15,0));
  const LKnee=worldPos(lKnee,new THREE.Vector3(-.16,.72,0));
  const LFoot=worldPos(lFoot,new THREE.Vector3(-.16,.16,0));

  const RHip=worldPos(rHip,new THREE.Vector3(.16,1.15,0));
  const RKnee=worldPos(rKnee,new THREE.Vector3(.16,.72,0));
  const RFoot=worldPos(rFoot,new THREE.Vector3(.16,.16,0));

  addHeadLook(head);
  addTorsoLook(chest,hips,neck);
  addArmLook('L',LU,LL,LH);
  addArmLook('R',RU,RL,RH);
  addLegLook('L',LHip,LKnee,LFoot);
  addLegLook('R',RHip,RKnee,RFoot);

  document.body.dataset.look='red-runner-static-v1';
}

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.addEventListener('click',()=>setCameraView(btn.dataset.view));
});

new GLTFLoader().load(
  MODEL_URL,
  gltf=>{
    const human=gltf.scene;
    fitToHeight(human,2.42);
    human.rotation.y=Math.PI;
    human.scale.x*=.93;
    human.scale.z*=.93;

    neutralizeBase(human);
    runnerRoot.add(human);

    poseStatic(human,gltf);
    buildRedLook(human);

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