import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_BASE='https://cdn.jsdelivr.net/gh/TheFlameFoundation/MagicWorlds@1230ca734e484d0a8acaeb0e59a47e6b6b3f9c54/worlds/robot-world/glTF_Character/';
const PORTRAIT_BASE='../Verb-Runner/assets/sprites/';
const TARGET_HEIGHT=2.35;

const runners=[
  {
    name:'Red',
    file:'Casual_Female.gltf',
    portrait:'select-red-neon.webp',
    directPortrait:true,
    scaleX:.88,
    headXZ:.82,
    palette:{Shirt:0xe43c3c,Pants:0x111318,Belt:0xff9b9b,Hair:0x6d3429}
  },
  {
    name:'Blue',
    file:'Casual_Male.gltf',
    portrait:'select-hd-1.webp.b64',
    palette:{Shirt:0x2475d1,Pants:0x111827,Belt:0x8ad8ff,Hair:0x6b4635}
  },
  {
    name:'Green',
    file:'Casual2_Male.gltf',
    portrait:'select-hd-5.webp.b64',
    palette:{Shirt:0x218c4b,Pants:0x111827,Belt:0x7be5a2,Hair:0xc89b58}
  },
  {
    name:'Pink',
    file:'Casual2_Female.gltf',
    portrait:'select-hd-2.webp.b64',
    palette:{Shirt:0xef4c78,Pants:0x191218,Belt:0xff9fbd,Hair:0x4b302b}
  },
  {
    name:'White / Black',
    file:'Casual3_Male.gltf',
    portrait:'select-hd-3.webp.b64',
    palette:{Shirt:0xe9ecf2,Pants:0x151821,Belt:0x7f899c,Hair:0x171b22}
  },
  {
    name:'Purple',
    file:'Casual3_Female.gltf',
    portrait:'select-hd-4.webp.b64',
    palette:{Shirt:0x8f46d8,Pants:0x16131c,Belt:0xd59fff,Hair:0x6a4437}
  }
];

const loader=new GLTFLoader();
const instances=[];
let selectedAnimation='idle';

function cloneMaterials(root){
  root.traverse(object=>{
    if(!object.isMesh)return;
    if(Array.isArray(object.material)){
      object.material=object.material.map(material=>material?.clone?.()||material);
    }else if(object.material?.clone){
      object.material=object.material.clone();
    }
  });
}

function applyPalette(root,palette={}){
  root.traverse(object=>{
    if(!object.isMesh)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(material?.name && palette[material.name]!==undefined){
        material.color.setHex(palette[material.name]);
      }
    });
  });
}

function fitToHeight(root,target=TARGET_HEIGHT){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0)return;

  const scale=target/size.y;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  const fittedBox=new THREE.Box3().setFromObject(root);
  root.position.y-=fittedBox.min.y;
  root.updateMatrixWorld(true);
}

function getClip(clips,name){
  const wanted=name.toLowerCase();
  return clips.find(clip=>clip.name.toLowerCase()===wanted)
    || clips.find(clip=>clip.name.toLowerCase().includes(wanted));
}

function sanitizeClip(clip){
  const copy=clip.clone();
  copy.tracks=copy.tracks.filter(track=>{
    const name=track.name.toLowerCase();
    return !(
      name==='root.position' ||
      name==='characterarmature.position' ||
      name.endsWith('bone.position')
    );
  });
  return copy;
}

function makeAction(mixer,clip,once=false){
  if(!clip)return null;
  const action=mixer.clipAction(sanitizeClip(clip));
  action.enabled=true;
  action.clampWhenFinished=once;
  action.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  return action;
}

function setPortrait(index){
  const config=runners[index];
  const image=document.querySelector('#portrait-'+index);
  if(config.directPortrait){
    image.src=PORTRAIT_BASE+config.portrait;
    return;
  }

  fetch(PORTRAIT_BASE+config.portrait)
    .then(response=>{
      if(!response.ok)throw new Error('Portrait '+response.status);
      return response.text();
    })
    .then(text=>{
      image.src='data:image/webp;base64,'+text.trim();
    })
    .catch(error=>{
      console.error(error);
      image.alt+=' (failed to load)';
    });
}

function createStage(index){
  const canvas=document.querySelector('#model-'+index);
  const status=document.querySelector('#status-'+index);
  const card=document.querySelectorAll('.runner-card')[index];
  const config=runners[index];

  const renderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:true,
    powerPreference:'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();

  const camera=new THREE.PerspectiveCamera(34,1,.1,30);
  camera.position.set(0,1.25,4.5);
  camera.lookAt(0,1.18,0);

  scene.add(new THREE.HemisphereLight(0xdaf5ff,0x202133,2.25));

  const key=new THREE.DirectionalLight(0xffffff,3.5);
  key.position.set(-3.5,5.5,5);
  key.castShadow=true;
  scene.add(key);

  const accent=getComputedStyle(card).getPropertyValue('--accent').trim()||'#ffffff';
  const rim=new THREE.DirectionalLight(new THREE.Color(accent),2.1);
  rim.position.set(4,3,-3);
  scene.add(rim);

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(1.18,48),
    new THREE.ShadowMaterial({color:0x000000,opacity:.28})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=.001;
  floor.receiveShadow=true;
  scene.add(floor);

  const instance={
    index,
    config,
    canvas,
    status,
    renderer,
    scene,
    camera,
    model:null,
    mixer:null,
    actions:{},
    activeAction:null,
    loaded:false,
    drag:false,
    lastX:0,
    yaw:Math.PI
  };
  instances[index]=instance;

  canvas.addEventListener('pointerdown',event=>{
    instance.drag=true;
    instance.lastX=event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove',event=>{
    if(!instance.drag || !instance.model)return;
    const dx=event.clientX-instance.lastX;
    instance.lastX=event.clientX;
    instance.yaw+=dx*.012;
    instance.model.rotation.y=instance.yaw;
  });
  const stopDrag=()=>{instance.drag=false};
  canvas.addEventListener('pointerup',stopDrag);
  canvas.addEventListener('pointercancel',stopDrag);

  loader.load(
    MODEL_BASE+config.file,
    gltf=>{
      const model=gltf.scene;
      cloneMaterials(model);

      model.traverse(object=>{
        if(object.isMesh){
          object.castShadow=true;
          object.receiveShadow=true;
        }
      });

      fitToHeight(model,TARGET_HEIGHT);
      applyPalette(model,config.palette);

      // Preserve the approved red girl's exact proportions without changing height.
      if(config.scaleX){
        model.scale.x*=config.scaleX;
      }
      if(config.headXZ){
        const head=model.getObjectByName('Head');
        if(head){
          head.scale.x*=config.headXZ;
          head.scale.z*=config.headXZ;
        }
      }

      model.rotation.y=instance.yaw;
      scene.add(model);

      const mixer=new THREE.AnimationMixer(model);
      const clips=gltf.animations||[];

      instance.model=model;
      instance.mixer=mixer;
      instance.actions={
        idle:makeAction(mixer,getClip(clips,'Idle')),
        run:makeAction(mixer,getClip(clips,'Run')),
        jump:makeAction(mixer,getClip(clips,'Jump'),true),
        roll:makeAction(mixer,getClip(clips,'Roll'),true),
        hit:makeAction(
          mixer,
          getClip(clips,'RecieveHit')||getClip(clips,'ReceiveHit'),
          true
        )
      };
      instance.loaded=true;

      const available=Object.entries(instance.actions)
        .filter(([,action])=>Boolean(action))
        .map(([name])=>name)
        .join(' · ');

      status.textContent='Ready · height '+TARGET_HEIGHT+' · '+available;
      status.classList.add('ready');

      mixer.addEventListener('finished',()=>{
        if(['jump','roll','hit'].includes(selectedAnimation)){
          playInstance(instance,'idle');
        }
      });

      playInstance(instance,selectedAnimation);
    },
    undefined,
    error=>{
      console.error(config.file,error);
      status.textContent='Could not load '+config.file;
      status.classList.add('error');
    }
  );

  return instance;
}

function playInstance(instance,name){
  if(!instance?.loaded)return;
  const next=instance.actions[name];
  if(!next)return;

  const once=['jump','roll','hit'].includes(name);
  next.enabled=true;
  next.clampWhenFinished=once;
  next.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
  next.setEffectiveTimeScale(name==='roll'?1.10:1);
  next.setEffectiveWeight(1);
  next.reset().fadeIn(.09).play();

  if(instance.activeAction && instance.activeAction!==next){
    instance.activeAction.fadeOut(.09);
  }
  instance.activeAction=next;
}

function playAll(name){
  selectedAnimation=name;
  document.querySelectorAll('[data-animation]').forEach(button=>{
    button.classList.toggle('active',button.dataset.animation===name);
  });
  instances.forEach(instance=>playInstance(instance,name));
}

document.querySelectorAll('[data-animation]').forEach(button=>{
  button.addEventListener('click',()=>playAll(button.dataset.animation));
});

runners.forEach((runner,index)=>{
  setPortrait(index);
  createStage(index);
});

const clock=new THREE.Clock();

function resizeInstance(instance){
  const width=Math.max(1,Math.floor(instance.canvas.clientWidth));
  const height=Math.max(1,Math.floor(instance.canvas.clientHeight));
  const pixelRatio=instance.renderer.getPixelRatio();
  const drawWidth=Math.floor(width*pixelRatio);
  const drawHeight=Math.floor(height*pixelRatio);

  if(instance.canvas.width!==drawWidth || instance.canvas.height!==drawHeight){
    instance.renderer.setSize(width,height,false);
    instance.camera.aspect=width/height;
    instance.camera.updateProjectionMatrix();
  }
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);

  instances.forEach(instance=>{
    resizeInstance(instance);
    if(instance.mixer)instance.mixer.update(dt);
    instance.renderer.render(instance.scene,instance.camera);
  });
}
animate();
