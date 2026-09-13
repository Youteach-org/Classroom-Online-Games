import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROBOT_URL='https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
const IS_MOBILE=matchMedia('(pointer:coarse)').matches||innerWidth<=700;
const ANSWER_SPAWN_Z=IS_MOBILE?-50:-70;
const OBSTACLE_SPAWN_Z=IS_MOBILE?-58:-74;

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
  easy:{name:'easy',speed:.90,answerSpacing:.82,distractors:2,preview:false,penalty:0},
  medium:{name:'medium',speed:1.00,answerSpacing:.82,distractors:3,preview:false,penalty:1},
  hard:{name:'hard',speed:1.15,answerSpacing:.82,distractors:4,preview:false,penalty:2}
};
let difficulty=difficultyPresets.medium;
let totalChallenges=TOTAL_CHALLENGES;
let gameSettings={
  preview:false,
  answerSpacing:.82,
  distractors:3,
  obstacleFrequency:45,
  momentumCorrect:8,
  penalty:1,
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

const renderer=new THREE.WebGLRenderer({canvas,antialias:!IS_MOBILE,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(IS_MOBILE?Math.min(devicePixelRatio||1,1.1):Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=!IS_MOBILE;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8ec9ee);
scene.fog=new THREE.FogExp2(0xcfe5f4,IS_MOBILE?0.010:0.014);

const camera=new THREE.PerspectiveCamera(52,1,.1,180);
camera.position.set(0,IS_MOBILE?4.4:4.8,IS_MOBILE?9.5:10.8);
camera.fov=IS_MOBILE?58:52;
camera.lookAt(0,1.55,IS_MOBILE?-14:-18);

scene.add(new THREE.HemisphereLight(0xeaf8ff,0x8c9b79,2.35));

const sun=new THREE.DirectionalLight(0xfff3cf,4.2);
sun.position.set(-10,16,10);
sun.castShadow=true;
sun.shadow.mapSize.set(IS_MOBILE?1024:2048,IS_MOBILE?1024:2048);
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

  if(!IS_MOBILE||index%2===0){
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
  }

  const rows=IS_MOBILE?2:Math.max(2,floors-1);
  const cols=IS_MOBILE?2:3;
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

  if(!IS_MOBILE&&index%3===0){
    const awning=new THREE.Mesh(
      new THREE.BoxGeometry(.55,.08,d*.7),
      new THREE.MeshStandardMaterial({color:index%2?0x9a2744:0x1c6c8e,roughness:.74})
    );
    awning.position.set(roadFaceX-side*.28,1.38,0);
    awning.rotation.z=side*.08;
    group.add(awning);
  }

  if(!IS_MOBILE&&index%4===0){
    const roofUnit=new THREE.Mesh(new THREE.BoxGeometry(w*.42,.55,d*.34),concreteMat);
    roofUnit.position.set(0,h+.28,0);
    group.add(roofUnit);
  }

  group.position.set(side*(8.65+w/2),0,z);
  return group;
}

for(let i=0;i<(IS_MOBILE?13:19);i++){
  const z=-4-i*9.2;
  for(const side of [-1,1]){
    const building=createFacadeBuilding(side,i+(side>0?2:0),z-(side>0?3.8:0));
    city.add(building);
    addMover(building,{speedFactor:.9,span:175,startZ:building.position.z});
  }
}

const skyline=new THREE.Group();
world.add(skyline);
for(let i=0;i<(IS_MOBILE?10:18);i++){
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
for(let i=0;i<(IS_MOBILE?10:18);i++){
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
let answerResolutionActive=false;
let lastCorrectAnswerIndex=-1;
let recentCorrectPositions=[];

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
  if(challengeNumber)challengeNumber.textContent='1 / '+totalChallenges;
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
  if(challengeNumber)challengeNumber.textContent='';
  document.querySelectorAll('[data-slot]').forEach((el,index)=>{
    const value=currentChallenge.slots[index];
    el.classList.remove('feedback-correct','feedback-wrong');
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
  c.width=768;c.height=256;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#123b56';ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle='#ffffff';ctx.globalAlpha=.95;ctx.lineWidth=14;ctx.strokeRect(10,10,c.width-20,c.height-20);
  ctx.globalAlpha=1;
  ctx.fillStyle='#ffffff';
  ctx.font='900 82px Arial';
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

  let heightMode=Math.random()<.5?'low':'high';
  const nearSpawn=obstacles.filter(o=>o?.mesh);
  const blockedByObstacle=new Set(
    nearSpawn
      .filter(o=>{
        const dz=Math.abs(o.mesh.position.z-ANSWER_SPAWN_Z);
        if(heightMode==='high'&&o.type==='slide')return dz<28;
        return dz<12;
      })
      .map(o=>o.laneIndex)
  );

  let availableLanes=[0,1,2].filter(i=>!blockedByObstacle.has(i));
  if(!availableLanes.length&&heightMode==='high'){
    heightMode='low';
    const lowBlocked=new Set(
      nearSpawn.filter(o=>Math.abs(o.mesh.position.z-ANSWER_SPAWN_Z)<12).map(o=>o.laneIndex)
    );
    availableLanes=[0,1,2].filter(i=>!lowBlocked.has(i));
  }

  let laneIndex=availableLanes.length
    ? availableLanes[Math.floor(Math.random()*availableLanes.length)]
    : Math.floor(Math.random()*3);

  if(answers.length&&answers.at(-1)?.laneIndex===laneIndex&&availableLanes.length>1){
    const alternates=availableLanes.filter(i=>i!==laneIndex);
    laneIndex=alternates[Math.floor(Math.random()*alternates.length)];
  }

  const group=new THREE.Group();
  const cardW=IS_MOBILE?3.55:2.85;
  const cardH=IS_MOBILE?1.28:1.02;
  const glow=new THREE.Mesh(
    new THREE.PlaneGeometry(cardW+0.28,cardH+0.18),
    new THREE.MeshBasicMaterial({color:0x64ddff,transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false})
  );
  glow.scale.set(1.08,1.12,1);
  group.add(glow);

  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(cardW,cardH),
    new THREE.MeshBasicMaterial({map:makeAnswerTexture(item.value),transparent:false,side:THREE.DoubleSide,fog:false,toneMapped:false})
  );
  panel.position.z=.02;
  group.add(panel);

  const answerY=heightMode==='low'?1.15:(IS_MOBILE?2.78:3.15);
  group.position.set(lanes[laneIndex],answerY,ANSWER_SPAWN_Z);
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

  let correctIndex=sequence.findIndex(item=>item.correct);
  const lastIndex=sequence.length-1;
  const recentLastCount=recentCorrectPositions.filter(i=>i===lastIndex).length;

  if(correctIndex===lastIndex&&(lastCorrectAnswerIndex===lastIndex||recentLastCount>=1)){
    const candidates=sequence
      .map((item,index)=>({item,index}))
      .filter(x=>!x.item.correct&&x.index!==lastIndex);
    if(candidates.length){
      const swapWith=candidates[Math.floor(Math.random()*candidates.length)].index;
      [sequence[correctIndex],sequence[swapWith]]=[sequence[swapWith],sequence[correctIndex]];
      correctIndex=swapWith;
    }
  }

  lastCorrectAnswerIndex=correctIndex;
  recentCorrectPositions.push(correctIndex);
  if(recentCorrectPositions.length>4)recentCorrectPositions.shift();

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
  if(answerResolutionActive||!pendingAnswers.length)return;
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

function disposeAnswer(answer){
  if(!answer)return;
  scene.remove(answer.mesh);
  answer.mesh?.traverse?.(o=>{
    if(o.material?.map)o.material.map.dispose?.();
    o.material?.dispose?.();
    o.geometry?.dispose?.();
  });
  const idx=answers.indexOf(answer);
  if(idx>=0)answers.splice(idx,1);
}

function answerScreenPoint(answer){
  const p=new THREE.Vector3();
  answer.mesh.getWorldPosition(p);
  p.project(camera);
  const rect=canvas.getBoundingClientRect();
  return {
    x:rect.left+(p.x*.5+.5)*rect.width,
    y:rect.top+(-p.y*.5+.5)*rect.height
  };
}

function waitMs(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function animateAnswerToBlank(answer,correct,startOverride=null){
  const blankPart=document.querySelector('.part.blank');
  const blankText=blankPart?.querySelector('b');
  if(!blankPart||!blankText)return;

  const start=startOverride||answerScreenPoint(answer);
  const targetRect=blankText.getBoundingClientRect();
  const target={
    x:targetRect.left+targetRect.width/2,
    y:targetRect.top+targetRect.height/2
  };

  const flyer=document.createElement('div');
  flyer.className='answer-flight';
  flyer.textContent=String(answer.item.value).toUpperCase();
  flyer.style.left=start.x+'px';
  flyer.style.top=start.y+'px';
  document.body.appendChild(flyer);

  const finalBg=correct?'#178b4c':'#b8243e';
  const finalBorder=correct?'#66f0a0':'#ff7185';
  const keyframes=[
    {
      left:start.x+'px',
      top:start.y+'px',
      transform:'translate(-50%,-50%) scale(.9)',
      background:'#123b56',
      borderColor:'#ffffff',
      opacity:1
    },
    {
      offset:.72,
      left:target.x+'px',
      top:(target.y+5)+'px',
      transform:'translate(-50%,-50%) scale(1.18)',
      background:finalBg,
      borderColor:finalBorder,
      opacity:1
    },
    {
      left:target.x+'px',
      top:target.y+'px',
      transform:'translate(-50%,-50%) scale(1)',
      background:finalBg,
      borderColor:finalBorder,
      opacity:1
    }
  ];

  if(flyer.animate){
    const anim=flyer.animate(keyframes,{duration:560,easing:'cubic-bezier(.2,.8,.22,1)',fill:'forwards'});
    await anim.finished.catch(()=>{});
  }else{
    flyer.style.left=target.x+'px';
    flyer.style.top=target.y+'px';
    flyer.style.background=finalBg;
    await waitMs(560);
  }

  blankPart.classList.remove('blank');
  blankPart.classList.add(correct?'feedback-correct':'feedback-wrong');
  blankText.textContent=String(answer.item.value).toUpperCase();
  flyer.remove();

  await waitMs(correct?330:420);

  if(!correct){
    blankPart.classList.remove('feedback-wrong');
    blankPart.classList.add('blank');
    blankText.textContent='____';
  }
}

async function collectAnswer(answer){
  if(answer.resolved||answerResolutionActive)return;
  answer.resolved=true;
  answerResolutionActive=true;
  const item=answer.item;

  if(item.correct){
    const startPoint=answerScreenPoint(answer);
    const selectedCopy={mesh:answer.mesh,item:answer.item};
    clearAnswers();
    await animateAnswerToBlank(selectedCopy,true,startPoint);
    applyRunEvent('correct');
    showNotice('CORRECT!','correct');
    challengeIndex++;

    if(runState.completed>=totalChallenges){
      answerResolutionActive=false;
      beginVictorySprint();
      return;
    }

    ensureChallengeAvailable();
    renderChallenge();
    launchChallengeChain(.55);
    answerResolutionActive=false;
  }else{
    const startPoint=answerScreenPoint(answer);
    const selectedCopy={mesh:answer.mesh,item:answer.item};
    disposeAnswer(answer);
    await animateAnswerToBlank(selectedCopy,false,startPoint);
    applyRunEvent('grammar-error');
    showNotice(String(item.value).toUpperCase()+' — WRONG · −'+gameSettings.penalty+' ADVANCE','wrong');
    answerResolutionActive=false;
  }
}

function missedCorrectAnswer(){
  if(victoryMode)return;
  clearAnswers();

  if(challengeIndex>=challenges.length-1){
    if(!verbDeck.length)refillVerbDeck();
    const nextVerb=verbDeck.shift();
    if(nextVerb)challenges.push(makeChallengeFromVerb(nextVerb));
  }

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
  answerResolutionActive=false;
  lastCorrectAnswerIndex=-1;
  recentCorrectPositions=[];
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

const obstacleMaterials={
  asphaltDark:new THREE.MeshStandardMaterial({color:0x1c2228,roughness:.82,metalness:.18}),
  rubber:new THREE.MeshStandardMaterial({color:0x101215,roughness:.95,metalness:.02}),
  metal:new THREE.MeshStandardMaterial({color:0xaeb7bd,roughness:.35,metalness:.65}),
  glass:new THREE.MeshStandardMaterial({color:0x80afc4,roughness:.18,metalness:.22,transparent:true,opacity:.92}),
  orange:new THREE.MeshStandardMaterial({color:0xf17828,roughness:.58,metalness:.08}),
  white:new THREE.MeshStandardMaterial({color:0xf1eee5,roughness:.62,metalness:.04}),
  yellow:new THREE.MeshStandardMaterial({color:0xf3c52f,roughness:.55,metalness:.08}),
  blue:new THREE.MeshStandardMaterial({color:0x2878b8,roughness:.6,metalness:.06}),
  brown:new THREE.MeshStandardMaterial({color:0x9b6944,roughness:.88,metalness:.02}),
  fur:new THREE.MeshStandardMaterial({color:0x8b5b37,roughness:.98,metalness:0}),
  skin:new THREE.MeshStandardMaterial({color:0xd99a72,roughness:.9,metalness:0}),
  cloth:new THREE.MeshStandardMaterial({color:0x305c88,roughness:.88,metalness:.02}),
  black:new THREE.MeshStandardMaterial({color:0x17191d,roughness:.86,metalness:.08})
};

function cylinderBetween(a,b,r,mat){
  const delta=new THREE.Vector3().subVectors(b,a);
  const length=delta.length();
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,10),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
  return mesh;
}

function pickObstacleLane(type){
  const blocked=new Set();
  for(const a of answers){
    if(!a?.mesh)continue;
    if(type==='slide'&&a.heightMode==='high'&&Math.abs(a.mesh.position.z-OBSTACLE_SPAWN_Z)<30)blocked.add(a.laneIndex);
    else if(Math.abs(a.mesh.position.z-OBSTACLE_SPAWN_Z)<14)blocked.add(a.laneIndex);
  }
  const available=[0,1,2].filter(i=>!blocked.has(i));
  if(!available.length)return null;
  return available[Math.floor(Math.random()*available.length)];
}

function createRoadCar(index=0){
  const car=new THREE.Group();
  const colors=[0xc83e3e,0x2d6fb3,0xd19a2d,0x3f805c,0x747b86,0x8b54a7];
  const paint=new THREE.MeshStandardMaterial({color:colors[index%colors.length],roughness:.36,metalness:.34});
  const trim=new THREE.MeshStandardMaterial({color:0x252a30,roughness:.62,metalness:.28});
  const glass=new THREE.MeshStandardMaterial({color:0x7eaec1,roughness:.12,metalness:.34,transparent:true,opacity:.9});
  const chrome=new THREE.MeshStandardMaterial({color:0xc7cfd4,roughness:.25,metalness:.72});
  const lightFront=new THREE.MeshBasicMaterial({color:0xfff0b1});
  const lightRear=new THREE.MeshBasicMaterial({color:0xe83a3f});

  const chassis=new THREE.Mesh(new THREE.BoxGeometry(1.82,.48,3.28),paint);
  chassis.position.y=.56;
  chassis.castShadow=true;
  car.add(chassis);

  const lowerSkirt=new THREE.Mesh(new THREE.BoxGeometry(1.92,.18,2.95),trim);
  lowerSkirt.position.y=.31;
  car.add(lowerSkirt);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.68,.28,1.05),paint);
  hood.position.set(0,.82,-1.03);
  hood.rotation.x=-.055;
  hood.castShadow=true;
  car.add(hood);

  const trunk=new THREE.Mesh(new THREE.BoxGeometry(1.62,.25,.70),paint);
  trunk.position.set(0,.83,1.24);
  trunk.rotation.x=.045;
  car.add(trunk);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.46,.72,1.48),paint);
  cabin.position.set(0,1.17,.17);
  cabin.castShadow=true;
  car.add(cabin);

  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.30,.13,.92),paint);
  roof.position.set(0,1.58,.22);
  car.add(roof);

  const windshield=new THREE.Mesh(new THREE.PlaneGeometry(1.20,.48),glass);
  windshield.position.set(0,1.28,-.59);
  windshield.rotation.x=-.40;
  car.add(windshield);

  const rearWindow=new THREE.Mesh(new THREE.PlaneGeometry(1.16,.44),glass);
  rearWindow.position.set(0,1.29,.92);
  rearWindow.rotation.x=.38;
  rearWindow.rotation.y=Math.PI;
  car.add(rearWindow);

  for(const side of [-1,1]){
    const sideGlassFront=new THREE.Mesh(new THREE.PlaneGeometry(.62,.43),glass);
    sideGlassFront.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    sideGlassFront.position.set(side*.738,1.30,-.18);
    car.add(sideGlassFront);

    const sideGlassRear=new THREE.Mesh(new THREE.PlaneGeometry(.55,.43),glass);
    sideGlassRear.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    sideGlassRear.position.set(side*.738,1.30,.48);
    car.add(sideGlassRear);

    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.18,.10,.25),paint);
    mirror.position.set(side*.92,1.15,-.48);
    car.add(mirror);
  }

  for(const x of [-.94,.94]){
    for(const z of [-1.02,1.02]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.20,18),obstacleMaterials.rubber);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(x,.34,z);
      car.add(wheel);

      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.205,12),chrome);
      hub.rotation.z=Math.PI/2;
      hub.position.set(x,.34,z);
      car.add(hub);
    }
  }

  const grille=new THREE.Mesh(new THREE.BoxGeometry(.90,.20,.08),trim);
  grille.position.set(0,.58,-1.67);
  car.add(grille);

  const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(1.60,.11,.10),chrome);
  frontBumper.position.set(0,.35,-1.69);
  car.add(frontBumper);

  const rearBumper=frontBumper.clone();
  rearBumper.position.z=1.69;
  car.add(rearBumper);

  for(const x of [-.57,.57]){
    const headlight=new THREE.Mesh(new THREE.BoxGeometry(.28,.17,.065),lightFront);
    headlight.position.set(x,.73,-1.665);
    car.add(headlight);

    const taillight=new THREE.Mesh(new THREE.BoxGeometry(.27,.16,.065),lightRear);
    taillight.position.set(x,.72,1.665);
    car.add(taillight);
  }

  car.scale.set(.82,.82,.82);
  return car;
}

function makeRoadBarricadeTexture(){
  const c=document.createElement('canvas');
  c.width=512;
  c.height=192;
  const ctx=c.getContext('2d');

  ctx.fillStyle='#f4f1e8';
  ctx.fillRect(0,0,c.width,c.height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0,0,c.width,c.height);
  ctx.clip();
  ctx.lineWidth=64;
  ctx.strokeStyle='#f07724';
  for(let x=-180;x<c.width+220;x+=150){
    ctx.beginPath();
    ctx.moveTo(x,c.height+45);
    ctx.lineTo(x+170,-45);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle='#262b30';
  ctx.lineWidth=16;
  ctx.strokeRect(8,8,c.width-16,c.height-16);

  ctx.fillStyle='rgba(255,255,255,.30)';
  ctx.fillRect(20,18,c.width-40,12);

  for(const x of [42,c.width-42]){
    ctx.fillStyle='#555b60';
    ctx.beginPath();
    ctx.arc(x,c.height/2,9,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#d9dde0';
    ctx.beginPath();
    ctx.arc(x,c.height/2,4,0,Math.PI*2);
    ctx.fill();
  }

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const roadBarricadeTexture=makeRoadBarricadeTexture();

function createRoadSign(){
  const g=new THREE.Group();

  const boardMat=new THREE.MeshStandardMaterial({
    map:roadBarricadeTexture,
    roughness:.48,
    metalness:.08
  });
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.72,.68,.12),boardMat);
  board.position.y=.94;
  board.castShadow=true;
  g.add(board);

  const frameMat=new THREE.MeshStandardMaterial({color:0x30363b,roughness:.52,metalness:.42});
  const reflectorMat=new THREE.MeshBasicMaterial({color:0xffd45a});

  for(const x of [-.72,.72]){
    const post=new THREE.Mesh(new THREE.BoxGeometry(.10,.88,.11),frameMat);
    post.position.set(x,.48,.015);
    g.add(post);

    const foot=new THREE.Mesh(new THREE.BoxGeometry(.52,.12,.58),obstacleMaterials.black);
    foot.position.set(x,.07,0);
    foot.rotation.y=x>0?.06:-.06;
    g.add(foot);

    const reflector=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.035,16),reflectorMat);
    reflector.rotation.x=Math.PI/2;
    reflector.position.set(x,.94,-.075);
    g.add(reflector);
  }

  const topLamp=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.07,16),reflectorMat);
  topLamp.rotation.x=Math.PI/2;
  topLamp.position.set(0,1.36,-.065);
  g.add(topLamp);

  const cap=new THREE.Mesh(new THREE.BoxGeometry(1.82,.08,.16),frameMat);
  cap.position.y=1.30;
  g.add(cap);

  return g;
}

function createDeliveryBoxes(){
  const g=new THREE.Group();
  const sizes=[
    {x:-.35,y:.28,z:.05,w:.68,h:.56,d:.62},
    {x:.31,y:.34,z:.02,w:.62,h:.68,d:.58},
    {x:.02,y:.82,z:.04,w:.72,h:.5,d:.64}
  ];
  for(const s of sizes){
    const box=new THREE.Mesh(new THREE.BoxGeometry(s.w,s.h,s.d),obstacleMaterials.brown);
    box.position.set(s.x,s.y,s.z);
    box.castShadow=true;
    g.add(box);
    const tape=new THREE.Mesh(new THREE.BoxGeometry(.09,s.h+.01,s.d+.02),obstacleMaterials.white);
    tape.position.copy(box.position);
    g.add(tape);
  }
  return g;
}

function makeLimb(length,radius,material){
  const pivot=new THREE.Group();
  const limb=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(.05,length-radius*2),5,8),material);
  limb.position.y=-length*.5;
  pivot.add(limb);
  return pivot;
}

function createPedestrian(index=0){
  const g=new THREE.Group();

  const skinTones=[0xf0bd98,0xd89a73,0xb97655,0x8d5b45];
  const shirtColors=[0x2f78ad,0xc64e58,0x4f9766,0xe0a33c,0x7658b6,0x289b98];
  const pantsColors=[0x253344,0x3b3d43,0x355443,0x5b4538];
  const hairColors=[0x2c211b,0x4b3020,0x17181a,0x704a2e];

  const skin=new THREE.MeshStandardMaterial({color:skinTones[index%skinTones.length],roughness:.82});
  const shirt=new THREE.MeshStandardMaterial({color:shirtColors[index%shirtColors.length],roughness:.78});
  const pants=new THREE.MeshStandardMaterial({color:pantsColors[index%pantsColors.length],roughness:.86});
  const hair=new THREE.MeshStandardMaterial({color:hairColors[index%hairColors.length],roughness:.92});
  const shoe=new THREE.MeshStandardMaterial({color:0x1b1d21,roughness:.88});
  const eyeMat=new THREE.MeshBasicMaterial({color:0x17191c});

  const pelvis=new THREE.Group();
  pelvis.position.y=.93;
  g.add(pelvis);

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.27,.66,6,12),shirt);
  torso.position.y=.43;
  torso.scale.set(1.05,1,0.82);
  torso.castShadow=true;
  pelvis.add(torso);

  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.085,.09,.15,10),skin);
  neck.position.y=.87;
  pelvis.add(neck);

  const headGroup=new THREE.Group();
  headGroup.position.y=1.08;
  pelvis.add(headGroup);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.235,16,12),skin);
  head.scale.set(.9,1.08,.92);
  head.castShadow=true;
  headGroup.add(head);

  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.242,16,10,0,Math.PI*2,0,Math.PI*.55),hair);
  hairCap.position.y=.035;
  hairCap.scale.set(.92,1.02,.94);
  headGroup.add(hairCap);

  for(const x of [-.075,.075]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),eyeMat);
    eye.position.set(x,.035,-.205);
    headGroup.add(eye);
  }

  const nose=new THREE.Mesh(new THREE.ConeGeometry(.025,.07,8),skin);
  nose.rotation.x=Math.PI/2;
  nose.position.set(0,-.005,-.235);
  headGroup.add(nose);

  const leftArm=makeLimb(.72,.075,skin);
  leftArm.position.set(-.31,.75,0);
  leftArm.rotation.z=.12;
  pelvis.add(leftArm);

  const rightArm=makeLimb(.72,.075,skin);
  rightArm.position.set(.31,.75,0);
  rightArm.rotation.z=-.12;
  pelvis.add(rightArm);

  const leftSleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.28,5,8),shirt);
  leftSleeve.position.set(-.31,.58,0);
  leftSleeve.rotation.z=.12;
  pelvis.add(leftSleeve);

  const rightSleeve=leftSleeve.clone();
  rightSleeve.position.x=.31;
  rightSleeve.rotation.z=-.12;
  pelvis.add(rightSleeve);

  const leftLeg=makeLimb(.88,.095,pants);
  leftLeg.position.set(-.14,0,0);
  pelvis.add(leftLeg);

  const rightLeg=makeLimb(.88,.095,pants);
  rightLeg.position.set(.14,0,0);
  pelvis.add(rightLeg);

  const leftFoot=new THREE.Mesh(new THREE.BoxGeometry(.19,.13,.36),shoe);
  leftFoot.position.set(-.14,-.86,-.11);
  pelvis.add(leftFoot);

  const rightFoot=leftFoot.clone();
  rightFoot.position.x=.14;
  pelvis.add(rightFoot);

  g.userData.walkParts={leftArm,rightArm,leftLeg,rightLeg,leftFoot,rightFoot,headGroup};
  g.userData.walkPhase=Math.random()*Math.PI*2;
  g.userData.crossDir=Math.random()<.5?1:-1;
  g.userData.crossSpeed=1.65+Math.random()*.55;
  g.userData.startSide=g.userData.crossDir>0?-1:1;
  g.rotation.y=g.userData.crossDir>0?-Math.PI/2:Math.PI/2;
  g.scale.setScalar(.98+Math.random()*.08);
  return g;
}

function createCyclist(index=0){
  const g=new THREE.Group();
  const wheelMat=obstacleMaterials.rubber;
  const frameMat=index%2?obstacleMaterials.yellow:obstacleMaterials.blue;
  const wheels=[];

  for(const z of [-.75,.75]){
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.42,.055,8,18),wheelMat);
    wheel.rotation.y=Math.PI/2;
    wheel.position.set(0,.48,z);
    wheels.push(wheel);
    g.add(wheel);
  }

  const rear=new THREE.Vector3(0,.48,.75);
  const front=new THREE.Vector3(0,.48,-.75);
  const crank=new THREE.Vector3(0,.62,.08);
  const seat=new THREE.Vector3(0,.98,.35);
  const handle=new THREE.Vector3(0,1.02,-.48);
  g.add(cylinderBetween(rear,crank,.045,frameMat));
  g.add(cylinderBetween(front,crank,.045,frameMat));
  g.add(cylinderBetween(crank,seat,.045,frameMat));
  g.add(cylinderBetween(seat,handle,.04,frameMat));

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.55,5,10),obstacleMaterials.cloth);
  torso.position.set(0,1.46,.05);
  torso.rotation.x=.28;
  g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),obstacleMaterials.skin);
  head.position.set(0,1.89,-.12);
  g.add(head);

  g.userData.wheels=wheels;
  return g;
}

function makeDuckUnderTexture(){
  const c=document.createElement('canvas');
  c.width=768;c.height=220;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#171b20';ctx.fillRect(0,0,c.width,c.height);

  for(let x=-120;x<c.width+160;x+=140){
    ctx.save();
    ctx.translate(x,0);
    ctx.rotate(-.45);
    ctx.fillStyle='#f4c531';
    ctx.fillRect(0,-140,58,520);
    ctx.restore();
  }

  ctx.fillStyle='rgba(15,18,22,.92)';
  ctx.fillRect(120,45,c.width-240,c.height-90);
  ctx.strokeStyle='#ffffff';ctx.lineWidth=7;
  ctx.strokeRect(120,45,c.width-240,c.height-90);
  ctx.fillStyle='#ffffff';
  ctx.font='900 54px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('DUCK UNDER',c.width/2,92);
  ctx.fillStyle='#ffd23d';
  ctx.font='900 70px Arial';
  ctx.fillText('↓   ↓   ↓',c.width/2,158);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}
const duckUnderTexture=makeDuckUnderTexture();

function createDuckUnderObstacle(){
  const g=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x272d33,roughness:.62,metalness:.36});
  const yellow=new THREE.MeshStandardMaterial({color:0xf1b925,roughness:.55,metalness:.12});
  const faceMat=new THREE.MeshBasicMaterial({map:duckUnderTexture,side:THREE.DoubleSide,fog:false,toneMapped:false});

  const bar=new THREE.Mesh(new THREE.BoxGeometry(2.72,.22,.28),yellow);
  bar.position.set(0,1.78,0);
  bar.castShadow=true;
  g.add(bar);

  const face=new THREE.Mesh(new THREE.PlaneGeometry(2.60,.76),faceMat);
  face.position.set(0,1.93,-.155);
  g.add(face);

  for(const x of [-1.24,1.24]){
    const sidePost=new THREE.Mesh(new THREE.BoxGeometry(.10,1.25,.12),dark);
    sidePost.position.set(x,.72,.05);
    g.add(sidePost);

    const cone=new THREE.Mesh(new THREE.ConeGeometry(.22,.64,12),obstacleMaterials.orange);
    cone.position.set(x,.32,.36);
    g.add(cone);

    const coneStripe=new THREE.Mesh(new THREE.CylinderGeometry(.14,.17,.11,12),obstacleMaterials.white);
    coneStripe.position.set(x,.34,.36);
    g.add(coneStripe);

    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0xffc72f}));
    beacon.position.set(x,1.44,.02);
    g.add(beacon);
  }

  const hangingTapeMat=new THREE.MeshBasicMaterial({color:0xffd331,side:THREE.DoubleSide});
  for(const x of [-.82,-.28,.28,.82]){
    const tape=new THREE.Mesh(new THREE.PlaneGeometry(.07,.45),hangingTapeMat);
    tape.position.set(x,1.47,-.08);
    g.add(tape);
  }

  g.userData.clearance=1.50;
  return g;
}

function spawnObstacle(){
  const roll=Math.random();
  let type;
  let kind;

  if(roll<.16){type='car';kind='car';}
  else if(roll<.31){type='jump';kind='sign';}
  else if(roll<.44){type='jump';kind='boxes';}
  else if(roll<.62){type='dodge';kind='pedestrian';}
  else if(roll<.77){type='dodge';kind='cyclist';}
  else {type='slide';kind='duck';}

  const laneIndex=pickObstacleLane(type);
  if(laneIndex===null)return;

  let mesh;
  if(kind==='car')mesh=createRoadCar(Math.floor(Math.random()*6));
  else if(kind==='sign')mesh=createRoadSign();
  else if(kind==='boxes')mesh=createDeliveryBoxes();
  else if(kind==='pedestrian')mesh=createPedestrian(Math.floor(Math.random()*12));
  else if(kind==='cyclist')mesh=createCyclist(Math.floor(Math.random()*4));
  else mesh=createDuckUnderObstacle();

  if(kind==='pedestrian'){
    mesh.position.set(mesh.userData.startSide*5.25,0,OBSTACLE_SPAWN_Z);
  }else{
    mesh.position.set(lanes[laneIndex],0,OBSTACLE_SPAWN_Z);
  }

  scene.add(mesh);
  obstacles.push({mesh,type,kind,laneIndex,passed:false});
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
    if(answerResolutionActive)continue;
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

    if(o.kind==='cyclist'&&o.mesh.userData.wheels){
      for(const wheel of o.mesh.userData.wheels)wheel.rotation.x-=travel*1.55;
      o.mesh.rotation.z=Math.sin(o.mesh.position.z*.08)*.035;
    }else if(o.kind==='pedestrian'){
      const p=o.mesh.userData.walkParts;
      const phase=o.mesh.userData.walkPhase+runElapsed*7.4;
      const swing=Math.sin(phase);
      const counter=Math.sin(phase+Math.PI);

      if(p){
        p.leftArm.rotation.x=swing*.78;
        p.rightArm.rotation.x=counter*.78;
        p.leftLeg.rotation.x=counter*.68;
        p.rightLeg.rotation.x=swing*.68;
        p.leftFoot.rotation.x=Math.max(0,swing)*.28;
        p.rightFoot.rotation.x=Math.max(0,counter)*.28;
        p.headGroup.rotation.y=Math.sin(phase*.45)*.08;
      }

      o.mesh.position.x+=o.mesh.userData.crossDir*o.mesh.userData.crossSpeed*dt;
      o.mesh.position.y=Math.abs(Math.sin(phase))*0.035;
      o.mesh.rotation.z=Math.sin(phase)*.018;
    }

    if(o.kind==='pedestrian'){
      const closeZ=Math.abs(o.mesh.position.z-runnerRoot.position.z)<1.15;
      const closeX=Math.abs(o.mesh.position.x-runnerRoot.position.x)<.72;
      if(!o.passed&&closeZ&&closeX){
        o.passed=true;
        hit();
      }else if(o.mesh.position.z>4.2){
        o.passed=true;
      }
    }else if(!o.passed&&o.mesh.position.z>1.1){
      o.passed=true;
      const sameLane=o.laneIndex===lane&&Math.abs(o.mesh.position.x-runnerRoot.position.x)<1.25;
      if(sameLane){
        const safe=o.type==='jump'
          ? runnerRoot.position.y>.92
          : (o.type==='car'
              ? runnerRoot.position.y>1.28
              : (o.type==='slide'
                  ? sliding
                  : false));
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
  if(IS_MOBILE)renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.1));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}

addEventListener('resize',resize);
resize();
