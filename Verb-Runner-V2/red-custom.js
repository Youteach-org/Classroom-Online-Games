import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL='https://cdn.jsdelivr.net/gh/TheFlameFoundation/MagicWorlds@1230ca734e484d0a8acaeb0e59a47e6b6b3f9c54/worlds/robot-world/glTF_Character/Casual_Female.gltf';
const PORTRAIT='../Verb-Runner/assets/sprites/select-red-neon.webp';
const TARGET_HEIGHT=2.35;

const canvas=document.querySelector('#stage');
const status=document.querySelector('#status');
const portrait=document.querySelector('#portrait');
portrait.src=PORTRAIT;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(31,1,.1,40);
camera.position.set(0,1.3,5.25);
camera.lookAt(0,1.23,0);

scene.add(new THREE.HemisphereLight(0xf5fbff,0x1a1420,2.55));
const key=new THREE.DirectionalLight(0xffffff,3.6); key.position.set(-3,6,4); key.castShadow=true; scene.add(key);
const rim=new THREE.DirectionalLight(0xff3150,2.7); rim.position.set(4,3,-3); scene.add(rim);
const fill=new THREE.DirectionalLight(0x7ca8ff,1.25); fill.position.set(-4,2,-2); scene.add(fill);

const floor=new THREE.Mesh(new THREE.CircleGeometry(1.45,64),new THREE.ShadowMaterial({opacity:.28}));
floor.rotation.x=-Math.PI/2; floor.position.y=.003; floor.receiveShadow=true; scene.add(floor);

const mats={
  skin:new THREE.MeshStandardMaterial({color:0xd98f69,roughness:.82,metalness:0}),
  face:new THREE.MeshStandardMaterial({color:0xf0a987,roughness:.82,metalness:0}),
  red:new THREE.MeshStandardMaterial({color:0xd92738,roughness:.68,metalness:.03,side:THREE.DoubleSide}),
  red2:new THREE.MeshStandardMaterial({color:0x8f111f,roughness:.72,metalness:.02,side:THREE.DoubleSide}),
  white:new THREE.MeshStandardMaterial({color:0xf5f2ec,roughness:.84,metalness:0,side:THREE.DoubleSide}),
  black:new THREE.MeshStandardMaterial({color:0x111218,roughness:.78,metalness:.02,side:THREE.DoubleSide}),
  charcoal:new THREE.MeshStandardMaterial({color:0x1a1b22,roughness:.88,metalness:.01,side:THREE.DoubleSide}),
  hair:new THREE.MeshStandardMaterial({color:0x6f2a24,roughness:.82,metalness:0,side:THREE.DoubleSide}),
  hairHi:new THREE.MeshStandardMaterial({color:0xa44837,roughness:.78,metalness:0,side:THREE.DoubleSide}),
  eye:new THREE.MeshBasicMaterial({color:0x2a1415,side:THREE.DoubleSide}),
  iris:new THREE.MeshBasicMaterial({color:0x7c281e,side:THREE.DoubleSide}),
  eyeWhite:new THREE.MeshBasicMaterial({color:0xfff8f2,side:THREE.DoubleSide}),
  mouth:new THREE.MeshBasicMaterial({color:0x8d2430,side:THREE.DoubleSide})
};

const loader=new GLTFLoader();
let model=null,mixer=null,activeAction=null,yaw=Math.PI;
const actions={};

function cloneMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(Array.isArray(o.material))o.material=o.material.map(m=>m?.clone?.()||m);
    else if(o.material?.clone)o.material=o.material.clone();
  });
}

function fitToHeight(root,target=TARGET_HEIGHT){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3(); box.getSize(size);
  const s=target/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
  root.updateMatrixWorld(true);
}

function softenBaseBody(root){
  root.traverse(o=>{
    if(!o.isMesh)return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    for(const m of materials){
      if(!m?.name)continue;
      if(m.name==='Skin'){m.color.copy(mats.skin.color); m.roughness=.82;}
      if(m.name==='Face'){m.color.copy(mats.face.color); m.roughness=.82;}
      if(['Shirt','Pants','Belt','Hair'].includes(m.name)){
        m.transparent=true; m.opacity=0; m.depthWrite=false;
      }
    }
    o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false;
  });
}

function sculptBody(root){
  root.traverse(o=>{
    if(!o.isSkinnedMesh || !o.geometry?.attributes?.position)return;
    const g=o.geometry=o.geometry.clone();
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
      let sx=1, sz=1;
      if(y>1.08 && y<1.52){sx=.83; sz=.90;}
      else if(y>=1.52 && y<2.15){sx=.90; sz=.93;}
      else if(y>.68 && y<=1.08){sx=.94; sz=.98;}
      else if(y<.68){sx=.92; sz=.94;}
      if(y>2.25){sx=.84; sz=.86;}
      p.setXYZ(i,x*sx,y,z*sz);
    }
    p.needsUpdate=true;
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
  });
}

function geometryFrom(vertices,indices){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

function loft(sections,material,{start=0,end=Math.PI*2,segments=18}={}){
  const v=[],idx=[], cols=segments+1;
  for(const s of sections){
    for(let i=0;i<=segments;i++){
      const t=start+(end-start)*(i/segments);
      const wave=1+(s.wave||0)*Math.sin(t*3+(s.phase||0));
      v.push((s.cx||0)+Math.cos(t)*s.rx*wave,s.y,(s.cz||0)+Math.sin(t)*s.rz*wave);
    }
  }
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*cols+i,b=a+1,c=a+cols,d=c+1;
    idx.push(a,c,b,b,c,d);
  }
  return new THREE.Mesh(geometryFrom(v,idx),material);
}

function tubeY(length,r0x,r0z,r1x,r1z,material,{y0=0,segments=12}={}){
  return loft([{y:y0,rx:r0x,rz:r0z},{y:y0+length,rx:r1x,rz:r1z}],material,{segments});
}

function wedge(material,{w=.4,h=.25,d=.55,toe=.12}={}){
  const x=w/2,z0=-d/2,z1=d/2;
  const v=[
    -x,0,z0, x,0,z0, x,0,z1, -x,0,z1,
    -x,h,z0, x,h,z0, x,h-toe,z1, -x,h-toe,z1
  ];
  const f=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
  return new THREE.Mesh(geometryFrom(v,f),material);
}

function ribbon(points,widths,depth,material){
  const v=[],idx=[];
  for(let i=0;i<points.length;i++){
    const p=points[i],w=widths[i]??widths[widths.length-1];
    const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
    const tangent=new THREE.Vector3(next.x-prev.x,next.y-prev.y,next.z-prev.z).normalize();
    let side=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,0,1));
    if(side.lengthSq()<1e-5)side.set(1,0,0); else side.normalize();
    const n=new THREE.Vector3().crossVectors(side,tangent).normalize().multiplyScalar(depth/2);
    side.multiplyScalar(w/2);
    const corners=[
      new THREE.Vector3(p.x,p.y,p.z).add(side).add(n),
      new THREE.Vector3(p.x,p.y,p.z).sub(side).add(n),
      new THREE.Vector3(p.x,p.y,p.z).add(side).sub(n),
      new THREE.Vector3(p.x,p.y,p.z).sub(side).sub(n)
    ];
    corners.forEach(q=>v.push(q.x,q.y,q.z));
  }
  for(let i=0;i<points.length-1;i++){
    const a=i*4,b=a+4;
    idx.push(a,b,a+1,a+1,b,b+1, a+2,a+3,b+2,a+3,b+3,b+2, a,a+2,b,a+2,b+2,b, a+1,b+1,a+3,a+3,b+1,b+3);
  }
  return new THREE.Mesh(geometryFrom(v,idx),material);
}

function ellipse(cx,cy,z,rx,ry,material,segments=18){
  const v=[cx,cy,z],idx=[];
  for(let i=0;i<=segments;i++){
    const t=(i/segments)*Math.PI*2;
    v.push(cx+Math.cos(t)*rx,cy+Math.sin(t)*ry,z);
  }
  for(let i=1;i<=segments;i++)idx.push(0,i,i+1);
  return new THREE.Mesh(geometryFrom(v,idx),material);
}

function attachAtRest(root,bone,obj){
  root.add(obj);
  root.updateMatrixWorld(true); bone.updateMatrixWorld(true); obj.updateMatrixWorld(true);
  bone.attach(obj);
}

function addBoneTube(root,boneName,length,r0x,r0z,r1x,r1z,material,opts={}){
  const bone=root.getObjectByName(boneName); if(!bone)return null;
  const mesh=tubeY(length,r0x,r0z,r1x,r1z,material,opts);
  mesh.castShadow=true; mesh.receiveShadow=true; bone.add(mesh); return mesh;
}

function buildRedSkin(root){
  const torso=root.getObjectByName('Torso');
  const hips=root.getObjectByName('Hips');
  const head=root.getObjectByName('Head');
  if(!torso||!hips||!head)throw new Error('Expected shared rig bones were not found');

  const crop=loft([{y:1.53,rx:.365,rz:.235},{y:1.82,rx:.405,rz:.255}],mats.white,{segments:22});
  crop.castShadow=true; attachAtRest(root,torso,crop);

  const jacket=loft([
    {y:1.44,rx:.49,rz:.315},{y:1.72,rx:.52,rz:.335},{y:2.02,rx:.50,rz:.32},{y:2.12,rx:.44,rz:.30}
  ],mats.red,{start:THREE.MathUtils.degToRad(137),end:THREE.MathUtils.degToRad(403),segments:28});
  jacket.castShadow=true; attachAtRest(root,torso,jacket);

  const lapelL=ribbon([{x:-.38,y:2.05,z:.30},{x:-.31,y:1.82,z:.335},{x:-.24,y:1.51,z:.325}],[.075,.065,.05],.026,mats.black);
  const lapelR=ribbon([{x:.38,y:2.05,z:.30},{x:.31,y:1.82,z:.335},{x:.24,y:1.51,z:.325}],[.075,.065,.05],.026,mats.black);
  attachAtRest(root,torso,lapelL); attachAtRest(root,torso,lapelR);

  for(const side of ['L','R']){
    addBoneTube(root,'UpperArm.'+side,.53,.19,.17,.15,.14,mats.red,{segments:14});
    addBoneTube(root,'LowerArm.'+side,.42,.15,.14,.115,.105,mats.red,{segments:14});
    addBoneTube(root,'LowerArm.'+side,.085,.128,.118,.118,.108,mats.black,{y0:.335,segments:14});
  }

  const hipShell=loft([{y:.93,rx:.43,rz:.285},{y:1.16,rx:.45,rz:.30},{y:1.33,rx:.385,rz:.265}],mats.charcoal,{segments:24});
  hipShell.castShadow=true; attachAtRest(root,hips,hipShell);

  for(const side of ['L','R']){
    addBoneTube(root,'UpperLeg.'+side,.46,.255,.225,.225,.20,mats.charcoal,{segments:16});
    addBoneTube(root,'LowerLeg.'+side,.48,.245,.215,.17,.16,mats.charcoal,{segments:16});
    addBoneTube(root,'UpperLeg.'+side,.055,.273,.243,.273,.243,mats.red2,{y0:.17,segments:16});
    addBoneTube(root,'LowerLeg.'+side,.05,.255,.225,.255,.225,mats.red2,{y0:.18,segments:16});
  }

  const waist=loft([{y:1.24,rx:.405,rz:.285},{y:1.30,rx:.408,rz:.288}],mats.red2,{segments:22});
  attachAtRest(root,hips,waist);
  const strapL=ribbon([{x:-.30,y:1.28,z:.30},{x:-.34,y:1.03,z:.31},{x:-.31,y:.82,z:.28}],[.055,.05,.04],.022,mats.red2);
  const strapR=ribbon([{x:.30,y:1.28,z:.30},{x:.34,y:1.03,z:.31},{x:.31,y:.82,z:.28}],[.055,.05,.04],.022,mats.red2);
  attachAtRest(root,hips,strapL); attachAtRest(root,hips,strapR);

  const shoes=[['Foot.L',-.255],['Foot.R',.255]];
  for(const [boneName,x] of shoes){
    const foot=root.getObjectByName(boneName); if(!foot)continue;
    const upper=wedge(mats.red,{w:.31,h:.27,d:.58,toe:.08}); upper.position.set(x,.08,.09); upper.castShadow=true;
    const sole=wedge(mats.white,{w:.335,h:.07,d:.61,toe:.02}); sole.position.set(x,.015,.10); sole.castShadow=true;
    attachAtRest(root,foot,upper); attachAtRest(root,foot,sole);
  }

  const hairShell=loft([
    {y:2.28,rx:.43,rz:.34,wave:.055,phase:.2},
    {y:2.48,rx:.55,rz:.44,wave:.06,phase:.8},
    {y:2.72,rx:.60,rz:.47,wave:.055,phase:1.4},
    {y:2.96,rx:.52,rz:.42,wave:.05,phase:.4},
    {y:3.15,rx:.28,rz:.28,wave:.03,phase:1.2}
  ],mats.hair,{start:THREE.MathUtils.degToRad(142),end:THREE.MathUtils.degToRad(398),segments:34});
  hairShell.castShadow=true; attachAtRest(root,head,hairShell);

  const locks=[
    {x:-.48,z:.12,phase:0,mat:mats.hair},{x:-.35,z:.26,phase:.8,mat:mats.hairHi},{x:-.23,z:.34,phase:1.5,mat:mats.hair},
    {x:.48,z:.12,phase:.4,mat:mats.hair},{x:.35,z:.26,phase:1.1,mat:mats.hairHi},{x:.23,z:.34,phase:1.8,mat:mats.hair}
  ];
  for(const l of locks){
    const pts=[]; const widths=[];
    for(let i=0;i<6;i++){
      const t=i/5;
      pts.push({x:l.x+Math.sin(l.phase+t*4)*.055*t,y:2.98-t*.82,z:l.z+Math.sin(l.phase+t*5)*.04});
      widths.push(.18*(1-t)+.055);
    }
    const strand=ribbon(pts,widths,.07,l.mat); strand.castShadow=true; attachAtRest(root,head,strand);
  }

  const bangDefs=[[-.24,.02],[-.03,.03],[.20,.00]];
  for(const [x,phase] of bangDefs){
    const pts=[{x,y:3.05,z:.39},{x:x+Math.sin(phase+1)*.04,y:2.84,z:.48},{x:x+(x<0?-.035:.035),y:2.60,z:.50}];
    const b=ribbon(pts,[.20,.15,.055],.055,mats.hairHi); attachAtRest(root,head,b);
  }

  for(const x of [-.13,.13]){
    const white=ellipse(x,2.665,.516,.095,.052,mats.eyeWhite,22);
    const iris=ellipse(x+(x<0?.012:-.012),2.66,.520,.040,.045,mats.iris,20);
    const pupil=ellipse(x+(x<0?.012:-.012),2.66,.523,.018,.028,mats.eye,18);
    attachAtRest(root,head,white); attachAtRest(root,head,iris); attachAtRest(root,head,pupil);
  }
  const mouth=ribbon([{x:-.055,y:2.535,z:.521},{x:0,y:2.523,z:.524},{x:.065,y:2.542,z:.521}],[.015,.016,.012],.008,mats.mouth);
  attachAtRest(root,head,mouth);
}

function findClip(clips,name){
  const n=name.toLowerCase();
  return clips.find(c=>c.name.toLowerCase()===n)||clips.find(c=>c.name.toLowerCase().includes(n));
}
function sanitizeClip(clip){
  const c=clip.clone();
  c.tracks=c.tracks.filter(track=>{
    const n=track.name.toLowerCase();
    return !(n==='root.position'||n==='characterarmature.position'||n.endsWith('bone.position'));
  });
  return c;
}
function registerAction(name,clip,once=false){
  if(!clip)return;
  const a=mixer.clipAction(sanitizeClip(clip));
  a.clampWhenFinished=once; a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity); actions[name]=a;
}
function play(name){
  const next=actions[name]; if(!next)return;
  const once=['jump','roll','hit'].includes(name);
  next.enabled=true; next.clampWhenFinished=once; next.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name==='run'?1.02:name==='roll'?1.08:1).fadeIn(.1).play();
  if(activeAction&&activeAction!==next)activeAction.fadeOut(.1);
  activeAction=next;
  document.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('active',b.dataset.action===name));
}

document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>play(btn.dataset.action)));

let dragging=false,lastX=0;
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging||!model)return; yaw+=(e.clientX-lastX)*.012;lastX=e.clientX;model.rotation.y=yaw;});
canvas.addEventListener('pointerup',()=>dragging=false); canvas.addEventListener('pointercancel',()=>dragging=false);

loader.load(MODEL_URL,gltf=>{
  model=gltf.scene;
  cloneMaterials(model);
  softenBaseBody(model);
  sculptBody(model);
  fitToHeight(model,TARGET_HEIGHT);
  model.scale.x*=.84;

  const head=model.getObjectByName('Head');
  if(head){head.scale.x*=.80;head.scale.z*=.84;}

  model.rotation.y=yaw;
  scene.add(model);
  model.updateMatrixWorld(true);
  buildRedSkin(model);

  mixer=new THREE.AnimationMixer(model);
  registerAction('idle',findClip(gltf.animations,'Idle'));
  registerAction('run',findClip(gltf.animations,'Run'));
  registerAction('jump',findClip(gltf.animations,'Jump'),true);
  registerAction('roll',findClip(gltf.animations,'Roll'),true);
  registerAction('hit',findClip(gltf.animations,'RecieveHit')||findClip(gltf.animations,'ReceiveHit'),true);
  mixer.addEventListener('finished',()=>play('idle'));
  play('idle');

  status.textContent='Custom red skin ready · rig preserved · height 2.35';
  status.classList.add('ready');
},undefined,err=>{
  console.error(err); status.textContent='Could not load base rig'; status.classList.add('error');
});

function resize(){
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  const dpr=renderer.getPixelRatio();
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
}
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);resize();
  if(mixer)mixer.update(Math.min(clock.getDelta(),.04)); else clock.getDelta();
  renderer.render(scene,camera);
}
animate();
