import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_BASE='https://cdn.jsdelivr.net/gh/TheFlameFoundation/MagicWorlds@1230ca734e484d0a8acaeb0e59a47e6b6b3f9c54/worlds/robot-world/glTF_Character/';

const runners=[
  {
    name:'Red',
    accent:'#e43c3c',
    portrait:'../Verb-Runner/assets/sprites/select-red-neon.webp',
    model:'Casual_Female.gltf',
    scaleX:.88,
    headXZ:.82,
    palette:{Shirt:0xe43c3c,Pants:0x111318,Belt:0xff9b9b,Hair:0x6d3429}
  },
  {
    name:'Blue',
    accent:'#2475d1',
    portrait:'../Verb-Runner/assets/sprites/select-hd-1.webp.b64',
    portraitBase64:true,
    model:'Casual2_Female.gltf',
    scaleX:.88,
    headXZ:.82,
    palette:{Shirt:0x2475d1,Pants:0x111827,Belt:0x8ad8ff,Hair:0x23252d}
  },
  {
    name:'Green',
    accent:'#218c4b',
    portrait:'../Verb-Runner/assets/sprites/select-hd-5.webp.b64',
    portraitBase64:true,
    model:'Ninja_Female.gltf',
    scaleX:.89,
    headXZ:.84,
    palette:{Main:0x218c4b,Details:0x7be5a2,Grey:0x151a18,Hair:0x17211d}
  },
  {
    name:'Pink',
    accent:'#ef4c78',
    portrait:'../Verb-Runner/assets/sprites/select-hd-2.webp.b64',
    portraitBase64:true,
    model:'Casual3_Female.gltf',
    scaleX:.88,
    headXZ:.82,
    palette:{Shirt:0xef4c78,Pants:0x191218,Belt:0xff9fbd,Hair:0x5c342e}
  },
  {
    name:'White',
    accent:'#e9edf5',
    portrait:'../Verb-Runner/assets/sprites/select-hd-3.webp.b64',
    portraitBase64:true,
    model:'Suit_Female.gltf',
    scaleX:.89,
    headXZ:.84,
    palette:{Shirt:0xf3f4f7,Suit:0xd9dde6,Pants:0x252932,Hair:0xd6b16b}
  },
  {
    name:'Purple',
    accent:'#9a4de0',
    portrait:'../Verb-Runner/assets/sprites/select-hd-4.webp.b64',
    portraitBase64:true,
    model:'BlueSoldier_Female.gltf',
    scaleX:.89,
    headXZ:.84,
    palette:{Main:0x9a4de0,Black:0x14171e,Grey:0xdd9cff,Hair:0xa9432d}
  }
];

const gallery=document.querySelector('#gallery');
const loader=new GLTFLoader();
const scenes=[];

function cardTemplate(cfg,index){
  return `
    <article class="runner-card" data-runner="${index}" style="--accent:${cfg.accent}">
      <div class="runner-head">
        <div class="runner-title"><span class="color-dot"></span><h2>${cfg.name} runner</h2></div>
        <div class="model-name">${cfg.model.replace('.gltf','')}</div>
      </div>
      <div class="comparison">
        <div class="pane portrait-pane">
          <img class="portrait loading" alt="${cfg.name} original Verb Runner selection portrait" />
        </div>
        <div class="pane model-pane">
          <canvas class="runner-canvas" aria-label="${cfg.name} 3D runner proposal"></canvas>
          <div class="loading-label">Loading 3D model…</div>
        </div>
      </div>
      <div class="controls">
        <button class="anim-btn active" data-action="idle">Idle</button>
        <button class="anim-btn" data-action="run">Run</button>
        <button class="anim-btn" data-action="jump">Jump</button>
        <button class="anim-btn" data-action="roll">Roll</button>
        <button class="anim-btn" data-action="hit">Hit</button>
        <span class="clip-state">checking clips…</span>
      </div>
    </article>`;
}

gallery.innerHTML=runners.map(cardTemplate).join('');

async function loadPortrait(card,cfg){
  const img=card.querySelector('.portrait');
  try{
    if(cfg.portraitBase64){
      const text=await fetch(cfg.portrait,{cache:'force-cache'}).then(r=>{
        if(!r.ok)throw new Error('portrait '+r.status);
        return r.text();
      });
      img.src='data:image/webp;base64,'+text.replace(/\s+/g,'');
    }else{
      img.src=cfg.portrait;
    }
    await img.decode().catch(()=>{});
    img.classList.remove('loading');
  }catch(err){
    console.error('Portrait failed:',cfg.name,err);
    img.alt=cfg.name+' portrait failed to load';
  }
}

function cloneMaterials(root){
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(Array.isArray(o.material))o.material=o.material.map(m=>m?.clone?.()||m);
    else if(o.material?.clone)o.material=o.material.clone();
  });
}

function applyPalette(root,palette){
  root.traverse(o=>{
    if(!o.isMesh)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const mat of mats){
      if(!mat?.name)continue;
      if(palette[mat.name]!==undefined)mat.color.setHex(palette[mat.name]);
    }
  });
}

function fitToHeight(root,target=2.35){
  root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3();
  box.getSize(size);
  if(size.y<=0)return;
  const s=target/size.y;
  root.scale.setScalar(s);
  root.updateMatrixWorld(true);
  const fitted=new THREE.Box3().setFromObject(root);
  root.position.y-=fitted.min.y;
}

function getClip(clips,name){
  const lower=name.toLowerCase();
  return clips.find(c=>c.name.toLowerCase()===lower)
    || clips.find(c=>c.name.toLowerCase().includes(lower));
}

function sanitizeClip(clip){
  const copy=clip.clone();
  copy.tracks=copy.tracks.filter(track=>{
    const n=track.name.toLowerCase();
    return !(n==='root.position' || n==='characterarmature.position' || n.endsWith('bone.position'));
  });
  return copy;
}

function buildScene(card,cfg){
  const canvas=card.querySelector('.runner-canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,30);
  camera.position.set(0,1.28,5.05);
  camera.lookAt(0,1.13,0);

  scene.add(new THREE.HemisphereLight(0xdff7ff,0x171322,2.6));
  const key=new THREE.DirectionalLight(0xffffff,3.2);
  key.position.set(-3,6,4);
  scene.add(key);
  const rim=new THREE.DirectionalLight(new THREE.Color(cfg.accent),2.15);
  rim.position.set(4,3,-3);
  scene.add(rim);

  const state={card,cfg,canvas,renderer,scene,camera,mixer:null,actions:{},active:null,model:null,last:performance.now()};
  scenes.push(state);

  const observer=new ResizeObserver(()=>resizeState(state));
  observer.observe(canvas.parentElement);

  loader.load(
    MODEL_BASE+cfg.model,
    gltf=>{
      const model=gltf.scene;
      model.rotation.y=Math.PI;
      cloneMaterials(model);
      model.traverse(o=>{
        if(o.isMesh){
          o.frustumCulled=false;
        }
      });

      fitToHeight(model,2.35);
      model.scale.x*=cfg.scaleX;

      const head=model.getObjectByName('Head');
      if(head){
        head.scale.x*=cfg.headXZ;
        head.scale.z*=cfg.headXZ;
      }

      applyPalette(model,cfg.palette||{});
      scene.add(model);
      state.model=model;
      state.mixer=new THREE.AnimationMixer(model);

      const clips=gltf.animations||[];
      const found={
        idle:getClip(clips,'Idle'),
        run:getClip(clips,'Run'),
        jump:getClip(clips,'Jump'),
        roll:getClip(clips,'Roll'),
        hit:getClip(clips,'RecieveHit')||getClip(clips,'ReceiveHit')
      };

      for(const [name,clip] of Object.entries(found)){
        if(!clip)continue;
        const action=state.mixer.clipAction(sanitizeClip(clip));
        action.clampWhenFinished=['jump','roll','hit'].includes(name);
        action.setLoop(action.clampWhenFinished?THREE.LoopOnce:THREE.LoopRepeat,action.clampWhenFinished?1:Infinity);
        state.actions[name]=action;
      }

      state.mixer.addEventListener('finished',()=>playState(state,'idle'));
      playState(state,'idle',true);

      const missing=Object.entries(found).filter(([,v])=>!v).map(([k])=>k);
      const clipState=card.querySelector('.clip-state');
      clipState.textContent=missing.length?'missing: '+missing.join(', '):'Idle · Run · Jump · Roll · Hit ✓';
      if(missing.length)clipState.classList.add('error');

      card.classList.add('ready');
      resizeState(state);
    },
    undefined,
    err=>{
      console.error('Model failed:',cfg.name,cfg.model,err);
      card.querySelector('.loading-label').textContent='Model failed to load';
      card.querySelector('.loading-label').classList.add('error');
    }
  );

  card.querySelectorAll('.anim-btn').forEach(btn=>{
    btn.addEventListener('click',()=>playState(state,btn.dataset.action,true));
  });
}

function playState(state,name,reset=false){
  const next=state.actions[name];
  if(!next)return;
  if(state.active===next && !reset)return;
  next.enabled=true;
  next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name==='run'?1.02:1).fadeIn(.1).play();
  if(state.active && state.active!==next)state.active.fadeOut(.1);
  state.active=next;

  state.card.querySelectorAll('.anim-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.action===name);
  });
}

function resizeState(state){
  const host=state.canvas.parentElement;
  const width=Math.max(1,host.clientWidth);
  const height=Math.max(1,host.clientHeight);
  const dpr=state.renderer.getPixelRatio();
  const targetW=Math.round(width*dpr);
  const targetH=Math.round(height*dpr);
  if(state.canvas.width!==targetW || state.canvas.height!==targetH){
    state.renderer.setSize(width,height,false);
    state.camera.aspect=width/height;
    state.camera.updateProjectionMatrix();
  }
}

for(const [index,cfg] of runners.entries()){
  const card=gallery.querySelector(`[data-runner="${index}"]`);
  loadPortrait(card,cfg);
  buildScene(card,cfg);
}

let previous=performance.now();
function animate(now){
  const dt=Math.min((now-previous)/1000,.05);
  previous=now;
  for(const state of scenes){
    if(state.mixer)state.mixer.update(dt);
    resizeState(state);
    state.renderer.render(state.scene,state.camera);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
