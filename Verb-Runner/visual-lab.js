import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const HUMAN_URL='https://cdn.jsdelivr.net/gh/psqd12137-sudo/dream-channel@3d1f3c91810ac6b73146971d7d6297b12c8f3244/godot/assets/quaternius/animated_characters/Casual_Female.gltf';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd8f4);
scene.fog=new THREE.FogExp2(0xbfe7ef,.0095);

const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.1,260);
camera.position.set(.1,3.25,7.8);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
document.querySelector('#stage').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xeafaff,0xd89d71,2.6));
const sun=new THREE.DirectionalLight(0xffedc4,4.4);
sun.position.set(-7,13,8);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-22;
sun.shadow.camera.right=22;
sun.shadow.camera.top=20;
sun.shadow.camera.bottom=-8;
scene.add(sun);

const toon=(color)=>new THREE.MeshToonMaterial({color});
const soft=(color)=>new THREE.MeshStandardMaterial({color,roughness:.76,metalness:.01});
const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({
  color,
  transparent:opacity<1,
  opacity,
  depthWrite:opacity>=1
});

const M={
  paving:toon(0xe0c9a6),
  pavingDark:toon(0xc9ad82),
  plasterA:toon(0xf1c878),
  plasterB:toon(0xf1dfbd),
  plasterC:toon(0xd9a47f),
  plasterD:toon(0xc3d8c5),
  terracotta:toon(0xcf704e),
  terracotta2:toon(0xea9463),
  wood:toon(0x9c6842),
  dark:toon(0x2f3f50),
  teal:toon(0x398ea2),
  blue:toon(0x487fb8),
  red:toon(0xdc584f),
  yellow:toon(0xf0bd49),
  green:toon(0x5b9a66),
  leaf:toon(0x44865b),
  white:toon(0xfff6e8),
  metal:soft(0x526872),
  glass:soft(0x86c9dc),
  sea:soft(0x38a7c7),
  black:toon(0x242c35)
};

function roundedBox(w,h,d,material,x,y,z,parent=scene,radius=.12,segments=3,cast=true){
  const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,segments,radius),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=cast;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function box(w,h,d,material,x,y,z,parent=scene,cast=true){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=cast;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function cyl(r1,r2,h,material,x,y,z,parent=scene,segments=12){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function sphere(r,material,x,y,z,parent=scene){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,18,12),material);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  parent.add(mesh);
  return mesh;
}

const city=new THREE.Group();
scene.add(city);

// Short pedestrian market start. The route rises almost immediately.
roundedBox(8.6,.25,14.5,M.paving,0,-.12,1.1,city,.12,4);
for(let z=7;z>-5.4;z-=1.55){
  box(8.15,.018,.04,basic(0xb99d79,.42),0,.025,z,city,false);
}

// Chunky Mediterranean buildings, close enough to frame the player.
const wallMaterials=[M.plasterA,M.plasterB,M.plasterC,M.plasterD];
function addWindow(parent,faceX,y,z,side,index){
  roundedBox(.11,1.1,.82,M.white,faceX+side*.035,y,z,parent,.08,3,false);
  roundedBox(.13,.84,.57,index%2?M.blue:M.teal,faceX-side*.015,y,z,parent,.055,3,false);
}
function building(side,z,w,h,d,index){
  const group=new THREE.Group();
  city.add(group);
  group.position.set(side*(5.5+w*.5),0,z);

  const wall=wallMaterials[index%wallMaterials.length];
  roundedBox(w,h,d,wall,0,h/2,0,group,.28,5);
  roundedBox(w+.2,.28,d+.2,index%2?M.terracotta:M.terracotta2,0,h+.12,0,group,.08,3);

  const face=-side*w*.5;
  const floors=h>7.1?3:2;
  for(let floor=0;floor<floors;floor++){
    const yy=1.8+floor*2.25;
    addWindow(group,face,yy,-1.35,side,index+floor);
    addWindow(group,face,yy, 1.35,side,index+floor+1);
  }

  if(index%2===0){
    const canopy=roundedBox(1.55,.16,3.45,index%4===0?M.red:M.teal,face-side*.72,2.05,0,group,.09,3);
    canopy.rotation.z=side*.16;
    cyl(.055,.055,2.05,M.metal,face-side*1.35,1.0,-1.32,group,8);
    cyl(.055,.055,2.05,M.metal,face-side*1.35,1.0, 1.32,group,8);
  }

  if(index%3===1){
    roundedBox(1.22,.2,2.9,M.wood,face-side*.68,4.25,.2,group,.08,3);
    for(const zz of [-1.1,-.55,0,.55,1.1]){
      cyl(.045,.045,.76,M.metal,face-side*1.22,4.62,.2+zz,group,8);
    }
    box(.05,.05,2.55,M.metal,face-side*1.22,5.0,.2,group);
  }

  // Big simplified shop sign for a mobile-game silhouette.
  if(index%3===0){
    const sign=roundedBox(.15,.72,2.25,index%2?M.yellow:M.blue,face-side*.15,3.2,-.2,group,.14,4);
    sign.rotation.z=side*.02;
  }
}

for(let i=0;i<6;i++){
  building(-1,1.0-i*7.0,4.6+(i%2)*.65,6.4+(i%3)*.85,5.6,i);
  building( 1,-1.0-i*7.0,4.8+((i+1)%2)*.6,6.8+((i+1)%3)*.8,5.8,i+2);
}

// Dense foreground market props.
function fruitStall(x,z,accent,index){
  const g=new THREE.Group();
  city.add(g);
  g.position.set(x,0,z);
  roundedBox(2.15,1.05,2.5,M.wood,0,.53,0,g,.12,4);
  const canopy=roundedBox(2.65,.18,3.05,accent,0,2.22,0,g,.13,4);
  canopy.rotation.z=x<0?.1:-.1;
  for(let i=0;i<12;i++){
    const colors=[M.red,M.yellow,M.green];
    sphere(.13+(i%3)*.018,colors[(i+index)%3],-.72+(i%4)*.48,.98,-.55+Math.floor(i/4)*.52,g);
  }
  roundedBox(.55,.22,1.8,index%2?M.blue:M.teal,0,1.48,.3,g,.08,3);
}
fruitStall(-4.0,4.2,M.red,0);
fruitStall( 4.05,2.1,M.yellow,1);
fruitStall(-4.05,-2.5,M.teal,2);

// First climb begins directly ahead of the runner.
const stairs=new THREE.Group();
city.add(stairs);
stairs.position.set(-.65,0,-5.1);
for(let i=0;i<10;i++){
  roundedBox(4.75,.28,1.05,M.pavingDark,0,.14+i*.28,-i*.73,stairs,.08,3);
}
for(const side of [-1,1]){
  for(let i=0;i<6;i++){
    cyl(.055,.055,1.0,M.metal,side*2.05,.6+i*.48,-i*1.46,stairs,8);
  }
  const rail=box(.06,.06,8.1,M.metal,side*2.05,1.8,-3.4,stairs);
  rail.rotation.x=-.35;
}

// Bright awning acts as first elevated platform.
const awningRoute=new THREE.Group();
city.add(awningRoute);
awningRoute.position.set(-.65,2.95,-13.1);
const awning=roundedBox(4.35,.22,5.2,M.red,0,0,0,awningRoute,.14,4);
awning.rotation.x=.02;
for(const xx of [-1.8,1.8]){
  for(const zz of [-2.0,2.0]) cyl(.055,.055,2.95,M.metal,xx,-1.48,zz,awningRoute,8);
}

// Rooftops appear immediately after the awning.
for(let i=0;i<5;i++){
  const x=(i%2===0?-1.0:1.05);
  const z=-20.0-i*7.3;
  roundedBox(7.1,.42,5.6,i%2?M.terracotta:M.terracotta2,x,4.15,z,city,.12,4);
  roundedBox(7.35,.52,.24,M.white,x,4.42,z-2.68,city,.08,3);
  if(i<4){
    roundedBox(2.6,.22,1.0,M.yellow,x+(i%2?-.8:.8),4.25,z-3.62,city,.1,3);
  }
}

// More readable elevated shortcut / scaffold.
const scaffold=new THREE.Group();
city.add(scaffold);
scaffold.position.set(5.15,3.15,-13.0);
for(let i=0;i<5;i++){
  const z=-i*3.8;
  roundedBox(2.25,.18,3.25,M.wood,0,i*.72,z,scaffold,.07,3);
  for(const xx of [-.95,.95]){
    for(const zz of [-1.4,1.4]) cyl(.05,.05,2.5,M.metal,xx,-.45+i*.72,z+zz,scaffold,8);
  }
  if(i<4){
    const brace=box(.05,.05,4.4,M.metal,.98,.65+i*.72,z-1.85,scaffold);
    brace.rotation.x=.08;
  }
}

// Seafront reveal and distant coast.
const sea=new THREE.Mesh(
  new THREE.PlaneGeometry(90,130),
  new THREE.MeshStandardMaterial({color:0x35a9c9,roughness:.28,metalness:.02})
);
sea.rotation.x=-Math.PI/2;
sea.position.set(27,-.42,-61);
scene.add(sea);

for(let i=0;i<11;i++){
  const foam=box(12,.018,.1,basic(0xd5fbff,.36),17+i*.65,-.38,-25-i*5,scene,false);
  foam.rotation.y=.08;
}

const hillMat=toon(0x709e76);
const hill=new THREE.Mesh(new THREE.ConeGeometry(28,23,10),hillMat);
hill.position.set(-25,4,-78);
hill.scale.z=1.7;
scene.add(hill);
const hill2=hill.clone();
hill2.position.set(30,2,-105);
hill2.scale.set(.86,1.05,1.45);
scene.add(hill2);

for(let i=0;i<28;i++){
  const x=-19+(i%9)*4.8+(i%2)*1.1;
  const z=-72-Math.floor(i/9)*7.4;
  const y=8.5+Math.floor(i/9)*2.4;
  roundedBox(2.6,2.0+(i%3)*.55,2.5,wallMaterials[i%wallMaterials.length],x,y,z,scene,.16,3,false);
  roundedBox(2.8,.18,2.7,M.terracotta,x,y+1.1+(i%3)*.28,z,scene,.06,3,false);
}

function palm(x,z,scale=1){
  const g=new THREE.Group();
  city.add(g);
  g.position.set(x,0,z);
  g.scale.setScalar(scale);
  const trunk=cyl(.13,.22,4.1,M.wood,0,2.05,0,g,10);
  trunk.rotation.z=.035;
  for(let i=0;i<10;i++){
    const leaf=roundedBox(.13,.06,2.65,M.leaf,0,4.08,0,g,.04,2,false);
    const angle=i*Math.PI*2/10;
    leaf.rotation.y=angle;
    leaf.rotation.x=-.30;
    leaf.position.x=Math.sin(angle)*.85;
    leaf.position.z=Math.cos(angle)*.85;
  }
}
palm(-5.0,-4.3,.9);
palm( 5.2,-11.5,1.05);
palm(-5.2,-31,.82);

// Overhead bunting creates the dense, playful mobile-runner look.
for(let i=0;i<4;i++){
  const y=5.0+i*.3;
  const z=-3.0-i*10.5;
  box(.04,.04,11,M.dark,0,y,z,city,false);
  for(let k=0;k<10;k++){
    const colors=[M.red,M.yellow,M.teal,M.blue];
    const flag=roundedBox(.46,.5,.04,colors[k%4],-4.4+k*.98,y-.31,z,city,.05,2,false);
    flag.rotation.z=k%2?.07:-.07;
  }
}

// Runner.
const runnerRoot=new THREE.Group();
runnerRoot.position.set(0,0,4.4);
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.72,32),
  new THREE.MeshBasicMaterial({color:0x17212b,transparent:true,opacity:.26,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.025;
runnerRoot.add(shadow);

let mixer=null;
const clock=new THREE.Clock();

function fitToHeight(root,target){
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  bounds.getSize(size);
  const scale=target/Math.max(.001,size.y);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
}

function styleHuman(human){
  human.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    obj.material=materials.map(material=>{
      if(!material)return material;
      const clone=material.clone();
      const name=(clone.name||'').toLowerCase();

      if(name.includes('shirt')||name.includes('top')||name.includes('hoodie')){
        clone.color?.setHex(0xff6a48);
      }else if(name.includes('pants')||name.includes('trouser')){
        clone.color?.setHex(0x253b5c);
      }else if(name.includes('shoe')){
        clone.color?.setHex(0xfff1d8);
      }else if(name.includes('hair')){
        clone.color?.setHex(0x3c2a24);
      }

      if('roughness' in clone)clone.roughness=.72;
      if('metalness' in clone)clone.metalness=.01;
      return clone;
    });
    if(!Array.isArray(obj.material))obj.material=obj.material[0]||obj.material;
  });
}

new GLTFLoader().load(
  HUMAN_URL,
  gltf=>{
    const human=gltf.scene;
    fitToHeight(human,2.72);
    human.rotation.y=Math.PI;
    styleHuman(human);
    runnerRoot.add(human);

    // Simple chunky backpack to sharpen the runner silhouette.
    const backpack=roundedBox(.72,.88,.34,M.teal,0,1.55,.20,runnerRoot,.14,4);
    backpack.rotation.x=-.08;

    mixer=new THREE.AnimationMixer(human);
    const run=(gltf.animations||[]).find(clip=>/run/i.test(clip.name))||gltf.animations?.[0];
    if(run){
      const action=mixer.clipAction(run);
      action.timeScale=1.18;
      action.play();
    }

    document.body.dataset.visualReady='true';
  },
  undefined,
  err=>{
    console.error(err);
    document.body.dataset.visualReady='error';
  }
);

const sunDisk=new THREE.Mesh(
  new THREE.SphereGeometry(3.8,32,16),
  new THREE.MeshBasicMaterial({color:0xffe39c})
);
sunDisk.position.set(-24,22,-105);
scene.add(sunDisk);

// Closer chase camera and subtle side-to-side energy.
let t=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.033,clock.getDelta());
  t+=dt;
  mixer?.update(dt);

  runnerRoot.position.y=Math.sin(t*9.2)*.018;
  runnerRoot.rotation.z=Math.sin(t*4.6)*.012;

  camera.position.x=THREE.MathUtils.lerp(camera.position.x,.08+Math.sin(t*.8)*.045,.055);
  camera.position.y=THREE.MathUtils.lerp(camera.position.y,3.18,.055);
  camera.position.z=THREE.MathUtils.lerp(camera.position.z,7.75,.055);
  camera.lookAt(0,1.65,-7.4);

  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
