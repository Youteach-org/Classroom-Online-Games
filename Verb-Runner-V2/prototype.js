import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROBOT_URL='https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

const variants=[
  {name:'RED',accent:0xe43c3c,secondary:0x821b2a,dark:0x171922,light:0xf0f2f6},
  {name:'BLUE',accent:0x2475d1,secondary:0x123c73,dark:0x151922,light:0xddeeff},
  {name:'GREEN',accent:0x29a65a,secondary:0x145f37,dark:0x141b18,light:0xe2f5e8},
  {name:'PINK',accent:0xef4c78,secondary:0x8d2345,dark:0x1d151a,light:0xffe1ea},
  {name:'WHITE / BLACK',accent:0xe8ebf2,secondary:0x8d94a3,dark:0x111319,light:0xffffff},
  {name:'PURPLE',accent:0x9a4de0,secondary:0x57258d,dark:0x18131e,light:0xf0e2ff}
];

const canvas=document.querySelector('#game');
const distanceEl=document.querySelector('#distance');
const speedEl=document.querySelector('#speed');
const modelStatus=document.querySelector('#modelStatus');
const flash=document.querySelector('#flash');
const picker=document.querySelector('#picker');
const startButton=document.querySelector('#startButton');
const runnerChip=document.querySelector('#runnerChip');
const runnerName=document.querySelector('#runnerName');
const runnerDot=document.querySelector('#runnerDot');
const pauseButton=document.querySelector('#pauseButton');
const resumeButton=document.querySelector('#resumeButton');
const pauseOverlay=document.querySelector('#pauseOverlay');
const resultOverlay=document.querySelector('#resultOverlay');
const runAgainButton=document.querySelector('#runAgainButton');
const challengeNumber=document.querySelector('#challengeNumber');
const streakValue=document.querySelector('#streakValue');
const progressValue=document.querySelector('#progressValue');
const momentumValue=document.querySelector('#momentumValue');
const momentumFill=document.querySelector('#momentumFill');
const raceTime=document.querySelector('#raceTime');
const gameNotice=document.querySelector('#gameNotice');
const resultTime=document.querySelector('#resultTime');
const resultAccuracy=document.querySelector('#resultAccuracy');
const resultCorrect=document.querySelector('#resultCorrect');
const resultStreak=document.querySelector('#resultStreak');
const resultObstacles=document.querySelector('#resultObstacles');
const resultMomentum=document.querySelector('#resultMomentum');

const TOTAL_CHALLENGES=12;
const difficultyPresets={
  easy:{name:'easy',speed:.90,answerSpacing:.82,distractors:2,preview:false,penalty:1},
  medium:{name:'medium',speed:1.00,answerSpacing:.82,distractors:3,preview:false,penalty:2},
  hard:{name:'hard',speed:1.15,answerSpacing:.82,distractors:4,preview:false,penalty:3}
};
let difficulty=difficultyPresets.medium;
let totalChallenges=TOTAL_CHALLENGES;
let gameSettings={
  preview:false,
  answerSpacing:.82,
  distractors:3,
  obstacleFrequency:45,
  momentumCorrect:8,
  penalty:2,
  initialSpeed:18,
  maxSpeed:31,
  speedScale:1
};

const sessionCode=(new URLSearchParams(location.search).get('session')||'').toUpperCase();
let sessionApi=null;
let sessionData=null;
let sessionLoadPromise=Promise.resolve(null);

function localRunnerId(){
  try{
    const stored=localStorage.getItem('verbRunnerV2RunnerId');
    if(stored)return stored;
    const id='R-'+Math.random().toString(36).slice(2,6).toUpperCase();
    localStorage.setItem('verbRunnerV2RunnerId',id);
    return id;
  }catch{
    return 'R-'+Math.random().toString(36).slice(2,6).toUpperCase();
  }
}
const runnerSessionId=localRunnerId();

function sessionUpdate(patch={}){
  if(!sessionApi||!sessionData||!sessionCode)return Promise.resolve();
  return sessionApi.updateRunner(sessionCode,runnerSessionId,patch);
}
function sessionConnect(data={}){
  if(!sessionApi||!sessionData||!sessionCode)return Promise.resolve();
  return sessionApi.connectRunner(sessionCode,runnerSessionId,data);
}
function sessionFinish(data={}){
  if(!sessionApi||!sessionData||!sessionCode)return Promise.resolve();
  return sessionApi.finishRunner(sessionCode,runnerSessionId,data);
}

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ec9ee);
scene.fog=new THREE.FogExp2(0xcfe5f4,0.014);

const camera=new THREE.PerspectiveCamera(52,1,.1,180);
camera.position.set(0,4.8,10.8);
camera.lookAt(0,1.55,-18);

scene.add(new THREE.HemisphereLight(0xeaf8ff,0x8c9b79,2.35));

const sun=new THREE.DirectionalLight(0xfff3cf,4.2);
sun.position.set(-10,16,10);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-16;
sun.shadow.camera.right=16;
sun.shadow.camera.top=18;
sun.shadow.camera.bottom=-8;
scene.add(sun);

const daylightFill=new THREE.DirectionalLight(0xc9e6ff,1.15);
daylightFill.position.set(8,6,-10);
scene.add(daylightFill);

const world=new THREE.Group();
scene.add(world);

const environmentMovers=[];
const farMovers=[];

function addMover(object,{speedFactor=1,span=180,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  environmentMovers.push({object,speedFactor,span,initialZ});
}

function addFarMover(object,{speedFactor=.28,span=210,startZ=null}={}){
  const initialZ=startZ??object.position.z;
  farMovers.push({object,speedFactor,span,initialZ});
}

const road=new THREE.Mesh(
  new THREE.PlaneGeometry(12,170),
  new THREE.MeshStandardMaterial({color:0x24262b,roughness:.92,metalness:.04})
);
road.rotation.x=-Math.PI/2;
road.position.z=-68;
road.receiveShadow=true;
world.add(road);

const roadGlow=new THREE.MeshBasicMaterial({color:0xe8e2c9,transparent:true,opacity:.65});
for(const x of [-6,6]){
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.025,170),roadGlow);
  rail.position.set(x,.03,-68);
  world.add(rail);
}

const sidewalkMat=new THREE.MeshStandardMaterial({color:0x5b5d60,roughness:.94,metalness:.02});
for(const x of [-7.2,7.2]){
  const sidewalk=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,170),sidewalkMat);
  sidewalk.position.set(x,.08,-68);
  sidewalk.receiveShadow=true;
  world.add(sidewalk);
}

const seamMat=new THREE.MeshBasicMaterial({color:0xd9d4bf,transparent:true,opacity:.55});
for(const x of [-5.65,5.65]){
  for(let i=0;i<18;i++){
    const seam=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,3.2),seamMat);
    seam.position.set(x,.04,-i*9.5);
    seam.userData.loopSpan=171;
    environmentMovers.push({object:seam,speedFactor:1,span:171,initialZ:seam.position.z});
    world.add(seam);
  }
}

const laneMarkers=[];
const markerMat=new THREE.MeshBasicMaterial({color:0xf1ecd7,transparent:true,opacity:.86});
for(const x of [-1.5,1.5]){
  for(let i=0;i<20;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,2.5),markerMat);
    m.position.set(x,.035,-i*8);
    laneMarkers.push(m);
    world.add(m);
  }
}

const city=new THREE.Group();
world.add(city);

const facadeMaterials=[
  new THREE.MeshStandardMaterial({color:0xb7b9bd,roughness:.88,metalness:.02}),
  new THREE.MeshStandardMaterial({color:0xb98c7f,roughness:.9,metalness:.01}),
  new THREE.MeshStandardMaterial({color:0x8fa8b7,roughness:.86,metalness:.03}),
  new THREE.MeshStandardMaterial({color:0xc2ad8d,roughness:.9,metalness:.01}),
  new THREE.MeshStandardMaterial({color:0x9ea3b2,roughness:.84,metalness:.04})
];

const glassMat=new THREE.MeshStandardMaterial({
  color:0x8db8cb,
  roughness:.18,
  metalness:.16
});
const warmWindowMat=new THREE.MeshStandardMaterial({color:0xbfd2da,roughness:.18,metalness:.12});
const coolWindowMat=new THREE.MeshStandardMaterial({color:0x9bc9dc,roughness:.16,metalness:.14});
const dimWindowMat=new THREE.MeshStandardMaterial({color:0x718898,roughness:.22,metalness:.12});
const concreteMat=new THREE.MeshStandardMaterial({color:0x777c83,roughness:.92,metalness:.01});
const curbMat=new THREE.MeshStandardMaterial({color:0xb8b8b5,roughness:.92,metalness:0});
const signNames=['CAFE','MARKET','ARCADE','HOTEL','METRO','PIZZA','BOOKS','SHOP'];

function makeSignTexture(text,bg,fg='#ffffff'){
  const c=document.createElement('canvas');
  c.width=256;c.height=96;
  const ctx=c.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=6;ctx.strokeRect(5,5,c.width-10,c.height-10);
  ctx.fillStyle=fg;
  ctx.font='900 46px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,c.width/2,c.height/2+2);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function createFacadeBuilding(side,index,z){
  const group=new THREE.Group();
  const floors=3+(index%5);
  const floorH=1.25;
  const h=floors*floorH+1.25;
  const w=3.4+(index%3)*.65;
  const d=5.2+(index%4)*.9;

  const body=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    facadeMaterials[index%facadeMaterials.length]
  );
  body.position.y=h/2;
  body.castShadow=true;
  body.receiveShadow=true;
  group.add(body);

  const roadFaceX=-side*w/2-side*.035;

  const store=new THREE.Mesh(new THREE.BoxGeometry(.08,1.05,d*.78),glassMat);
  store.position.set(roadFaceX,.68,0);
  group.add(store);

  const storeFrame=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,d*.84),concreteMat);
  storeFrame.position.set(roadFaceX-side*.03,1.23,0);
  group.add(storeFrame);

  const signText=signNames[index%signNames.length];
  const signColors=['#b51f3d','#1669a8','#6d35a4','#a85a16','#127b6f'];
  const signTex=makeSignTexture(signText,signColors[index%signColors.length]);
  const sign=new THREE.Mesh(
    new THREE.PlaneGeometry(1.55,.58),
    new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide})
  );
  sign.rotation.y=side>0?-Math.PI/2:Math.PI/2;
  sign.position.set(roadFaceX-side*.075,1.72,-d*.18);
  group.add(sign);

  const rows=Math.max(2,floors-1);
  const cols=3;
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const win=new THREE.Mesh(
        new THREE.BoxGeometry(.055,.48,.62),
        (index+r+c)%4===0?warmWindowMat:((index+r+c)%3===0?dimWindowMat:coolWindowMat)
      );
      win.position.set(
        roadFaceX-side*.04,
        2.45+r*1.05,
        THREE.MathUtils.lerp(-d*.3,d*.3,c/(cols-1))
      );
      group.add(win);
    }
  }

  if(index%3===0){
    const awning=new THREE.Mesh(
      new THREE.BoxGeometry(.55,.08,d*.7),
      new THREE.MeshStandardMaterial({color:index%2?0x9a2744:0x1c6c8e,roughness:.74})
    );
    awning.position.set(roadFaceX-side*.28,1.38,0);
    awning.rotation.z=side*.08;
    group.add(awning);
  }

  if(index%4===0){
    const roofUnit=new THREE.Mesh(new THREE.BoxGeometry(w*.42,.55,d*.34),concreteMat);
    roofUnit.position.set(0,h+.28,0);
    group.add(roofUnit);
  }

  group.position.set(side*(8.65+w/2),0,z);
  return group;
}

for(let i=0;i<19;i++){
  const z=-4-i*9.2;
  for(const side of [-1,1]){
    const building=createFacadeBuilding(side,i+(side>0?2:0),z-(side>0?3.8:0));
    city.add(building);
    addMover(building,{speedFactor:.9,span:175,startZ:building.position.z});
  }
}

const skyline=new THREE.Group();
world.add(skyline);
for(let i=0;i<18;i++){
  const side=i%2?-1:1;
  const h=10+(i%6)*2.8;
  const w=3.2+(i%4)*.8;
  const d=3.6+(i%3);
  const z=-28-i*10.2;
  const tower=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color:i%2?0x8f9aa4:0xa4adb4,
      roughness:.9
    })
  );
  tower.position.set(side*(15.5+(i%3)*3.4),h/2,z);
  skyline.add(tower);
  addFarMover(tower,{speedFactor:.2,span:208,startZ:z});
}

const streetProps=new THREE.Group();
world.add(streetProps);

const lampPostMat=new THREE.MeshStandardMaterial({color:0x505862,roughness:.5,metalness:.5});
const lampGlowMat=new THREE.MeshStandardMaterial({color:0xe6e3d7,roughness:.28,metalness:.04});
for(let i=0;i<18;i++){
  const z=-5-i*9.6;
  for(const side of [-1,1]){
    const pole=new THREE.Group();
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,3.1,8),lampPostMat);
    stem.position.y=1.55;
    pole.add(stem);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.48,.06,.06),lampPostMat);
    arm.position.set(-side*.2,2.98,0);
    pole.add(arm);
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.2,.12,.32),lampGlowMat);
    lamp.position.set(-side*.42,2.91,0);
    pole.add(lamp);
    pole.position.set(side*6.55,0,z);
    streetProps.add(pole);
    addMover(pole,{speedFactor:1,span:173,startZ:z});
  }
}

const intersectionMat=new THREE.MeshStandardMaterial({color:0x17191e,roughness:.94,metalness:.02});
for(let k=0;k<6;k++){
  const baseZ=-26-k*29;
  const intersection=new THREE.Mesh(new THREE.BoxGeometry(16,.035,6.8),intersectionMat);
  intersection.position.set(0,.022,baseZ);
  world.add(intersection);
  addMover(intersection,{speedFactor:1,span:174,startZ:baseZ});


  for(const side of [-1,1]){
    const lightGroup=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,3.4,8),lampPostMat);
    pole.position.y=1.7;
    lightGroup.add(pole);

    const box=new THREE.Mesh(new THREE.BoxGeometry(.3,.72,.28),new THREE.MeshStandardMaterial({color:0x17191c,roughness:.55,metalness:.35}));
    box.position.set(-side*.18,2.75,0);
    lightGroup.add(box);

    const redLamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0xff394f}));
    redLamp.position.set(-side*.34,2.94,0);
    lightGroup.add(redLamp);
    const greenLamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0x56ff89}));
    greenLamp.position.set(-side*.34,2.57,0);
    lightGroup.add(greenLamp);

    lightGroup.position.set(side*6.55,0,baseZ+1.7);
    streetProps.add(lightGroup);
    addMover(lightGroup,{speedFactor:1,span:174,startZ:lightGroup.position.z});
  }
}

for(const side of [-1,1]){
  const curb=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,170),curbMat);
  curb.position.set(side*6.08,.11,-68);
  curb.castShadow=true;
  world.add(curb);
}

const horizonGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(58,20),
  new THREE.MeshBasicMaterial({
    color:0xd9edf8,
    transparent:true,
    opacity:.3,
    side:THREE.DoubleSide,
    depthWrite:false
  })
);
horizonGlow.position.set(0,9,-96);
world.add(horizonGlow);

const runnerRoot=new THREE.Group();
runnerRoot.position.set(0,0,2);
scene.add(runnerRoot);

const shadow=new THREE.Mesh(
  new THREE.CircleGeometry(.72,32),
  new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.34,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;
shadow.position.y=.025;
runnerRoot.add(shadow);

let model=null;
let baseScale=null;
let mixer=null;
let actions={};
let activeAction=null;
let selectedVariant=0;
let gameStarted=false;
let gamePaused=false;
let victoryMode=false;
let runState=null;
let challenges=[];
let challengeIndex=0;
let verbDeck=[];
let runElapsed=0;
let noticeTimer=0;
let pendingAnswers=[];
let answerSpawnClock=0;
let currentChallenge=null;
let retryQueued=false;

function applyDifficultyDefaults(preset){
  difficulty=preset;
  gameSettings={
    ...gameSettings,
    preview:preset.preview,
    answerSpacing:preset.answerSpacing,
    distractors:preset.distractors,
    speedScale:preset.speed,
    penalty:preset.penalty
  };
}

function applySessionSettings(settings={}){
  const preset=difficultyPresets[settings.difficulty]||difficultyPresets.medium;
  difficulty=preset;
  totalChallenges=Math.max(5,Math.min(40,Number(settings.challengeCount)||totalChallenges));
  gameSettings={
    preview:settings.preview??preset.preview,
    answerSpacing:Number(settings.answerSpacing)||preset.answerSpacing,
    distractors:Math.max(1,Math.min(6,Number(settings.distractors)||preset.distractors)),
    obstacleFrequency:Math.max(0,Math.min(100,Number(settings.obstacleFrequency)??45)),
    momentumCorrect:Math.max(0,Number(settings.momentumCorrect)??8),
    penalty:preset.penalty,
    initialSpeed:Math.max(12,Number(settings.initialSpeed)||18),
    maxSpeed:Math.max(20,Number(settings.maxSpeed)||31),
    speedScale:Number(settings.speedScale)||preset.speed
  };
  document.querySelectorAll('[data-difficulty]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.difficulty===preset.name);
    btn.disabled=true;
  });
  challengeNumber.textContent='1 / '+totalChallenges;
  progressValue.textContent='0 / '+totalChallenges;
}

if(sessionCode){
  modelStatus.textContent='Loading classroom session '+sessionCode+'…';
  sessionLoadPromise=import('./session-sync.js')
    .then(api=>{
      sessionApi=api;
      return api.loadSession(sessionCode);
    })
    .then(data=>{
      if(!data||data.status!=='active')throw new Error('Session not active');
      sessionData=data;
      applySessionSettings(data.settings||{});
      modelStatus.textContent='Session '+sessionCode+' ready · choose a robot';
      return data;
    })
    .catch(err=>{
      console.error('Verb Runner session load failed',err);
      sessionApi=null;
      sessionData=null;
      modelStatus.textContent='Session unavailable · local mode';
      return null;
    });
}



function formatTime(ms){
  const total=Math.max(0,Math.round(ms));
  const minutes=Math.floor(total/60000);
  const seconds=Math.floor((total%60000)/1000);
  const millis=total%1000;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(millis).padStart(3,'0')}`;
}

function showNotice(text,kind='info'){
  gameNotice.textContent=text;
  gameNotice.className='game-notice show '+kind;
  noticeTimer=.9;
}

function updateHud(){
  if(!runState)return;
  streakValue.textContent=String(runState.streak);
  progressValue.textContent=`${runState.completed} / ${totalChallenges}`;
  momentumValue.textContent=`${runState.momentum}%`;
  momentumFill.style.width=`${runState.momentum}%`;
  if(sessionCode&&sessionData){
    sessionUpdate({
      progress:runState.completed,
      total:totalChallenges,
      momentum:runState.momentum,
      streak:runState.streak,
      correct:runState.correct,
      grammarErrors:runState.grammarErrors,
      obstacleHits:runState.obstacleHits
    }).catch(()=>{});
  }
}

function renderChallenge(){
  ensureChallengeAvailable();
  currentChallenge=challenges[challengeIndex];
  if(!currentChallenge)return;
  challengeNumber.textContent='VERB '+String(challengeIndex+1);
  document.querySelectorAll('[data-slot]').forEach((el,index)=>{
    const value=currentChallenge.slots[index];
    el.querySelector('b').textContent=value?String(value).toUpperCase():'____';
    el.classList.toggle('blank',value===null);
  });
  if(sessionCode&&sessionData){
    const known=currentChallenge.slots.map(v=>v?String(v).toUpperCase():'____').join(' · ');
    sessionUpdate({
      challenge:challengeIndex+1,
      challengeLabel:known
    }).catch(()=>{});
  }
}

function makeChallengeFromVerb(verb){
  return window.VerbRunnerChallenge.createChallenge(verb,{
    difficulty:difficulty.name,
    distractorCount:gameSettings.distractors
  });
}

function refillVerbDeck(){
  verbDeck=window.VerbRunnerChallenge.shuffled([...(window.VerbRunnerBank?.VERBS||[])]);
}

function ensureChallengeAvailable(){
  while(challengeIndex>=challenges.length){
    if(!verbDeck.length)refillVerbDeck();
    const nextVerb=verbDeck.shift();
    if(!nextVerb)break;
    challenges.push(makeChallengeFromVerb(nextVerb));
  }
}

function buildChallenges(){
  challenges=[];
  challengeIndex=0;
  refillVerbDeck();
  while(challenges.length<totalChallenges&&verbDeck.length){
    challenges.push(makeChallengeFromVerb(verbDeck.shift()));
  }
}

function makeAnswerTexture(word){
  const c=document.createElement('canvas');
  c.width=512;c.height=180;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#123b56';ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='#ffffff';ctx.globalAlpha=.9;ctx.lineWidth=10;ctx.strokeRect(8,8,c.width-16,c.height-16);
  ctx.globalAlpha=1;
  ctx.fillStyle='#ffffff';
  ctx.font='900 58px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(String(word).toUpperCase(),c.width/2,c.height/2+2);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

const answers=[];

function spawnAnswer(item){
  if(!gameStarted||gamePaused||victoryMode)return;
  let laneIndex=Math.floor(Math.random()*3);
  if(answers.length&&answers.at(-1)?.laneIndex===laneIndex)laneIndex=(laneIndex+1+Math.floor(Math.random()*2))%3;

  const group=new THREE.Group();
  const glow=new THREE.Mesh(
    new THREE.PlaneGeometry(2.65,1.02),
    new THREE.MeshBasicMaterial({color:0x42bfe8,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false})
  );
  glow.scale.set(1.08,1.12,1);
  group.add(glow);

  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(2.45,.86),
    new THREE.MeshBasicMaterial({map:makeAnswerTexture(item.value),transparent:false,side:THREE.DoubleSide})
  );
  panel.position.z=.02;
  group.add(panel);

  const heightMode=Math.random()<.5?'low':'high';
  const answerY=heightMode==='low'?1.15:3.15;
  group.position.set(lanes[laneIndex],answerY,-74);
  scene.add(group);
  answers.push({mesh:group,laneIndex,item,resolved:false,heightMode});
}

function clearAnswers(){
  for(const answer of answers){
    scene.remove(answer.mesh);
    answer.mesh.traverse?.(o=>{
      if(o.material?.map)o.material.map.dispose?.();
      o.material?.dispose?.();
      o.geometry?.dispose?.();
    });
  }
  answers.length=0;
  pendingAnswers=[];
  answerSpawnClock=0;
}

function launchChallengeChain(initialDelay=.42){
  clearAnswers();
  retryQueued=false;
  if(!currentChallenge)return;

  const sequence=window.VerbRunnerChallenge.buildAnswerSequence(currentChallenge,{
    distractorCount:gameSettings.distractors
  });

  pendingAnswers=sequence.map((item,index)=>({
    item,
    at:initialDelay+index*gameSettings.answerSpacing
  }));
  answerSpawnClock=0;

  if(gameSettings.preview){
    showNotice('LOOK FOR: '+String(currentChallenge.correctAnswer).toUpperCase(),'info');
  }
}

function updateAnswerSpawns(dt){
  if(!pendingAnswers.length)return;
  answerSpawnClock+=dt;
  while(pendingAnswers.length&&answerSpawnClock>=pendingAnswers[0].at){
    const next=pendingAnswers.shift();
    spawnAnswer(next.item);
  }
}

function applyRunEvent(type){
  if(!runState)return;
  const next={...runState};
  if(type==='correct'){
    next.completed=Math.min(totalChallenges,next.completed+1);
    next.correct+=1;
    next.streak+=1;
    next.bestStreak=Math.max(next.bestStreak,next.streak);
    next.momentum=Math.min(100,next.momentum+gameSettings.momentumCorrect);
  }else if(type==='grammar-error'){
    next.grammarErrors+=1;
    next.streak=0;
    next.completed=Math.max(0,next.completed-gameSettings.penalty);
  }else if(type==='obstacle-hit'){
    next.obstacleHits+=1;
    next.completed=Math.max(0,next.completed-gameSettings.penalty);
  }
  runState=next;
  updateHud();
}

function collectAnswer(answer){
  if(answer.resolved)return;
  answer.resolved=true;
  const item=answer.item;

  if(item.correct){
    applyRunEvent('correct');
    showNotice('CORRECT!','correct');
    clearAnswers();
    challengeIndex++;

    if(runState.completed>=totalChallenges){
      beginVictorySprint();
      return;
    }

    ensureChallengeAvailable();
    renderChallenge();
    launchChallengeChain(.55);
  }else{
    applyRunEvent('grammar-error');
    showNotice(String(item.value).toUpperCase()+' — WRONG · −'+gameSettings.penalty+' ADVANCE','wrong');
    scene.remove(answer.mesh);
    const idx=answers.indexOf(answer);
    if(idx>=0)answers.splice(idx,1);
  }
}

function missedCorrectAnswer(){
  if(victoryMode)return;
  clearAnswers();
  const missed=challenges.splice(challengeIndex,1)[0];
  if(missed)challenges.push(missed);
  showNotice('CORRECT FORM MISSED · MOVED TO END','info');
  renderChallenge();
  launchChallengeChain(.6);
}

function setPaused(next){
  if(!gameStarted||victoryMode)return;
  gamePaused=next;
  pauseOverlay.hidden=!next;
  pauseButton.textContent=next?'▶':'Ⅱ';
  modelStatus.textContent=next?'Paused':variants[selectedVariant].name+' robot · DAY CITY AVENUE';
  if(sessionCode&&sessionData)sessionUpdate({status:next?'paused':'running'}).catch(()=>{});
}

function finishRun(){
  gameStarted=false;
  victoryMode=false;
  gamePaused=false;
  clearAnswers();
  for(const o of obstacles.splice(0))scene.remove(o.mesh);
  if(activeAction&&actions.idle)play('idle',.15);

  const summary=window.VerbRunnerGameCore.summarize(runState,runElapsed*1000);
  resultTime.textContent=formatTime(summary.timeMs);
  resultAccuracy.textContent=summary.accuracy+'%';
  resultCorrect.textContent=summary.correctLabel;
  resultStreak.textContent=String(summary.bestStreak);
  resultObstacles.textContent=String(summary.obstacleHits);
  resultMomentum.textContent=summary.momentum+'%';
  resultOverlay.hidden=false;

  try{
    localStorage.setItem('verbRunnerV2LastResult',JSON.stringify({
      ...summary,
      difficulty:difficulty.name,
      runner:selectedVariant,
      completedAt:Date.now()
    }));
  }catch{}

  if(sessionCode&&sessionData){
    sessionFinish({
      progress:totalChallenges,
      total:totalChallenges,
      momentum:summary.momentum,
      bestStreak:summary.bestStreak,
      accuracy:summary.accuracy,
      correct:runState.correct,
      grammarErrors:runState.grammarErrors,
      obstacleHits:summary.obstacleHits,
      timeMs:summary.timeMs
    }).catch(()=>{});
  }
}

function beginVictorySprint(){
  victoryMode=true;
  clearAnswers();
  for(const o of obstacles.splice(0))scene.remove(o.mesh);
  showNotice('VICTORY SPRINT!','correct');
  if(actions.run){
    actions.run.timeScale=1.7;
    play('run',.1);
  }
  setTimeout(()=>{
    if(actions.run)actions.run.timeScale=1.2;
    finishRun();
  },2200);
}

function resetRun(){
  runState=window.VerbRunnerGameCore.createRunState(totalChallenges);
  challengeIndex=0;
  runElapsed=0;
  distance=0;
  speed=18;
  nextSpawn=26;
  hitCooldown=0;
  victoryMode=false;
  gamePaused=false;
  clearAnswers();
  verbDeck=[];
  buildChallenges();
  renderChallenge();
  updateHud();
  raceTime.textContent='00:00.000';
}

function hashName(name='mesh'){
  let h=0;
  for(const c of name)h=(h*31+c.charCodeAt(0))|0;
  return Math.abs(h);
}

function applyRobotPalette(index){
  selectedVariant=index;
  const cfg=variants[index];
  const palette=[cfg.accent,cfg.dark,cfg.secondary,cfg.light,cfg.dark,cfg.accent];

  if(model){
    model.traverse(obj=>{
      if(!obj.isMesh)return;
      const n=hashName(obj.name);
      if(obj.material?.dispose)obj.material.dispose();
      obj.material=new THREE.MeshToonMaterial({
        color:palette[n%palette.length],
        emissive:n%6===0?cfg.secondary:0x000000,
        emissiveIntensity:n%6===0?.35:0
      });
      obj.castShadow=true;
      obj.receiveShadow=true;
    });
  }

  const hex='#'+cfg.accent.toString(16).padStart(6,'0');
  document.documentElement.style.setProperty('--runner-accent',hex);
  runnerName.textContent=cfg.name;
  runnerDot.style.background=hex;
  runnerDot.style.boxShadow='0 0 15px '+hex;

  document.querySelectorAll('.robot-option').forEach((btn,i)=>btn.classList.toggle('active',i===index));
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

function chooseClip(clips,words){
  return clips.find(c=>words.some(w=>c.name.toLowerCase().includes(w)));
}

function play(name,fade=.16){
  const next=actions[name];
  if(!next||next===activeAction)return;
  next.reset().fadeIn(fade).play();
  if(activeAction)activeAction.fadeOut(fade);
  activeAction=next;
}

const loader=new GLTFLoader();
loader.load(
  ROBOT_URL,
  gltf=>{
    model=gltf.scene;
    fitToHeight(model,2.35);
    baseScale=model.scale.clone();
    model.rotation.y=Math.PI;
    model.position.y=0;
    runnerRoot.add(model);

    mixer=new THREE.AnimationMixer(model);
    const runClip=chooseClip(gltf.animations,['running','run'])||gltf.animations[0];
    const jumpClip=chooseClip(gltf.animations,['jump']);
    const idleClip=chooseClip(gltf.animations,['idle','standing']);

    actions.run=mixer.clipAction(runClip);
    if(jumpClip)actions.jump=mixer.clipAction(jumpClip);
    if(idleClip)actions.idle=mixer.clipAction(idleClip);

    actions.run.timeScale=1.2;
    if(actions.jump){
      actions.jump.setLoop(THREE.LoopOnce,1);
      actions.jump.clampWhenFinished=false;
    }

    applyRobotPalette(selectedVariant);
    play('idle',0);
    startButton.disabled=false;
    modelStatus.textContent='Robot ready · choose a color and start';
  },
  undefined,
  err=>{
    console.error(err);
    modelStatus.textContent='Robot failed to load — check network/CDN';
  }
);

document.querySelectorAll('.robot-option').forEach((btn,index)=>{
  btn.addEventListener('click',()=>applyRobotPalette(index));
});

document.querySelectorAll('[data-difficulty]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(sessionCode&&sessionData)return;
    const preset=difficultyPresets[btn.dataset.difficulty]||difficultyPresets.medium;
    applyDifficultyDefaults(preset);
    document.querySelectorAll('[data-difficulty]').forEach(b=>b.classList.toggle('active',b===btn));
  });
});

startButton.addEventListener('click',async()=>{
  await sessionLoadPromise;
  resetRun();
  picker.classList.add('hidden');
  resultOverlay.hidden=true;
  gameStarted=true;
  play('run',.12);
  modelStatus.textContent=variants[selectedVariant].name+' robot · DAY CITY AVENUE';
  if(sessionCode&&sessionData){
    await sessionConnect({
      total:totalChallenges,
      runner:selectedVariant,
      difficulty:difficulty.name
    }).catch(()=>{});
    renderChallenge();
    updateHud();
  }
  launchChallengeChain(gameSettings.preview?1.55:.55);
});

runnerChip.addEventListener('click',()=>{
  if(gameStarted){showNotice('FINISH THE RUN TO CHANGE ROBOT','info');return;}
  picker.classList.remove('hidden');
  play('idle',.12);
});

pauseButton.addEventListener('click',()=>setPaused(!gamePaused));
resumeButton.addEventListener('click',()=>setPaused(false));
runAgainButton.addEventListener('click',()=>{
  resultOverlay.hidden=true;
  picker.classList.remove('hidden');
  play('idle',.12);
});

const lanes=[-3,0,3];
let lane=1;
let targetX=lanes[lane];
let jumpTime=0;
const jumpDuration=.78;
let sliding=false;
let slideTime=0;
const slideDuration=.68;
let distance=0;
let speed=18;
let nextSpawn=26;
let hitCooldown=0;

function moveLane(dir){
  if(!gameStarted||gamePaused||victoryMode)return;
  lane=THREE.MathUtils.clamp(lane+dir,0,2);
  targetX=lanes[lane];
}

function jump(){
  if(!gameStarted||gamePaused||victoryMode||jumpTime>0||sliding)return;
  jumpTime=.001;
  if(actions.jump)play('jump',.08);
}

function slide(){
  if(!gameStarted||gamePaused||victoryMode||sliding||jumpTime>0)return;
  sliding=true;
  slideTime=.001;
}

window.addEventListener('keydown',e=>{
  if(['ArrowLeft','KeyA'].includes(e.code))moveLane(-1);
  if(['ArrowRight','KeyD'].includes(e.code))moveLane(1);
  if(['ArrowUp','Space','KeyW'].includes(e.code))jump();
  if(['ArrowDown','KeyS'].includes(e.code))slide();
});

let touchStart=null;
canvas.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{
  if(!touchStart)return;
  const dx=e.clientX-touchStart.x;
  const dy=e.clientY-touchStart.y;
  touchStart=null;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  if(Math.abs(dx)>Math.abs(dy))moveLane(dx>0?1:-1);
  else if(dy<0)jump();
  else slide();
});

const obstacles=[];
const geoLow=new THREE.BoxGeometry(2.3,.85,.65);
const geoHigh=new THREE.BoxGeometry(2.5,.45,.7);
const matLow=new THREE.MeshStandardMaterial({color:0xff315f,emissive:0x7b071f,emissiveIntensity:1.8,roughness:.35,metalness:.5});
const matHigh=new THREE.MeshStandardMaterial({color:0x18d9ff,emissive:0x045c7c,emissiveIntensity:1.6,roughness:.28,metalness:.52});

function pickObstacleLane(){
  const blocked=new Set(
    answers
      .filter(a=>a?.mesh&&Math.abs(a.mesh.position.z+74)<10)
      .map(a=>a.laneIndex)
  );
  const available=[0,1,2].filter(i=>!blocked.has(i));
  if(!available.length)return null;
  return available[Math.floor(Math.random()*available.length)];
}

function createRoadCar(index=0){
  const car=new THREE.Group();
  const colors=[0xc84545,0x2e6da4,0xd2a43b,0x4b7f61,0x777b84,0x8d55a8];
  const paint=new THREE.MeshStandardMaterial({color:colors[index%colors.length],roughness:.45,metalness:.32});
  const dark=new THREE.MeshStandardMaterial({color:0x15181c,roughness:.75,metalness:.18});
  const glass=new THREE.MeshStandardMaterial({color:0x7fb2c8,roughness:.16,metalness:.28,transparent:true,opacity:.9});
  const chrome=new THREE.MeshStandardMaterial({color:0xc9d0d4,roughness:.28,metalness:.72});
  const lightMat=new THREE.MeshBasicMaterial({color:0xfff0b0});

  const lower=new THREE.Mesh(new THREE.BoxGeometry(1.85,.52,3.35),paint);
  lower.position.y=.48;
  lower.castShadow=true;
  car.add(lower);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.78,.28,1.05),paint);
  hood.position.set(0,.78,-1.05);
  car.add(hood);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.48,.78,1.62),paint);
  cabin.position.set(0,1.08,.18);
  car.add(cabin);

  const windshield=new THREE.Mesh(new THREE.BoxGeometry(1.30,.48,.055),glass);
  windshield.position.set(0,1.18,-.65);
  windshield.rotation.x=-.18;
  car.add(windshield);

  const rearGlass=windshield.clone();
  rearGlass.position.z=.98;
  rearGlass.rotation.x=.18;
  car.add(rearGlass);

  for(const x of [-.96,.96]){
    for(const z of [-1.05,1.05]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.22,14),dark);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(x,.30,z);
      car.add(wheel);
    }
  }

  const bumper=new THREE.Mesh(new THREE.BoxGeometry(1.7,.12,.16),chrome);
  bumper.position.set(0,.34,-1.74);
  car.add(bumper);

  for(const x of [-.55,.55]){
    const lamp=new THREE.Mesh(new THREE.BoxGeometry(.28,.16,.06),lightMat);
    lamp.position.set(x,.64,-1.71);
    car.add(lamp);
  }

  return car;
}

function spawnObstacle(){
  const roll=Math.random();
  const type=roll<.42?'car':(roll<.72?'jump':'slide');
  const laneIndex=pickObstacleLane();
  if(laneIndex===null)return;
  let mesh;

  if(type==='car'){
    mesh=createRoadCar(Math.floor(Math.random()*6));
    mesh.position.set(lanes[laneIndex],0,-74);
  }else{
    mesh=new THREE.Mesh(type==='jump'?geoLow:geoHigh,type==='jump'?matLow:matHigh);
    mesh.castShadow=true;
    mesh.position.x=lanes[laneIndex];
    mesh.position.z=-74;
    mesh.position.y=type==='jump'?.43:2.35;

    if(type==='slide'){
      const posts=new THREE.Group();
      for(const x of [-1.1,1.1]){
        const p=new THREE.Mesh(new THREE.BoxGeometry(.18,2.5,.18),matHigh);
        p.position.set(x,-1.1,0);
        posts.add(p);
      }
      mesh.add(posts);
    }
  }

  scene.add(mesh);
  obstacles.push({mesh,type,laneIndex,passed:false});
}

function hit(){
  if(hitCooldown>0||victoryMode)return;
  hitCooldown=.9;
  flash.classList.add('on');
  setTimeout(()=>flash.classList.remove('on'),180);
  applyRunEvent('obstacle-hit');
  showNotice('OBSTACLE HIT · −'+gameSettings.penalty+' ADVANCE','wrong');
}

function updateRunner(dt){
  runnerRoot.position.x=THREE.MathUtils.damp(runnerRoot.position.x,targetX,11,dt);
  const lean=(targetX-runnerRoot.position.x)*-.05;
  runnerRoot.rotation.z=THREE.MathUtils.damp(runnerRoot.rotation.z,lean,8,dt);

  let y=0;

  if(jumpTime>0){
    jumpTime+=dt;
    const t=jumpTime/jumpDuration;
    if(t>=1){
      jumpTime=0;
      if(gameStarted)play('run',.1);
    }else{
      y=Math.sin(Math.PI*t)*2.45;
    }
  }

  if(sliding){
    slideTime+=dt;
    const t=Math.min(1,slideTime/slideDuration);
    const s=t<.16?THREE.MathUtils.lerp(1,.62,t/.16):t>.78?THREE.MathUtils.lerp(.62,1,(t-.78)/.22):.62;

    if(model&&baseScale){
      model.scale.set(baseScale.x,baseScale.y*s,baseScale.z);
      model.rotation.x=-.24*(1-s);
    }

    if(slideTime>=slideDuration){
      sliding=false;
      slideTime=0;
      if(model&&baseScale){
        model.scale.copy(baseScale);
        model.rotation.x=0;
      }
    }
  }

  runnerRoot.position.y=y;
  shadow.scale.setScalar(THREE.MathUtils.lerp(1,.62,Math.min(1,y/2.45)));
  shadow.material.opacity=THREE.MathUtils.lerp(.34,.1,Math.min(1,y/2.45));
}

function updateWorld(dt){
  const travel=speed*dt;

  updateAnswerSpawns(dt);

  for(const mover of environmentMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>16)mover.object.position.z-=mover.span;
  }

  for(const mover of farMovers){
    mover.object.position.z+=travel*mover.speedFactor;
    if(mover.object.position.z>8)mover.object.position.z-=mover.span;
  }

  for(const m of laneMarkers){
    m.position.z+=travel;
    if(m.position.z>8)m.position.z-=160;
  }

  for(let i=answers.length-1;i>=0;i--){
    const a=answers[i];
    a.mesh.position.z+=travel;
    const closeToRunner=Math.abs(a.mesh.position.z-runnerRoot.position.z)<1.25;
    const sameLane=a.laneIndex===lane&&Math.abs(a.mesh.position.x-runnerRoot.position.x)<1.3;
    const verticalHit=a.heightMode==='low'
      ? runnerRoot.position.y<.82
      : runnerRoot.position.y>1.18;

    if(!a.resolved&&closeToRunner&&sameLane&&verticalHit){
      collectAnswer(a);
      if(!gameStarted||victoryMode)break;
      continue;
    }

    if(a.mesh.position.z>13){
      const wasCorrect=a.item.correct&&!a.resolved;
      scene.remove(a.mesh);
      answers.splice(i,1);
      if(wasCorrect){
        missedCorrectAnswer();
        break;
      }
    }
  }

  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.mesh.position.z+=travel;

    if(!o.passed&&o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane=o.laneIndex===lane&&Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe=o.type==='jump'
          ? runnerRoot.position.y>1.05
          : (o.type==='car'
              ? runnerRoot.position.y>1.32
              : (o.type==='slide'?sliding:false));
        if(!safe)hit();
      }
    }

    if(o.mesh.position.z>13){
      scene.remove(o.mesh);
      obstacles.splice(i,1);
    }
  }

  if(!victoryMode){
    nextSpawn-=travel;
    if(nextSpawn<=0){
      spawnObstacle();
      const frequencyScale=THREE.MathUtils.lerp(1.75,.58,gameSettings.obstacleFrequency/100);
      nextSpawn=(22+Math.random()*18)*frequencyScale/gameSettings.speedScale;
    }
  }
}


setInterval(()=>{
  if(sessionCode&&sessionData&&gameStarted){
    sessionUpdate({
      status:gamePaused?'paused':(victoryMode?'victory':'running'),
      progress:runState?.completed||0,
      total:totalChallenges,
      momentum:runState?.momentum??75
    }).catch(()=>{});
  }
},15000);

const clock=new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);

  if(mixer&&!gamePaused)mixer.update(dt);
  hitCooldown=Math.max(0,hitCooldown-dt);

  if(noticeTimer>0){
    noticeTimer-=dt;
    if(noticeTimer<=0)gameNotice.className='game-notice';
  }

  if(gameStarted&&!gamePaused){
    runElapsed+=dt;
    raceTime.textContent=formatTime(runElapsed*1000);

    if(victoryMode){
      speed=34;
      distance+=speed*dt;
      updateRunner(dt);
      for(const mover of environmentMovers){
        mover.object.position.z+=speed*dt*mover.speedFactor;
        if(mover.object.position.z>16)mover.object.position.z-=mover.span;
      }
      for(const mover of farMovers){
        mover.object.position.z+=speed*dt*mover.speedFactor;
        if(mover.object.position.z>8)mover.object.position.z-=mover.span;
      }
      for(const m of laneMarkers){
        m.position.z+=speed*dt;
        if(m.position.z>8)m.position.z-=160;
      }
    }else{
      const momentumBoost=.78+(runState?.momentum||75)/340;
      speed=Math.min(gameSettings.maxSpeed,(gameSettings.initialSpeed+distance/620)*gameSettings.speedScale*momentumBoost);
      distance+=speed*dt;
      updateRunner(dt);
      updateWorld(dt);
    }
  }

  if(distanceEl)distanceEl.textContent=String(Math.floor(distance)).padStart(4,'0');
  if(speedEl)speedEl.textContent=(speed/18).toFixed(2)+'×';

  camera.position.x=THREE.MathUtils.damp(camera.position.x,runnerRoot.position.x*.15,3.5,dt);
  renderer.render(scene,camera);
}

animate();

function resize(){
  const w=innerWidth;
  const h=innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}

addEventListener('resize',resize);
resize();
