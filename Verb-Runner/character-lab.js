import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const MODEL_URL='https://raw.githubusercontent.com/dpwhittaker/avatar-city/c21f285f84a35be7f7f1f8e9827e9e897ea55de1/public/characters/Casual3_Male.gltf';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xdce9ef);
scene.fog=new THREE.Fog(0xdce9ef,18,35);

const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.05,80);
camera.position.set(0,2.25,6.15);

const renderer=new THREE.WebGLRenderer({
  antialias:true,
  alpha:false,
  powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio,3));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.style.imageRendering='auto';
document.querySelector('#stage').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf5fbff,0x7f8a91,2.4));

const key=new THREE.DirectionalLight(0xfff2da,4.0);
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

const rim=new THREE.DirectionalLight(0x9bdcff,2.2);
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
runnerRoot.position.set(0,0,0);
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.68,64),
  new THREE.MeshBasicMaterial({color:0x1c2b35,transparent:true,opacity:.18,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.01;
runnerRoot.add(shadow);

let mixer=null;
let backpackAnchor=null;
const clock=new THREE.Clock();

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
  if('roughness' in m)m.roughness=.72;
  if('metalness' in m)m.metalness=.01;
  m.dithering=true;
  if('flatShading' in m)m.flatShading=false;
  m.needsUpdate=true;
  return m;
}

function styleRunner(root){
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=false;

    if(obj.geometry?.attributes?.normal){
      obj.geometry.normalizeNormals();
    }

    const source=Array.isArray(obj.material)?obj.material:[obj.material];
    const styled=source.map(mat=>{
      if(!mat)return mat;
      const m=cloneMaterial(mat);
      const name=(m.name||'').toLowerCase();

      if(name==='shirt' || name.includes('shirt')){
        m.color?.setHex(0xc7463f);
      }else if(name==='pants' || name.includes('pants')){
        m.color?.setHex(0x315b8a);
      }else if(name==='belt' || name.includes('belt')){
        m.color?.setHex(0x2b3440);
      }else if(name==='hair' || name.includes('hair')){
        m.color?.setHex(0x2d211d);
      }else if(name==='face' || name==='skin' || name.includes('skin')){
        m.color?.setHex(0xd99c76);
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
    if(/upper.?chest|chest|spine.?2|spine.?1|spine|torso/i.test(obj.name||'')){
      named.push(item);
    }
  });

  const score=item=>{
    const {x,y,z}=item.pos;
    return Math.abs(x)*2.8 + Math.abs(z)*1.4 + Math.abs(y-1.55);
  };

  const pool=named.length?named:all;
  pool.sort((a,b)=>score(a)-score(b));
  return pool[0]?.bone||null;
}

function createBackpack(){
  const g=new THREE.Group();
  g.name='RunnerBackpack';

  const shellMat=new THREE.MeshStandardMaterial({
    color:0x26384d,
    roughness:.68,
    metalness:.03
  });
  const trimMat=new THREE.MeshStandardMaterial({
    color:0xb46f43,
    roughness:.66,
    metalness:.02
  });
  const strapMat=new THREE.MeshStandardMaterial({
    color:0x1d2936,
    roughness:.80,
    metalness:0
  });

  const shell=new THREE.Mesh(
    new RoundedBoxGeometry(.72,.86,.34,10,.14),
    shellMat
  );
  shell.position.set(0,0,.12);
  shell.rotation.x=-.08;
  shell.castShadow=true;
  g.add(shell);

  const flap=new THREE.Mesh(
    new RoundedBoxGeometry(.58,.30,.08,8,.08),
    trimMat
  );
  flap.position.set(0,.18,.31);
  flap.rotation.x=-.08;
  flap.castShadow=true;
  g.add(flap);

  for(const x of [-.27,.27]){
    const strap=new THREE.Mesh(
      new RoundedBoxGeometry(.09,.78,.08,6,.04),
      strapMat
    );
    strap.position.set(x,.02,-.08);
    strap.rotation.z=x<0?-.12:.12;
    strap.rotation.x=-.06;
    strap.castShadow=true;
    g.add(strap);
  }

  return g;
}

function attachBackpackToTorso(human){
  const backpack=createBackpack();

  // Start in the same world-space pose as the previous lab version.
  backpack.position.set(0,1.48,.18);
  runnerRoot.add(backpack);

  scene.updateMatrixWorld(true);
  const torsoBone=findTorsoBone(human);

  if(torsoBone){
    // Object3D.attach preserves the current world transform, then the backpack
    // inherits every animated transform of the real torso bone.
    torsoBone.attach(backpack);
    backpackAnchor=torsoBone;
    document.body.dataset.backpackAnchor=torsoBone.name||'unnamed-torso-bone';
  }else{
    backpackAnchor=runnerRoot;
    document.body.dataset.backpackAnchor='runner-root-fallback';
  }
}

function addHood(){
  const hoodMat=new THREE.MeshStandardMaterial({
    color:0xc7463f,
    roughness:.74,
    metalness:0
  });
  const hood=new THREE.Mesh(
    new THREE.TorusGeometry(.29,.105,16,40,Math.PI*1.45),
    hoodMat
  );
  hood.position.set(0,2.25,.05);
  hood.rotation.set(Math.PI*.5,0,Math.PI*.27);
  hood.castShadow=true;
  runnerRoot.add(hood);
}

new GLTFLoader().load(
  MODEL_URL,
  gltf=>{
    const human=gltf.scene;
    fitToHeight(human,2.72);
    human.rotation.y=Math.PI;
    styleRunner(human);
    runnerRoot.add(human);

    scene.updateMatrixWorld(true);
    attachBackpackToTorso(human);
    addHood();

    mixer=new THREE.AnimationMixer(human);
    const run=(gltf.animations||[]).find(c=>c.name==='Run'||/run/i.test(c.name))||gltf.animations?.[0];
    if(run){
      const action=mixer.clipAction(run);
      action.timeScale=1.12;
      action.play();
    }

    document.body.dataset.characterReady='true';
  },
  undefined,
  err=>{
    console.error(err);
    document.body.dataset.characterReady='error';
  }
);

let t=0;
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  t+=dt;
  mixer?.update(dt);

  runnerRoot.position.y=Math.sin(t*9)*.012;
  camera.position.x=Math.sin(t*.55)*.025;
  camera.lookAt(0,1.35,.05);

  renderer.render(scene,camera);
}
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio,3));
  renderer.setSize(innerWidth,innerHeight);
});
