import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const HUMAN_URL='https://cdn.jsdelivr.net/gh/psqd12137-sudo/dream-channel@3d1f3c91810ac6b73146971d7d6297b12c8f3244/godot/assets/quaternius/animated_characters/Casual_Female.gltf';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fd3ee);
scene.fog=new THREE.FogExp2(0xaedbe5,.013);

const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.1,250);
camera.position.set(.25,4.3,9.2);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
document.querySelector('#stage').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdff7ff,0xb47b52,2.1));
const sun=new THREE.DirectionalLight(0xfff0cf,4.0);
sun.position.set(-7,14,7);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-8;
scene.add(sun);

const mat=(color,rough=.78)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.02});
const toon=(color)=>new THREE.MeshToonMaterial({color});
const M={
  stone:mat(0xdfc7a3),stone2:mat(0xcab18d),plaster:mat(0xf0c983),plaster2:mat(0xe9dfc4),
  terracotta:mat(0xc96d49),terracotta2:mat(0xe39061),wood:mat(0x91613f),dark:mat(0x2d3c49),
  teal:mat(0x3e91a3),blue:mat(0x4479ae),red:mat(0xd6574f),yellow:mat(0xe5b94f),
  green:mat(0x568b61),leaf:mat(0x3e8159),sea:mat(0x3ba6c5,.32),white:mat(0xf8f2e8),
  metal:mat(0x4d626b),cloth:mat(0xe7655c),black:mat(0x27303a)
};

function box(w,h,d,material,x,y,z,parent=scene,cast=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
}
function cyl(r1,r2,h,material,x,y,z,parent=scene,seg=12){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),material);
  m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
}
function plane(w,h,material,x,y,z,rx=-Math.PI/2,parent=scene){
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);p.position.set(x,y,z);p.rotation.x=rx;p.receiveShadow=true;parent.add(p);return p;
}

const city=new THREE.Group();scene.add(city);

// Ground-level market path: pedestrian paving, never asphalt.
box(8.8,.22,23,M.stone,0,-.11,-3,city);
for(let z=7;z>-15;z-=2.1){
  box(8.3,.025,.05,new THREE.MeshBasicMaterial({color:0xc3aa88,transparent:true,opacity:.45}),0,.02,z,city,false);
}
for(const x of [-2.82,0,2.82]){
  const strip=box(.06,.03,22,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.13}),x,.03,-3,city,false);
  strip.material.depthWrite=false;
}

// Side buildings, deep façades, balconies and awnings.
const wallColors=[M.plaster,M.plaster2,mat(0xdca572),mat(0xbfd3c4),mat(0xe4bb9f)];
function building(side,z,w=5,h=7,d=6,index=0){
  const g=new THREE.Group();city.add(g);
  g.position.set(side*(6.5+w*.5),0,z);
  const wall=wallColors[index%wallColors.length];
  box(w,h,d,wall,0,h/2,0,g);
  box(w+.25,.25,d+.25,M.terracotta,0,h+.12,0,g);
  const face=-side*w*.5;
  for(let floor=0;floor<2;floor++){
    for(let k=-1;k<=1;k++){
      const win=box(.08,1.0,.72,M.blue,face+side*.02,1.8+floor*2.45,k*1.45,g,false);
      const trim=box(.10,1.22,.92,M.white,face+side*.04,1.8+floor*2.45,k*1.45,g,false);
      trim.scale.set(1,1.15,1.15);
      g.remove(trim); g.add(win);
    }
  }
  if(index%2===0){
    const awning=box(1.7,.12,3.5,index%4===0?M.red:M.teal,face-side*.78,2.15,0,g);
    awning.rotation.z=side*.16;
    box(.10,2.1,.10,M.metal,face-side*1.4,1.05,-1.35,g);
    box(.10,2.1,.10,M.metal,face-side*1.4,1.05,1.35,g);
  }
  if(index%3===1){
    const balcony=box(1.25,.16,2.8,M.wood,face-side*.7,4.2,.2,g);
    for(const zz of [-1.15,-.55,0,.55,1.15]) box(.06,.75,.06,M.metal,face-side*1.25,4.55,.2+zz,g);
    box(.06,.06,2.6,M.metal,face-side*1.25,4.9,.2,g);
  }
}
for(let i=0;i<7;i++){
  building(-1,-1-i*7.3,4.3+(i%2)*.7,6.0+(i%3)*1.0,5.5,i);
  building( 1,-3-i*7.3,4.5+((i+1)%2)*.7,6.5+((i+2)%3)*.9,5.8,i+2);
}

// Market stalls near camera.
for(const [x,z,c] of [[-4.1,3.2,M.red],[4.15,1.2,M.yellow],[-4.05,-4.4,M.teal]]){
  box(2.0,1.05,2.4,M.wood,x,.52,z,city);
  const canopy=box(2.5,.15,2.8,c,x,2.15,z,city);canopy.rotation.z=(x<0?.10:-.10);
  for(let i=0;i<8;i++){
    const fruit=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),[M.red,M.yellow,M.green][i%3]);
    fruit.position.set(x-.65+(i%4)*.42,.95,z-.45+Math.floor(i/4)*.65);fruit.castShadow=true;city.add(fruit);
  }
}

// Stairs that pull route upward instead of continuing flat.
const stairs=new THREE.Group();city.add(stairs);
stairs.position.set(-1.25,0,-14);
for(let i=0;i<11;i++) box(4.9,.22,1.1,M.stone2,0,.11+i*.24,-i*.78,stairs);
for(const side of [-1,1]){
  for(let i=0;i<6;i++) cyl(.055,.055,1.0,M.metal,side*2.15,.55+i*.48,-i*1.55,stairs,8);
}

// Elevated market awning bridge leading into rooftop section.
const awningRoute=new THREE.Group();city.add(awningRoute);
awningRoute.position.set(-1.25,2.75,-23.0);
box(4.4,.18,5.3,M.red,0,0,0,awningRoute);
for(const xx of [-1.85,1.85]) for(const zz of [-2.15,2.15]) cyl(.06,.06,2.8,M.metal,xx,-1.4,zz,awningRoute,8);

// Rooftop path with gaps and alternate scaffold.
const roofZ=-31;
for(let i=0;i<5;i++){
  const x=(i%2===0?-1.3:1.0);
  const z=roofZ-i*8.2;
  box(7.4,.36,6.4,i%2?M.terracotta:M.terracotta2,x,4.05,z,city);
  box(7.55,.55,.24,M.white,x,4.32,z-3.08,city);
  if(i<4){
    // bright jump landing lip.
    box(3.0,.18,1.2,M.yellow,x+(i%2?-.9:.9),4.15,z-4.15,city);
  }
}

// Right-side scaffold shortcut high above street.
const scaffold=new THREE.Group();city.add(scaffold);scaffold.position.set(5.2,3.8,-25);
for(let i=0;i<5;i++){
  box(2.1,.16,3.8,M.wood,0,i*.62,-i*4.0,scaffold);
  for(const x of [-.9,.9]) for(const z of [-1.7,1.7]) cyl(.055,.055,2.5,M.metal,x,-.55+i*.62,z-i*4.0,scaffold,8);
  if(i<4){
    const rail=box(.06,.06,4.0,M.metal,.95,.72+i*.62,-1.95-i*4.0,scaffold);rail.rotation.x=.04;
  }
}

// Seafront reveal at distance right.
const sea=new THREE.Mesh(new THREE.PlaneGeometry(85,120),new THREE.MeshStandardMaterial({color:0x3babc8,roughness:.25,metalness:.02,transparent:true,opacity:.94}));
sea.rotation.x=-Math.PI/2;sea.position.set(24,-.35,-63);sea.receiveShadow=false;scene.add(sea);
for(let i=0;i<12;i++){
  const foam=box(10,.02,.12,new THREE.MeshBasicMaterial({color:0xcaf4f7,transparent:true,opacity:.45}),15+i*.7,-.30,-25-i*5,scene,false);
  foam.rotation.y=.08;
}

// Hills and distant coastal blocks.
const hillMat=toon(0x6f9d74);
const hill=new THREE.Mesh(new THREE.ConeGeometry(27,22,8),hillMat);hill.position.set(-24,4,-78);hill.scale.z=1.8;scene.add(hill);
const hill2=hill.clone();hill2.position.set(28,2,-105);hill2.scale.set(.85,1.1,1.5);scene.add(hill2);
for(let i=0;i<24;i++){
  const x=-18+(i%8)*5.1+(i%2)*1.4, z=-72-Math.floor(i/8)*8, y=8+Math.floor(i/8)*2.5;
  const b=box(2.8,2.1+(i%3)*.6,2.6,wallColors[i%wallColors.length],x,y,z,scene,false);
  box(3,.16,2.8,M.terracotta,x,y+1.15+(i%3)*.3,z,scene,false);
}

// Palms and hanging banners.
function palm(x,z,s=1){
  const g=new THREE.Group();city.add(g);g.position.set(x,0,z);g.scale.setScalar(s);
  cyl(.14,.22,4.0,M.wood,0,2,0,g,9);
  for(let i=0;i<9;i++){
    const leaf=box(.18,.06,2.6,M.leaf,0,4.05,0,g,false);
    leaf.rotation.y=i*Math.PI*2/9;leaf.rotation.x=-.28;leaf.position.x=Math.sin(leaf.rotation.y)*.85;leaf.position.z=Math.cos(leaf.rotation.y)*.85;
  }
}
palm(-5.1,-10,.9);palm(5.4,-18,1.05);palm(-5.4,-37,.8);
for(let i=0;i<3;i++){
  const y=5.0+i*.35,z=-8-i*13;
  const cord=box(.04,.04,11,M.dark,0,y,z,city,false);
  for(let k=0;k<9;k++){
    const flag=box(.45,.52,.04,[M.red,M.yellow,M.teal,M.blue][k%4],-4.2+k*1.05,y-.30,z,city,false);
    flag.rotation.z=(k%2?.07:-.07);
  }
}

// Runner.
const runnerRoot=new THREE.Group();runnerRoot.position.set(0,0,4.1);scene.add(runnerRoot);
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.72,32),new THREE.MeshBasicMaterial({color:0x15202b,transparent:true,opacity:.28,depthWrite:false}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;runnerRoot.add(shadow);

let mixer=null;
const clock=new THREE.Clock();

function fitToHeight(root,target){
  root.updateMatrixWorld(true);
  const box3=new THREE.Box3().setFromObject(root);const size=new THREE.Vector3();box3.getSize(size);
  const scale=target/Math.max(.001,size.y);root.scale.setScalar(scale);root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);root.position.y-=fitted.min.y;
}

new GLTFLoader().load(HUMAN_URL,gltf=>{
  const human=gltf.scene;
  fitToHeight(human,2.5);
  human.rotation.y=Math.PI;
  human.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=false}});
  runnerRoot.add(human);
  mixer=new THREE.AnimationMixer(human);
  const run=(gltf.animations||[]).find(c=>/run/i.test(c.name))||gltf.animations?.[0];
  if(run){const action=mixer.clipAction(run);action.timeScale=1.12;action.play();}
  document.body.dataset.visualReady='true';
},undefined,err=>{
  console.error(err);
  document.body.dataset.visualReady='error';
});

// Warm sun disk.
const sunDisk=new THREE.Mesh(new THREE.SphereGeometry(3.6,32,16),new THREE.MeshBasicMaterial({color:0xffe6a8}));
sunDisk.position.set(-24,22,-105);scene.add(sunDisk);

// Camera and subtle runner motion.
let t=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(.033,clock.getDelta());t+=dt;mixer?.update(dt);
  runnerRoot.position.y=Math.sin(t*9)*.018;
  camera.position.x=THREE.MathUtils.lerp(camera.position.x,.25+Math.sin(t*.7)*.07,.045);
  camera.position.y=THREE.MathUtils.lerp(camera.position.y,4.25,.04);
  camera.lookAt(.0,2.0,-13.5);
  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
